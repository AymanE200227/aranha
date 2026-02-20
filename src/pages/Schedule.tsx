import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Calendar, Clock3, Layers3 } from "lucide-react";
import { getSchedules, getGroups } from "@/lib/storage";
import { Group, ScheduleSlot } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useAppContent } from "@/hooks/useAppContent";
import { cn } from "@/lib/utils";
import { getGroupColorClasses } from "@/lib/groupColors";
import {
  SCHEDULE_DAYS,
  SCHEDULE_DAY_END_LABEL,
  SCHEDULE_TIME_SLOTS,
  formatTimeRange,
  getDurationHoursFromTimes,
  getSlotSpan,
} from "@/lib/schedule";

const Schedule = () => {
  const { isAuthenticated, user } = useAuth();
  const content = useAppContent();
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    setSchedules(getSchedules());
    setGroups(getGroups());
  }, []);

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

  const userGroup = user?.groupId ? groups.find((group) => group.id === user.groupId) : null;

  const isCellCoveredByAnySlot = (day: string, time: string): boolean => {
    return schedules.some((slot) => slot.day === day && slot.startTime <= time && slot.endTime > time);
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
        const isUserGroup = !!group && user?.groupId === group.id;

        cells.push(
          <td key={`${day}-${startingSlot.id}`} colSpan={span} className="p-1 align-top">
            <div
              className={cn(
                "h-[56px] sm:h-[64px] rounded-md border px-2 py-1",
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

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">{content["schedule.badge"]}</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-foreground">
              {content["schedule.title_prefix"]} <span className="text-gradient-gold">{content["schedule.title_highlight"]}</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">{content["schedule.description"]}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Jours actifs</p>
              <p className="font-display text-2xl text-foreground">{SCHEDULE_DAYS.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sessions</p>
              <p className="font-display text-2xl text-foreground">{schedules.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Heures planifiees</p>
              <p className="font-display text-2xl text-foreground">{totalHours}h</p>
            </div>
          </div>

          {/* User Group Info */}
          {isAuthenticated && userGroup && (
            <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/30 text-center max-w-md mx-auto">
              <p className="text-sm text-muted-foreground">{content["schedule.user_group_label"]}</p>
              <p className="font-display text-lg text-primary">{userGroup.name}</p>
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
          <div className="card-elevated p-3 sm:p-4 overflow-x-auto">
            <table className="w-full min-w-[1220px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-card p-2 sm:p-3 text-left font-display text-foreground min-w-[120px]">
                    {content["schedule.table.day"]}
                  </th>
                {SCHEDULE_TIME_SLOTS.map((time) => (
                  <th key={time} className="p-1.5 sm:p-2 text-center font-mono text-[11px] sm:text-xs text-muted-foreground min-w-[68px] sm:min-w-[76px]">
                    {time}
                  </th>
                ))}
              </tr>
            </thead>
              <tbody>
                {SCHEDULE_DAYS.map((day) => (
                  <tr key={day} className="border-t border-border/30">
                    <td className="sticky left-0 z-10 bg-card p-2 sm:p-3 font-display text-foreground text-xs sm:text-sm border-r border-border/30">
                      {day}
                    </td>
                    {renderDayCells(day)}
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
