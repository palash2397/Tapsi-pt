import { Router } from "express";
import { createPayment, paymentStatus } from "../controllers/paymentController.js";

const paymentRouter = Router();

paymentRouter.post("/sibs/create", createPayment);
paymentRouter.get("/sibs/status/:transactionId", paymentStatus);


export default paymentRouter;