import { googleConfigured, getGoogleAccessToken } from "./google-auth";

export function calendarConfigured(): boolean {
  return googleConfigured() && Boolean(process.env.GOOGLE_CALENDAR_ID);
}

const TIPO_LABEL: Record<string, string> = {
  APPUNTAMENTO: "Appuntamento",
  SOPRALLUOGO: "Sopralluogo",
  MONTAGGIO: "Montaggio",
  ALTRO: "Impegno",
};

type AppointmentInput = {
  id: string;
  scheduledAt: Date;
  durationMin: number;
  type: string;
  address?: string | null;
  notes?: string | null;
  clientName: string;
  googleEventId?: string | null;
};

async function calendarFetch(
  path: string,
  method: string,
  token: string,
  body?: object
): Promise<Response> {
  const calId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!);
  return fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export async function pushAppointmentToCalendar(appt: AppointmentInput): Promise<string | null> {
  if (!calendarConfigured()) return null;
  const token = await getGoogleAccessToken("https://www.googleapis.com/auth/calendar");
  if (!token) return null;

  const end = new Date(appt.scheduledAt.getTime() + appt.durationMin * 60_000);
  const eventBody = {
    summary: `${TIPO_LABEL[appt.type] ?? appt.type} — ${appt.clientName}`,
    location: appt.address ?? undefined,
    description: [appt.notes, `ID Bolero: ${appt.id}`].filter(Boolean).join("\n"),
    start: { dateTime: appt.scheduledAt.toISOString(), timeZone: "Europe/Zurich" },
    end: { dateTime: end.toISOString(), timeZone: "Europe/Zurich" },
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }] },
  };

  const isUpdate = Boolean(appt.googleEventId);
  const res = await calendarFetch(
    isUpdate ? `/events/${appt.googleEventId}` : "/events",
    isUpdate ? "PUT" : "POST",
    token,
    eventBody
  );

  if (!res.ok) return appt.googleEventId ?? null;
  const data = (await res.json()) as { id?: string };
  return data.id ?? null;
}

export async function deleteCalendarEvent(googleEventId: string): Promise<void> {
  if (!calendarConfigured()) return;
  const token = await getGoogleAccessToken("https://www.googleapis.com/auth/calendar");
  if (!token) return;
  await calendarFetch(`/events/${googleEventId}`, "DELETE", token).catch(() => {});
}
