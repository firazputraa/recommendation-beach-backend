import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import userController from "./app/user/controller";
import reviewController from "./app/review/controller";
import * as beachController from "./app/beach/controller";
import { logger } from "./middleware/logger";
import { errorHandler } from "./middleware/error";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: ["https://cheerful-buttercream-e459e1.netlify.app"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(logger);

app.get("/", (req, res) => {
  res.send("API is running.");
});

app.use("/user", userController);
app.use("/review", reviewController);
app.use("/beach", beachController.default);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use(errorHandler);

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
