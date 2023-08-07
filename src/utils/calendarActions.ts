import { Prisma } from "@prisma/client";
import { google } from "googleapis";
import * as path from "path";
import { freeSlotBodyForCalendar } from "./mappers";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
const prisma = new PrismaClient();

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

export const insertSlotsToCalendar = async (
  user: UserWithRelations,
  appointmentSlots: Prisma.AppointmentsCreateManyInput[]
) => {
  try {
    // const appointmentSlotsIds = appointmentSlots.map((slot) => slot.intervalId);
    // const databaseFreeSlots = await prisma.appointments.findMany({
    //   where: { intervalId: { in: appointmentSlotsIds } },
    // });
    const time = Date.now();
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
          console.log("insertSlotsToCalendar-->🟥", Date.now() - time);
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
    console.log(error);
    // Here we can publish the error message to the RabbitMQ queue
  }
};
