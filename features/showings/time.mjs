export const ZONE = "America/Guatemala";
export const SLOT_MS = 30 * 60 * 1000;

/** @param {Date} date */
export function localInput(date) {
  const fields = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(fields.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

/** @param {string} input */
export function parseLocal(input) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return null;
  // The demo schedules future visits in Guatemala, which uses UTC−06:00.
  const date = new Date(`${input}:00-06:00`);
  return Number.isFinite(date.getTime()) && localInput(date) === input ? date : null;
}

/** @param {string} from @param {string} to */
export function searchWindow(from, to) {
  const start = parseLocal(from);
  const end = parseLocal(to);
  if (!start || !end || end.getTime() - start.getTime() < SLOT_MS) return null;
  return { start, lastStart: new Date(end.getTime() - SLOT_MS) };
}

/** @param {Date} start */
export function formatSlot(start) {
  const date = new Intl.DateTimeFormat("en-GT", {
    timeZone: ZONE, day: "numeric", month: "short", year: "numeric",
  });
  const time = new Intl.DateTimeFormat("en-GT", {
    timeZone: ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  return `${date.format(start)} · ${time.format(start)}–${time.format(new Date(start.getTime() + SLOT_MS))}`;
}
