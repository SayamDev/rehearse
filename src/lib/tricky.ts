import type { PractiseItem } from "@/components/practise-button";

/**
 * Tricky topics: the parts of someone's story they worry about most. Each has an honest,
 * safe way to talk about it, what the interviewer really wants, and a question to practise.
 * Rights notes are for the UK; the page says rules differ elsewhere.
 */
export type Tricky = {
  id: string;
  title: string;
  worry: string;
  theyWant: string;
  rights?: string[];
  shape: string[];
  example: string;
  avoid: string[];
  support?: { label: string; href: string }[];
  practice: PractiseItem;
};

export const TRICKY: Tricky[] = [
  {
    id: "gap",
    title: "A gap in your CV",
    worry: "“They'll think I was lazy, or that something is wrong with me.”",
    theyWant: "To know you're ready and reliable now. Almost everyone has a gap at some point.",
    shape: [
      "Say what the gap was, in one short sentence. You don't have to share private details.",
      "Mention anything you did or learned in that time, however small.",
      "Move forward: why you're ready now, and why this job.",
    ],
    example:
      "“I took eighteen months out to look after a family member. In that time I managed their appointments and the household budget, and I did an online Excel course. Things are settled now, and I'm ready to get back to work, which is why this admin role appeals to me.”",
    avoid: ["Apologising again and again", "Long explanations or private medical details", "Blaming anyone"],
    practice: {
      text: "I notice there's a gap in your CV. Can you tell me about that?",
      category: "curveball",
      competency: "adaptability",
      difficulty: 3,
      looking_for: "A short, honest reason, anything useful you did or learned, and why you're ready now.",
    },
  },
  {
    id: "fired",
    title: "Being fired, or leaving on bad terms",
    worry: "“If I tell the truth they won't hire me.”",
    theyWant: "Honesty, that you've learned from it, and that it won't happen again.",
    shape: [
      "Be honest and brief. Use neutral words like “it wasn't the right fit” or “I was let go”.",
      "Take your share of responsibility, without running yourself down.",
      "Say what you learned and what you do differently now, with proof if you can.",
    ],
    example:
      "“I was let go from my last job after a few months. I'd taken on more shifts than I could manage and I was late too often. It taught me to be realistic about my hours. Since then I've volunteered every Saturday for six months and haven't missed a single shift.”",
    avoid: ["Criticising your old boss or company", "Lying: references often reveal it", "Going into every detail"],
    practice: {
      text: "Why did you leave your last job?",
      category: "curveball",
      competency: "ownership",
      difficulty: 4,
      looking_for: "Honesty without blame, what you learned, and proof you've changed.",
    },
  },
  {
    id: "no-experience",
    title: "No work experience",
    worry: "“I've got nothing to talk about.”",
    theyWant: "Proof of everyday skills like reliability, teamwork and learning fast. They count wherever you learned them.",
    shape: [
      "Pick a real example from school, college, volunteering, sport, caring, faith groups, hobbies or home.",
      "Tell it like a work story: what happened, what you did, and what changed.",
      "Link it to the job: “That's the kind of thing I'd bring here.”",
    ],
    example:
      "“I haven't had a paid job yet, but I've coached the under-10s football team every Sunday for a year. I plan the sessions, keep the kids safe, and talk to parents when there's a problem. That's taught me to be reliable and patient, which I know matters in retail.”",
    avoid: ["Saying “I don't have any experience” and stopping there", "Apologising for your age"],
    support: [{ label: "National Careers Service (free advice)", href: "https://nationalcareers.service.gov.uk" }],
    practice: {
      text: "You don't have much work experience. What makes you think you can do this job?",
      category: "curveball",
      competency: "motivation",
      difficulty: 3,
      looking_for: "A real example from outside work that proves a skill this job needs.",
    },
  },
  {
    id: "disability",
    title: "A disability or health condition",
    worry: "“Should I tell them? Will it count against me?”",
    theyWant: "To know you can do the job, with any support you need. Many employers actively want to hire disabled people.",
    rights: [
      "You don't have to tell an employer about a disability or health condition. It's your choice.",
      "In the UK, employers generally shouldn't ask health questions before offering you a job, except to arrange adjustments for the interview or for a task that's essential to the role.",
      "You can ask for reasonable adjustments, such as extra time, a quiet room, or questions in writing.",
      "Access to Work is a free government scheme that can pay for support at work.",
    ],
    shape: [
      "If you choose to mention it, keep it short and focus on what you can do.",
      "Say what helps you work at your best (the adjustment), not every detail of the condition.",
      "Bring it back to the job and your strengths.",
    ],
    example:
      "“I'm dyslexic, so I use text-to-speech software for long documents. It means I check my work really carefully, and I'm great at explaining things out loud. With that software set up, I'll be able to do everything in this role.”",
    avoid: ["Feeling you must explain your medical history", "Apologising for needing adjustments"],
    support: [
      { label: "Access to Work (GOV.UK)", href: "https://www.gov.uk/access-to-work" },
      { label: "Scope: disability and work", href: "https://www.scope.org.uk/advice-and-support/" },
    ],
    practice: {
      text: "Is there anything we can do to help you work at your best?",
      category: "motivation",
      competency: "communication",
      difficulty: 2,
      looking_for: "A calm, confident answer that names any support you'd like, or simply says you're all set.",
    },
  },
  {
    id: "mental-health",
    title: "Mental health",
    worry: "“If they know about my anxiety or depression, they'll think I can't cope.”",
    theyWant: "Someone who can do the job and knows how to look after themselves.",
    rights: [
      "Mental health conditions can count as a disability in the UK, with the same rights: you don't have to share it, and you can ask for adjustments.",
    ],
    shape: [
      "You can keep it private. If a gap or a question touches on it, “a health issue that's now well managed” is enough.",
      "If you share, focus on how you manage it and what you've learned.",
      "Move on to what you'll bring to the job.",
    ],
    example: "“I had some time out for a health issue, which is well managed now. It taught me a lot about pacing myself and asking for help early, which I think makes me a better team member.”",
    avoid: ["Sharing more than you're comfortable with", "Pretending you've never struggled if it's relevant to a gap"],
    support: [{ label: "Mind: work and mental health", href: "https://www.mind.org.uk/information-support/tips-for-everyday-living/workplace-mental-health/" }],
    practice: {
      text: "How do you handle pressure and stress at work?",
      category: "behavioral",
      competency: "adaptability",
      difficulty: 3,
      looking_for: "Real, healthy ways you cope, shown through one example.",
    },
  },
  {
    id: "criminal-record",
    title: "A criminal record",
    worry: "“Once they know, it's over.”",
    theyWant: "Honesty, that you've moved on, and that you're no risk in this job. Many employers hire people with convictions.",
    rights: [
      "In England and Wales, once a conviction is “spent” you usually don't have to mention it, unless the job needs a standard or enhanced DBS check (for example, work with children or vulnerable adults). Scotland and Northern Ireland have their own rules.",
      "If you're not sure whether yours is spent, the charity Unlock has a free, private calculator and helpline.",
      "If you do need to tell them, it's often better to raise it yourself than to wait for them to find it.",
    ],
    shape: [
      "State it briefly and honestly: what it was and when. No excuses.",
      "Say what's changed: what you've done since (work, courses, volunteering, support).",
      "Bring it back to the job: why you're a safe, committed choice now.",
    ],
    example:
      "“I want to be upfront: I have a conviction for theft from six years ago. I was in a bad place, and I'm not proud of it. Since then I've done a warehouse qualification, volunteered at a food bank for two years, and I have a reference from them. I'm ready to show you I'm reliable.”",
    avoid: ["Lying about an unspent conviction when asked", "Blaming others", "Going into details of the offence"],
    support: [{ label: "Unlock: help for people with convictions", href: "https://unlock.org.uk" }],
    practice: {
      text: "We ask everyone: do you have any unspent criminal convictions? Can you tell me about them?",
      category: "curveball",
      competency: "ownership",
      difficulty: 4,
      looking_for: "A brief, honest answer with no excuses, what has changed since, and why you're a safe choice now.",
    },
  },
  {
    id: "short-jobs",
    title: "Lots of short jobs",
    worry: "“They'll think I'll leave straight away.”",
    theyWant: "To know you'll stay, and why this job is different.",
    shape: [
      "Give the honest pattern in one line (temporary contracts, moving house, finding what suits you).",
      "Show what you gained: a range of skills and settings.",
      "Explain why this job is one you want to stay in.",
    ],
    example: "“A lot of my roles were seasonal or agency work, which gave me experience in three different warehouses fast. I'm now looking for something permanent where I can grow, and your team-leader training is a big reason I applied.”",
    avoid: ["Criticising every past employer", "Promising you'll “never leave”"],
    practice: {
      text: "You've had a few short jobs. How do we know you'll stay with us?",
      category: "curveball",
      competency: "motivation",
      difficulty: 3,
      looking_for: "An honest reason for the pattern, what you gained, and a real reason to stay here.",
    },
  },
  {
    id: "career-change",
    title: "Changing career",
    worry: "“I'm starting from scratch.”",
    theyWant: "A clear reason for the change, and the skills you're bringing with you.",
    shape: [
      "Give a positive reason for the change: moving towards something, not just away.",
      "Name two skills that carry over, with a quick example each.",
      "Show you've already started: a course, reading, volunteering, a project.",
    ],
    example: "“After eight years in hospitality I realised the part I loved was solving customers' problems, so I'm moving into IT support. Handling a busy restaurant taught me to stay calm under pressure, and I've just finished the Google IT Support course.”",
    avoid: ["Talking down your old career", "Only talking about what you don't know yet"],
    practice: {
      text: "Why are you changing careers, and why now?",
      category: "motivation",
      competency: "motivation",
      difficulty: 3,
      looking_for: "A positive reason, skills that carry over, and proof you've already started.",
    },
  },
  {
    id: "caring",
    title: "Being a parent or carer",
    worry: "“They'll think I can't commit.”",
    theyWant: "To know you can do the hours. Your home life is otherwise your business.",
    rights: [
      "In the UK, interviewers shouldn't ask about children, pregnancy or family plans. If they do, you can answer about your availability instead.",
      "After 26 weeks in a job, you have the right to ask for flexible working.",
    ],
    shape: [
      "You don't have to mention it. If it explains a gap, one sentence is enough.",
      "Talk about availability, not childcare: “I can do the hours in the advert.”",
      "Caring builds real skills (organising, patience, staying calm). Use them as examples.",
    ],
    example: "“I've been at home raising my children for four years. Running a household taught me to plan, budget and stay calm when three things go wrong at once. They're both in school now, and I'm fully available for the hours in the advert.”",
    avoid: ["Sharing more about your family than you want to"],
    support: [{ label: "Carers UK: work and caring", href: "https://www.carersuk.org/help-and-advice/work-and-career/" }],
    practice: {
      text: "Tell me about what you've been doing for the last few years.",
      category: "curveball",
      competency: "adaptability",
      difficulty: 2,
      looking_for: "A short, confident summary, skills you've built, and that you're ready for the hours.",
    },
  },
  {
    id: "language",
    title: "English isn't your first language",
    worry: "“They'll judge my accent or my grammar.”",
    theyWant: "To understand you and to see you can communicate at work. Speaking another language is often a bonus.",
    shape: [
      "Speak a little slower than feels natural and keep sentences short.",
      "It's fine to say “Could you repeat that?” or “Do you mean...?”",
      "Mention your other languages as a strength where it fits the job.",
    ],
    example: "“Sorry, could you say that again a little slower? ... Thank you. Yes: in my last job I often helped customers who spoke Polish, so the team came to me for that.”",
    avoid: ["Apologising for your English", "Rushing to hide your accent"],
    practice: {
      text: "Tell me about a time you had to explain something clearly to someone.",
      category: "behavioral",
      competency: "communication",
      difficulty: 2,
      looking_for: "One real example, what you did to make yourself clear, and the result.",
    },
  },
  {
    id: "illegal-questions",
    title: "When they ask something they shouldn't",
    worry: "“They asked my age, religion or if I'm planning a family. What do I do?”",
    theyWant: "Usually nothing bad: some interviewers just don't know the rules.",
    rights: [
      "In the UK, employers shouldn't make decisions based on age, disability, gender reassignment, marriage, pregnancy, race, religion, sex or sexual orientation. Questions about these are a warning sign.",
      "You can politely steer back to the job. If you think you were treated unfairly, Acas gives free, confidential advice.",
    ],
    shape: [
      "Stay calm and polite.",
      "Answer the real worry behind it, not the question: “I'm fully available for the hours.”",
      "Move back to the job.",
    ],
    example: "“I'd rather keep my family life private, but I can tell you I'm fully available for the shifts in the advert, and I've always had great attendance.”",
    avoid: ["Feeling you have to answer", "Getting into an argument in the interview"],
    support: [{ label: "Acas: free advice about work", href: "https://www.acas.org.uk" }],
    practice: {
      text: "Are you planning to have children any time soon?",
      category: "curveball",
      competency: "communication",
      difficulty: 4,
      looking_for: "A calm, polite answer that keeps your private life private and steers back to your availability and the job.",
    },
  },
];

export function trickyById(id: string): Tricky | undefined {
  return TRICKY.find((t) => t.id === id);
}
