import { Router } from "express";
import {
  createPayment,
  paymentStatus,
  getPaymentPage,
  paymentResult,
} from "../controllers/paymentController.js";

const paymentRouter = Router();

paymentRouter.post("/create", createPayment);
paymentRouter.get("/status/:transactionId", paymentStatus);
paymentRouter.get("/page", getPaymentPage);
paymentRouter.get("/result", paymentResult);

export default paymentRouter;