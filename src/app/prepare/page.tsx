import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  StackIcon,
  ListNumbersIcon,
  LifebuoyIcon,
  CoinsIcon,
  SunHorizonIcon,
  FileTextIcon,
  ChatCircleTextIcon,
  CoffeeIcon,
  PersonSimpleIcon,
  PrinterIcon,
  UserSoundIcon,
  WindIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PersonaAvatar } from "@/components/persona-avatar";
import { InterviewCountdown } from "@/components/interview-countdown";
import { UiText } from "@/components/ui-text";

export const metadata: Metadata = { title: "Get ready", description: "Tools for the big day: a full mock interview, your intro, and questions to ask." };

const TOOLS = [
  {
    href: "/prepare/advert",
    title: "Likely questions",
    note: "Got an interview? Paste the job advert to see the questions you'll most likely get, and why.",
    ink: "sticker-tomato",
    icon: MagnifyingGlassIcon,
  },
  {
    href: "/prepare/cv",
    title: "CV helper",
    note: "Upload or paste your CV. Find your best stories, then do a mock interview built from them.",
    ink: "sticker-grape",
    icon: FileTextIcon,
  },
  {
    href: "/prepare/answer",
    title: "Answer builder",
    note: "Freeze on \u201ctell me about a time\u201d? Build an answer one small box at a time.",
    ink: "sticker-lime",
    icon: ListNumbersIcon,
  },
  {
    href: "/prepare/tricky",
    title: "Tricky topics",
    note: "CV gaps, being fired, no experience, disability, a criminal record: honest ways to talk about them.",
    ink: "bg-mint",
    icon: LifebuoyIcon,
  },
  {
    href: "/prepare/packs",
    title: "Question packs",
    note: "Real questions for retail, care, hospitality, warehouse, office, tech, creative, trades and more.",
    ink: "sticker-sky",
    icon: StackIcon,
  },
  {
    href: "/practice/warmup",
    title: "Warm-up round",
    note: "Three easy, everyday questions to get talking. Nothing is scored.",
    ink: "sticker-lime",
    icon: CoffeeIcon,
  },
  {
    href: "/prepare/intro",
    title: "\u201cTell me about yourself\u201d builder",
    note: "Write your opening answer in three short steps, then practise saying it.",
    ink: "sticker-sun",
    icon: UserSoundIcon,
  },
  {
    href: "/prepare/questions",
    title: "Questions to ask them",
    note: "Good questions for the end of the interview. Star your favourites.",
    ink: "sticker-grape",
    icon: ChatCircleTextIcon,
  },
  {
    href: "/prepare/body",
    title: "Body language",
    note: "Eye contact, posture, greetings, and how to look good on a video call.",
    ink: "sticker-sky",
    icon: PersonSimpleIcon,
  },
  {
    href: "/calm",
    title: "Calm corner",
    note: "Get nervous or panicky? Breathing, grounding, and what to say if your mind goes blank.",
    ink: "bg-mint",
    icon: WindIcon,
  },
  {
    href: "/prepare/offer",
    title: "Pay Talk",
    note: "Got an offer? Practise asking for more pay, politely, with Mr. Grant.",
    ink: "sticker-sun",
    icon: CoinsIcon,
  },
  {
    href: "/prepare/today",
    title: "Interview-day mode",
    note: "Your checklist, a warm-up, your card and one minute of breathing on one screen.",
    ink: "sticker-sky",
    icon: SunHorizonIcon,
  },
  {
    href: "/prepare/card",
    title: "Interview-day card",
    note: "Your intro, key stories and questions on one page to print or save.",
    ink: "sticker-sun",
    icon: PrinterIcon,
  },
];

export default function PreparePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">
          <UiText k="prepare.title" />
        </h1>
        <p className="max-w-[56ch] text-muted">Got an interview coming up? These help with the parts almost every interview has.</p>
      </div>

      <InterviewCountdown />

      <section aria-labelledby="mock" className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <PersonaAvatar id="friendly" size={80} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 id="mock" className="text-title-lg font-bold tracking-[-0.02em]">
            Full mock interview
          </h2>
          <p className="max-w-[52ch] text-body-sm leading-relaxed text-muted">
            A real interview from hello to goodbye: &ldquo;tell me about yourself&rdquo;, four questions for your job, then
            your questions for them. About 15 minutes, with notes on every answer.
          </p>
        </div>
        <Link href="/practice/new?mode=mock" className="btn btn-go shrink-0">
          Start mock interview <ArrowRightIcon size={18} weight="bold" aria-hidden />
        </Link>
      </section>

      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {TOOLS.map(({ href, title, note, ink, icon: ToolIcon }) => (
          <li key={href}>
            <Link href={href} className="group flex items-center gap-4 py-5 transition-colors hover:text-ink">
              <span className={`sticker ${ink} size-12 shrink-0 justify-center p-0`} aria-hidden>
                <ToolIcon size={24} weight="bold" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-title font-bold">{title}</span>
                <span className="text-body-sm text-muted">{note}</span>
              </span>
              <ArrowRightIcon size={20} weight="bold" className="shrink-0 transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
