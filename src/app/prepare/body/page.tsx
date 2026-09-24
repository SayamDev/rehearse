import type { Metadata } from "next";
import Link from "next/link";
import {
  ArmchairIcon,
  CameraIcon,
  EyeIcon,
  HandPalmIcon,
  HandWavingIcon,
  HeadphonesIcon,
  LightbulbIcon,
  MonitorIcon,
  SmileyIcon,
  TShirtIcon,
  WifiHighIcon,

} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export const metadata: Metadata = {
  title: "Body language",
  description: "Simple tips for eye contact, posture, greetings and video calls.",
};

type Tip = { icon: Icon; ink: string; title: string; body: string };

const IN_PERSON: Tip[] = [
  {
    icon: HandWavingIcon,
    ink: "sticker-sun",
    title: "Say hello",
    body: "Smile, say their name if you know it, and offer a handshake if they offer one. A nod or a wave is fine too.",
  },
  {
    icon: ArmchairIcon,
    ink: "sticker-sky",
    title: "Sit up, lean in a little",
    body: "Sit back in the chair with both feet on the floor. Leaning slightly forward shows you're interested.",
  },
  {
    icon: EyeIcon,
    ink: "sticker-lime",
    title: "Look at them, on and off",
    body: "Look at their face while they talk, and look away naturally while you think. If eye contact is hard for you, looking at their eyebrows or nose works just as well.",
  },
  {
    icon: HandPalmIcon,
    ink: "sticker-grape",
    title: "Keep your hands easy",
    body: "Rest them on the table or your lap. Using them a little while you talk is natural. If they shake, holding a pen can help.",
  },
  {
    icon: SmileyIcon,
    ink: "sticker-sun",
    title: "Smile when it fits",
    body: "At the start, the end, and when you talk about something you enjoyed. You don't need to smile the whole time.",
  },
  {
    icon: TShirtIcon,
    ink: "sticker-sky",
    title: "Dress one step smarter",
    body: "Wear something clean and a little smarter than people wear in that job every day. Comfortable matters too.",
  },
];

const VIDEO: Tip[] = [
  {
    icon: CameraIcon,
    ink: "sticker-lime",
    title: "Camera at eye level",
    body: "Put your laptop or phone on some books so the camera is level with your eyes, not looking up at you.",
  },
  {
    icon: LightbulbIcon,
    ink: "sticker-sun",
    title: "Light in front of you",
    body: "Face a window or a lamp. A bright window behind you turns you into a shadow.",
  },
  {
    icon: MonitorIcon,
    ink: "sticker-grape",
    title: "Look at the lens",
    body: "When you speak, look at the camera, not at their face on the screen. That's what looks like eye contact to them.",
  },
  {
    icon: HeadphonesIcon,
    ink: "sticker-sky",
    title: "Quiet and clear",
    body: "Find a quiet spot. Headphones with a microphone make you easier to hear. Mute notifications first.",
  },
  {
    icon: WifiHighIcon,
    ink: "sticker-lime",
    title: "Test it 10 minutes before",
    body: "Open the link early, check the camera and sound, and close other apps. If the call drops, rejoin calmly and carry on.",
  },
];

function TipList({ tips }: { tips: Tip[] }) {
  return (
    <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
      {tips.map(({ icon: TipIcon, ink, title, body }, i) => (
        <li key={title} className="flex gap-4">
          <span
            aria-hidden
            className={`sticker ${ink} size-12 shrink-0 justify-center p-0 ${i % 2 ? "rotate-3" : "-rotate-3"}`}
          >
            <TipIcon size={24} weight="bold" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="font-bold">{title}</h3>
            <p className="max-w-[46ch] text-body-sm leading-relaxed text-muted">{body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function BodyLanguagePage() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">Body language</h1>
        <p className="max-w-[58ch] text-muted">
          How you sit and look matters less than you think. These small things help you seem calm and friendly. Do what feels
          natural for you.
        </p>
      </div>

      <section aria-labelledby="in-person" className="flex flex-col gap-5">
        <h2 id="in-person" className="text-title-lg font-bold tracking-[-0.02em]">
          In person
        </h2>
        <TipList tips={IN_PERSON} />
      </section>

      <section aria-labelledby="video" className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 id="video" className="text-title-lg font-bold tracking-[-0.02em]">
            Video interviews
          </h2>
          <p className="text-body-sm text-muted">
            Practise with <span className="font-semibold text-ink">Camera check</span> in the answer box to see how you look on
            screen.
          </p>
        </div>
        <TipList tips={VIDEO} />
      </section>

      <Link href="/practice/new" className="btn btn-go w-fit">
        Practise with the camera on
      </Link>
    </div>
  );
}
