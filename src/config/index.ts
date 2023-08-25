import * as dotenv from "dotenv";
import { Secret } from "jsonwebtoken";

// The code below reads and sets environment files from the file ".env" if environment name wasn't set and by default environment is always development.
if (!!process.env.NODE_ENV) {
  const configFile = `./.env.${process.env.NODE_ENV}`;
  dotenv.config({ path: configFile });
} else {
  dotenv.config();
}

export const NODE_ENV = process.env.NODE_ENV;
export const PORT = process.env.PORT;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;
export const BASE_URL = process.env.BASE_URL;

//Zoom Credentials
export const ZOOM_MEETING_CLIENT_ID = process.env.ZOOM_MEETING_SDK_CLIENT_ID;
export const ZOOM_MEETING_CLIENT_SECRET = process.env
  .ZOOM_MEETING_SDK_CLIENT_SECRET as Secret;
export const ZOOM_OAUTH_CLIENT_ID = process.env.ZOOM_OAUTH_CLIENT_ID;
export const ZOOM_OAUTH_CLIENT_SECRET = process.env.ZOOM_OAUTH_CLIENT_SECRET;
export const ZOOM_EVENT_SECRET_TOKEN = process.env
  .ZOOM_EVENT_SECRET_TOKEN as string;
export const ZOOM_USER_ID = process.env.ZOOM_USER_ID;

//RabbitMQ credentials
export const EXCHANGE_NAME = process.env.EXCHANGE_NAME as string;
export const MSG_QUEUE_URL = process.env.MSG_QUEUE_URL as string;

// Service names
export const AUTH_SERVICE = "auth_service";
export const APPOINTMENT_SERVICE = "appointment_service";
