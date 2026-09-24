"use client";

import { useId, useMemo, useRef, useState } from "react";
import { BriefcaseIcon } from "@phosphor-icons/react";

/** About 150 common jobs across entry-level, trades, care, office and tech roles. Users can type anything. */
export const JOB_SUGGESTIONS = [
  "Customer service advisor",
  "Retail sales associate",
  "Cashier",
  "Shop assistant",
  "Store manager",
  "Visual merchandiser",
  "Stock controller",
  "Barista",
  "Waiter / waitress",
  "Bartender",
  "Kitchen porter",
  "Chef",
  "Line cook",
  "Restaurant manager",
  "Hotel receptionist",
  "Hotel housekeeper",
  "Care assistant",
  "Healthcare assistant",
  "Support worker",
  "Nurse",
  "Nursing assistant",
  "Midwife",
  "Paramedic",
  "Pharmacy assistant",
  "Pharmacist",
  "Dental nurse",
  "Receptionist",
  "Medical receptionist",
  "Physiotherapist",
  "Occupational therapist",
  "Social worker",
  "Youth worker",
  "Teaching assistant",
  "Teacher",
  "Nursery practitioner",
  "Childminder",
  "Tutor",
  "Lecturer",
  "School administrator",
  "Warehouse operative",
  "Picker packer",
  "Forklift driver",
  "Delivery driver",
  "Van driver",
  "HGV driver",
  "Courier",
  "Bus driver",
  "Taxi driver",
  "Logistics coordinator",
  "Supply chain analyst",
  "Cleaner",
  "Caretaker",
  "Security officer",
  "Door supervisor",
  "Groundskeeper",
  "Apprentice electrician",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Bricklayer",
  "Painter and decorator",
  "Construction labourer",
  "Site manager",
  "Mechanic",
  "Welder",
  "Maintenance technician",
  "Engineer",
  "Civil engineer",
  "Mechanical engineer",
  "Electrical engineer",
  "Administrative assistant",
  "Office manager",
  "Personal assistant",
  "Data entry clerk",
  "Call centre agent",
  "Customer success manager",
  "Receptionist (office)",
  "HR assistant",
  "HR advisor",
  "Recruiter",
  "Payroll administrator",
  "Accounts assistant",
  "Bookkeeper",
  "Accountant",
  "Financial analyst",
  "Bank teller",
  "Insurance advisor",
  "Sales representative",
  "Business development manager",
  "Account manager",
  "Estate agent",
  "Marketing coordinator",
  "Marketing manager",
  "Social media manager",
  "Content writer",
  "Copywriter",
  "Graphic designer",
  "Product designer",
  "UX designer",
  "Photographer",
  "Video editor",
  "Journalist",
  "Software engineer",
  "Web developer",
  "Front-end developer",
  "Back-end developer",
  "Data analyst",
  "Data scientist",
  "IT support technician",
  "Network engineer",
  "Cyber security analyst",
  "QA tester",
  "Product manager",
  "Project manager",
  "Project coordinator",
  "Business analyst",
  "Operations manager",
  "Team leader",
  "Supervisor",
  "Shift manager",
  "Charity fundraiser",
  "Volunteer coordinator",
  "Community outreach worker",
  "Paralegal",
  "Solicitor",
  "Legal secretary",
  "Police officer",
  "Firefighter",
  "Prison officer",
  "Civil servant",
  "Council officer",
  "Armed forces",
  "Hairdresser",
  "Barber",
  "Beauty therapist",
  "Nail technician",
  "Fitness instructor",
  "Personal trainer",
  "Lifeguard",
  "Event staff",
  "Event coordinator",
  "Travel agent",
  "Flight attendant",
  "Airport operative",
  "Gardener",
  "Farm worker",
  "Veterinary nurse",
  "Dog groomer",
  "Lab technician",
  "Research assistant",
  "Scientist",
  "Interpreter",
  "Translator",
  "Apprentice",
  "Graduate trainee",
  "Intern",
];

/**
 * An accessible job-title combobox (ARIA 1.2 pattern) styled as part of the sticker sheet.
 * Suggestions filter as you type; arrow keys move, Enter picks, Escape closes.
 */
export function JobCombobox({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  className = "",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const options = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return JOB_SUGGESTIONS.slice(0, 40);
    // Titles that start with what you typed, then titles with a word starting with it, then any match.
    const score = (job: string) => {
      const j = job.toLowerCase();
      if (j.startsWith(q)) return 0;
      if (j.split(/[\s/()-]+/).some((w) => w.startsWith(q))) return 1;
      return 2;
    };
    return JOB_SUGGESTIONS.filter((job) => job.toLowerCase().includes(q) && job.toLowerCase() !== q)
      .sort((a, b) => score(a) - score(b))
      .slice(0, 12);
  }, [value]);

  const showList = open && options.length > 0;

  function pick(option: string) {
    onChange(option);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % Math.max(options.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter" && showList && active >= 0) {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className={`relative w-full ${className}`}>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        placeholder="e.g. Customer service advisor"
        autoComplete="off"
        maxLength={80}
        className="field h-12 text-body-lg"
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Job suggestions"
          onMouseDown={() => {
            // Keep focus in the input while a suggestion is clicked.
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
          className="absolute inset-x-0 top-[calc(100%+8px)] z-40 max-h-72 overflow-auto rounded-[var(--radius-panel)] border-[3px] border-[var(--die)] bg-surface p-1.5 shadow-[var(--sheet-shadow)]"
        >
          {options.map((option, i) => (
            <li
              key={option}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(option);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3 text-body transition-colors ${
                i === active ? "bg-sun text-on-ink" : "text-ink"
              }`}
            >
              <BriefcaseIcon size={16} weight={i === active ? "fill" : "regular"} aria-hidden className="shrink-0" />
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
