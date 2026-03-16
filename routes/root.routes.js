import { Router } from "express";

import cardRouter from "./card.routes.js";


const rootRouter = Router();

rootRouter.use("/card", cardRouter);



export default rootRouter;

