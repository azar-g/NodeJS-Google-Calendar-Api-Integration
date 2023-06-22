interface FreeSlot {
  id: string;
  created: Date;
  updated: Date;
}

export const mapEvent = (item) => {
  return {
    id: item.id,
    created: item.created,
    updated: item.updated,
    summary: item.summary,
    description: item.description,
    location: item.location,
    start: { dateTime: item.start?.dateTime, timeZone: item.start?.timeZone },
    end: { dateTime: item.end?.dateTime, timeZone: item.end?.timeZone },
    status: item.extendedProperties?.shared?.status,
    customerPhoneNumber: item.extendedProperties?.shared?.customerPhoneNumber,
  };
};
