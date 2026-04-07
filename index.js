import express from "express";
import morgan from "morgan";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 4006;

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
  console.clear();
  console.log(`Server is running on port ${PORT}`);
});



// import express from "express";
// import http from "http";

// const app = express();
// const PORT = 4006;

// app.get("/", (req, res) => {
//   res.send("OK");
// });

// const server = http.createServer(app);

// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
//   console.log("Listening:", server.listening);
//   console.log("Address:", server.address());
// });

// server.on("close", () => {
//   console.log("Server closed");
// });

// server.on("error", (err) => {
//   console.error("Server error:", err);
// });

// setInterval(() => {
//   console.log("still alive");
// }, 5000);

// process.on("exit", (code) => {
//   console.log("Process exit code:", code);
// });