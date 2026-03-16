import { Router } from "express";
import { testing } from "../controllers/card/cardController.js";

const cardRouter = Router();

cardRouter.get("/testing", testing);

export default cardRouter;