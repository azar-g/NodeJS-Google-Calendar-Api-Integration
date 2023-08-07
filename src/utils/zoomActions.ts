import axios, { AxiosError } from "axios";
import jwt, { Secret } from "jsonwebtoken";
import crypto from "crypto";
import * as dotenv from "dotenv";
dotenv.config();

const ZOOM_OAUTH_CLIENT_ID = process.env.ZOOM_OAUTH_CLIENT_ID;
const ZOOM_OAUTH_CLIENT_SECRET = process.env.ZOOM_OAUTH_CLIENT_SECRET;

const ZOOM_MEETING_CLIENT_KEY =
  process.env.NODE_ENV === "development"
    ? process.env.DEV_ZOOM_MEETING_SDK_CLIENT_ID
    : process.env.PROD_ZOOM_MEETING_SDK_CLIENT_ID;

const ZOOM_MEETING_CLIENT_SECRET =
  process.env.NODE_ENV === "development"
    ? (process.env.DEV_ZOOM_MEETING_SDK_CLIENT_SECRET as Secret)
    : (process.env.PROD_ZOOM_MEETING_SDK_CLIENT_SECRET as Secret);

const ZOOM_EVENT_SECRET_TOKEN = process.env.ZOOM_EVENT_SECRET_TOKEN as string;

const apiBaseUrl = "https://api.zoom.us/v2";

const USER_ID = process.env.ZOOM_USER_ID;

export interface ZoomMeetingType {
  start_time: string;
  duration: number;
  start_url: string;
  join_url: string;
}

export const encryptToken = (plainToken: string) =>
  crypto
    .createHmac("sha256", ZOOM_EVENT_SECRET_TOKEN)
    .update(plainToken)
    .digest("hex");

export const zoomAuthorize = async () => {
  try {
    const config = {
      method: "post",
      url: `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${USER_ID}`,
      headers: {
        Host: "zoom.us",
        ContentType: "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${ZOOM_OAUTH_CLIENT_ID}:${ZOOM_OAUTH_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
    };

    const { data } = await axios(config);
    process.env.access_token = data.access_token;
    console.log(process.env.access_token);
    return data;
  } catch (error) {
    throw new Error("Failed to fetch access token.");
  }
};

export const generateZoomMeetingSignature = (
  meetingNumber: string,
  role: string
) => {
  const iat = Math.round(new Date().getTime() / 1000);
  const exp = iat + 60 * 60 * 2;

  const payload = {
    sdkKey: ZOOM_MEETING_CLIENT_KEY,
    mn: meetingNumber,
    role: role,
    iat: iat,
    exp: exp,
    appKey: ZOOM_MEETING_CLIENT_KEY,
    tokenExp: iat + 60 * 60 * 2,
  };

  const signature = jwt.sign(payload, ZOOM_MEETING_CLIENT_SECRET, {
    algorithm: "HS256",
  });

  return signature;
};

export const createMeeting = async (meetingData: { schedule_for: string }) => {
  const url = `${apiBaseUrl}/users/${meetingData.schedule_for}/meetings`;
  try {
    const response = await axios.post(url, meetingData, {
      headers: {
        Authorization: `Bearer ${process.env.access_token}`,
      },
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};

export const createUser = async (providerData: {}) => {
  const payload = {
    action: "create",
    user_info: {
      ...providerData,
      type: 1,
    },
  };
  const url = `${apiBaseUrl}/users`;

  try {
    const { data } = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.access_token}`,
      },
    });

    return data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};

export const addRegistrant = async (meetingId: string, registrantData: {}) => {
  const url = `${apiBaseUrl}/meetings/${meetingId}/registrants`;
  try {
    const response = await axios.post(url, registrantData, {
      headers: {
        Authorization: `Bearer ${process.env.access_token}`,
      },
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};

export const getMeetings = async (email: string) => {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/users/${email}/meetings`, {
      headers: {
        Authorization: `Bearer ${process.env.access_token}`,
      },
    });
    return data.meetings;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};

export const getMeeting = async (id: string) => {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/meetings/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.access_token}`,
      },
    });
    return data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};

export const getPastMeeting = async (id: string) => {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/past_meetings/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.access_token}`,
      },
    });
    return data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};

export const getEndedMeeting = async (id: string) => {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/metrics/meetings/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.access_token}`,
      },
    });
    return data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};

export const deleteMeeting = async (id: string) => {
  try {
    await axios.delete(`${apiBaseUrl}/meetings/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.access_token}`,
      },
    });
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};

export const endMeeting = async (meetingId: string) => {
  const url = `${apiBaseUrl}/meetings/${meetingId}/status`;
  try {
    const response = await axios.put(
      url,
      { action: "end" },
      {
        headers: {
          Authorization: `Bearer ${process.env.access_token}`,
        },
      }
    );
    // deleteMeeting(meetingId);

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};

export const getUsers = async () => {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/users`, {
      headers: {
        Authorization: `Bearer ${process.env.access_token}`,
      },
    });
    return data.users;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};
