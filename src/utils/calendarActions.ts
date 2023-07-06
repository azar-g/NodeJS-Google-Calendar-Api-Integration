import { Prisma, Appointments } from "@prisma/client";
import { google } from "googleapis";
import * as path from "path";
import { freeSlotBodyForCalendar, mapEvent } from "./mappers";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import CustomError from "../errors";
const prisma = new PrismaClient();

// const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;

const credentialsPath = path.join(__dirname, "../../credentials.json");

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

type AppointmentSlot = {
  startTime: string;
  endTime: string;
  userId: number;
  intervalId: string;
  summary: string;
  description: string;
};

export const insertSlotsToCalendar = async (
  user: UserWithRelations,
  appointmentSlots: Prisma.AppointmentsCreateManyInput[]
) => {
  const appointmentSlotsIds = appointmentSlots.map((slot) => slot.intervalId);
  try {
    await prisma.$transaction(
      async (tx) => {
        const databaseFreeSlots = await tx.appointments.findMany({
          where: { intervalId: { in: appointmentSlotsIds } },
        });

        for (const databaseFreeSlot of databaseFreeSlots) {
          const { data: freeSlot } = await calendar.events.insert({
            calendarId: user.calendar?.calendarId,
            requestBody: {
              ...freeSlotBodyForCalendar,
              location: user.profile?.address,
              start: {
                dateTime: dayjs(databaseFreeSlot.startTime).toISOString(),
              },
              end: { dateTime: dayjs(databaseFreeSlot.endTime).toISOString() },
            },
          });

          await tx.appointments.update({
            where: { id: databaseFreeSlot.id },
            data: { ...databaseFreeSlot, eventId: freeSlot.id },
          });
        }
      },
      {
        maxWait: 5000, // default: 2000
        timeout: 30000, // default: 5000
      }
    );
  } catch (error) {
    console.log(error);
    // Here we can publish the error message to the RabbitMQ queue
  }
};

export const updateFreeSlotToEvent = async (
  id: number,
  eventId: string,
  // providerEmail: string,
  description: string,
  subscriberName: string,
  subscriberPhoneNumber: string
) => {
  try {
    await prisma.$transaction(async (tx) => {
      /* const userProfile = await tx.profiles.findUnique({
        where: { email: providerEmail },
        select: {
          user: {
            select: {
              calendar: true,
            },
          },
        },
      }); */

      const appointment = await tx.appointments.findUnique({
        where: { id },
        select: { user: { select: { calendar: true } } },
      });

      // if (!userProfile) throw new CustomError.NotFoundError("Provider not found");

      await calendar.events.patch({
        // calendarId: userProfile?.user?.calendar?.calendarId,
        calendarId: appointment?.user.calendar?.calendarId,
        eventId,
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
    console.log(error);
    // Here we can publish the error message to the RabbitMQ queue
  }
};
