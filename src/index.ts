import "./config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import calendarRouter from "./routes/calendarRoutes";
import eventsRouter from "./routes/eventRoutes";
import zoomRouter from "./routes/zoomRoutes";
import emailRouter from "./routes/emailRoutes";
import errorHandlerMiddleware from "./middleware/error-handler";
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express";
import { PORT } from "./config";
import "./utils/rabbitMQ";
import {
  createMessageChannel,
  // channel,
  subscribeMessage,
} from "./utils/rabbitMQ";

const swaggerDocs = YAML.load(`./src/api.yaml`);

const app = express();

const corsOptions = {
  origin: [
    "https://app.tibbnet.com/",
    "http://localhost:3000",
    "http://localhost:4000",
  ],
};
app.use(cors(corsOptions));

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

createMessageChannel().then((channel) => subscribeMessage(channel));
app.use("/api/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/api/v1", calendarRouter);
app.use("/api/v1", eventsRouter);
app.use("/api/v1", zoomRouter);
app.use("/api/v1", emailRouter);

app.use(errorHandlerMiddleware);

const port = PORT || 5000;
const start = async () => {
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
  });
};
start();
