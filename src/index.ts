import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import calendarRouter from "./routes/calendarRoutes";
import eventsRouter from "./routes/eventRoutes";
import errorHandlerMiddleware from "./middleware/error-handler";
import * as dotenv from "dotenv";
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express";
// import swaggerJsDoc from "swagger-jsdoc";
// import { swaggerOptions } from "./swagger";

// const swaggerDocs = swaggerJsDoc(swaggerOptions);
const swaggerDocs = YAML.load(`./src/api.yaml`);

dotenv.config();

const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,PATCH,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/api/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/api/v1", calendarRouter);
app.use("/api/v1", eventsRouter);

app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;
const start = async () => {
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
  });
};
start();
