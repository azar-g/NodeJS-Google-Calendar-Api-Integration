import axios from "axios";
import { createCalendar } from "../controllers/calendar_controllers";
import { createGoogleCalendar } from "./calendarActions";
import { BASE_URL } from "../config";

interface Message {
  event: string;
  data: { [key: string]: any };
}
export const subscribeEvents = async (message: any) => {
  try {
    const payload = JSON.parse(message) as Message;
    switch (payload.event) {
      case "create_provider_calendar":
        console.log("payload---->🟥🟥", payload);
        const { data } = await axios.post(`${BASE_URL}/api/v1/createCalendar`, {
          userId: payload.data.userId,
        });

        break;

      default:
        break;
    }
  } catch (error) {
    console.log(error);
  }
};
