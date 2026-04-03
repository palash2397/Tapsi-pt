import express from "express";
import morgan from "morgan";
import "dotenv/config.js";

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Root route
import indexRouter from "./routes/index.routes.js";
app.use("/api/v1", indexRouter);

// Routes
app.get("/api", (req, res) => {
  res.send("Welcome to tapsi API");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
