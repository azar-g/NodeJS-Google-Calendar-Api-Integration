import axios from "axios";
import jwt from "jsonwebtoken";
import { Secret } from "jsonwebtoken";
import KJUR from "jsrsasign";
import * as dotenv from "dotenv";
dotenv.config();

const CLIENT_KEY =
  process.env.NODE_ENV === "development"
    ? process.env.DEV_ZOOM_CLIENT_ID
    : process.env.PROD_ZOOM_CLIENT_ID;

const CLIENT_SECRET =
  process.env.NODE_ENV === "development"
    ? (process.env.DEV_ZOOM_CLIENT_SECRET as Secret)
    : (process.env.PROD_ZOOM_CLIENT_SECRET as Secret);

const SDK_KEY =
  process.env.NODE_ENV === "development"
    ? process.env.DEV_ZOOM_CLIENT_ID
    : process.env.PROD_ZOOM_CLIENT_ID;

const SDK_SECRET =
  process.env.NODE_ENV === "development"
    ? process.env.DEV_ZOOM_CLIENT_SECRET
    : process.env.PROD_ZOOM_CLIENT_SECRET;

export const createZoomMeetingUrl = async (email: string) => {
  const payload = {
    iss: CLIENT_KEY,
    exp: new Date().getTime() + 5000,
  };
  const token = jwt.sign(payload, CLIENT_SECRET);
  const requestData = {
    topic: "Zoom Meeting",
    type: 1,
    settings: {
      host_video: true,
      participant_video: true,
    },
  };

  try {
    const { data } = await axios.post(
      `https://api.zoom.us/v2/users/${email}/meetings`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Zoom-api-Jwt-Request",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const joinUrl: string = data.join_url;
    return joinUrl;
  } catch (error) {
    console.error("Error creating Zoom meeting:", error);
    throw error;
  }
};

const generateZoomsignature = async ({
  meetingNumber,
  role,
}: {
  meetingNumber: number;
  role: number;
}) => {
  try {
    const iat = Math.round(new Date().getTime() / 1000);
    const exp = iat + 60 * 60 * 2;

    const payload = {
      sdkKey: SDK_KEY,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      appKey: SDK_KEY,
      tokenExp: iat + 60 * 60 * 2,
    };

    // const oHeader = { alg: "HS256", typ: "JWT" };
    // const sHeader = JSON.stringify(oHeader);
    // const sPayload = JSON.stringify(oPayload);
    // const signature = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, SDK_SECRET);

    const signature = jwt.sign(payload, CLIENT_SECRET, { algorithm: "HS256" });
    return { signature };
  } catch (error) {
    console.log(error);
    throw new Error(" Zoom meeting signature couldn't be generated");
  }
};
