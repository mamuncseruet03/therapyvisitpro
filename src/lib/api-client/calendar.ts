import { apiUrl, handleResponse } from "./_fetch";

export async function getCalendarVisits() {
  const res = await fetch(apiUrl("/api/v1/calendar/visits"));
  return handleResponse(res);
}

export async function getWeeklyCloseData() {
  const res = await fetch(apiUrl("/api/v1/calendar/weekly-close"));
  return handleResponse(res);
}

export async function getTherapistsForSchedule() {
  const res = await fetch(apiUrl("/api/v1/therapists/schedule"));
  return handleResponse(res);
}
