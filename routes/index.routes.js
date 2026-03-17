import { Router } from "express";
import { createCreditCardPayment, createMbWayPayment } from "../controllers/paymentController.js";

const paymentRouter = Router();

paymentRouter.post("/card/create", createCreditCardPayment);
paymentRouter.post("/mbway/create", createMbWayPayment);

export default paymentRouter;