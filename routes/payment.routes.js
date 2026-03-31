import { Router } from "express";
import { createPayment } from "../controllers/paymentController.js";

const paymentRouter = Router();

paymentRouter.post("/sibs/create", createPayment);


export default paymentRouter;