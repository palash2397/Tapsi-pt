import { Router } from "express";
import { createCardPayment } from "../controllers/card/cardController.js";

const cardRouter = Router();

cardRouter.post("/create", createCardPayment);

export default cardRouter;