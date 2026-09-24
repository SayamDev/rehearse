---
name: Rehearse
description: Free interview practice where every skill you practise becomes a die-cut sticker you earn.
colors:
  floor: "#f3f4fb"
  surface: "#fdfdff"
  surface-2: "#e9ebf7"
  ink: "#1c1b2e"
  muted: "#56566e"
  line: "#d8dbee"
  on-ink: "#1c1b2e"
  die: "#fdfdff"
  tomato: "#ff5a3c"
  sky: "#3ba7ff"
  lime: "#b8e62e"
  sun: "#ffc83d"
  grape: "#a58bff"
  mint: "#3ddbb4"
  sun-text: "#8a5a00"
  cue: "#ff5a3c"
  up: "#2f7a12"
  down: "#c2331b"
  focus: "#1f6fd1"
  floor-dark: "#17162a"
  surface-dark: "#221f38"
  surface-2-dark: "#2d2a48"
  ink-dark: "#f4f3ff"
  muted-dark: "#b1afcc"
  line-dark: "#3a3760"
  die-dark: "#fbfbff"
  sun-text-dark: "#ffc83d"
  up-dark: "#b8e62e"
  down-dark: "#ff8a73"
  focus-dark: "#3ba7ff"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "2.4rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  display-lg:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "3.4rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  score:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  score-lg:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline-lg:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  question:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  title-lg:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  score-sm:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1
  wordmark:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1
  tape:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, ui-sans-serif, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1
  body-lg:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
  micro:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  skeleton: "10px"
  focus: "12px"
  control: "14px"
  panel: "20px"
  score-sticker: "22px"
  sticker: "999px"
spacing:
  gutter: "16px"
  gutter-sm: "24px"
  panel-pad: "20px"
  panel-pad-sm: "24px"
  section: "56px"
  content-max: "768px"
  content-wide: "1152px"
  touch: "44px"
  touch-lg: "48px"
  record: "96px"
components:
  button-go:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.on-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 18.4px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.floor}"
    rounded: "{rounded.control}"
    padding: "0 18.4px"
    height: "44px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 18.4px"
    height: "44px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "0 9.6px"
    height: "44px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 15.2px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-pad}"
  sticker:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.on-ink}"
    typography: "{typography.tape}"
    rounded: "{rounded.sticker}"
    padding: "6.7px 11.2px 6.4px"
  sticker-sky:
    backgroundColor: "{colors.sky}"
    textColor: "{colors.on-ink}"
  sticker-lime:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.on-ink}"
  sticker-tomato:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.on-ink}"
  sticker-empty:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
  score-sticker:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.score}"
    rounded: "{rounded.score-sticker}"
    padding: "12px 16px 8px"
  record-sticker:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sticker}"
    size: "96px"
  step-marker-current:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sticker}"
    size: "40px"
  step-marker-done:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sticker}"
    size: "40px"
  step-marker-todo:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.sticker}"
    size: "40px"
  skill-sticker:
    rounded: "{rounded.sticker}"
    size: "64px"
  skill-sticker-sm:
    rounded: "{rounded.sticker}"
    size: "48px"
---

# Design System: Rehearse

## Overview

**Creative North Star: "The Sticker Book"**

Rehearse is a sticker sheet. The backing is a cool lilac-white in light mode and a deep ink-violet at night. White paper sheets (panels) sit on it, and everything that marks progress is a bold die-cut sticker stuck on top: the wordmark, the level, the take tab, the score change, the step you are on, the skill you earned. Every skill you practise is a sticker waiting on the sheet as a dashed outline; score 7 or more and it slaps on in full colour.

Four flat inks do all the talking, each with one job. Tomato is go and record. Sky names takes and carries info. Lime is earned and improved. Sun is XP, level, streak and the step you are on. Text on any ink is always the same dark ink, so every sticker reads the same way. Reading text is ink and muted grey set in Atkinson Hyperlegible Next; everything chunky (headlines, the question, scores, sticker text) is Bricolage Grotesque.

The signature moment is the slap. On a retake the new score arrives on a white die-cut score sticker that drops in larger and tilted and springs onto the sheet, then the improvement sticker lands beside it. It refuses the green-mascot learning-app default and the dark productivity-tool default: the world is playful through material (paper, die-cut, tilt), not through characters or confetti.

**Key Characteristics:**
- Cool lilac-white backing (dark: deep ink-violet), white paper panels with 20px corners.
- Four flat sticker inks with fixed roles; text on ink is always the dark ink.
- Every sticker tilts slightly, has a thick white die-cut border and a short soft shadow.
- Not earned yet is a dashed outline where the sticker will go.
- Bricolage Grotesque for display and numbers, Atkinson Hyperlegible Next for reading.
- Phosphor fill icons inside round die-cut stickers.
- Scores out of 10 with one decimal, rendered through the Score component.

## Colors

A cool, near-white paper world where colour is almost entirely carried by four flat sticker inks. Both themes follow `prefers-color-scheme`; the four inks and the die-cut white are the same in both, while neutrals and text-safe tones have a `-dark` counterpart.

### Primary
- **Tomato** (`tomato`): the go action and recording. The Start / Take again sticker button, the round record sticker, the wordmark sticker, the flag sticker, the due-count badge. `cue` is the same ink named for the record ring pulse and level meter.

### Secondary
- **Sky** (`sky`): takes and info. The Take tab on the score sticker, the Take N sticker on the answer panel, the Quick notes sticker, take history.

### Tertiary
- **Lime** (`lime`): earned and improved. The positive score-change sticker, answered step markers, earned skill stickers, the strength meter segments, recalled key points, "Free, no signup".
- **Sun** (`sun`): XP, level, streak and the current step. The Lv sticker in the nav, the Level sticker, the XP bar fill, the current step marker, the active mobile tab, content stickers like "Next take" and "Work on", text selection. `sun-text` is its text-safe tone (deep amber in light, full sun in dark) for the streak flame.

### Neutral
- **Lilac Backing** (`floor`, `floor-dark`): page ground, sticky nav and action bar ground at 75 to 95% with backdrop blur, text on the ink button. The dark floor is also the dark `theme-color`.
- **Paper Sheet** (`surface`, `surface-dark`): panels, fields, ghost buttons, the score sticker face.
- **Raised Paper** (`surface-2`, `surface-2-dark`): active top-nav pill, empty XP track and meter segments, inline alerts, skeletons.
- **Ink** (`ink`, `ink-dark`): headings, emphasis, the primary button fill. `on-ink` is the fixed dark ink used for all text on sticker inks in both themes.
- **Muted** (`muted`, `muted-dark`): secondary prose, captions, the struck-through previous take, inactive nav, unearned outlines.
- **Line** (`line`, `line-dark`): panel borders, section dividers, field and ghost button borders, the dotted sticker-sheet backing.
- **Die-cut White** (`die`, `die-dark`): the thick border around every sticker. Stays white at night.
- **Up / Down** (`up`, `down` and dark pairs): per-criterion gains and drops in small text, a negative delta's text, errors, the over-time timer. Never a fill.
- **Focus** (`focus`, `focus-dark`): the 3px focus outline.

### Named Rules
**The Four Inks Rule.** Each ink has one job: tomato for go and recording, sky for takes and info, lime for earned and improved, sun for XP, level, streak and the current step. A new sticker picks its ink by meaning, not by what looks nice next to it. (Skill stickers are the exception: each skill has its own fixed ink as its art.)

**The One Text Colour On Ink Rule.** Text and icons on any ink are `on-ink`, in both themes. Never white on tomato, never ink-coloured stickers.

## Typography

**Display Font:** Bricolage Grotesque (with Atkinson Hyperlegible Next, ui-sans-serif, sans-serif)
**Body Font:** Atkinson Hyperlegible Next (with ui-sans-serif, system-ui, sans-serif)

**Character:** Bricolage is chunky, slightly quirky and heavy at the top, the voice of stickers and scores. Atkinson is built for legibility, calm and open for everything you read. `h1` to `h3`, sticker text, buttons and scores use Bricolage; prose, labels and fields use Atkinson.

### Hierarchy
Every size is a `--text-*` token in `globals.css`, used as `text-<token>` in markup.
- **Display** (`display`, `display-lg` from 640px; 800, tight): the landing question only, max 16ch.
- **Score** (`score` on notes, `score-lg` on the session report; 800, line-height 1): the current score on the score sticker.
- **Headline** (`headline`, `headline-lg`; 700): page titles, the Me level title, recall result.
- **Question** (`question`, `headline` from 640px; 600): the interview question on the practice page, recall drill and saved-answer editor.
- **Title** (`title`; 700): in-page section headings ("What your notes look like", "Stickers to earn").
- **Wordmark** (`wordmark`; 700): the Rehearse wordmark, set on a tomato sticker.
- **Body** (`body-lg` for the fix line and landing intro from 640px, `body`, `body-sm` for secondary rows; 400, relaxed 1.625). Prose runs 52 to 62ch.
- **Label** (`label`; 600): skill sticker names, field labels.
- **Tape** (`tape`; 700, line-height 1): text on stickers. The delta sticker runs at `body`.
- **Micro** (`micro`; 700): the due-count badge only.

### Named Rules
**The Token Ramp Rule.** The type ramp only comes from tokens. A size that is not a `--text-*` token does not ship; if a new size is needed, add a token first.

**The Score Rule.** Scores always read out of 10 with one decimal and render through the Score component: Bricolage, tabular lining digits, with the decimal point switched back to normal width so it never reads "7 . 9".

**The No Kicker Rule.** No eyebrow or kicker labels over headings. A sticker carries content (a take, a level, "Next take", where you stopped), never section decoration.

## Layout

A centred column, max 768px, with 16px gutters (24px from 640px). The main area pads 24px on top (40px from 768px) and 112px on the bottom below 768px so content clears the tab bar. A page opts into a wide layout by carrying `data-wide`; at lg the main widens to max 1152px.

- **Landing.** Two columns at lg (1.05fr and 1fr, centred, 56px gap): the question, job input and Start sticker on the left, the sample notes card on the right. Below lg they stack, and the mobile first view still shows the sample score row (Take 1 struck through, the Take 2 score sticker, the +1.8 lime sticker). Sections stack at 56px.
- **Navigation.** From 768px a sticky 64px top bar with the tomato wordmark sticker, pill links, the streak and a sun Lv sticker. Below 768px a fixed four-tab bottom bar (Practice, Remember, Archive, Me); the active tab's icon becomes a tilted sun sticker.
- **Practice.** Step markers, then the question large, then the answer panel with the round tomato record sticker centred. Actions sit in a sticky blurred bar above the tab bar; buttons stretch equally on mobile and size to content from 640px.
- **Sticker sheet.** Three columns on mobile, five from 640px, on a dotted backing (16px grid) inside a panel.

Touch targets are at least 44px; primary flow actions are 48px tall. Panels pad 20px, 24px from 640px.

## Elevation & Depth

Paper on a backing, stickers on paper. There are exactly two shadows and each belongs to a material. Sheets (panels) lift a little off the backing with a soft wide shadow. Stickers sit on top with a shorter, tighter shadow and a white die-cut border. Sticky bars use a hairline and blurred floor, not shadow. In dark mode both shadows deepen to black.

### Shadow Vocabulary
- **Sticker** (`--sticker-shadow`, light: `0 1px 0 rgb(28 27 46 / 0.1), 0 4px 10px -4px rgb(28 27 46 / 0.28)`): every sticker, the score sticker, the go button, the record sticker, step markers, the active tab icon.
- **Sheet** (`--sheet-shadow`, light: `0 1px 2px rgb(28 27 46 / 0.05), 0 10px 28px -18px rgb(28 27 46 / 0.3)`): panels.
- **Cue pulse**: while recording, a tomato halo grows from 0 to 20px and fades (1.6s, expo-out, looping) behind the record sticker's own shadow.

### Named Rules
**The Die-Cut Rule.** Every sticker tilts slightly (between about -6 and 6 degrees), has a white die-cut border (3px on labels, 4px on large stickers) and the short sticker shadow. There is no flat sticker in use.

**The Dashed Slot Rule.** Unearned means a dashed outline: no fill, no shadow, no tilt, muted mark. The skill slot, an unstarted step and a flat or negative delta all use it.

## Shapes

Round and soft. Stickers are full pills or circles (999px). The score sticker is a rounded square (22px). Panels are 20px sheets. Buttons and fields are 14px. The focus ring rounds at 12px; skeletons at 10px. Skill stickers sit in a thin 1px kiss-cut ring on the backing.

Die-cut borders are white and thick; paper borders are 1.5 to 2px `line`. Unearned is a 2 to 2.5px dashed outline.

## Components

### Buttons
Chunky and pressable, Bricolage 700 at `body`, 44px minimum, 14px corners.
- **Go:** a tomato sticker you press, with die-cut border and sticker shadow. The one move-forward action (Start, Record, Take again). Hover lifts 1px and tilts -1deg.
- **Primary (ink):** ink fill, floor text. Hover mixes 14% floor into the ink. Used for finishing (See my results) and fallbacks.
- **Ghost:** paper fill, 2px line border; hover darkens the border.
- **Quiet:** muted text, no border; hover turns ink.
- **States:** press scales to 0.97 (150ms expo-out); disabled is 45% opacity.

### Stickers (chips)
- **Label sticker:** pill, 3px die-cut border, sticker shadow, -2deg tilt, Bricolage 700 `tape`. Sun by default; sky, lime and tomato variants by role.
- **Empty sticker:** dashed 2px line outline, muted text, no shadow.
- **Other chips:** the "Sample" tag is a 1px line pill with muted text.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** paper sheet on the backing.
- **Shadow Strategy:** sheet shadow (see Elevation & Depth).
- **Border:** 1.5px line. Sections inside a panel are divided by top hairlines.
- **Internal Padding:** 20px, 24px from 640px.

### Inputs / Fields
- **Style:** paper fill, 2px line border, 14px corners, 12px by 15.2px padding, `body` text. The caret is tomato.
- **Hover:** border darkens toward muted.
- **Focus:** 3px focus outline 1px out, border transparent.
- **Error:** a `down` message with `role="alert"`.

### Navigation
- **Top bar:** sticky, blurred floor, hairline bottom, max 1152px. Tomato wordmark sticker; pill links in `body-sm` 500 (active on raised paper, inactive muted); streak flame in `sun-text` and a sun Lv sticker at the right.
- **Bottom tabs (below 768px):** four equal 60px tabs, 20px Phosphor icon over a label. The active icon sits in a tilted sun sticker with fill weight.

### Score Sticker (signature)
The score printed on a white die-cut sticker: 22px corners, 4px die border, sticker shadow, tilted -3deg (-2deg on the report), with a sky Take tab stuck over its top-left corner. On a retake it slaps in from scale 1.35 and 10deg more tilt, springing to rest (stiffness 360, damping 17). The previous take sits beside it small, muted and struck through.

### Delta Sticker
The score change as "+1.8", "-0.4" or "Same score" in `body`. A gain is a lime sticker; a drop or no change is the dashed empty sticker, with `down` text for a drop. On a retake it lands 120ms after the score sticker from scale 1.7 and -22deg.

### Skill Sticker Sheet
Nine round skill stickers (48px or 64px), each with a Phosphor fill icon, its own ink and its own tilt, 4px die border. Unearned skills are dashed circles with a bold outline icon. When earned they slap in from scale 1.6 (stiffness 380, damping 18).

### Record Sticker
A 96px round tomato sticker with a microphone, 4px die border, tilted -3deg; hover straightens it and scales to 1.04. While recording the border turns ink, the icon becomes a stop, the cue ring pulses, and a level meter, "Recording" label and timer appear.

### Step Markers
40px round markers numbered 1, 2, 3 in Bricolage tabular digits. The current step is a sun sticker tilted 3deg carrying a small flag sticker; an answered step is a lime sticker tilted -3deg; an unstarted step is a dashed outline.

### Flag Sticker
A small tomato pill with a filled pennant, die border, tilted -6deg. It marks where you stopped: on the current step marker and, with a label ("Question 2"), on the resume card.

### Sticker Loader
The one loader for every wait: three die-cut dots (tomato, sky, lime) hopping and tilting in turn, with a line naming who is doing what ("Sam is reading your answer..."). Waits that are often instant use the delayed variant so they never flash. Under reduced motion the dots stay put and fade slowly. Layout-shaped skeletons still stand in for content that is loading.

### Voice Bars
Four small bars beside the interviewer's name while they speak, so the voice and the card stay in sync.

## Do's and Don'ts

### Do:
- Use tomato for one main action per screen. Labels, flags and secondary buttons take sun, sky, grape or ghost, so the red button is always the obvious next step.
- **Do** give every sticker a slight tilt, a white die-cut border and the short sticker shadow.
- **Do** pick a sticker's ink by role: tomato for go and recording, sky for takes and info, lime for earned and improved, sun for XP, level, streak and the current step.
- **Do** show anything not yet earned as a dashed outline.
- **Do** show the current score on the white die-cut score sticker with a sky Take tab, and let it slap in on a retake.
- **Do** mark where the user stopped with the flag sticker.
- **Do** render every score through the Score component, out of 10 with one decimal.
- **Do** take every font size from the `--text-*` token ramp.
- **Do** keep the landing two columns at lg, with the sample score row visible in the mobile first view.

### Don't:
- **Don't** ship a flat, untilted, borderless or shadowless sticker.
- **Don't** put white text on an ink, or use an ink outside its role.
- **Don't** use a literal or framework-default font size.
- **Don't** add eyebrow or kicker labels over headings.
- **Don't** use mascots or green celebration screens; progress is the sticker sheet filling up.

## Collectibles, interviewers and game surfaces

**Sticker collection.** 24 collectibles in `src/lib/collection.ts`: 9 skill stickers (common), 12 achievements (common or rare) and 3 legendary characters. Art lives in `src/components/sticker-art.tsx` and is all authored SVG:
- Word stickers: bold Bricolage caps on one of ten die-cut shapes (burst, star, scallop, pill, bubble, ticket, shield, bolt, blob, banner), filled with one of six inks (tomato, sky, lime, sun, grape, mint), always with a 10px white die-cut stroke.
- Rare stickers add a white four-point sparkle. Legendary characters (golden mic, necktie in sunglasses, sticker-covered briefcase) use a holographic foil gradient and two sparkles.
- Locked stickers keep their shape as a dashed outline on `surface-2` with muted words, so people can always see what they are working towards. Every sticker's how-to-earn line is visible in the album.
- The album (`collection-album.tsx`) shows a detail card for the tapped sticker, then Legendary, Skill and Achievement groups. It appears on the landing page, in Me, and at `/collection`.

**Unlock moment.** `sticker-celebration.tsx` shows each new sticker once, above the tab bar: the Lottie burst (`public/lottie/sticker-burst.json`, authored with text-to-lottie and verified in Skottie) plays behind the sticker, which slaps in from 1.8x and -24deg. Nothing animates under reduced motion.

**Interviewers.** Sam (friendly recruiter), Priya (busy manager, level 3) and Mr. Grant (tough boss, level 5) are die-cut sticker portraits (`persona-avatar.tsx`). In a round, the interviewer sits beside a speech-bubble card that holds the question; the bubble has a 3px white die-cut border and a tail. Follow-ups appear under the notes in a dashed card with the interviewer's portrait.

**Modes.** Quick Round, Daily Challenge (tomato sticker label on its landing card), Speed Round (level 2, 60-second timer sticker that turns tomato under 10 seconds) and Boss Round (level 5). Locked modes and interviewers stay visible with a lock line and the level needed.

**Coach.** `/coach` is a chat: coach messages sit on white sheets, your messages are sky die-cut bubbles tilted 0.6deg. Replies from the built-in guide carry an outline "Quick guide" sticker.
