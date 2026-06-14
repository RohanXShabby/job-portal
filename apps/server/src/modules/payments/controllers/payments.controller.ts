import type { Context } from "hono";
import { sendSuccess, sendError } from "../../../lib/response.js";
import {
  createCheckoutSession,
  createSubscriptionCheckout,
  constructWebhookEvent,
} from "@job-portal/auth/lib/stripe";
import { SubscriptionModel, PaymentModel, AuditLogModel } from "@job-portal/db";

export class PaymentsController {
  async createCheckout(c: Context) {
    try {
      const user = c.get("user");
      const body = await c.req.json();
      const { priceId } = body;

      if (!priceId) return sendError(c, "VALIDATION_ERROR", "priceId is required", 400);

      const session = await createCheckoutSession({
        priceId,
        successUrl: `${process.env.CORS_ORIGIN || "http://localhost:3001"}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.CORS_ORIGIN || "http://localhost:3001"}/pricing`,
        metadata: { userId: user.id },
      });

      return sendSuccess(c, { sessionId: session.id, url: session.url }, "Checkout session created");
    } catch (err: any) {
      return sendError(c, "STRIPE_ERROR", err.message, 500);
    }
  }


  async createSubscription(c: Context) {
    try {
      const user = c.get("user");
      const body = await c.req.json();
      const { priceId } = body;

      if (!priceId) return sendError(c, "VALIDATION_ERROR", "priceId is required", 400);

      const session = await createSubscriptionCheckout({
        priceId,
        successUrl: `${process.env.CORS_ORIGIN || "http://localhost:3001"}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.CORS_ORIGIN || "http://localhost:3001"}/pricing`,
        metadata: { userId: user.id },
      });

      return sendSuccess(c, { sessionId: session.id, url: session.url }, "Subscription checkout created");
    } catch (err: any) {
      return sendError(c, "STRIPE_ERROR", err.message, 500);
    }
  }

  async handleWebhook(c: Context) {
    try {
      const signature = c.req.header("stripe-signature");
      if (!signature) return sendError(c, "WEBHOOK_ERROR", "Missing Stripe signature", 400);

      const rawBody = await c.req.text();
      const event = await constructWebhookEvent(rawBody, signature);

      // Idempotency: check if this event has already been processed
      const existingLog = await AuditLogModel.findOne({
        action: `stripe.${event.type}`,
        "details.eventId": event.id,
      } as any);
      if (existingLog) {
        return sendSuccess(c, null, "Event already processed");
      }

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const userId = session.metadata?.userId;

          if (session.mode === "subscription") {
            await SubscriptionModel.create({
              userId,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              planId: "starter", // Determined by priceId mapping
              status: "active",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
          }

          await PaymentModel.create({
            userId,
            amount: session.amount_total / 100,
            currency: session.currency,
            stripePaymentIntentId: session.payment_intent || session.id,
            status: "succeeded",
          });
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as any;
          const subscription = await SubscriptionModel.findOne({
            stripeSubscriptionId: invoice.subscription,
          } as any);
          if (subscription) {
            subscription.status = "active";
            subscription.currentPeriodEnd = new Date(invoice.lines.data[0]?.period?.end * 1000);
            await subscription.save();
          }
          break;
        }

        case "invoice.payment_failed": {
          const failedInvoice = event.data.object as any;
          await SubscriptionModel.updateOne(
            { stripeSubscriptionId: failedInvoice.subscription },
            { $set: { status: "past_due" } }
          );
          break;
        }

        case "customer.subscription.deleted": {
          const deletedSub = event.data.object as any;
          await SubscriptionModel.updateOne(
            { stripeSubscriptionId: deletedSub.id },
            { $set: { status: "canceled" } }
          );
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      // Log audit event for idempotency and compliance
      await AuditLogModel.create({
        action: `stripe.${event.type}`,
        details: new Map([
          ["eventId", event.id],
          ["type", event.type],
        ]),
      });

      return sendSuccess(c, null, "Webhook processed");
    } catch (err: any) {
      console.error("[Stripe Webhook Error]", err);
      return sendError(c, "WEBHOOK_ERROR", err.message, 400);
    }
  }

  async getMySubscription(c: Context) {
    try {
      const user = c.get("user");
      const subscription = await SubscriptionModel.findOne({ userId: user.id } as any)
        .sort({ createdAt: -1 })
        .lean();

      return sendSuccess(c, subscription, subscription ? "Subscription found" : "No active subscription");
    } catch (err: any) {
      return sendError(c, "DB_ERROR", err.message, 500);
    }
  }

  async getMyPayments(c: Context) {
    try {
      const user = c.get("user");
      const page = Number(c.req.query("page")) || 1;
      const limit = Number(c.req.query("limit")) || 20;
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        PaymentModel.find({ userId: user.id } as any).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        PaymentModel.countDocuments({ userId: user.id } as any),
      ]);

      return sendSuccess(c, payments, "Payments fetched", { total, page, limit });
    } catch (err: any) {
      return sendError(c, "DB_ERROR", err.message, 500);
    }
  }
}

export const paymentsController = new PaymentsController();
