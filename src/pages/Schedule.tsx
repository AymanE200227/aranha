import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Calendar, Clock3, Layers3, Sparkles } from "lucide-react";
import { getSchedules, getGroups } from "@/lib/storage";
import { Group, ScheduleSlot } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useAppContent } from "@/hooks/useAppContent";
import { cn } from "@/lib/utils";
import { getGroupColorClasses } from "@/lib/groupColors";
import { getUserGroupIds } from "@/lib/userGroups";
import {
  SCHEDULE_DAYS,
  SCHEDULE_DAY_END_LABEL,
  SCHEDULE_TIME_SLOTS,
  formatTimeRange,
  getDurationHoursFromTimes,
  getSlotSpan,
  parseTimeToMinutes,
} from "@/lib/schedule";

const Schedule = () => {
  const { isAuthenticated, user } = useAuth();
  const content = useAppContent();
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const timeLabels = useMemo(() => [...SCHEDULE_TIME_SLOTS, SCHEDULE_DAY_END_LABEL], []);

  const loadData = useCallback(() => {
    setSchedules(getSchedules());
    setGroups(getGroups());
  }, []);

  useEffect(() => {
    loadData();

    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || event.key === "jj_schedules" || event.key === "jj_groups") {
        loadData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadData]);

  const groupsById = useMemo(() => {
    return new Map(groups.map((group) => [group.id, group]));
  }, [groups]);

  const slotStartMap = useMemo(() => {
    const map = new Map<string, ScheduleSlot>();
    schedules.forEach((slot) => {
      map.set(`${slot.day}|${slot.startTime}`, slot);
    });
    return map;
  }, [schedules]);

  const totalHours = useMemo(() => {
    return schedules.reduce((sum, slot) => sum + getDurationHoursFromTimes(slot.startTime, slot.endTime), 0);
  }, [schedules]);

  const userGroupIds = useMemo(() => getUserGroupIds(user), [user]);
  const userGroups = useMemo(
    () => groups.filter((group) => userGroupIds.includes(group.id)),
    [groups, userGroupIds]
  );

  const isCellCoveredByAnySlot = (day: string, time: string): boolean => {
    const currentTime = parseTimeToMinutes(time);
    return schedules.some((slot) => {
      if (slot.day !== day) return false;
      return parseTimeToMinutes(slot.startTime) <= currentTime && parseTimeToMinutes(slot.endTime) > currentTime;
    });
  };

  const renderDayCells = (day: string) => {
    const cells: JSX.Element[] = [];

    let columnIndex = 0;
    while (columnIndex < SCHEDULE_TIME_SLOTS.length) {
      const currentTime = SCHEDULE_TIME_SLOTS[columnIndex];
      const startingSlot = slotStartMap.get(`${day}|${currentTime}`);

      if (startingSlot) {
        const group = groupsById.get(startingSlot.groupId);
        const span = Math.max(
          1,
          Math.min(getSlotSpan(startingSlot, SCHEDULE_TIME_SLOTS), SCHEDULE_TIME_SLOTS.length - columnIndex)
        );
        const colorClasses = getGroupColorClasses(group?.color);
        const isUserGroup = !!group && userGroupIds.includes(group.id);

        cells.push(
          <td key={`${day}-${startingSlot.id}`} colSpan={span} className="p-1 align-top">
            <div
              className={cn(
                "h-[56px] sm:h-[64px] rounded-md border px-2 py-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                "flex flex-col justify-between text-left",
                colorClasses.filledCell,
                isUserGroup && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <p className="text-xs font-semibold leading-tight text-foreground">{group?.name || "Groupe"}</p>
              <p className="text-[11px] text-muted-foreground">{formatTimeRange(startingSlot.startTime, startingSlot.endTime)}</p>
            </div>
          </td>
        );

        columnIndex += span;
        continue;
      }

      if (isCellCoveredByAnySlot(day, currentTime)) {
        columnIndex += 1;
        continue;
      }

      cells.push(
        <td key={`${day}-${currentTime}`} className="p-1 align-top">
          <div className="h-[56px] sm:h-[64px] rounded-md border border-dashed border-border/40 bg-secondary/15" />
        </td>
      );

      columnIndex += 1;
    }

    return cells;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative overflow-hidden pt-24 pb-16">
        <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="container mx-auto px-3 sm:px-4">
          {/* Header */}
          <div className="relative mb-10 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-secondary/35 via-card to-secondary/20 px-4 py-8 sm:px-6 sm:py-10 text-center animate-fade-in">
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-accent/10 blur-2xl" />

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">{content["schedule.badge"]}</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-foreground">
              {content["schedule.title_prefix"]} <span className="text-gradient-gold">{content["schedule.title_highlight"]}</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">{content["schedule.description"]}</p>
            <p className="text-xs text-muted-foreground/90 mt-3 inline-flex items-center gap-2">
              <Clock3 className="w-3.5 h-3.5" />
              Grille detaillee en 30 minutes, de 06:00 a 22:00.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 text-center transition-transform duration-300 hover:-translate-y-0.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Jours actifs</p>
              <p className="font-display text-2xl text-foreground">{SCHEDULE_DAYS.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 text-center transition-transform duration-300 hover:-translate-y-0.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sessions</p>
              <p className="font-display text-2xl text-foreground">{schedules.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 text-center transition-transform duration-300 hover:-translate-y-0.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Heures planifiees</p>
              <p className="font-display text-2xl text-foreground">{totalHours.toFixed(1).replace(".0", "")}h</p>
            </div>
          </div>

          {/* User Group Info */}
          {isAuthenticated && userGroups.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30 text-center max-w-2xl mx-auto">
              <p className="text-sm text-muted-foreground">{content["schedule.user_group_label"]}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {userGroups.map((group) => (
                  <p key={group.id} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-display text-base text-primary">
                    {group.name}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3 mb-5">
            {groups.map((group) => {
              const colorClasses = getGroupColorClasses(group.color);
              return (
                <div key={group.id} className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1">
                  <span className={cn("h-2.5 w-2.5 rounded-full", colorClasses.dot)} />
                  <span className="text-sm text-muted-foreground">{group.name}</span>
                </div>
              );
            })}
          </div>

          {/* Schedule Grid */}
          <div className="card-elevated p-3 sm:p-4 overflow-x-auto border-border/70 bg-gradient-to-b from-card to-secondary/10">
            <table className="w-full min-w-[1660px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-20 bg-card/95 backdrop-blur p-2 sm:p-3 text-left font-display text-foreground min-w-[120px]">
                    {content["schedule.table.day"]}
                  </th>
                {timeLabels.map((time, timeIndex) => (
                  <th
                    key={time}
                    className={cn(
                      "sticky top-0 z-10 bg-card/90 backdrop-blur p-1.5 sm:p-2 text-center font-mono text-[11px] sm:text-xs text-muted-foreground min-w-[46px] sm:min-w-[50px]",
                      timeIndex === timeLabels.length - 1 && "text-primary border-l border-primary/30"
                    )}
                  >
                    {time}
                  </th>
                ))}
              </tr>
            </thead>
              <tbody>
                {SCHEDULE_DAYS.map((day) => (
                  <tr key={day} className="border-t border-border/30 even:bg-secondary/10">
                    <td className="sticky left-0 z-10 bg-card/95 backdrop-blur p-2 sm:p-3 font-display text-foreground text-xs sm:text-sm border-r border-border/30">
                      {day}
                    </td>
                    {renderDayCells(day)}
                    <td className="p-0 align-top">
                      <div className="h-[56px] sm:h-[64px] border-l border-primary/35 bg-primary/5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Info */}
          <p className="text-center text-muted-foreground text-sm mt-6 flex items-center justify-center gap-2">
            <Layers3 className="h-4 w-4" />
            {isAuthenticated ? content["schedule.info.authenticated"] : content["schedule.info.guest"]}
          </p>
          <p className="text-center text-muted-foreground/80 text-xs mt-2 flex items-center justify-center gap-2">
            <Clock3 className="h-3.5 w-3.5" />
            Grille etendue jusqu a {SCHEDULE_DAY_END_LABEL} avec sessions fusionnees sur plusieurs heures.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Schedule;
