import express from "express";
import morgan from "morgan";

import "dotenv/config.js";




const app = express();
const PORT = process.env.PORT;



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));
app.use("/api/v1", express.static("public"));


// Root route
import rootRouter from "./routes/root.routes.js";
app.use("/api/v1", rootRouter);

// Routes
app.get("/api", (req, res) => {
  res.send("Welcome to College Nerd");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});