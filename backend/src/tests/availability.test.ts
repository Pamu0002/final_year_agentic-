import { describe, expect, it } from "vitest";
import { getOpeningTimeSlots } from "../modules/reservation/availability.js";

describe("restaurant opening time slots", () => {
  it("creates half-hour slots for split service periods", () => {
    const slots = getOpeningTimeSlots(
      { fri: "12:00-13:00,18:30-20:00" },
      "2026-09-18",
    );
    expect(slots).toEqual(["12:00", "12:30", "18:30", "19:00", "19:30"]);
  });

  it("returns no slots when the restaurant is closed", () => {
    expect(getOpeningTimeSlots({ fri: "closed" }, "2026-09-18")).toEqual([]);
  });
});
