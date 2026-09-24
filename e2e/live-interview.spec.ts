import { expect, test } from "@playwright/test";

/**
 * Live Interview, start to finish, with a fake microphone, fake speech recognition and
 * fake AI replies, so it runs the same every time and costs nothing:
 * the interviewer asks, the candidate "answers", the interviewer reacts, and the notes arrive.
 */

const ANSWERS = [
  "I'm finishing a retail course at college and I work weekends at a bakery where I serve lots of customers.",
  "At the bakery a customer was upset about a late order, so I apologised, called our other shop and got it sent over within an hour.",
  "What does a good first month look like in this role?",
];

const GRADING = {
  rubric: Object.fromEntries(["relevance", "structure", "specificity", "ownership", "clarity", "role_fit"].map((k) => [k, { score: 7, why: "Good." }])),
  star: { situation: true, task: true, action: true, result: true },
  strength: { quote: "I apologised", why: "Clear action." },
  fix: "Add a number.",
  improvedAnswer: "Better answer.",
  followUpQuestion: "What next?",
  isGenuineAnswer: true,
  criteria: [{ point: "A real example", met: true }],
};

const q = (id: string, text: string, category = "behavioral") => ({
  question: { id, text, category, competency: "communication", difficulty: 2, lookingFor: "A real example." },
  takes: [],
});

test("Live Interview runs hands-free from hello to notes", async ({ page }) => {
  const session = {
    id: "11111111-2222-4333-8444-555555555555",
    role: "Retail assistant",
    seniority: "entry",
    jobDescription: "",
    mode: "live",
    persona: "friendly",
    questions: [
      q("mock-opener", "To start, tell me a bit about yourself.", "motivation"),
      q("q1", "Tell me about a time you helped an unhappy customer."),
      q("mock-closer", "That's everything from me. Do you have any questions for me?", "closing"),
    ],
    createdAt: new Date().toISOString(),
    completedAt: null,
    demo: true,
  };

  await page.addInitScript(
    ({ session, answers }) => {
      if (!localStorage.getItem("rehearse:v1")) {
        localStorage.setItem(
          "rehearse:v1",
          JSON.stringify({
            sessions: [session],
            bank: [],
            profile: { xp: 0, settings: { voiceEngine: "standard", readAloud: true, keepRecordings: false, helpers: false } },
          }),
        );
      }
      // The interviewer's voice finishes instantly.
      const synth = window.speechSynthesis;
      synth.speak = (u: SpeechSynthesisUtterance) => {
        setTimeout(() => {
          u.onstart?.(new Event("start") as SpeechSynthesisEvent);
          setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 30);
        }, 10);
      };
      // A silent microphone (Chrome's own fake device beeps, which sounds like non-stop talking).
      navigator.mediaDevices.getUserMedia = async () => new AudioContext().createMediaStreamDestination().stream;
      // Speech recognition that "hears" the next scripted answer once, then silence.
      let turn = 0;
      let heardTurn = -1;
      class FakeRecognition {
        continuous = true;
        interimResults = true;
        lang = "en-GB";
        onresult: ((e: unknown) => void) | null = null;
        onerror: ((e: unknown) => void) | null = null;
        onend: (() => void) | null = null;
        private stopped = false;
        start() {
          this.stopped = false;
          if (heardTurn === turn) return;
          const mine = turn;
          const text = answers[Math.min(turn, answers.length - 1)];
          setTimeout(() => {
            if (this.stopped || heardTurn === mine) return;
            heardTurn = mine;
            const result = Object.assign([{ transcript: text }], { isFinal: true });
            this.onresult?.({ resultIndex: 0, results: [result] });
          }, 400);
        }
        stop() {
          this.stopped = true;
          // The answer is over once it was heard and the app stops listening.
          if (heardTurn === turn) turn++;
          setTimeout(() => this.onend?.(), 0);
        }
        abort() {
          this.stop();
        }
      }
      (window as unknown as Record<string, unknown>).SpeechRecognition = FakeRecognition;
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition;
    },
    { session, answers: ANSWERS },
  );

  await page.route("**/api/speak", (r) => r.fulfill({ status: 503, json: { fallback: true } }));
  await page.route("**/api/transcribe", (r) => r.fulfill({ json: { fallback: true } }));
  await page.route("**/api/react", (r) => r.fulfill({ json: { reply: "That's really helpful to hear.", probe: "", source: "ai" } }));
  await page.route("**/api/grade", (r) => r.fulfill({ json: { grading: GRADING, source: "ai" } }));

  await page.goto(`/practice/${session.id}`);
  // Say how you feel, which starts the round.
  await page.getByRole("button", { name: "Okay", exact: true }).click();

  // The interviewer asks the first question and then listens.
  await expect(page.getByRole("heading", { level: 1 })).toContainText("tell me a bit about yourself", { timeout: 15_000 });

  // Every answer is heard, the interviewer reacts, and the round is graded at the end.
  await expect
    .poll(
      async () =>
        page.evaluate((id) => {
          const s = JSON.parse(localStorage.getItem("rehearse:v1") ?? "{}").sessions?.find((x: { id: string }) => x.id === id);
          return s ? { done: Boolean(s.completedAt), takes: s.questions.filter((x: { takes: unknown[] }) => x.takes.length).length, lines: s.conversation?.length ?? 0 } : null;
        }, session.id),
      { timeout: 70_000, intervals: [1000] },
    )
    .toEqual(expect.objectContaining({ done: true, takes: 3 }));

  const saved = await page.evaluate((id) => JSON.parse(localStorage.getItem("rehearse:v1")!).sessions.find((x: { id: string }) => x.id === id), session.id);
  const said = saved.conversation.map((l: { who: string; text: string }) => `${l.who}: ${l.text}`).join("\n");
  expect(said).toContain("you: I'm finishing a retail course");
  expect(said).toContain("That's really helpful to hear.");
  expect(saved.questions[1].takes[0].transcript).toContain("called our other shop");
});
