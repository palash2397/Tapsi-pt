import { Router } from "express";
import {
  createPayment,
  paymentStatus,
  getPaymentPage,
  paymentResult,
  payWithSavedCard,
  refundPayment,
  payWithSavedCardMIT,
  createAuth,
  capturePayment,
  cancelPayment,
  createAuthWithSavedCard,
  getPaymentStatus
} from "../controllers/paymentController.js";

const paymentRouter = Router();

paymentRouter.post("/create", createPayment);
paymentRouter.get("/status/:transactionId", paymentStatus);
paymentRouter.get("/page", getPaymentPage);
paymentRouter.get("/result", paymentResult);
paymentRouter.post("/pay/saved/card", payWithSavedCard);
paymentRouter.post("/refund", refundPayment);
paymentRouter.post("/pay/saved/card/mit", payWithSavedCardMIT);
paymentRouter.post("/auth", createAuth);
paymentRouter.patch("/capture", capturePayment);
paymentRouter.post("/cancel", cancelPayment);
paymentRouter.get("/status", getPaymentStatus);

// Auth
paymentRouter.patch("/auth/saved/card", createAuthWithSavedCard);

export default paymentRouter;