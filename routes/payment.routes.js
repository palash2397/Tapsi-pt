import { Router } from "express";
import {
  createPayment,
  paymentStatus,
  getPaymentPage,
  paymentResult,
  payWithSavedCard,
  refundPayment
} from "../controllers/paymentController.js";

const paymentRouter = Router();

paymentRouter.post("/create", createPayment);
paymentRouter.get("/status/:transactionId", paymentStatus);
paymentRouter.get("/page", getPaymentPage);
paymentRouter.get("/result", paymentResult);
paymentRouter.post("/pay/saved/card", payWithSavedCard);
paymentRouter.post("/refund", refundPayment);

export default paymentRouter;