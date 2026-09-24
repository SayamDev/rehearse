"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { ArrowRightIcon, ChartLineUpIcon, FireIcon, GearSixIcon, SpeakerHighIcon, StickerIcon } from "@phosphor-icons/react";
import { liveStreak, resetAll, updateSettings, useStore } from "@/lib/store";
import { levelFromXp } from "@/lib/scoring";
import { COLLECTION, earnedIds } from "@/lib/collection";
import { PERSONAS } from "@/lib/game";
import { speak } from "@/lib/tts";
import { CollectionAlbum } from "./collection-album";
import { deleteRecordings } from "@/lib/recordings";
import { StickerArt } from "./sticker-art";
import { VoiceSetting } from "./voice-setting";
import { Segmented } from "./segmented";

type Tab = "progress" | "stickers" | "settings";

const TABS: { id: Tab; label: string; icon: typeof GearSixIcon }[] = [
  { id: "progress", label: "Progress", icon: ChartLineUpIcon },
  { id: "stickers", label: "Stickers", icon: StickerIcon },
  { id: "settings", label: "Settings", icon: GearSixIcon },
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

  // Opening /me#settings (or #stickers) lands on that tab.
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (TABS.some((t) => t.id === fromHash)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(fromHash as Tab);
    }
  }, []);

  function choose(next: Tab) {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
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
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Me</h1>
        <div role="tablist" aria-label="Your page" className="flex w-fit max-w-full gap-1 rounded-full border-2 border-line bg-surface p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`${baseId}-${id}`}
              aria-selected={tab === id}
              aria-controls={`${baseId}-panel`}
              onClick={() => choose(id)}
              className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-label font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] sm:px-5 ${
                tab === id ? "bg-ink text-floor" : "text-muted hover:text-ink"
              }`}
            >
              <Icon size={18} weight={tab === id ? "fill" : "regular"} aria-hidden />
              {label}
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

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="level" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="sticker tnum text-body">Level {level.level}</span>
          <h2 id="level" className="text-title-lg font-bold tracking-[-0.02em]">
            {level.title}
          </h2>
        </div>
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
        <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm text-muted">
          <span className="flex items-center gap-1.5">
            <FireIcon size={18} weight={streak ? "fill" : "regular"} className={streak ? "text-sun-text" : ""} aria-hidden />
            <span className="tnum font-semibold text-ink">{streak}</span> day streak (best {profile.bestStreak})
          </span>
          <span>
            <span className="tnum font-semibold text-ink">{answers}</span> answers
          </span>
          <span>
            <span className="tnum font-semibold text-ink">{retakes}</span> retakes
          </span>
          <span>
            <span className="tnum font-semibold text-ink">{earned.size}</span> of {COLLECTION.length} stickers
          </span>
        </p>
      </section>

      {felt.length > 0 && (
        <section aria-labelledby="nerves" className="flex flex-col gap-1.5">
          <h2 id="nerves" className="font-semibold">
            Nerves
          </h2>
          <p className="max-w-[60ch] text-body-sm leading-relaxed text-muted">
            You felt calmer at the end of <span className="tnum font-semibold text-ink">{calmer}</span> of{" "}
            <span className="tnum font-semibold text-ink">{felt.length}</span> {felt.length === 1 ? "round" : "rounds"}. The more
            you practise, the more familiar the real thing feels.{" "}
            <Link href="/calm" className="font-semibold text-ink underline underline-offset-4">
              Calm corner
            </Link>
          </p>
        </section>
      )}

      {next && (
        <section aria-labelledby="next-goal" className="panel flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <StickerArt item={next} earned={false} size={84} tilt={-4} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 id="next-goal" className="text-title font-bold">
              Next sticker: {next.name}
            </h2>
            <p className="max-w-[56ch] text-body-sm text-muted">{next.how}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/practice/new" className="btn btn-go">
              Practise now
            </Link>
            <button type="button" className="btn btn-ghost" onClick={onStickers}>
              All stickers
            </button>
          </div>
        </section>
      )}

      <section aria-labelledby="how-xp" className="flex flex-col gap-2">
        <h2 id="how-xp" className="font-semibold">
          How to level up faster
        </h2>
        <ul className="flex max-w-[62ch] flex-col gap-1.5 text-body-sm leading-relaxed text-muted">
          <li>Every answer earns XP. Beating your own score on a retake earns the most.</li>
          <li>Practise a little every day to grow your streak. The daily question takes two minutes.</li>
          <li>Save strong answers in Remember and recall them to earn extra XP.</li>
        </ul>
        <Link href="/archive" className="mt-1 flex w-fit items-center gap-1.5 text-label font-semibold underline underline-offset-4">
          See past sessions <ArrowRightIcon size={14} weight="bold" aria-hidden />
        </Link>
      </section>
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

/* ---------------- Settings ---------------- */

function SettingsTab() {
  const { profile, sessions, bank } = useStore();
  const s = profile.settings;
  const [confirming, setConfirming] = useState(false);
  const ids = { read: useId(), help: useId(), delivery: useId(), soft: useId(), large: useId(), plain: useId(), rec: useId() };
  const [recsCleared, setRecsCleared] = useState(false);
  const speed = SPEEDS.find((o) => Number(o.value) === s.voiceSpeed)?.value ?? "1";

  return (
    <div className="flex flex-col gap-8">
      <Group title="Your interviewer" hint="How questions sound when they're read to you.">
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

      <Group title="Answering" hint="How you answer and what help you get.">
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

      <Group title="Easier to use" hint="Make the app work better for you.">
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

      <Group title="Your data" hint="Everything stays in this browser.">
        <Row
          label={<label htmlFor={ids.rec}>Keep recordings of my spoken answers</label>}
          description="Saved only on this device, never uploaded. Your 10 best are kept so you can replay them in the Calm corner."
          control={<Switch id={ids.rec} checked={s.keepRecordings} onChange={(v) => updateSettings({ keepRecordings: v })} />}
        />
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <button
            type="button"
            className="btn btn-ghost min-h-10 text-label"
            onClick={() => deleteRecordings().then(() => setRecsCleared(true))}
          >
            Delete my recordings
          </button>
          {recsCleared && (
            <span role="status" className="text-label text-muted">
              Recordings deleted.
            </span>
          )}
        </div>
        <div className="flex flex-col gap-4 p-5">
          <p className="max-w-[60ch] text-body-sm leading-relaxed text-muted">
            Audio is only kept if you turn on recordings above, and then only on this device. In Live Interview, answers are sent to our AI provider to transcribe accurately, and not stored. Answer text is sent to our AI provider to be scored, with data retention turned off.{" "}
            <Link href="/privacy" className="font-semibold text-ink underline underline-offset-4">
              Read the privacy page
            </Link>
          </p>
          {!confirming ? (
            <button
              type="button"
              className="btn btn-ghost w-fit"
              onClick={() => setConfirming(true)}
              disabled={sessions.length === 0 && profile.xp === 0 && bank.length === 0}
            >
              Delete all my practice data
            </button>
          ) : (
            <div role="alert" className="flex flex-col gap-3 rounded-control border border-down/40 p-4">
              <p className="font-medium">Delete every session, saved answer, your XP, and your streak? This can&apos;t be undone.</p>
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

function Group({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div>
        <h2 id={id} className="text-title font-bold tracking-[-0.01em]">
          {title}
        </h2>
        <p className="text-body-sm text-muted">{hint}</p>
      </div>
      <div className="panel flex flex-col divide-y divide-line">{children}</div>
    </section>
  );
}

/** One setting: label and explanation, with its control beside (or below, when `stacked`). */
function Row({
  label,
  description,
  control,
  stacked = false,
}: {
  label: ReactNode;
  description: string;
  control: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div className={`flex gap-4 p-5 ${stacked ? "flex-col" : "items-start justify-between"}`}>
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
