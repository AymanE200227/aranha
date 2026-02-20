import type { ScheduleSlot } from "@/lib/types";

export const SCHEDULE_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;
export const SCHEDULE_START_HOUR = 8;
export const SCHEDULE_END_HOUR = 24;
export const SCHEDULE_DAY_END_LABEL = "24:00";

const padHour = (hour: number): string => String(hour).padStart(2, "0");

export const SCHEDULE_TIME_SLOTS = Array.from(
  { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR },
  (_, index) => `${padHour(SCHEDULE_START_HOUR + index)}:00`
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
  return Math.max(1, Math.round(minutes / 60));
};

export const getSlotSpan = (slot: ScheduleSlot, slots: string[] = SCHEDULE_TIME_SLOTS): number => {
  const startIndex = getTimeIndex(slot.startTime, slots);
  const endIndex = getTimeIndex(slot.endTime, slots);
  if (startIndex >= 0 && endIndex > startIndex) {
    return endIndex - startIndex;
  }
  return getDurationHoursFromTimes(slot.startTime, slot.endTime);
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
  durationHours: number,
  slots: string[] = SCHEDULE_TIME_SLOTS
): Pick<ScheduleSlot, "day" | "startTime" | "endTime"> => {
  const normalizedStartIndex = Math.max(0, startIndex);
  const normalizedDuration = Math.max(1, durationHours);
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
