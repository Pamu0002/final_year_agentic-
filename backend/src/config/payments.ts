const configuredDeposit = Number(process.env.RESERVATION_DEPOSIT_LKR ?? "1000");

export const RESERVATION_DEPOSIT_LKR =
  Number.isFinite(configuredDeposit) && configuredDeposit > 0
    ? Math.round(configuredDeposit)
    : 1000;

const configuredRefundHours = Number(process.env.CANCELLATION_REFUND_HOURS ?? "24");

export const CANCELLATION_REFUND_HOURS =
  Number.isFinite(configuredRefundHours) && configuredRefundHours >= 0
    ? configuredRefundHours
    : 24;

const configuredHoldMinutes = Number(process.env.RESERVATION_HOLD_MINUTES ?? "30");

export const RESERVATION_HOLD_MINUTES =
  Number.isFinite(configuredHoldMinutes) && configuredHoldMinutes >= 30 && configuredHoldMinutes < 24 * 60
    ? Math.round(configuredHoldMinutes)
    : 30;

const configuredConfirmationMinutes = Number(process.env.RESTAURANT_CONFIRMATION_MINUTES ?? "30");

export const RESTAURANT_CONFIRMATION_MINUTES =
  Number.isFinite(configuredConfirmationMinutes) && configuredConfirmationMinutes >= 5 && configuredConfirmationMinutes <= 24 * 60
    ? Math.round(configuredConfirmationMinutes)
    : 30;
