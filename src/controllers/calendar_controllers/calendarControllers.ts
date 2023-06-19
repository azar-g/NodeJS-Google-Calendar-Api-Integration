import { TokenUser } from "./../../utils/jwt";
import { NextFunction, Request, Response } from "express";
import CustomError from "../../errors";
import { google } from "googleapis";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middleware/authentication";
import { StatusCodes } from "http-status-codes";

const prisma = new PrismaClient();

const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;
const SCOPE = "https://www.googleapis.com/auth/calendar";

const credentialsPath = path.join(__dirname, "../../../credentials.json");

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: SCOPE,
});

const calendar = google.calendar({
  version: "v3",
  auth: auth,
});

interface Event {
  id: string;
  summary: string;
  description: string;
  location: string;
  creator: { email: string };
  organizer: { email: string; displayName: string };
  start: { dateTime: string } | undefined;
  end: { dateTime: string } | undefined;
  attendees: { email: string; responseStatus: string }[];
}

export const getCalendarList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data } = await calendar.calendarList.list();
    res.status(StatusCodes.OK).send(data.items);
  } catch (error) {
    next(error);
  }
};

export const getAclList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user as TokenUser;
    const user = await prisma.users.findUnique({
      where: { id },
      select: { calendar: true },
    });

    const { data: accList } = await calendar.acl.list({
      calendarId: user?.calendar?.calendarId,
    });
    res.status(StatusCodes.OK).send(accList.items);
  } catch (error) {
    next(error);
  }
};

export const createCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Calendar is created while either new user is being registered or the user starts to use their calendar for the first time (if calendar creation was unsuccesful whiel registration)
  try {
    const { email, id: userId } = req.body;
    const profile = await prisma.profiles.findUnique({
      where: {
        email,
      },
    });
    if (!profile) throw new CustomError.BadRequestError("user not found");

    //  Search the database if user already has calendar
    const userCalendar = await prisma.calendars.findUnique({
      where: { userId },
    });
    if (userCalendar?.calendarId)
      throw new CustomError.BadRequestError("User already has calendar");

    const { data: insertedCalendar } = await calendar.calendars.insert({
      requestBody: {
        summary: `${profile?.firstName} ${profile?.lastName} `,
        description: `Calendar of the user with the email ${email}`,
        timeZone: "UTC",
      },
    });
    if (!insertedCalendar.id) return;

    const { data: calendarData } = await calendar.calendarList.insert({
      requestBody: {
        id: insertedCalendar.id,
      },
    });
    const { data: acl } = await calendar.acl.insert({
      calendarId: insertedCalendar.id,
      requestBody: {
        role: "owner",
        scope: { type: "user", value: profile?.email },
      },
    });

    if (!acl.id) return;

    const sharedCalendar = await prisma.calendars.create({
      data: { aclId: acl.id, userId, calendarId: insertedCalendar.id },
    });

    res.status(StatusCodes.OK).send({ sharedCalendar });
  } catch (error) {
    next(error);
  }
};

export const deleteAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user as TokenUser;
    const user = await prisma.users.findUnique({
      where: { id },
      select: { profile: true, calendar: true },
    });

    const { statusText } = await calendar.acl.delete({
      calendarId: user?.calendar?.calendarId,
      ruleId: `user:${user?.profile?.email}`,
    });
    res.send(statusText);
  } catch (error) {
    next(error);
  }
};

export const deleteCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await calendar.calendars.delete({
      calendarId: id,
    });

    res.send(`Calendar with id ${id} was deleted`);
  } catch (error) {
    next(error);
  }
};
