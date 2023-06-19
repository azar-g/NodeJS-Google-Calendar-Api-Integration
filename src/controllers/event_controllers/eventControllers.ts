import { NextFunction, Request, Response } from "express";
import { google } from "googleapis";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import process from "process";
import { AuthenticatedRequest } from "../../middleware/authentication";
import { TokenUser } from "../../utils/jwt";
import CustomError from "../../errors";

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

export const createAppointmentSlots = async (
  // Consultant creates free slots for appointments to be booked
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, id: userId } = req.user as TokenUser;
    const { intervals } = req.body;

    const profile = await prisma.profiles.findUnique({
      where: { email },
    });

    const savedCalendar = await prisma.calendars.findUnique({
      where: { userId: userId },
    });

    if (!savedCalendar?.calendarId)
      throw new CustomError.NotFoundError("user has no calendar");

    const { data: userCalendar } = await calendar.calendars.get({
      calendarId: savedCalendar.calendarId,
    });

    const events = [];
    for (const interval of intervals) {
      try {
        const { data } = await calendar.events.insert({
          calendarId: savedCalendar.calendarId,
          requestBody: {
            summary: "Free Slot",
            description: "it is free",
            creator: { email: email },
            location: profile?.address,
            colorId: "4",
            start: { dateTime: interval.startDateTime, timeZone: "Asia/Baku" },
            end: { dateTime: interval.endDateTime, timeZone: "Asia/Baku" },
            extendedProperties: {
              shared: {
                status: "free",
              },
            },
          },
        });
        events.push(data);
      } catch (error) {
        // Handling event insertion(we can get informed which slot wasn't inserted.)
        console.error("Failed to insert event:", error);
        events.push(null);
      }
    }
    res.json({ events });
  } catch (error) {
    next(error);
  }
};

export const getEventsList = async (
  // to get all the calendar events of the user(free and booked slots)
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const userProfile = await prisma.profiles.findUnique({
      where: { email },
      select: {
        userId: true,
        user: {
          select: {
            calendar: true,
          },
        },
      },
    });

    const { data } = await calendar.events.list({
      calendarId: userProfile?.user?.calendar?.calendarId,
      // timeMin: new Date().toISOString(),
      // maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    return res.json({ items: data.items });
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
      userEmail,
      eventId,
      description,
      customerName,
      customerPhoneNumber,
    } = req.body;

    const userProfile = await prisma.profiles.findUnique({
      where: { email: userEmail },
      select: {
        userId: true,
        user: {
          select: {
            calendar: true,
          },
        },
      },
    });

    const { data: updatedEvent } = await calendar.events.patch({
      calendarId: userProfile?.user?.calendar?.calendarId,
      eventId: eventId,
      requestBody: {
        summary: `${customerName} ${customerPhoneNumber}`,
        description: description,
        colorId: "1",
        // attendees: [
        //   {
        //     email: "azerbatistuta@gmail.com",
        //   },
        // ],
        // "Service accounts cannot invite attendees without Domain-Wide Delegation of Authority."

        extendedProperties: {
          shared: {
            status: "booked",
            customerPhoneNumber,
          },
        },
      },
    });
    res.send(updatedEvent);
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

    res.send(`Event with id ${id} was deleted`);
  } catch (error) {
    next(error);
  }
};
