import { Hono } from "hono";
import { paymentsController } from "./controllers/payments.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const paymentsRouter = new Hono();

// Stripe webhook (no auth - verified by signature)
paymentsRouter.post("/webhook", (c) => paymentsController.handleWebhook(c));

// Protected routes
paymentsRouter.post("/checkout", requireAuth, (c) => paymentsController.createCheckout(c));
paymentsRouter.post("/subscribe", requireAuth, (c) => paymentsController.createSubscription(c));
paymentsRouter.get("/subscription", requireAuth, (c) => paymentsController.getMySubscription(c));
paymentsRouter.get("/history", requireAuth, (c) => paymentsController.getMyPayments(c));

export default paymentsRouter;
