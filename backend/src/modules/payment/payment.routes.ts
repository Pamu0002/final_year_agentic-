import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  CreatePaymentIntentBodySchema,
  CreateCheckoutSessionBodySchema,
  ConfirmCheckoutSessionBodySchema,
} from "./payment.schema.js";
import * as paymentController from "./payment.controller.js";

const router = Router();

router.post(
  "/create-intent",
  authenticate,
  validate(CreatePaymentIntentBodySchema),
  paymentController.createPaymentIntent,
);

router.post(
  "/checkout-session",
  authenticate,
  validate(CreateCheckoutSessionBodySchema),
  paymentController.createCheckoutSession,
);

router.post(
  "/confirm-session",
  authenticate,
  validate(ConfirmCheckoutSessionBodySchema),
  paymentController.confirmCheckoutSession,
);

router.get("/history", authenticate, paymentController.getPaymentHistory);

export default router;
