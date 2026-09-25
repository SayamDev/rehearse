"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CaretDownIcon,
  ChartLineUpIcon,
  ChatCircleIcon,
  DeviceMobileIcon,
  FireIcon,
  GearSixIcon,
  LockIcon,
  LockSimpleIcon,
  MicrophoneIcon,
  SparkleIcon,
  SpeakerHighIcon,
  StarIcon,
  StickerIcon,
  TrashIcon,
  TrophyIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { liveStreak, resetAll, updateSettings, useStore } from "@/lib/store";
import { levelFromXp } from "@/lib/scoring";
import { COLLECTION, earnedIds } from "@/lib/collection";
import { PERSONAS } from "@/lib/game";
import { speak } from "@/lib/tts";
import { CollectionAlbum } from "./collection-album";
import { deleteRecordings, listRecordings } from "@/lib/recordings";
import { StickerArt } from "./sticker-art";
import { VoiceSetting } from "./voice-setting";
import { Segmented } from "./segmented";
import { LANGUAGES, isEnglish } from "@/lib/languages";
import { scoreGain, scoreHistory, skillAverages, weakestSkill } from "@/lib/skills";
import { ScoreChart, SkillBars } from "./progress-chart";
import { ShareProgress } from "./share-progress";
import { WeeklyGoal } from "./weekly-goal";
import { useInstall } from "./pwa";
import { scrollToHash } from "./route-scroll";
import { ACCENTS, AUTO, accentFor } from "@/lib/accents";
import { BackupButton, LoadBackup } from "./progress-backup";
import { lastBackupLabel } from "@/lib/backup";
import { useT, type UiKey } from "@/lib/i18n";

type Tab = "progress" | "stickers" | "settings";

/** Settings sections that links can open directly, like /me#voice. */
const SETTINGS_SECTIONS = ["voice", "language", "accent", "easier", "app", "data"];

const TABS: { id: Tab; label: UiKey; icon: typeof GearSixIcon }[] = [
  { id: "progress", label: "me.progress", icon: ChartLineUpIcon },
  { id: "stickers", label: "me.stickers", icon: StickerIcon },
  { id: "settings", label: "me.settings", icon: GearSixIcon },
];

const SPEEDS = [
  { value: "0.7", label: "Slowest" },
  { value: "0.85", label: "Slower" },
  { value: "1", label: "Normal" },
  { value: "1.15", label: "Faster" },
  { value: "1.3", label: "Fastest" },
];

export function MeView() {
  const store = useStore();
  const { hydrated } = store;
  const [tab, setTab] = useState<Tab>("progress");
  const baseId = useId();
  const t = useT();

  // Opening /me#settings (or #stickers) lands on that tab; a settings section (#voice, #language,
  // #data) opens Settings and scrolls to it. Works for links clicked while already on this page too.
  useEffect(() => {
    if (!hydrated) return;
    const open = () => {
      const fromHash = window.location.hash.slice(1);
      if (TABS.some((t) => t.id === fromHash)) setTab(fromHash as Tab);
      else if (SETTINGS_SECTIONS.includes(fromHash)) {
        setTab("settings");
        scrollToHash(fromHash);
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [hydrated]);

  function choose(next: Tab) {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
    // If the tabs have scrolled off the top (long pages on a phone), bring them back so the new tab starts at its top.
    const tabs = document.getElementById(`${baseId}-tabs`);
    if (tabs && tabs.getBoundingClientRect().top < 0) tabs.scrollIntoView({ block: "start" });
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading your page">
        <div className="skeleton h-9 w-56" />
        <div className="skeleton h-12 w-80 rounded-full" />
        <div className="skeleton h-40 w-full rounded-[var(--radius-panel)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">{t("me.title")}</h1>
        <div id={`${baseId}-tabs`} role="tablist" aria-label="Your page" className="scroll-mt-20 flex w-fit max-w-full gap-1 rounded-full border-2 border-line bg-surface p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`${baseId}-${id}`}
              aria-selected={tab === id}
              aria-controls={`${baseId}-panel`}
              onClick={() => choose(id)}
              className={`flex min-h-11 items-center gap-2 rounded-full px-3 text-label min-[380px]:px-4 font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] sm:px-5 ${
                tab === id ? "bg-ink text-floor" : "text-muted hover:text-ink"
              }`}
            >
              <Icon size={18} weight={tab === id ? "fill" : "regular"} className="max-[359px]:hidden" aria-hidden />
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-${tab}`}>
        {tab === "progress" && <ProgressTab onStickers={() => choose("stickers")} />}
        {tab === "stickers" && <StickersTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

/* ---------------- Progress ---------------- */

function ProgressTab({ onStickers }: { onStickers: () => void }) {
  const { profile, sessions, bank } = useStore();
  const level = levelFromXp(profile.xp);
  const span = Math.max(1, level.next - level.floor);
  const into = profile.xp - level.floor;
  const pct = level.level >= 50 ? 100 : Math.min(100, Math.round((into / span) * 100));
  const streak = liveStreak(profile);
  const answers = sessions.reduce((a, s) => a + s.questions.reduce((b, q) => b + q.takes.length, 0), 0);
  const retakes = sessions.reduce((a, s) => a + s.questions.reduce((b, q) => b + Math.max(0, q.takes.length - 1), 0), 0);
  const earned = earnedIds({ sessions, bank, profile });
  // Rounds where the user said how they felt before and after.
  const felt = sessions.filter((s) => s.feel?.before !== undefined && s.feel?.after !== undefined);
  const calmer = felt.filter((s) => s.feel!.after! > s.feel!.before!).length;
  const next = COLLECTION.find((c) => c.group === "achievements" && !earned.has(c.id)) ?? COLLECTION.find((c) => !earned.has(c.id));
  const points = scoreHistory(sessions);
  const skills = skillAverages(sessions);
  const rounds = sessions.filter((s) => s.completedAt).length;
  // Scores need two rounds to draw a line; until then one friendly note instead of two empty ones.
  const unlocked = rounds >= 2;

  return (
    <div className="flex flex-col gap-10">
      <Group title={`Level ${level.level} · ${level.title}`} hint="Every answer earns XP." icon={TrophyIcon} ink="bg-sun" padded>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div
              className="h-3 w-full overflow-hidden rounded-full border border-line bg-surface-2"
              role="progressbar"
              aria-label="XP toward next level"
              aria-valuemin={0}
              aria-valuemax={span}
              aria-valuenow={Math.min(into, span)}
            >
              <div className="h-full rounded-full bg-sun transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-label text-muted">
              <span className="tnum font-semibold text-ink">{profile.xp} XP</span>
              {level.level < 50 && ` · ${level.next - profile.xp} XP to level ${level.level + 1}`}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            <Stat icon={FireIcon} lit={streak > 0} label="Streak" value={streak} detail={`Best ${profile.bestStreak}`} />
            <Stat icon={ChatCircleIcon} lit={answers > 0} label="Answers" value={answers} detail={`${retakes} ${retakes === 1 ? "retake" : "retakes"}`} />
            <Stat icon={StickerIcon} lit={earned.size > 0} label="Stickers" value={earned.size} detail={`of ${COLLECTION.length}`} />
          </dl>
          {answers === 0 ? (
            <div className="flex flex-col gap-3 rounded-control bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-sm">
                <strong>Your first round is waiting.</strong> Three questions, about five minutes.
              </p>
              <Link href="/practice/new" className="btn btn-go shrink-0">
                Start your first round
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/archive" className="btn btn-ghost">
                See past sessions <ArrowRightIcon size={16} weight="bold" aria-hidden />
              </Link>
              <ShareProgress />
            </div>
          )}
        </div>
      </Group>

      <Group title="This week" hint="A gentle goal. Any finished round counts." icon={CalendarCheckIcon} ink="bg-lime" padded>
        <WeeklyGoal />
      </Group>

      {next && (
        <Group title="Up next" hint="Your next sticker to earn." icon={StarIcon} ink="bg-tomato" padded>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <StickerArt item={next} earned={false} size={84} tilt={-4} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-title font-bold">{next.name}</p>
              <p className="max-w-[56ch] text-body-sm text-muted">{next.how}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {answers > 0 && (
                <Link href="/practice/new" className="btn btn-go">
                  Practise now
                </Link>
              )}
              <button type="button" className="btn btn-ghost" onClick={onStickers}>
                All stickers
              </button>
            </div>
          </div>
        </Group>
      )}

      <Group
        title="Scores and skills"
        hint={unlocked ? `Your rounds over time, and your last ${skills[0]?.count ?? 0} answers out of 10.` : "How you're improving."}
        icon={ChartLineUpIcon}
        ink="bg-sky"
        padded
      >
        {unlocked ? (
          <div className="flex flex-col gap-8">
            <ScoreChart points={points} gain={scoreGain(points)} />
            <div className="flex flex-col gap-3 border-t border-line pt-6">
              <h3 className="font-semibold">Your skills</h3>
              <SkillBars skills={skills} weakest={weakestSkill(skills)} />
            </div>
            {felt.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-line pt-6">
                <h3 className="font-semibold">Nerves</h3>
                <p className="max-w-[60ch] text-body-sm leading-relaxed text-muted">
                  You felt calmer at the end of <span className="tnum font-semibold text-ink">{calmer}</span> of{" "}
                  <span className="tnum font-semibold text-ink">{felt.length}</span> {felt.length === 1 ? "round" : "rounds"}. The more
                  you practise, the more familiar the real thing feels.{" "}
                  <Link href="/calm" className="font-semibold text-ink underline underline-offset-4">
                    Calm corner
                  </Link>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <LockSimpleIcon size={22} weight="bold" className="mt-0.5 shrink-0 text-muted" aria-hidden />
            <p className="text-body-sm text-muted">
              Finish {rounds === 1 ? "one more round" : "two rounds"} to unlock your score line and see which skills are strongest.
            </p>
          </div>
        )}
      </Group>

      <details className="group rounded-[var(--radius-panel)] border-2 border-dashed border-line px-5 py-4">
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
          How to level up faster
          <CaretDownIcon size={18} weight="bold" className="shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="mt-3 flex max-w-[62ch] flex-col gap-1.5 text-body-sm leading-relaxed text-muted">
          <li>Every answer earns XP. Beating your own score on a retake earns the most.</li>
          <li>Practise a little every day to grow your streak. The daily question takes two minutes.</li>
          <li>Save strong answers in Remember and recall them to earn extra XP.</li>
        </ul>
      </details>
    </div>
  );
}

/** One number worth glancing at: icon, big number, what it is, and a small detail. */
function Stat({ icon: StatIcon, lit, label, value, detail }: { icon: Icon; lit: boolean; label: string; value: number; detail: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-control bg-surface-2 p-3 sm:p-4">
      <dd className="order-1 flex flex-col gap-2">
        <StatIcon size={20} weight={lit ? "fill" : "regular"} className={lit ? "text-ink" : "text-muted"} aria-hidden />
        <span className="tnum font-display text-title-lg font-bold leading-none">{value}</span>
      </dd>
      <dt className="order-2 mt-1.5 text-label font-semibold">{label}</dt>
      <dd className="order-3 text-label text-muted">{detail}</dd>
    </div>
  );
}

/* ---------------- Stickers ---------------- */

function StickersTab() {
  return (
    <section aria-label="Your stickers" className="flex flex-col gap-4">
      <p className="text-body-sm text-muted">Tap a sticker to see how to earn it.</p>
      <CollectionAlbum />
    </section>
  );
}

const THEMES: { value: "system" | "light" | "dark"; label: string }[] = [
  { value: "system", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/* ---------------- Settings ---------------- */

function SettingsTab() {
  const { profile, sessions, bank } = useStore();
  const s = profile.settings;
  const [confirming, setConfirming] = useState(false);
  // What "Automatic" means on this device, shown in the list. Read in an effect: the server can't know.
  const [autoAccent, setAutoAccent] = useState(() => accentFor(AUTO));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutoAccent(accentFor(AUTO, navigator.languages ?? [navigator.language]));
  }, []);
  const nothingSaved = sessions.length === 0 && profile.xp === 0 && bank.length === 0 && !profile.stories?.length && !profile.numbers?.length && !profile.company;
  const ids = { lang: useId(), read: useId(), help: useId(), delivery: useId(), soft: useId(), large: useId(), plain: useId(), rec: useId(), focus: useId(), accent: useId(), accurate: useId() };
  const speed = SPEEDS.find((o) => Number(o.value) === s.voiceSpeed)?.value ?? "1";

  return (
    <div className="flex flex-col gap-8">
      <Group anchor="voice" title="Your interviewer" hint="How questions sound when they're read to you." icon={SpeakerHighIcon} ink="bg-sky">
        <Row
          label={<label htmlFor={ids.read}>Read questions aloud</label>}
          description="Your interviewer says each question out loud."
          control={<Switch id={ids.read} checked={s.readAloud} onChange={(v) => updateSettings({ readAloud: v })} />}
        />
        <Row
          stacked
          label="Speaking speed"
          description="How fast interviewers talk. Sam, Priya and Mr. Grant each keep their own style on top of this."
          control={
            <div className="flex flex-wrap items-center gap-2">
              <Segmented label="Speaking speed" value={speed} options={SPEEDS} onChange={(v) => updateSettings({ voiceSpeed: Number(v) })} />
              <button
                type="button"
                className="btn btn-quiet min-h-10 text-label"
                onClick={() => speak("Hi, I'm Sam. Tell me about a time you helped someone.", PERSONAS.friendly, s.voiceEngine)}
              >
                <SpeakerHighIcon size={16} weight="fill" aria-hidden /> Hear it
              </button>
            </div>
          }
        />
        <Row
          stacked
          label="Voice quality"
          description="Most human is a free voice that runs on your device, so nothing is sent anywhere. It downloads once (about 90MB), by itself on Wi-Fi. Until it's ready, or if it can't run, a cloud voice or your device's voice reads instead. Standard skips the download."
          control={<VoiceSetting engine={s.voiceEngine} />}
        />
      </Group>

      <Group title="Answering" hint="How you answer and what help you get." icon={MicrophoneIcon} ink="bg-tomato">
        <Row
          stacked
          label="Answer by default with"
          description="You can always switch while answering."
          control={
            <Segmented
              label="Answer by default with"
              value={s.defaultAnswerMode}
              options={[
                { value: "voice", label: "Speaking" },
                { value: "type", label: "Typing" },
              ]}
              onChange={(v) => updateSettings({ defaultAnswerMode: v })}
            />
          }
        />
        {isEnglish(s.language) && (
          <Row
            stacked
            anchor="accent"
            label={<label htmlFor={ids.accent}>Your English accent</label>}
            description="Helps your spoken answers come out as the words you said. Automatic uses your device's setting."
            control={
              <select id={ids.accent} value={s.accent ?? AUTO} onChange={(e) => updateSettings({ accent: e.target.value })} className="field w-full max-w-xs">
                <option value={AUTO}>Automatic ({autoAccent.label.split(" (")[0]})</option>
                {ACCENTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}
                  </option>
                ))}
              </select>
            }
          />
        )}
        <Row
          label={<label htmlFor={ids.accurate}>More accurate transcripts</label>}
          description="When you stop speaking, your recording is checked by a speech model that's better with accents (Whisper, through Groq, which doesn't keep it). Turn off to use only your browser's own speech recognition. Phones need this for spoken answers."
          control={<Switch id={ids.accurate} checked={s.accurateVoice !== false} onChange={(v) => updateSettings({ accurateVoice: v })} />}
        />
        <Row
          label={<label htmlFor={ids.help}>Show hints when I&apos;m stuck</label>}
          description="A “Stuck?” button under each question, and a gentle nudge if you go quiet while speaking."
          control={<Switch id={ids.help} checked={s.helpers} onChange={(v) => updateSettings({ helpers: v })} />}
        />
        <Row
          label={<label htmlFor={ids.delivery}>Score my delivery</label>}
          description="Pace and filler words for spoken answers. Turn off if you're practising in a second language and want feedback on content only."
          control={<Switch id={ids.delivery} checked={s.deliveryMetrics} onChange={(v) => updateSettings({ deliveryMetrics: v })} />}
        />
        <Row
          label={<label htmlFor={ids.soft}>Soft mode</label>}
          description="Hide scores while you practise and see them only at the end of the round. Good if numbers make you anxious."
          control={<Switch id={ids.soft} checked={s.softMode} onChange={(v) => updateSettings({ softMode: v })} />}
        />
      </Group>

      <Group anchor="easier" title="Easier to use" hint="Make the app work better for you." icon={SparkleIcon} ink="bg-lime">
        <Row
          stacked
          label="Light or dark"
          description="Match device follows your phone or computer's own setting."
          control={
            <Segmented
              label="Light or dark"
              value={s.theme}
              options={THEMES}
              onChange={(v) => updateSettings({ theme: v })}
            />
          }
        />
        <Row
          stacked
          anchor="language"
          label={<label htmlFor={ids.lang}>Practise in</label>}
          description={
            isEnglish(s.language)
              ? "Answer questions and get your notes in another language. The main menus and buttons switch too."
              : "Questions, your notes, Cobi's replies and the main menus are in this language (some screens are still English). Questions are read by your device's voice, or a free human voice for Arabic. Live Interview is English only."
          }
          control={
            <select
              id={ids.lang}
              value={s.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="field w-full max-w-xs"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} lang={l.code}>
                  {l.code === "en" ? "English" : `${l.native} (${l.name})`}
                </option>
              ))}
            </select>
          }
        />
        <Row
          label={<label htmlFor={ids.focus}>Focus mode</label>}
          description="During a round, only the question, your answer and your progress stay on screen. Menus and stickers wait, and notes open with the one thing to fix. Helpful for ADHD or when your mind wanders."
          control={<Switch id={ids.focus} checked={Boolean(s.focusMode)} onChange={(v) => updateSettings({ focusMode: v })} />}
        />
        <Row
          label={<label htmlFor={ids.large}>Larger text</label>}
          description="Makes all the text in the app bigger."
          control={<Switch id={ids.large} checked={s.largeText} onChange={(v) => updateSettings({ largeText: v })} />}
        />
        <Row
          label={<label htmlFor={ids.plain}>Simpler words</label>}
          description="Questions and notes use short sentences and everyday words. Helpful if you're learning English. Pair it with a slower speaking speed above."
          control={<Switch id={ids.plain} checked={s.plainWords} onChange={(v) => updateSettings({ plainWords: v })} />}
        />
      </Group>

      <Group anchor="app" title="Use it like an app" hint="Put Rehearse on your home screen." icon={DeviceMobileIcon} ink="bg-sun">
        <InstallRow />
      </Group>

      <Group
        anchor="data"
        title="Your data"
        icon={LockIcon}
        ink="bg-grape"
        hint="Everything stays in this browser. Use the same browser to keep your progress: other browsers, other devices and private or incognito windows start fresh."
      >
        <div className="flex flex-col gap-4 p-5">
          <div>
            <p className="font-semibold">Keep your progress safe</p>
            <p className="mt-1 max-w-[56ch] text-label leading-relaxed text-muted">
              Save a backup file now and then. Load it on a new phone, another browser, or after clearing your browser, and carry on where
              you left off. {lastBackupLabel(profile.lastBackup)}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <BackupButton />
            <LoadBackup />
          </div>
        </div>
        <Row
          label={<label htmlFor={ids.rec}>Keep recordings of my spoken answers</label>}
          description="Saved only on this device, never uploaded. Your 10 best are kept so you can replay them in the Calm corner."
          control={<Switch id={ids.rec} checked={s.keepRecordings} onChange={(v) => updateSettings({ keepRecordings: v })} />}
        />
        <RecordingsControl key={sessions.length === 0 ? "none" : "some"} keeping={s.keepRecordings} />
        <div className="flex flex-col gap-4 p-5">
          <p className="max-w-[60ch] text-body-sm leading-relaxed text-muted">
            Audio is only kept if you turn on recordings above, and then only on this device. Spoken answers are sent to our AI provider to get the words right (unless you turn off More accurate transcripts), and not stored. Answer text is sent to our AI provider to be scored, with data retention turned off.{" "}
            <Link href="/privacy" className="font-semibold text-ink underline underline-offset-4">
              Read the privacy page
            </Link>
          </p>
          {!confirming ? (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-ghost w-fit" onClick={() => setConfirming(true)} disabled={nothingSaved}>
                Delete all my practice data
              </button>
              {nothingSaved && <span className="text-label text-muted">Nothing saved yet, so nothing to delete.</span>}
            </div>
          ) : (
            <div role="alert" className="flex flex-col gap-3 rounded-control border border-down/40 p-4">
              <p className="font-medium">Delete every session, saved answer, story, your XP and your streak? This can&apos;t be undone.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn bg-down text-white hover:opacity-90"
                  onClick={() => {
                    resetAll();
                    void deleteRecordings();
                    setConfirming(false);
                  }}
                >
                  Delete everything
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
                  Keep my data
                </button>
              </div>
            </div>
          )}
        </div>
      </Group>
    </div>
  );
}

/** Delete recordings: says how many there are, asks first, and goes quiet once there are none. */
function RecordingsControl({ keeping }: { keeping: boolean }) {
  const [count, setCount] = useState<number | null>(null);
  const [asking, setAsking] = useState(false);
  const [done, setDone] = useState(false);

  // Recordings live in the browser's database, so they're counted after the page loads (and when the switch changes).
  useEffect(() => {
    let live = true;
    listRecordings().then((r) => live && setCount(r.length));
    return () => {
      live = false;
    };
  }, [keeping]);

  async function remove() {
    await deleteRecordings();
    setCount(0);
    setAsking(false);
    setDone(true);
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4" aria-live="polite">
      {count === null ? (
        <span className="skeleton h-10 w-48" aria-hidden />
      ) : count === 0 ? (
        <p className="flex items-center gap-2 text-label text-muted">
          {done && <CheckIcon size={16} weight="bold" className="text-up" aria-hidden />}
          {done ? "Recordings deleted. None are saved on this device now." : "No recordings saved on this device."}
        </p>
      ) : asking ? (
        <div role="alert" className="flex flex-col gap-3">
          <p className="text-body-sm font-medium">
            Delete {count === 1 ? "your recording" : `all ${count} recordings`}? You can&apos;t get {count === 1 ? "it" : "them"} back.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn min-h-10 bg-down text-label text-white hover:opacity-90" onClick={remove}>
              Delete {count === 1 ? "it" : "them"}
            </button>
            <button type="button" className="btn btn-ghost min-h-10 text-label" onClick={() => setAsking(false)}>
              Keep {count === 1 ? "it" : "them"}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost min-h-10 w-fit text-label" onClick={() => setAsking(true)}>
          <TrashIcon size={16} weight="bold" aria-hidden />
          Delete my {count === 1 ? "recording" : `${count} recordings`}
        </button>
      )}
    </div>
  );
}

function InstallRow() {
  const { state, install } = useInstall();
  const how =
    state === "installed"
      ? "Rehearse is installed. Open it from your home screen or apps."
      : state === "ios"
        ? "In Safari, tap the Share button, then \u201cAdd to Home Screen\u201d."
        : state === "ready"
          ? "Opens in its own window, and still works without internet for Remember, the Calm corner and practice with built-in notes."
          : "In Chrome or Edge, use the install button in the address bar or the menu (\u201cInstall Rehearse\u201d). It still works without internet for Remember, the Calm corner and practice with built-in notes.";
  return (
    <Row
      label="Install Rehearse"
      description={how}
      control={
        state === "ready" ? (
          <button type="button" className="btn btn-ghost min-h-10 shrink-0 text-label" onClick={install}>
            Install
          </button>
        ) : (
          <span />
        )
      }
    />
  );
}

/** A group of related things (settings, or progress), headed by a small sticker icon in its own colour so each group is easy to spot. */
function Group({
  title,
  hint,
  icon: GroupIcon,
  ink,
  padded = false,
  anchor,
  children,
}: {
  /** An id links can jump to, like /me#voice. */
  anchor?: string;
  title: string;
  hint: string;
  icon: Icon;
  ink: string;
  /** A card with padding, for free-form content, rather than a list of setting rows. */
  padded?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section id={anchor} aria-labelledby={id} className="flex scroll-mt-20 flex-col gap-3">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-10 shrink-0 -rotate-3 items-center justify-center rounded-full border-[3px] border-[var(--die)] text-on-ink shadow-[var(--sticker-shadow)] ${ink}`}
        >
          <GroupIcon size={20} weight="fill" aria-hidden />
        </span>
        <div>
          <h2 id={id} className="text-title font-bold tracking-[-0.01em]">
            {title}
          </h2>
          <p className="text-body-sm text-muted">{hint}</p>
        </div>
      </div>
      <div className={padded ? "panel p-5 sm:p-6" : "panel flex flex-col divide-y divide-line"}>{children}</div>
    </section>
  );
}

/** One setting: label and explanation, with its control beside (or below, when `stacked`). */
function Row({
  label,
  description,
  control,
  stacked = false,
  anchor,
}: {
  anchor?: string;
  label: ReactNode;
  description: string;
  control: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div id={anchor} className={`flex scroll-mt-20 gap-4 p-5 ${stacked ? "flex-col" : "items-start justify-between"}`}>
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="mt-1 max-w-[56ch] text-label leading-relaxed text-muted">{description}</p>
      </div>
      {control}
    </div>
  );
}

function Switch({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-150 ${
        checked ? "border-ink bg-ink" : "border-line bg-surface-2"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full transition-transform duration-150 ${
          checked ? "translate-x-[22px] bg-floor" : "translate-x-[3px] bg-muted"
        }`}
      />
    </button>
  );
}
