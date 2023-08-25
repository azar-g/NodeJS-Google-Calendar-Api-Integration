import { Prisma } from "@prisma/client";
import { google } from "googleapis";
import * as path from "path";
import { freeSlotBodyForCalendar } from "./mappers";
import dayjs from "dayjs";
import { prisma } from "./db";
import CustomError from "../errors";
import { AxiosError } from "axios";

// const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;

const credentialsPath = path.join(__dirname, "../../service_credentials.json");

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: "https://www.googleapis.com/auth/calendar",
});

const calendar = google.calendar({
  version: "v3",
  auth: auth,
});

type UserWithRelations = Prisma.UsersGetPayload<{
  select: { profile: true; calendar: true };
}>;

export const createGoogleCalendar = async (userId: number) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { calendar: true, profile: true },
    });

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
        return sharedCalendar;
      },
      {
        maxWait: 5000, // default: 2000
        timeout: 10000, // default: 5000
      }
    );
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data.message as string);
  }
};

export const insertSlotsToCalendar = async (
  user: UserWithRelations,
  appointmentSlots: Prisma.AppointmentsCreateManyInput[]
) => {
  try {
    // const appointmentSlotsIds = appointmentSlots.map((slot) => slot.intervalId);
    // const databaseFreeSlots = await prisma.appointments.findMany({
    //   where: { intervalId: { in: appointmentSlotsIds } },
    // });
    await prisma.$transaction(
      async (tx) => {
        for (const appointmentSlot of appointmentSlots) {
          const { data: freeSlot } = await calendar.events.insert({
            calendarId: user.calendar?.calendarId,
            requestBody: {
              ...freeSlotBodyForCalendar,
              location: user.profile?.address,
              start: {
                dateTime: dayjs(appointmentSlot.startTime).toISOString(),
              },
              end: { dateTime: dayjs(appointmentSlot.endTime).toISOString() },
            },
          });

          await tx.appointments.update({
            where: { intervalId: appointmentSlot.intervalId },
            data: { ...appointmentSlot, eventId: freeSlot.id },
          });
        }
      },
      {
        maxWait: 5000, // default: 2000
        timeout: 30000, // default: 5000
      }
    );
  } catch (error) {
    throw new Error("There was error with inserting slots to google calendar");
  }
};

export const updateFreeSlotToEvent = async (
  id: number,
  description: string,
  subscriberName: string,
  subscriberPhoneNumber: string
) => {
  try {
    await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointments.findUnique({
        where: { id },
        select: {
          eventId: true,
          user: { select: { calendar: true, profile: true } },
        },
      });
      // appointment.user.profile?.email

      // if (!userProfile) throw new CustomError.NotFoundError("Provider not found");

      await calendar.events.patch({
        // calendarId: userProfile?.user?.calendar?.calendarId,
        calendarId: appointment?.user.calendar?.calendarId,
        eventId: appointment?.eventId as string,
        requestBody: {
          summary: `${subscriberName} ${subscriberPhoneNumber}`,
          // we are providing subscriberName and phoneNumber
          // in summary in order it would be possible
          // to see in the google calendar by whom the event was created
          description: description,
          colorId: "6",
          // attendees: [
          //   {
          //     email: "azerbatistuta@gmail.com",
          //   },
          // ],
          // "Service accounts cannot invite attendees without Domain-Wide Delegation of Authority."

          extendedProperties: {
            shared: {
              status: "booked",
              subscriberName,
              subscriberPhoneNumber,
            },
          },
        },
      });
    });
  } catch (error) {
    throw new Error("There was error with updating the slot to a new event");
  }
};
