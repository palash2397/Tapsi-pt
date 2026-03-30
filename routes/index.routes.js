import { Router } from "express";
import paymentRouter from "./payment.routes.js";

const rootRouter = Router();

rootRouter.use("/payment", paymentRouter);

export default rootRouter;