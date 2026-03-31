import { Router } from "express";
import {
  createPayment,
  paymentStatus,
  getPaymentPage,
  paymentResult,
} from "../controllers/paymentController.js";

const paymentRouter = Router();

paymentRouter.post("/sibs/create", createPayment);
paymentRouter.get("/sibs/status/:transactionId", paymentStatus);
paymentRouter.get("/sibs/page", getPaymentPage);


export default paymentRouter;