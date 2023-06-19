export const dateTimeForCalendar = () => {
  const apiDate = new Date();

  const year = apiDate.getFullYear();
  const month = String(apiDate.getMonth() + 1).padStart(2, "0");
  const day = String(apiDate.getDate()).padStart(2, "0");
  const hours = String(apiDate.getHours()).padStart(2, "0");
  const minutes = String(apiDate.getMinutes()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:00.000`;

  const event = new Date(Date.parse(formattedDate));

  const startDateTime = event;
  const endDateTime = new Date(new Date(event).setHours(event.getHours() + 1));
  return {
    startDateTime,
    endDateTime,
  };
};
