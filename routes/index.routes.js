import { Router } from "express";
import { createCreditCardPayment } from "../controllers/paymentController.js";

const paymentRouter = Router();

paymentRouter.post("/card/create", createCreditCardPayment);

export default paymentRouter;