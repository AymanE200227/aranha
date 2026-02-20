import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  MoveHorizontal,
  Clock3,
} from "lucide-react";
import { toast } from "sonner";
import { Group, ScheduleSlot } from "@/lib/types";
import { getSchedules, createSchedule, deleteSchedule, getGroups } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import AdminShell from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";
import { getGroupColorClasses } from "@/lib/groupColors";
import {
  SCHEDULE_DAYS,
  SCHEDULE_TIME_SLOTS,
  buildSlotFromIndexes,
  findOverlappingSchedule,
  formatTimeRange,
  getDurationHoursFromTimes,
  getSlotSpan,
  getTimeByIndex,
  isTimeCoveredBySlot,
  parseTimeToMinutes,
} from "@/lib/schedule";

type PendingRange = {
  day: string;
  startIndex: number;
};

const AdminSchedules = () => {
  const navigate = useNavigate();
  const { logout, isAdmin, isAuthenticated, isLoading } = useAuth();

  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<PendingRange | null>(null);
  const [durationHours, setDurationHours] = useState(1);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

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

  const latestEndTime = useMemo(() => {
    if (schedules.length === 0) return "--:--";
    return schedules.reduce((latest, slot) => {
      return parseTimeToMinutes(slot.endTime) > parseTimeToMinutes(latest) ? slot.endTime : latest;
    }, "00:00");
  }, [schedules]);

  const totalHoursPlanned = useMemo(() => {
    return schedules.reduce((sum, slot) => sum + getDurationHoursFromTimes(slot.startTime, slot.endTime), 0);
  }, [schedules]);

  const loadData = () => {
    setSchedules(getSchedules());
    setGroups(getGroups());
  };

  const getSlotAtCell = (day: string, columnIndex: number): ScheduleSlot | null => {
    const time = SCHEDULE_TIME_SLOTS[columnIndex];
    if (!time) return null;
    return (
      schedules.find((slot) => {
        if (slot.day !== day) return false;
        return isTimeCoveredBySlot(slot, time);
      }) || null
    );
  };

  const isCellOccupied = (day: string, columnIndex: number): boolean => {
    return getSlotAtCell(day, columnIndex) !== null;
  };

  const getMaxDurationForStart = (day: string, startIndex: number): number => {
    let maxDuration = 0;
    for (let index = startIndex; index < SCHEDULE_TIME_SLOTS.length; index += 1) {
      if (isCellOccupied(day, index)) break;
      maxDuration += 1;
    }
    return Math.max(1, maxDuration);
  };

  const openCreateDialog = (day: string, startIndex: number) => {
    if (startIndex < 0 || startIndex >= SCHEDULE_TIME_SLOTS.length) {
      toast.error("Creneau invalide");
      return;
    }

    if (isCellOccupied(day, startIndex)) {
      toast.error("Ce creneau est deja occupe");
      return;
    }

    setPendingRange({ day, startIndex });
    setDurationHours(1);
    setIsDialogOpen(true);
  };

  const handleDeleteSlot = (slot: ScheduleSlot) => {
    const group = groupsById.get(slot.groupId);
    const shouldDelete = window.confirm(
      `Supprimer ${group?.name || "ce groupe"} (${formatTimeRange(slot.startTime, slot.endTime)}) ?`
    );
    if (!shouldDelete) return;

    deleteSchedule(slot.id);
    toast.success("Creneau supprime");
    loadData();
  };

  const maxDurationForDialog = pendingRange ? getMaxDurationForStart(pendingRange.day, pendingRange.startIndex) : 1;
  const safeDuration = Math.min(Math.max(1, durationHours), maxDurationForDialog);

  useEffect(() => {
    if (safeDuration !== durationHours) {
      setDurationHours(safeDuration);
    }
  }, [safeDuration, durationHours]);

  const handleCreateSlot = () => {
    if (!pendingRange || !selectedGroup) {
      toast.error("Veuillez choisir un groupe");
      return;
    }

    const candidate = buildSlotFromIndexes(pendingRange.day, pendingRange.startIndex, safeDuration);
    const overlap = findOverlappingSchedule(candidate, schedules);
    if (overlap) {
      const overlapGroup = groupsById.get(overlap.groupId);
      toast.error(
        `Conflit detecte avec ${overlapGroup?.name || "un groupe"} (${formatTimeRange(
          overlap.startTime,
          overlap.endTime
        )})`
      );
      return;
    }

    createSchedule({
      groupId: selectedGroup,
      ...candidate,
    });

    toast.success(`Session ${safeDuration}h ajoutee (${candidate.startTime} - ${candidate.endTime})`);
    setIsDialogOpen(false);
    setPendingRange(null);
    setSelectedGroup("");
    setDurationHours(1);
    loadData();
  };

  const renderDayCells = (day: string) => {
    const cells: JSX.Element[] = [];

    let columnIndex = 0;
    while (columnIndex < SCHEDULE_TIME_SLOTS.length) {
      const currentTime = SCHEDULE_TIME_SLOTS[columnIndex];
      const startingSlot = slotStartMap.get(`${day}|${currentTime}`);

      if (startingSlot) {
        const span = Math.max(
          1,
          Math.min(getSlotSpan(startingSlot, SCHEDULE_TIME_SLOTS), SCHEDULE_TIME_SLOTS.length - columnIndex)
        );
        const group = groupsById.get(startingSlot.groupId);
        const colorClasses = getGroupColorClasses(group?.color);

        cells.push(
          <td key={`${day}-${startingSlot.id}`} colSpan={span} className="p-1 align-top">
            <button
              type="button"
              onClick={() => handleDeleteSlot(startingSlot)}
              className={cn(
                "h-[56px] sm:h-[64px] w-full rounded-md border px-2 py-1 text-left transition-all",
                "hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                colorClasses.filledCell,
                colorClasses.filledCellHover
              )}
              title="Cliquez pour supprimer ce creneau"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold leading-tight text-foreground">{group?.name || "Groupe"}</p>
                  <p className="text-[11px] text-muted-foreground">{formatTimeRange(startingSlot.startTime, startingSlot.endTime)}</p>
                </div>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground/80" />
              </div>
            </button>
          </td>
        );

        columnIndex += span;
        continue;
      }

      if (isCellOccupied(day, columnIndex)) {
        columnIndex += 1;
        continue;
      }
      const cellIndex = columnIndex;

      cells.push(
        <td key={`${day}-${currentTime}`} className="p-1 align-top">
          <button
            type="button"
            onClick={() => openCreateDialog(day, cellIndex)}
            className={cn(
              "schedule-cell h-[56px] sm:h-[64px] w-full rounded-md border border-dashed",
              "flex items-center justify-center transition-all",
              "border-border/40 bg-secondary/20 hover:bg-secondary/40"
            )}
            title="Cliquez pour creer une session"
          >
            <Plus className="h-4 w-4 text-muted-foreground/40" />
          </button>
        </td>
      );

      columnIndex += 1;
    }

    return cells;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isLoading) return null;

  const pendingStartTime = pendingRange ? getTimeByIndex(pendingRange.startIndex, SCHEDULE_TIME_SLOTS) : "";
  const pendingEndTime = pendingRange
    ? getTimeByIndex(pendingRange.startIndex + safeDuration, SCHEDULE_TIME_SLOTS)
    : "";

  return (
    <AdminShell onLogout={handleLogout}>
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              EMPLOIS DU <span className="text-gradient-gold">TEMPS</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Cliquez une case vide puis choisissez 1h, 2h, 3h ou plus. Cliquez un bloc existant pour le supprimer.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Creneaux</p>
              <p className="font-display text-xl text-foreground">{schedules.length}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Heures totales</p>
              <p className="font-display text-xl text-foreground">{totalHoursPlanned}h</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Jusqu a</p>
              <p className="font-display text-xl text-foreground">{latestEndTime}</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-3">
          {groups.map((group) => {
            const colorClasses = getGroupColorClasses(group.color);
            return (
              <div key={group.id} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                <span className={cn("h-2.5 w-2.5 rounded-full", colorClasses.dot)} />
                <span className="text-muted-foreground">{group.name}</span>
              </div>
            );
          })}
        </div>

        <div className="card-elevated p-3 sm:p-4 overflow-x-auto">
          <table className="w-full min-w-[1220px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-card p-2 sm:p-3 text-left font-display text-foreground min-w-[120px]">
                  Jour
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

        {/* Create Slot Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Creer un creneau fusionne</DialogTitle>
              <DialogDescription>
                Definissez le groupe et la duree. Les conflits horaires sont bloques automatiquement.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {pendingRange && (
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MoveHorizontal className="h-4 w-4" />
                    <span>
                      {pendingRange.day} - {pendingStartTime} a {pendingEndTime}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span>Duree: {safeDuration}h</span>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Groupe</p>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Selectionner un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => {
                      const colorClasses = getGroupColorClasses(group.color);
                      return (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2.5 w-2.5 rounded-full", colorClasses.dot)} />
                            <span>{group.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Duree</p>
                <Select value={String(safeDuration)} onValueChange={(value) => setDurationHours(Number(value))}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxDurationForDialog }, (_, index) => index + 1).map((duration) => (
                      <SelectItem key={duration} value={String(duration)}>
                        {duration} heure{duration > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateSlot} variant="gold" className="w-full">
                Creer la session ({safeDuration}h)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
};

export default AdminSchedules;
