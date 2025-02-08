import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import databaseConnection from "./config/database.js";
import taskRouter from "./routes/task.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();
const port = process.env.PORT || 8081;

app.use(express.json());
// app.use(
//   cors({
//     origin: "https://kazam-ev-assignment.netlify.app",
//     credentials: true,
//   })
// );

app.get("/", (req, res) => {
  res.send("Welcome to TaskBoard App");
});

app.use("/tasks", taskRouter);
app.use("/user", userRouter);

databaseConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`server running on ${port}`);
    });
  })
  .catch((error) => {
    console.error("db connection failed:", error);
  });
