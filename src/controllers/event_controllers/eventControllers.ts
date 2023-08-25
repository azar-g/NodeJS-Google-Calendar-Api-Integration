import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { calendar } from "../../utils/googleCalendar";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "../../middleware/authentication";
import { TokenUser } from "../../utils/jwt";
import CustomError from "../../errors";
import { freeSlotBody } from "../../utils/mappers";
import {
  insertSlotsToCalendar,
  updateFreeSlotToEvent,
} from "../../utils/calendarActions";
import { ZoomMeetingType } from "../../utils/zoomActions";
import axios from "axios";
import { prisma } from "../../utils/db";
import { BASE_URL, GOOGLE_CALENDAR_ID } from "../../config";

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
    console.log(req.user);
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

    // checking user's appointment slots against coming intervals and sorting them.
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
      // if interval's start time is in already existing appointment we push it into busy intervals
      if (appointment) busyIntervals.push(interval);
      // else into free intervals
      else freeIntervals.push(interval);
    }

    const appointmentSlots = freeIntervals.map((interval) => ({
      ...freeSlotBody,
      startTime: interval.startDateTime,
      endTime: interval.endDateTime,
      userId,
      intervalId: uuidv4(), // intervaId is created for this reason: First we are creating appointment slots in our database then after sending response to the client we are sending them(but when we create them in database we only get their count not actually their created data) to insert Google calendar. And there we need to use this intervalId to distinguish the newly created appointment slot. Then we insert that appontment slot to Google calendar and update it in database by fetching its id given by Goole calendar.
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
      startTime,
      providerEmail,
      description,
      meetingDuration,
      subscriberName,
      subscriberEmail,
      subscriberPhoneNumber,
    } = req.body;

    const { id } = req.params;

    if (
      !id ||
      !subscriberName ||
      !providerEmail ||
      !subscriberEmail ||
      !subscriberPhoneNumber
    ) {
      throw new CustomError.BadRequestError("Missing required parameters");
    }
    const slot = await prisma.appointments.findUnique({
      where: { id: Number(id) },
    });
    //rabbitMQ
    await prisma.$transaction(
      async (tx) => {
        const { data: zoomMeetingData } = await axios.post<ZoomMeetingType>(
          `${BASE_URL}/api/v1/createZoomMeeting`,
          {
            topic: `${subscriberName} ${description}`,
            start_time: slot?.startTime,
            duration: meetingDuration,
          }
        );

        const createdEvent = await prisma.appointments.update({
          where: { id: Number(id) },
          data: {
            summary: `${subscriberName} ${subscriberPhoneNumber}`,
            description,
            subscriberName,
            subscriberPhoneNumber,
            status: "booked",
            meetingDuration,
            meetingLink: zoomMeetingData.start_url,
          },
        });

        if (!createdEvent)
          throw new CustomError.NotFoundError("Appointment not found");

        const providerEmailData = {
          to: `${providerEmail}`,
          subject: `New meeting on ${startTime}`,
          body: `Salam. ${subscriberName} ${startTime} tarixində randevu təyin etmişdir. Zoom meeting ${zoomMeetingData.start_url}`,
        };
        const subscriberEmailData = {
          to: `${subscriberEmail}`,
          subject: `Your meeting on ${new Date(startTime)}`,
          body: `Salam. ${new Date(
            startTime
          )} tarixində randevunuz müvəffəqiyyətlə təyin edilmişdir. Randevuya qoşulmaq üçün bu linkə-->${
            zoomMeetingData.start_url
          } tıklayacaqsınız`,
        };
        axios.post(`${BASE_URL}/api/v1/sendMail`, providerEmailData);
        axios.post(`${BASE_URL}/api/v1/sendMail`, subscriberEmailData);
      },
      {
        maxWait: 3000, // default: 2000
        timeout: 10000, // default: 5000
      }
    );

    res.status(StatusCodes.OK).send("ok");

    updateFreeSlotToEvent(
      Number(id),
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
