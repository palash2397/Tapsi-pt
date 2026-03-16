import { Router } from "express";
import { createCreditCardPayment } from "../controllers/card/cardController.js";

const cardRouter = Router();

cardRouter.post("/create", createCreditCardPayment);

export default cardRouter;