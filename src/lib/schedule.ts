import type { ScheduleSlot } from "@/lib/types";

export const SCHEDULE_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;
export const SCHEDULE_START_HOUR = 6;
export const SCHEDULE_END_HOUR = 22;
export const SCHEDULE_SLOT_INTERVAL_MINUTES = 30;
export const SCHEDULE_DAY_END_LABEL = `${String(SCHEDULE_END_HOUR).padStart(2, "0")}:00`;

const padHour = (hour: number): string => String(hour).padStart(2, "0");
const padMinute = (minute: number): string => String(minute).padStart(2, "0");
const formatMinutesToTime = (minutes: number): string => {
  const clamped = Math.max(0, minutes);
  const hour = Math.floor(clamped / 60);
  const minute = clamped % 60;
  return `${padHour(hour)}:${padMinute(minute)}`;
};

export const SCHEDULE_TIME_SLOTS = Array.from(
  { length: ((SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60) / SCHEDULE_SLOT_INTERVAL_MINUTES },
  (_, index) => formatMinutesToTime(SCHEDULE_START_HOUR * 60 + index * SCHEDULE_SLOT_INTERVAL_MINUTES)
);

export const parseTimeToMinutes = (time: string): number => {
  const [hourText, minuteText = "0"] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
  return hour * 60 + minute;
};

export const getTimeIndex = (time: string, slots: string[] = SCHEDULE_TIME_SLOTS): number => {
  if (time === SCHEDULE_DAY_END_LABEL) return slots.length;
  return slots.indexOf(time);
};

export const getTimeByIndex = (index: number, slots: string[] = SCHEDULE_TIME_SLOTS): string => {
  if (index >= slots.length) return SCHEDULE_DAY_END_LABEL;
  return slots[Math.max(0, index)];
};

export const getDurationHoursFromTimes = (startTime: string, endTime: string): number => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const minutes = Math.max(0, endMinutes - startMinutes);
  return minutes / 60;
};

export const getDurationSlotsFromTimes = (startTime: string, endTime: string): number => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const minutes = Math.max(0, endMinutes - startMinutes);
  return Math.max(1, Math.round(minutes / SCHEDULE_SLOT_INTERVAL_MINUTES));
};

export const formatDurationFromSlots = (slotCount: number): string => {
  const normalized = Math.max(1, slotCount);
  const totalMinutes = normalized * SCHEDULE_SLOT_INTERVAL_MINUTES;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) return `${remainingMinutes}min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h${String(remainingMinutes).padStart(2, "0")}`;
};

export const getSlotSpan = (slot: ScheduleSlot, slots: string[] = SCHEDULE_TIME_SLOTS): number => {
  const startIndex = getTimeIndex(slot.startTime, slots);
  const endIndex = getTimeIndex(slot.endTime, slots);
  if (startIndex >= 0 && endIndex > startIndex) {
    return endIndex - startIndex;
  }
  return getDurationSlotsFromTimes(slot.startTime, slot.endTime);
};

export const isTimeCoveredBySlot = (slot: ScheduleSlot, time: string): boolean => {
  const current = parseTimeToMinutes(time);
  const start = parseTimeToMinutes(slot.startTime);
  const end = parseTimeToMinutes(slot.endTime);
  return start <= current && current < end;
};

export const sortSlotsByStartTime = (slots: ScheduleSlot[]): ScheduleSlot[] => {
  return [...slots].sort((left, right) => parseTimeToMinutes(left.startTime) - parseTimeToMinutes(right.startTime));
};

export const formatTimeRange = (startTime: string, endTime: string): string => `${startTime} - ${endTime}`;

export const buildSlotFromIndexes = (
  day: string,
  startIndex: number,
  durationSlots: number,
  slots: string[] = SCHEDULE_TIME_SLOTS
): Pick<ScheduleSlot, "day" | "startTime" | "endTime"> => {
  const normalizedStartIndex = Math.max(0, startIndex);
  const normalizedDuration = Math.max(1, durationSlots);
  const startTime = getTimeByIndex(normalizedStartIndex, slots);
  const endTime = getTimeByIndex(normalizedStartIndex + normalizedDuration, slots);
  return {
    day,
    startTime,
    endTime,
  };
};

export const findOverlappingSchedule = (
  candidate: Pick<ScheduleSlot, "day" | "startTime" | "endTime">,
  schedules: ScheduleSlot[],
  excludedScheduleId?: string
): ScheduleSlot | null => {
  const candidateStart = parseTimeToMinutes(candidate.startTime);
  const candidateEnd = parseTimeToMinutes(candidate.endTime);
  return (
    schedules.find((schedule) => {
      if (excludedScheduleId && schedule.id === excludedScheduleId) return false;
      if (schedule.day !== candidate.day) return false;
      const scheduleStart = parseTimeToMinutes(schedule.startTime);
      const scheduleEnd = parseTimeToMinutes(schedule.endTime);
      return candidateStart < scheduleEnd && scheduleStart < candidateEnd;
    }) || null
  );
};
