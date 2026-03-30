import { Router } from "express";
import { createPayment, openCheckoutPage } from "../controllers/paymentController.js";

const paymentRouter = Router();

paymentRouter.post("/sibs/create", createPayment);
paymentRouter.get("/sibs/checkout", openCheckoutPage);

export default paymentRouter;