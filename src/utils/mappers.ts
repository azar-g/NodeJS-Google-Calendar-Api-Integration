import { calendar_v3 } from "googleapis";

export const mapEvent = (item: calendar_v3.Schema$Event) => {
  return {
    id: item?.id,
    created: item.created,
    updated: item.updated,
    summary: item.summary,
    provider: item.organizer?.displayName,
    description: item.description,
    address: item.location,
    start: { dateTime: item.start?.dateTime, timeZone: item.start?.timeZone },
    end: { dateTime: item.end?.dateTime, timeZone: item.end?.timeZone },
    status: item.extendedProperties?.shared?.status,
    subscriberPhoneNumber:
      item.extendedProperties?.shared?.subscriberPhoneNumber,
    subscriberName: item.extendedProperties?.shared?.subscriberName,
  };
};

export const freeSlotBodyForCalendar = {
  summary: "Free Slot",
  description: "Free for an appointment",
  colorId: "2",
  extendedProperties: {
    shared: {
      status: "free",
    },
  },
};
export const freeSlotBody = {
  summary: "Free Slot",
  description: "Free for an appointment",
};

export const mapCalendar = (
  calendars: calendar_v3.Schema$CalendarListEntry[]
) => {
  return calendars.map((calendar) => ({
    id: calendar.id,
    provider: calendar.summary,
    description: calendar.description,
    timeZone: calendar.timeZone,
    accessRole: calendar.accessRole,
  }));
};
