import { describe, expect, it } from "vitest";
import { getCancellationEligibility } from "../modules/reservation/cancellation-policy.js";

describe("reservation cancellation policy", () => {
  const reservationDate = new Date("2026-09-17T18:30:00.000Z"); // 18 Sep in Colombo

  it("allows a full refund exactly 24 hours before arrival", () => {
    const result = getCancellationEligibility(
      reservationDate,
      "20:00",
      new Date("2026-09-17T14:30:00.000Z"),
    );
    expect(result.hoursUntilReservation).toBe(24);
    expect(result.fullRefundEligible).toBe(true);
  });

  it("does not allow a full refund inside the 24-hour window", () => {
    const result = getCancellationEligibility(
      reservationDate,
      "20:00",
      new Date("2026-09-17T14:30:01.000Z"),
    );
    expect(result.hoursUntilReservation).toBeLessThan(24);
    expect(result.fullRefundEligible).toBe(false);
  });

  it("identifies a reservation that has already started", () => {
    const result = getCancellationEligibility(
      reservationDate,
      "20:00",
      new Date("2026-09-18T14:31:00.000Z"),
    );
    expect(result.hoursUntilReservation).toBeLessThan(0);
    expect(result.fullRefundEligible).toBe(false);
  });
});
