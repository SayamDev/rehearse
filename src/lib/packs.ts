import type { BankItem } from "./ai/demo";

/**
 * Question packs: hand-written questions for common kinds of work. They need no AI,
 * so they work offline and when the free AI allowance runs out.
 */
export type Pack = {
  id: string;
  name: string;
  /** Job title used when a round is started from the pack. */
  role: string;
  blurb: string;
  /** Job titles that belong to this pack. */
  match: RegExp;
  questions: BankItem[];
};

export const PACKS: Pack[] = [
  {
    id: "first-job",
    name: "First job and no experience",
    role: "First job",
    blurb: "For school leavers, students and anyone starting out. Use school, clubs, volunteering or home life as examples.",
    match: /\b(first job|school leaver|graduate|intern|internship|apprentice|trainee|student|volunteer|work experience|entry)\b/i,
    questions: [
      { text: "You haven't had a job before. Why should we take a chance on you?", category: "motivation", competency: "motivation", difficulty: 2, looking_for: "Real strengths shown through school, volunteering, clubs or home life, and a clear wish to learn." },
      { text: "Tell me about a time you had to be reliable, even when you didn't feel like it.", category: "behavioral", competency: "ownership", difficulty: 2, looking_for: "One real example where you kept a commitment, what it took, and what happened because of it." },
      { text: "Tell me about something you've worked hard to learn.", category: "behavioral", competency: "adaptability", difficulty: 2, looking_for: "How you learn: what you practised, how long it took, and how you know you got better." },
      { text: "Tell me about a time you worked with others to get something done.", category: "behavioral", competency: "teamwork", difficulty: 2, looking_for: "What you personally did in the group, not just what the group did, and how it turned out." },
      { text: "How would you balance this job with school, college, or other things in your life?", category: "situational", competency: "ownership", difficulty: 2, looking_for: "A realistic plan for your time, and that you would tell your manager early if something clashed." },
      { text: "What would you do on your first day if you weren't sure what to do next?", category: "situational", competency: "communication", difficulty: 1, looking_for: "That you would ask, watch and learn rather than guess or stand still." },
    ],
  },
  {
    id: "retail",
    name: "Retail and shop floor",
    role: "Retail assistant",
    blurb: "Shops, supermarkets and tills. Customers, stock, teamwork and busy days.",
    match: /\b(retail|shop|store|cashier|till|sales assistant|merchandis|stock|supermarket|checkout|visual)\b/i,
    questions: [
      { text: "Tell me about a time you helped a customer who was unhappy.", category: "behavioral", competency: "communication", difficulty: 2, looking_for: "That you stayed calm, listened, fixed what you could, and the customer left better off." },
      { text: "A customer asks for something we don't have in stock. What do you do?", category: "situational", competency: "problem-solving", difficulty: 1, looking_for: "That you offer alternatives, check other stores or online, and never just say no." },
      { text: "The shop is really busy and a colleague hasn't turned up. How do you handle your shift?", category: "situational", competency: "teamwork", difficulty: 3, looking_for: "That you prioritise customers, stay calm, keep your manager informed and help where it matters most." },
      { text: "What does good customer service mean to you?", category: "role", competency: "role-knowledge", difficulty: 1, looking_for: "A clear idea backed by a real example of great service you gave or saw." },
      { text: "You see a colleague taking something without paying. What do you do?", category: "situational", competency: "ownership", difficulty: 3, looking_for: "Honesty and following the right process by telling a manager, without drama or accusations." },
      { text: "Why do you want to work in this shop in particular?", category: "motivation", competency: "motivation", difficulty: 1, looking_for: "That you know the shop, its customers and products, and a genuine reason you would fit." },
    ],
  },
  {
    id: "hospitality",
    name: "Hospitality and food",
    role: "Waiter",
    blurb: "Cafés, restaurants, bars, hotels and kitchens. Speed, smiles and teamwork under pressure.",
    match: /\b(waiter|waitress|server|barista|bartender|bar staff|chef|cook|kitchen|porter|hotel|housekeep|host|hostess|front of house|catering|café|cafe|restaurant|hospitality|food)\b/i,
    questions: [
      { text: "Tell me about a time you had to work fast without making mistakes.", category: "behavioral", competency: "problem-solving", difficulty: 2, looking_for: "How you stayed organised under pressure, with a specific example and result." },
      { text: "A customer says their food is cold and they're angry. What do you do?", category: "situational", competency: "communication", difficulty: 2, looking_for: "Apologise, fix it quickly, tell the kitchen or manager, and check back with them." },
      { text: "How would you handle three tables all wanting you at the same time?", category: "situational", competency: "problem-solving", difficulty: 2, looking_for: "Acknowledging everyone quickly, prioritising sensibly, and asking teammates for help." },
      { text: "Why is food safety and hygiene so important, and what do you do to keep to it?", category: "role", competency: "role-knowledge", difficulty: 2, looking_for: "Real habits like handwashing, allergen checks and temperatures, and why they matter to customers." },
      { text: "A customer tells you they have a nut allergy. What do you do?", category: "situational", competency: "ownership", difficulty: 3, looking_for: "That you take it seriously, check with the kitchen, never guess, and follow the allergen process." },
      { text: "Our shifts include evenings and weekends. How does that fit with your life?", category: "motivation", competency: "motivation", difficulty: 1, looking_for: "An honest, clear answer about when you can work, and reliability." },
    ],
  },
  {
    id: "care",
    name: "Care and support work",
    role: "Care assistant",
    blurb: "Care homes, home care, support work and healthcare assistants. Kindness, dignity and safety.",
    match: /\b(care|carer|support worker|healthcare assistant|hca|nurse|nursing|social work|domiciliary|residential|personal assistant|mental health|disability|elderly|hospital)\b/i,
    questions: [
      { text: "Why do you want to work in care?", category: "motivation", competency: "motivation", difficulty: 1, looking_for: "A genuine reason, ideally from a real experience, that shows you care about people." },
      { text: "How would you keep someone's dignity while helping them with personal care?", category: "role", competency: "role-knowledge", difficulty: 2, looking_for: "Asking consent, explaining what you're doing, privacy, and letting them do what they can for themselves." },
      { text: "A resident refuses to take their medication. What do you do?", category: "situational", competency: "communication", difficulty: 3, looking_for: "Respecting their choice, gently finding out why, never forcing, and reporting and recording it." },
      { text: "Tell me about a time you supported someone who was upset or scared.", category: "behavioral", competency: "communication", difficulty: 2, looking_for: "How you listened and calmed them, what you actually said or did, and how they felt after." },
      { text: "You notice bruises on someone you care for and they seem withdrawn. What do you do?", category: "situational", competency: "ownership", difficulty: 4, looking_for: "That you report it to your manager or safeguarding lead straight away and record what you saw, without investigating yourself." },
      { text: "Care work can be emotionally hard. How do you look after yourself?", category: "curveball", competency: "adaptability", difficulty: 2, looking_for: "Healthy, real ways you cope, and that you would ask for support when you need it." },
    ],
  },
  {
    id: "warehouse",
    name: "Warehouse, driving and delivery",
    role: "Warehouse operative",
    blurb: "Picking, packing, forklifts, drivers and couriers. Safety, accuracy and targets.",
    match: /\b(warehouse|picker|packer|forklift|driver|delivery|courier|logistics|operative|factory|production|labourer|cleaner|security|postal)\b/i,
    questions: [
      { text: "Tell me about a time you had to hit a target or deadline.", category: "behavioral", competency: "ownership", difficulty: 2, looking_for: "The target, what you did to reach it, and whether you did, with numbers if you can." },
      { text: "You notice a safety hazard that isn't your job to fix. What do you do?", category: "situational", competency: "ownership", difficulty: 2, looking_for: "That you make it safe if you can, report it straight away, and never ignore it." },
      { text: "How do you stay accurate when the work is repetitive?", category: "role", competency: "role-knowledge", difficulty: 2, looking_for: "Real habits like checking labels, routines and short breaks, and why accuracy matters." },
      { text: "Your team is behind on orders near the end of a shift. What would you do?", category: "situational", competency: "teamwork", difficulty: 3, looking_for: "Staying calm, helping where the backlog is biggest, keeping quality and safety, and telling your supervisor." },
      { text: "Tell me about a time you were given an instruction you didn't understand.", category: "behavioral", competency: "communication", difficulty: 2, looking_for: "That you asked questions instead of guessing, and what happened because you did." },
      { text: "This job has early starts and physical work. Why does it suit you?", category: "motivation", competency: "motivation", difficulty: 1, looking_for: "Honest reasons, reliability, and proof you can handle the hours and physical side." },
    ],
  },
  {
    id: "customer-service",
    name: "Customer service and call centres",
    role: "Customer service advisor",
    blurb: "Phones, chat and help desks. Patience, problem solving and staying calm.",
    match: /\b(customer service|call cent|contact cent|advisor|adviser|help ?desk|support agent|receptionist|complaints|client)\b/i,
    questions: [
      { text: "Tell me about a time you turned an unhappy customer around.", category: "behavioral", competency: "communication", difficulty: 3, looking_for: "What the problem was, the steps you took, and how the customer felt at the end." },
      { text: "A caller is shouting and swearing at you. What do you do?", category: "situational", competency: "conflict", difficulty: 3, looking_for: "Staying calm, not taking it personally, setting a polite boundary, and knowing when to escalate." },
      { text: "You don't know the answer to a customer's question. What do you do?", category: "situational", competency: "problem-solving", difficulty: 1, looking_for: "That you're honest, find out from the right place, and follow up instead of guessing." },
      { text: "How would you handle a long queue of calls or chats all day?", category: "role", competency: "role-knowledge", difficulty: 2, looking_for: "Keeping quality up, staying positive, and small routines that stop you getting drained." },
      { text: "Tell me about a time you explained something complicated in a simple way.", category: "behavioral", competency: "communication", difficulty: 2, looking_for: "The topic, how you made it simple, and how you checked the person understood." },
      { text: "What would you do if a customer asked for something that's against our policy?", category: "situational", competency: "ownership", difficulty: 2, looking_for: "Explaining the policy kindly, offering what you can do instead, and escalating if needed." },
    ],
  },
  {
    id: "office",
    name: "Office and admin",
    role: "Administrator",
    blurb: "Admin, reception, data entry and assistants. Organisation, accuracy and communication.",
    match: /\b(admin|administrator|administrative|office|secretary|assistant|data entry|clerk|coordinator|pa\b|executive assistant|bookkeep|accounts|finance|hr|human resources|operations)\b/i,
    questions: [
      { text: "Tell me about a time you had lots of tasks at once. How did you organise them?", category: "behavioral", competency: "problem-solving", difficulty: 2, looking_for: "Your system for prioritising, a real example, and that everything got done." },
      { text: "You notice a mistake in a report your manager already sent out. What do you do?", category: "situational", competency: "ownership", difficulty: 3, looking_for: "Telling your manager quickly and privately, with the correction ready, rather than ignoring it." },
      { text: "Which computer programs are you confident with, and how have you used them?", category: "role", competency: "role-knowledge", difficulty: 1, looking_for: "Specific tools and a real task you did with each, not just a list of names." },
      { text: "How do you make sure your work is accurate?", category: "role", competency: "role-knowledge", difficulty: 2, looking_for: "Real checking habits, and an example where they caught a mistake." },
      { text: "Tell me about a time you dealt with confidential information.", category: "behavioral", competency: "ownership", difficulty: 2, looking_for: "That you understand confidentiality and handled it carefully, with a real example." },
      { text: "Two managers both give you urgent work for the same afternoon. What do you do?", category: "situational", competency: "communication", difficulty: 3, looking_for: "Telling both early, asking them to agree priorities, and not quietly missing one deadline." },
    ],
  },
  {
    id: "tech",
    name: "Tech and software",
    role: "Software developer",
    blurb: "Developers, IT support, data and product. Problem solving, learning and explaining clearly.",
    match: /\b(software|developer|engineer|programmer|coder|web|frontend|front-end|backend|back-end|full stack|devops|data|analyst|it support|it technician|tech|cyber|qa|tester|product manager|ux|ui)\b/i,
    questions: [
      { text: "Tell me about a technical problem you solved that you're proud of.", category: "behavioral", competency: "problem-solving", difficulty: 3, looking_for: "The problem, how you worked out the cause, what you built or changed, and the result." },
      { text: "How do you learn a new tool or language quickly?", category: "role", competency: "adaptability", difficulty: 2, looking_for: "A real method and a recent example of something you picked up and used." },
      { text: "Explain something technical you know well as if I had never used a computer.", category: "curveball", competency: "communication", difficulty: 3, looking_for: "Plain words, a simple comparison, and no jargon." },
      { text: "Tell me about a time your code or work broke something. What happened?", category: "behavioral", competency: "ownership", difficulty: 3, looking_for: "Owning the mistake, how you fixed it, and what you changed so it wouldn't happen again." },
      { text: "You disagree with a teammate about how to build something. How do you decide?", category: "situational", competency: "conflict", difficulty: 3, looking_for: "Listening, comparing trade-offs with evidence, and agreeing a way forward without ego." },
      { text: "You're stuck on a task for hours. What do you do?", category: "situational", competency: "problem-solving", difficulty: 2, looking_for: "Breaking it down, searching and testing, and asking for help at the right time." },
    ],
  },
  {
    id: "creative",
    name: "Creative and content",
    role: "Content creator",
    blurb: "Writers, designers, content creators, marketing and social media. Ideas, feedback and results.",
    match: /\b(creative|writer|copywriter|content|designer|design|artist|illustrat|animator|photograph|video|editor|social media|marketing|influencer|journalist|musician|actor|producer|brand)\b/i,
    questions: [
      { text: "Walk me through a project you're proud of, from idea to finished piece.", category: "behavioral", competency: "ownership", difficulty: 2, looking_for: "Where the idea came from, the choices you made, and what it achieved." },
      { text: "Tell me about a time you got tough feedback on your work.", category: "behavioral", competency: "adaptability", difficulty: 3, looking_for: "That you listened without getting defensive, what you changed, and how the work improved." },
      { text: "How do you come up with ideas when you're stuck?", category: "role", competency: "problem-solving", difficulty: 2, looking_for: "A real process that works for you, with an example." },
      { text: "How do you know if a piece of content or design worked?", category: "role", competency: "role-knowledge", difficulty: 3, looking_for: "Real measures like views, engagement, sales or feedback, and what you did with them." },
      { text: "A client wants changes you think make the work worse. What do you do?", category: "situational", competency: "conflict", difficulty: 3, looking_for: "Understanding why they want it, explaining your view with reasons, then respecting their decision." },
      { text: "How do you handle tight deadlines on creative work?", category: "situational", competency: "ownership", difficulty: 2, looking_for: "Planning, knowing when good enough is ready, and communicating early if time is short." },
    ],
  },
  {
    id: "education",
    name: "Teaching and childcare",
    role: "Teaching assistant",
    blurb: "Teaching assistants, nursery, youth work and tutoring. Patience, safety and helping people learn.",
    match: /\b(teach|teacher|teaching assistant|tutor|nursery|childcare|child care|nanny|au pair|youth|lecturer|early years|sen|school|education|coach|trainer|instructor)\b/i,
    questions: [
      { text: "Why do you want to work with children or young people?", category: "motivation", competency: "motivation", difficulty: 1, looking_for: "A genuine reason, ideally from real experience, and what you would bring." },
      { text: "A child keeps disrupting the class. How would you handle it?", category: "situational", competency: "conflict", difficulty: 3, looking_for: "Staying calm, finding the reason, following the behaviour policy, and positive ways to re-engage them." },
      { text: "Tell me about a time you helped someone understand something they found hard.", category: "behavioral", competency: "communication", difficulty: 2, looking_for: "What they struggled with, how you explained it differently, and how you knew they got it." },
      { text: "A child tells you something that worries you about their safety at home. What do you do?", category: "situational", competency: "ownership", difficulty: 4, looking_for: "Listening calmly, not promising secrecy, and reporting to the safeguarding lead straight away." },
      { text: "How would you support a child who learns differently from others?", category: "role", competency: "role-knowledge", difficulty: 3, looking_for: "Adapting your approach, patience, and working with the teacher and parents." },
      { text: "How do you keep your patience on a difficult day?", category: "curveball", competency: "adaptability", difficulty: 2, looking_for: "Real, healthy ways you stay calm and reset, with an example." },
    ],
  },
  {
    id: "trades",
    name: "Trades and construction",
    role: "Electrician apprentice",
    blurb: "Electricians, plumbers, builders, mechanics and site work. Safety, skill and reliability.",
    match: /\b(electrician|plumber|builder|construction|carpenter|joiner|bricklayer|plasterer|painter|decorator|mechanic|technician|welder|engineer apprentice|site|roofer|gas|hvac|maintenance|handyman|landscap|gardener)\b/i,
    questions: [
      { text: "Why do you want to learn this trade?", category: "motivation", competency: "motivation", difficulty: 1, looking_for: "A real reason, anything you've already done with your hands, and commitment to learning." },
      { text: "Tell me about something practical you've built, fixed or made.", category: "behavioral", competency: "problem-solving", difficulty: 2, looking_for: "What it was, how you worked it out, and how it turned out." },
      { text: "Your supervisor asks you to do something you think isn't safe. What do you do?", category: "situational", competency: "ownership", difficulty: 3, looking_for: "Stopping, raising the concern politely, and never doing unsafe work, even under pressure." },
      { text: "How would you handle a customer who's unhappy with the finished job?", category: "situational", competency: "communication", difficulty: 3, looking_for: "Listening, checking the work honestly, and agreeing a fair fix." },
      { text: "Tell me about a time you made a mistake while learning something practical.", category: "behavioral", competency: "adaptability", difficulty: 2, looking_for: "Owning the mistake, how you fixed it, and what you do differently now." },
      { text: "This work means early starts and travelling to sites. How will you manage that?", category: "motivation", competency: "ownership", difficulty: 1, looking_for: "A realistic plan for getting there on time, every time." },
    ],
  },
  {
    id: "leadership",
    name: "Managers and leaders",
    role: "Manager",
    blurb: "Team leaders, managers, founders and CEOs. People, decisions, results and vision.",
    match: /\b(manager|management|supervisor|team lead|team leader|head of|director|ceo|cto|cfo|coo|chief|founder|owner|president|vp|vice president|executive|leader|principal)\b/i,
    questions: [
      { text: "Tell me about a time you had to turn around a team that was struggling.", category: "behavioral", competency: "leadership", difficulty: 4, looking_for: "What was wrong, what you changed yourself, and measurable results." },
      { text: "How do you handle someone in your team who isn't performing?", category: "situational", competency: "leadership", difficulty: 3, looking_for: "Finding the cause, clear expectations, support, and fair next steps if nothing changes." },
      { text: "Tell me about a hard decision you made with incomplete information.", category: "behavioral", competency: "problem-solving", difficulty: 4, looking_for: "How you weighed the risks, who you involved, what you decided, and what happened." },
      { text: "What would you focus on in your first 90 days here?", category: "role", competency: "role-knowledge", difficulty: 3, looking_for: "Listening first, a few clear priorities, and early wins tied to the business." },
      { text: "Tell me about a time you had to deliver bad news to your team or to leadership.", category: "behavioral", competency: "communication", difficulty: 3, looking_for: "Honesty, timing, how you framed it, and what you did to support people after." },
      { text: "How do you build a team people want to stay in?", category: "role", competency: "leadership", difficulty: 3, looking_for: "Concrete habits like one-to-ones, growth, recognition and trust, with evidence they worked." },
    ],
  },
];

export function packById(id: string): Pack | undefined {
  return PACKS.find((p) => p.id === id);
}

/** The pack that fits a job title best, if any. */
export function packForRole(role: string): Pack | undefined {
  return PACKS.find((p) => p.id !== "first-job" && p.match.test(role)) ?? (PACKS[0].match.test(role) ? PACKS[0] : undefined);
}
