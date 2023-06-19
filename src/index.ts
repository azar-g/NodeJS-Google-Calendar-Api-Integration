import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import calendarRouter from "./routes/calendarRoutes";
import eventsRouter from "./routes/eventRoutes";
import authRouter from "./routes/authRoutes";
import errorHandlerMiddleware from "./middleware/error-handler";
import * as dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import { swaggerOptions } from "./swagger";

const swaggerDocs = swaggerJsDoc(swaggerOptions);

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/api/v1", authRouter);
app.use("/api/v1", calendarRouter);
app.use("/api/v1", eventsRouter);

app.use(errorHandlerMiddleware);

const port = process.env.PORT || 8080;
const start = async () => {
  // Here will be added *****database connection*****
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
  });
};
start();
