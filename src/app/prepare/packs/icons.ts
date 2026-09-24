import {
  BriefcaseIcon,
  ChalkboardTeacherIcon,
  CodeIcon,
  ForkKnifeIcon,
  HammerIcon,
  HandHeartIcon,
  HeadsetIcon,
  PaintBrushIcon,
  StorefrontIcon,
  StudentIcon,
  TruckIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

/** Icon and sticker ink for each question pack. */
export const PACK_LOOK: Record<string, { icon: Icon; ink: string }> = {
  "first-job": { icon: StudentIcon, ink: "sticker-lime" },
  retail: { icon: StorefrontIcon, ink: "sticker-sun" },
  hospitality: { icon: ForkKnifeIcon, ink: "sticker-sky" },
  care: { icon: HandHeartIcon, ink: "bg-mint" },
  warehouse: { icon: TruckIcon, ink: "sticker-grape" },
  "customer-service": { icon: HeadsetIcon, ink: "sticker-sun" },
  office: { icon: BriefcaseIcon, ink: "sticker-sky" },
  tech: { icon: CodeIcon, ink: "sticker-lime" },
  creative: { icon: PaintBrushIcon, ink: "sticker-grape" },
  education: { icon: ChalkboardTeacherIcon, ink: "bg-mint" },
  trades: { icon: HammerIcon, ink: "sticker-sun" },
  leadership: { icon: UsersThreeIcon, ink: "sticker-sky" },
};
