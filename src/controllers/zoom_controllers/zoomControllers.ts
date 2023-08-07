import { NextFunction, Request, Response } from "express";
import {
  zoomAuthorize,
  generateZoomMeetingSignature,
  createMeeting,
  getMeetings,
  getMeeting,
  deleteMeeting,
  encryptToken,
  endMeeting,
  addRegistrant,
  createUser,
  getEndedMeeting,
  getUsers,
  getPastMeeting,
} from "../../utils/zoomActions";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

// Function to fetch access token initially and schedule subsequent fetches.
const fetchAndScheduleAccessToken = async () => {
  try {
    await zoomAuthorize();
    // Schedule the next token retrieval after one hour (in milliseconds).
    const token_expire_duration = 60 * 60 * 1000 - 2;
    setInterval(async () => {
      await zoomAuthorize();
    }, token_expire_duration);
  } catch (error) {
    console.log(error);
  }
};

fetchAndScheduleAccessToken();

export const zoomAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await zoomAuthorize();
    res.send("Access token successfully acquired and added to the system");
  } catch (error) {
    next(error);
  }
};

export const generateZoomSignature = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { meetingNumber, role } = req.body;
    const signature = generateZoomMeetingSignature(meetingNumber, role);

    res.send({ signature });
  } catch (error) {
    next(error);
  }
};

export const zoomEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("events.received---->", req.body);
    if (req.body.event === "endpoint.url_validation") {
      const plainToken = req.body.payload.plainToken;
      const encryptedToken = encryptToken(plainToken);
      res.json({
        plainToken,
        encryptedToken,
      });
    }
    if (req.body.event === "meeting.created") {
      res.send("Meeting created");
    } else if (
      req.body.event === "meeting.started" ||
      req.body.event === "meeting.participant_joined"
    ) {
      const endTime = req.body.payload.object.duration * 60 * 1000;
      setTimeout(() => {
        endMeeting(req.body.payload.object.id);
      }, endTime);
      res.send("Meeting started");
    } else if (
      req.body.event === "meeting.ended" ||
      req.body.event === "meeting.participant_left"
    ) {
      res.send("Meeting ended succesfully");
    } else if (req.body.event === "meeting.deleted") {
      res.send("Meeting deleted");
    }
  } catch (error) {
    next(error);
  }
};

export const createZoomMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const meetingData = {
    ...req.body,
    type: 2,
  };
  try {
    const { schedule_for: providerEmail } = req.body;
    const users = await getUsers();
    if (
      !users.some((user: { email: string }) => user.email === providerEmail)
    ) {
      const providerProfile = await prisma.profiles.findUnique({
        where: { email: providerEmail },
      });

      await createUser({
        email: providerEmail,
        first_name: providerProfile?.firstName,
        last_name: providerProfile?.lastName,
        display_name: `${providerProfile?.firstName} ${providerProfile?.lastName}`,
      });
      res.send("There was an issue. Please, try again");
    }
    const data = await createMeeting(meetingData);

    res.send(data);
  } catch (error) {
    next(error);
  }
};

export const createZoomUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const providerData = {
    ...req.body,
  };
  try {
    const data = await createUser(providerData);
    res.send(data);
  } catch (error) {
    next(error);
  }
};

export const getZoomUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await getUsers();

    res.send(users);
  } catch (error) {
    next(error);
  }
};

export const addRegistrantsToZoomMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const registrantData = {
    ...req.body,
    type: 2,
  };
  const { meetingId } = req.params;
  try {
    const data = await addRegistrant(meetingId, registrantData);

    res.send(data);
  } catch (error) {
    next(error);
  }
};

export const getZoomMeetings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = req.query.email as string;
    const data = await getMeetings(email);

    res.send(data);
  } catch (error) {
    next(error);
  }
};

export const getZoomMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { meetingId } = req.params;
  try {
    const data = await getMeeting(meetingId);
    res.send(data);
  } catch (error) {
    next(error);
  }
};

export const getPastZoomMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { meetingId } = req.params;
  try {
    const data = await getPastMeeting(meetingId);
    res.send(data);
  } catch (error) {
    next(error);
  }
};

export const getEndedZoomMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { meetingId } = req.params;
  try {
    const data = await getEndedMeeting(meetingId);
    res.send(data);
  } catch (error) {
    next(error);
  }
};

export const endZoomMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { meetingId } = req.params;
  const data = await endMeeting(meetingId);
  // deleteMeeting(meetingId);
  res.send(data);
};

export const deleteZoomMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { meetingId } = req.params;
  try {
    await deleteMeeting(meetingId);
    res.status(204).send("Meeting deleted succesfully");
  } catch (error) {
    next(error);
  }
};
