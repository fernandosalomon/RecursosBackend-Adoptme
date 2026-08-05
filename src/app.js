import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path from "path";
import __dirname from "./utils/index.js";

import usersRouter from "./routes/users.router.js";
import petsRouter from "./routes/pets.router.js";
import adoptionsRouter from "./routes/adoption.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import dotenv from "dotenv";
dotenv.config();

import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

export const app = express();
const PORT = process.env.PORT || 8080;
const connection = mongoose.connect(process.env.MONGO_URI);

app.use(express.json());
app.use(cookieParser());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AdoptMe API",
      version: "1.0.0",
      description: "API-Rest for AdoptMe project",
    },
    servers: [
      {
        url: "http://localhost:3030",
        description: "Develop",
      },
    ],
  },
  apis: [
    path.join(__dirname, "../docs", "users.yaml"),
    path.join(__dirname, "../docs", "adoptions.yaml"),
    path.join(__dirname, "../docs", "sessions.yaml"),
    path.join(__dirname, "../docs", "pets.yaml"),
  ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/api/users", usersRouter);
app.use("/api/pets", petsRouter);
app.use("/api/adoptions", adoptionsRouter);
app.use("/api/sessions", sessionsRouter);

export const server = app.listen(PORT, () =>
  console.log(`Listening on ${PORT}`),
);
