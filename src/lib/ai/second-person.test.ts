import { describe, expect, it } from "vitest";
import { toSecondPerson } from "./second-person";

describe("notes always say 'you'", () => {
  it("rewrites the common ways models refer to the user", () => {
    expect(toSecondPerson("This shows a clear result of the candidate's actions.")).toBe("This shows a clear result of your actions.");
    expect(toSecondPerson("The candidate shows good ownership.")).toBe("You show good ownership.");
    expect(toSecondPerson("The candidate was clear but the candidate focuses on the team.")).toBe("You were clear but you focus on the team.");
    expect(toSecondPerson("The candidate could add a number.")).toBe("You could add a number.");
    expect(toSecondPerson("The candidate doesn't name a result.")).toBe("You don't name a result.");
    expect(toSecondPerson("The interviewee tries hard.")).toBe("You try hard.");
    expect(toSecondPerson("A strong answer for the candidate")).toBe("A strong answer for you");
  });

  it("leaves text that already talks to the user alone", () => {
    expect(toSecondPerson("You named the result clearly.")).toBe("You named the result clearly.");
    expect(toSecondPerson("")).toBe("");
  });
});
