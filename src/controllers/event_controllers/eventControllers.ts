import { generateZoomsignature } from "./../../utils/zoomActions";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { google } from "googleapis";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import process from "process";
import { AuthenticatedRequest } from "../../middleware/authentication";
import { TokenUser } from "../../utils/jwt";
import CustomError from "../../errors";
import { freeSlotBody } from "../../utils/mappers";
import {
  insertSlotsToCalendar,
  updateFreeSlotToEvent,
} from "../../utils/calendarActions";

const prisma = new PrismaClient();

const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;

const credentialsPath = path.join(__dirname, "../../../credentials.json");

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: "https://www.googleapis.com/auth/calendar",
});

const calendar = google.calendar({
  version: "v3",
  auth: auth,
});

const fetchEvents = async (email: string) => {
  try {
    const events = await prisma.appointments.findMany({
      where: {
        user: { profile: { email: email } },
        startTime: {
          gt: new Date(),
        },
      },
      orderBy: { startTime: "asc" },
    });
    return {
      events,
      freeSlots: events?.filter((event) => event.status === "free"),
    };
  } catch (error) {
    throw new Error("Error occurred while fetching events");
  }
};

export const getEventsList = async (
  // to get all the calendar events of the user(free and booked slots)
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, role } = req.user as TokenUser;
    const { events, freeSlots } = await fetchEvents(email);
    // consultant will see all events free and booked appointment slots
    if (role === "consultant")
      return res.status(StatusCodes.OK).json({ events });
    else
      return res.status(StatusCodes.OK).json({
        // customer will see only free appointment slots
        freeSlots,
      });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = req.query.email as string;
    const { freeSlots } = await fetchEvents(email);
    return res.status(StatusCodes.OK).json({ freeSlots });
  } catch (error) {
    next(error);
  }
};

export const createAppointmentSlots = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  type Interval = {
    startDateTime: string;
    endDateTime: string;
  };

  try {
    const { id: userId } = req.user as TokenUser;
    const intervals: Interval[] = req.body.intervals;

    if (!intervals) {
      throw new CustomError.BadRequestError(
        "Time intervals for appointment slots must be provided"
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { profile: true, calendar: true },
    });

    if (!user?.calendar?.calendarId) {
      throw new CustomError.NotFoundError("User has no calendar");
    }

    const freeIntervals = [];
    const busyIntervals = [];

    for (const interval of intervals) {
      const appointment = await prisma.appointments.findFirst({
        where: {
          OR: {
            startTime: {
              lte: new Date(interval.startDateTime),
            },
            endTime: {
              gt: new Date(interval.startDateTime),
            },
          },
        },
      });
      if (appointment) busyIntervals.push(interval);
      else freeIntervals.push(interval);
    }

    const appointmentSlots = freeIntervals.map((interval) => ({
      ...freeSlotBody,
      startTime: interval.startDateTime,
      endTime: interval.endDateTime,
      userId,
      intervalId: uuidv4(),
    }));

    const { count } = await prisma.appointments.createMany({
      data: appointmentSlots,
      skipDuplicates: true,
    });

    let failureMessage: string = "";

    if (busyIntervals.length) {
      failureMessage = busyIntervals
        .map(
          (interval) =>
            `, Time between ${interval.startDateTime} and ${interval.endDateTime} is not free`
        )
        .join(";");
    }

    res
      .status(StatusCodes.CREATED)
      .send(
        `${count} free appointment slot${
          count > 1 ? "s" : ""
        } were succesfully created${failureMessage}`
      );

    insertSlotsToCalendar(user, appointmentSlots);
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      id,
      providerEmail,
      description,
      subscriberName,
      subscriberPhoneNumber,
    } = req.body;

    if (!id || !subscriberName || !subscriberPhoneNumber) {
      throw new CustomError.BadRequestError("Missing required parameters");
    }
    /* const provider = await prisma.profiles.findUnique({
      where: { email: providerEmail },
    });
    if (!provider)
      throw new CustomError.NotFoundError("Provider not found in database"); */

    const createdEvent = await prisma.appointments.update({
      where: { id },
      data: {
        summary: `${subscriberName} ${subscriberPhoneNumber}`,
        description,
        subscriberName,
        subscriberPhoneNumber,
        status: "booked",
      },
    });

    if (!createdEvent)
      throw new CustomError.NotFoundError("Appointment not found");

    res.status(StatusCodes.OK).send(createdEvent);

    updateFreeSlotToEvent(
      createdEvent.id,
      createdEvent.eventId as string,
      // providerEmail,
      description,
      subscriberName,
      subscriberPhoneNumber
    );
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    calendar.events.delete({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: id as string,
    });

    res.status(StatusCodes.NO_CONTENT);
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
    const signature = await generateZoomsignature({ meetingNumber, role });

    res.send({ signature });
  } catch (error) {
    next(error);
  }
};
