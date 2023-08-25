import { google } from "googleapis";
import * as path from "path";

const credentialsPath = path.join(__dirname, "../../service_credentials.json");

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: "https://www.googleapis.com/auth/calendar",
});

export const calendar = google.calendar({
  version: "v3",
  auth: auth,
});
