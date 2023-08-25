import { TokenUser } from "./../../utils/jwt";
import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authentication";
import { StatusCodes } from "http-status-codes";
import { mapCalendar } from "../../utils/mappers";
import { calendar } from "../../utils/googleCalendar";
import { prisma } from "../../utils/db";
import CustomError from "../../errors";
import { createGoogleCalendar } from "../../utils/calendarActions";

export const getCalendarList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      data: { items },
    } = await calendar.calendarList.list();

    res.status(StatusCodes.OK).send(items ? mapCalendar(items) : []);
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
  // Calendar is created while either new user is being registered or the user starts to use their calendar for the first time (if calendar creation was unsuccesful while registration)
  try {
    const { userId } = req.body;
    console.log("user id----->🟥🟥🟥", userId);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { calendar: true, profile: true },
    });
    console.log("user--->", user);

    if (!user) throw new CustomError.BadRequestError("user not found");
    if (user?.calendar?.calendarId)
      throw new CustomError.BadRequestError("User already has calendar");

    await prisma.$transaction(
      async (tx) => {
        const { data: insertedCalendar } = await calendar.calendars.insert({
          requestBody: {
            summary: `${user.profile?.firstName} ${user.profile?.lastName} `,
            description: `Calendar of the user with the email ${user.profile?.email}`,
            timeZone: "UTC",
          },
        });

        if (!insertedCalendar.id) return;

        const { data: acl } = await calendar.acl.insert({
          calendarId: insertedCalendar.id,
          requestBody: {
            role: "owner",
            scope: { type: "user", value: user.profile?.email },
          },
        });

        if (!insertedCalendar.id) return;
        if (!acl.id) return;

        const sharedCalendar = await tx.calendars.create({
          data: { userId, aclId: acl.id, calendarId: insertedCalendar.id },
        });

        res.status(StatusCodes.OK).send({ sharedCalendar });
      },
      {
        maxWait: 2000, // default: 2000
        timeout: 10000, // default: 5000
      }
    );
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
    res.status(StatusCodes.NO_CONTENT).send(statusText);
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
