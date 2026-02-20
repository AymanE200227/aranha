import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Calendar,
  UserCheck,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { User, Group, ScheduleSlot, AttendanceRecord } from "@/lib/types";
import {
  getUsers,
  getGroups,
  getSchedules,
  getAttendance,
  markAttendance,
} from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import AdminShell from "@/components/admin/AdminShell";
import { getGroupColorClasses } from "@/lib/groupColors";
import { SCHEDULE_TIME_SLOTS } from "@/lib/schedule";

const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const timeSlots = SCHEDULE_TIME_SLOTS;

const AdminAttendance = () => {
  const navigate = useNavigate();
  const { logout, isAdmin, isAuthenticated, isLoading, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Session selection for marking attendance
  const [selectedSession, setSelectedSession] = useState<{
    schedule: ScheduleSlot;
    group: Group;
    date: Date;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(getUsers());
    setGroups(getGroups());
    setSchedules(getSchedules());
    setAttendance(getAttendance());
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getWeekDates = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  };

  const getScheduleForDayTime = (day: string, time: string): { slot: ScheduleSlot; group: Group } | null => {
    const slot = schedules.find(
      (s) => s.day === day && s.startTime <= time && s.endTime > time
    );
    if (!slot) return null;
    const group = groups.find((g) => g.id === slot.groupId);
    if (!group) return null;
    return { slot, group };
  };

  const getAttendanceStatus = (userId: string, date: Date, scheduleSlotId: string): "present" | "absent" | null => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = attendance.find(
      (a) => a.userId === userId && a.date === dateStr && a.scheduleSlotId === scheduleSlotId
    );
    return record?.status || null;
  };

  const getSessionAttendanceStats = (scheduleId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return { present: 0, absent: 0, total: 0, unmarked: 0 };
    
    const groupClients = users.filter(u => u.role === "client" && u.groupId === schedule.groupId);
    const sessionAttendance = attendance.filter(
      a => a.scheduleSlotId === scheduleId && a.date === dateStr
    );
    
    const present = sessionAttendance.filter(a => a.status === "present").length;
    const absent = sessionAttendance.filter(a => a.status === "absent").length;
    
    return {
      present,
      absent,
      total: groupClients.length,
      unmarked: groupClients.length - (present + absent)
    };
  };

  const handleOpenSession = (schedule: ScheduleSlot, date: Date) => {
    const group = groups.find(g => g.id === schedule.groupId);
    if (!group) return;
    
    setSelectedSession({ schedule, group, date });
    setDialogOpen(true);
  };

  const handleMarkAttendance = (userId: string, status: "present" | "absent") => {
    if (!currentUser || !selectedSession) return;
    
    const dateStr = format(selectedSession.date, "yyyy-MM-dd");
    markAttendance(userId, selectedSession.schedule.id, dateStr, status, currentUser.id);
    toast.success(status === "present" ? "Present" : "Absent");
    loadData();
  };

  const handleMarkAllPresent = () => {
    if (!currentUser || !selectedSession) return;
    
    const groupClients = users.filter(
      u => u.role === "client" && u.groupId === selectedSession.group.id
    );
    
    const dateStr = format(selectedSession.date, "yyyy-MM-dd");
    groupClients.forEach(client => {
      markAttendance(client.id, selectedSession.schedule.id, dateStr, "present", currentUser.id);
    });
    
    toast.success(`${groupClients.length} membres marques presents`);
    loadData();
  };

  const getSessionClients = () => {
    if (!selectedSession) return [];
    return users.filter(
      u => u.role === "client" && u.groupId === selectedSession.group.id
    );
  };

  const weekDates = getWeekDates();

  if (isLoading) return null;

  return (
    <AdminShell onLogout={handleLogout}>
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              GESTION DES <span className="text-gradient-gold">PRESENCES</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Cliquez sur une seance pour marquer les presences
            </p>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Selectionnez une seance dans l'emploi du temps</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-display text-foreground px-4 min-w-[200px] text-center">
              {format(currentWeekStart, "d MMM", { locale: fr })} -{" "}
              {format(addDays(currentWeekStart, 6), "d MMM yyyy", { locale: fr })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {groups.map((group) => {
            const colorClasses = getGroupColorClasses(group.color);
            return (
              <div key={group.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${colorClasses.dot}`} />
                <span className="text-sm text-muted-foreground">{group.name}</span>
              </div>
            );
          })}
        </div>

        {/* Schedule Grid - Click to Open Session */}
        <div className="card-elevated p-6 overflow-x-auto">
          <table className="w-full min-w-[1220px]">
            <thead>
              <tr>
                <th className="p-3 text-left font-display text-foreground min-w-[100px]">
                  Jour / Date
                </th>
                {timeSlots.map((time) => (
                  <th key={time} className="p-2 text-center font-mono text-xs text-muted-foreground">
                    {time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekDates.map((date, dayIndex) => (
                <tr key={dayIndex} className="border-t border-border/30">
                  <td className="p-3">
                    <div className="font-display text-foreground text-sm">{dayNames[dayIndex]}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(date, "d MMM", { locale: fr })}
                    </div>
                  </td>
                  {timeSlots.map((time) => {
                    const data = getScheduleForDayTime(dayNames[dayIndex], time);
                    
                    if (!data) {
                      return (
                        <td key={`${dayIndex}-${time}`} className="p-1">
                          <div className="h-[60px] rounded-lg bg-secondary/20" />
                        </td>
                      );
                    }

                    const stats = getSessionAttendanceStats(data.slot.id, date);
                    const isFirstSlot = data.slot.startTime === time;
                    const colorClasses = getGroupColorClasses(data.group.color);

                    if (!isFirstSlot) {
                      return (
                        <td key={`${dayIndex}-${time}`} className="p-1">
                          <div
                            className={`h-[60px] rounded-lg cursor-pointer transition-all hover:scale-105 ${colorClasses.filledCell} ${colorClasses.filledCellHover}`}
                            onClick={() => handleOpenSession(data.slot, date)}
                          />
                        </td>
                      );
                    }

                    return (
                      <td key={`${dayIndex}-${time}`} className="p-1">
                        <div
                          className={`h-[60px] rounded-lg p-2 cursor-pointer transition-all hover:scale-105 border-2 ${colorClasses.filledCell} ${colorClasses.filledCellHover}`}
                          onClick={() => handleOpenSession(data.slot, date)}
                        >
                          <div className="text-[10px] font-medium text-foreground truncate">
                            {data.group.name}
                          </div>
                          {stats.total > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[9px] px-1 rounded bg-success/30 text-success">
                                {stats.present}P
                              </span>
                              <span className="text-[9px] px-1 rounded bg-destructive/30 text-destructive">
                                {stats.absent}A
                              </span>
                              {stats.unmarked > 0 && (
                                <span className="text-[9px] px-1 rounded bg-muted text-muted-foreground">
                                  {stats.unmarked}?
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Session Attendance Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-primary" />
                Marquer les Presences
              </DialogTitle>
              <DialogDescription>
                {selectedSession && (
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <span className={`px-3 py-1 rounded-full border text-sm font-medium ${getGroupColorClasses(selectedSession.group.color).badge}`}>
                      {selectedSession.group.name}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(selectedSession.date, "EEEE d MMMM yyyy", { locale: fr })}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {selectedSession.schedule.startTime} - {selectedSession.schedule.endTime}
                    </span>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedSession && (
              <div className="mt-4">
                {/* Quick Actions */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-success hover:bg-success/10"
                    onClick={handleMarkAllPresent}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Tous Presents
                  </Button>
                </div>

                {/* Client List */}
                <div className="space-y-2">
                  {getSessionClients().length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-secondary/20 rounded-lg">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun client dans ce groupe</p>
                      <p className="text-sm mt-1">
                        Assignez des clients au groupe "{selectedSession.group.name}" depuis la page Utilisateurs
                      </p>
                    </div>
                  ) : (
                    getSessionClients().map((client) => {
                      const status = getAttendanceStatus(
                        client.id,
                        selectedSession.date,
                        selectedSession.schedule.id
                      );

                      return (
                        <div
                          key={client.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                            status === "present"
                              ? "bg-success/10 border-success/30"
                              : status === "absent"
                              ? "bg-destructive/10 border-destructive/30"
                              : "bg-secondary/30 border-border"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-display text-primary">
                                {client.name.split(" ").map((n) => n[0]).join("")}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{client.name}</div>
                              <div className="text-xs text-muted-foreground">{client.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={status === "present" ? "default" : "outline"}
                              className={`w-24 ${
                                status === "present"
                                  ? "bg-success hover:bg-success/80 text-white"
                                  : "hover:bg-success/20 hover:text-success hover:border-success"
                              }`}
                              onClick={() => handleMarkAttendance(client.id, "present")}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={status === "absent" ? "default" : "outline"}
                              className={`w-24 ${
                                status === "absent"
                                  ? "bg-destructive hover:bg-destructive/80 text-white"
                                  : "hover:bg-destructive/20 hover:text-destructive hover:border-destructive"
                              }`}
                              onClick={() => handleMarkAttendance(client.id, "absent")}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Absent
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Session Stats */}
                {getSessionClients().length > 0 && (
                  <div className="mt-6 p-4 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-around text-center">
                      <div>
                        <div className="font-display text-2xl text-success">
                          {getSessionAttendanceStats(selectedSession.schedule.id, selectedSession.date).present}
                        </div>
                        <div className="text-xs text-muted-foreground">Presents</div>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div>
                        <div className="font-display text-2xl text-destructive">
                          {getSessionAttendanceStats(selectedSession.schedule.id, selectedSession.date).absent}
                        </div>
                        <div className="text-xs text-muted-foreground">Absents</div>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div>
                        <div className="font-display text-2xl text-muted-foreground">
                          {getSessionAttendanceStats(selectedSession.schedule.id, selectedSession.date).unmarked}
                        </div>
                        <div className="text-xs text-muted-foreground">Non marques</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
};

export default AdminAttendance;

