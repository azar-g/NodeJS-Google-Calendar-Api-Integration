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

export const generateZoomsignature = async ({
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
      sdkKey: CLIENT_KEY,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      appKey: CLIENT_KEY,
      tokenExp: iat + 60 * 60 * 2,
    };

    const signature = jwt.sign(payload, CLIENT_SECRET, { algorithm: "HS256" });
    return signature;
  } catch (error) {
    console.log(error);
    throw new Error(" Zoom meeting signature couldn't be generated");
  }
};
