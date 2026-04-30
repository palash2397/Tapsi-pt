import express from "express";
import morgan from "morgan";
import "dotenv/config";
import chalk from "chalk";

const app = express();
const PORT = process.env.PORT || 4006;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// webhook
import { sibsWebhook } from "./controllers/paymentController.js";
app.use(
  "/api/v1/payment/webhook",
  express.raw({ type: "*/*" }),
  sibsWebhook,
);

// Root route
import indexRouter from "./routes/index.routes.js";
app.use("/api/v1", indexRouter);

// Routes
app.get("/api", (req, res) => {
  res.send("Welcome to tapsi API");
});

app.listen(PORT, () => {
  console.clear();
  console.log(
    chalk.blue(
      "╔════════════════════════════════════════════════════════════════╗",
    ),
  );
  console.log(
    chalk.blue("║") +
      "  " +
      chalk.cyan("TASPSI") +
      " " +
      chalk.white("is running on port") +
      " " +
      chalk.green(PORT) +
      " " +
      chalk.blue("║"),
  );
  console.log(
    chalk.blue(
      "╚════════════════════════════════════════════════════════════════╝",
    ),
  );
});
