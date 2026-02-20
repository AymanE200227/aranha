import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BarChart3, CheckCircle, XCircle, TrendingUp, Lock, Calendar, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAppContent } from "@/hooks/useAppContent";
import { getAttendanceByUser, getSchedules, getGroups } from "@/lib/storage";
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleSlot, Group } from "@/lib/types";
import { getGroupColorClasses } from "@/lib/groupColors";

type WeeklyStat = {
  name: string;
  present: number;
  absent: number;
};

type AttendanceHistoryItem = {
  date: string;
  dayName: string;
  formattedDate: string;
  time: string;
  groupName: string;
  status: "present" | "absent";
};

const Stats = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const content = useAppContent();
  const [weeklyData, setWeeklyData] = useState<WeeklyStat[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryItem[]>([]);
  const [totalPresent, setTotalPresent] = useState(0);
  const [totalAbsent, setTotalAbsent] = useState(0);
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [userSchedules, setUserSchedules] = useState<ScheduleSlot[]>([]);

  const loadUserStats = useCallback(() => {
    if (!user) return;

    const attendance = getAttendanceByUser(user.id);
    const schedules = getSchedules();
    const groups = getGroups();

    const group = user.groupId ? groups.find((g) => g.id === user.groupId) : null;
    setUserGroup(group || null);

    const groupSchedules = user.groupId ? schedules.filter((s) => s.groupId === user.groupId) : [];
    setUserSchedules(groupSchedules);

    const present = attendance.filter((a) => a.status === "present").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    setTotalPresent(present);
    setTotalAbsent(absent);

    const weeklyStats: WeeklyStat[] = [];
    for (let i = 3; i >= 0; i -= 1) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });

      const weekAttendance = attendance.filter((a) => {
        const date = new Date(a.date);
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      });

      weeklyStats.push({
        name: `Sem ${4 - i}`,
        present: weekAttendance.filter((a) => a.status === "present").length,
        absent: weekAttendance.filter((a) => a.status === "absent").length,
      });
    }
    setWeeklyData(weeklyStats);

    const detailedHistory = attendance
      .map((a) => {
        const schedule = schedules.find((s) => s.id === a.scheduleSlotId);
        const scheduleGroup = schedule ? groups.find((g) => g.id === schedule.groupId) : null;

        return {
          date: a.date,
          dayName: format(parseISO(a.date), "EEEE", { locale: fr }),
          formattedDate: format(parseISO(a.date), "d MMMM yyyy", { locale: fr }),
          time: schedule ? `${schedule.startTime} - ${schedule.endTime}` : "",
          groupName: scheduleGroup?.name || "",
          status: a.status,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setAttendanceHistory(detailedHistory);
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserStats();
    }
  }, [isAuthenticated, user, loadUserStats]);

  const attendanceRate =
    totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0;

  const pieData = [
    { name: content["stats.common.present"], value: totalPresent, color: "hsl(145 65% 45%)" },
    { name: content["stats.common.absent"], value: totalAbsent, color: "hsl(0 75% 55%)" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">{content["stats.loading"]}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">{content["stats.badge"]}</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-foreground">
              {content["stats.title_prefix"]} <span className="text-gradient-gold">{content["stats.title_highlight"]}</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">{content["stats.description"]}</p>
          </div>

          {!isAuthenticated ? (
            <div className="max-w-md mx-auto">
              <div className="card-elevated p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-2">{content["stats.login.title"]}</h3>
                <p className="text-muted-foreground mb-6">{content["stats.login.description"]}</p>
                <Link to="/auth">
                  <Button variant="gold" size="lg">
                    {content["stats.login.button"]}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* User Group Badge */}
              {userGroup && (
                <div className="flex justify-center mb-8">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getGroupColorClasses(userGroup.color).badge}`}>
                    <span className="font-medium">{content["stats.group_label"]}</span>
                    <span className="font-display">{userGroup.name}</span>
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid sm:grid-cols-3 gap-6 mb-12">
                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-muted-foreground text-sm">{content["stats.card.present"]}</span>
                  </div>
                  <div className="font-display text-4xl text-foreground">{totalPresent}</div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <span className="text-muted-foreground text-sm">{content["stats.card.absent"]}</span>
                  </div>
                  <div className="font-display text-4xl text-foreground">{totalAbsent}</div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-muted-foreground text-sm">{content["stats.card.rate"]}</span>
                  </div>
                  <div className="font-display text-4xl text-gradient-gold">{attendanceRate}%</div>
                </div>
              </div>

              {/* Tabs for different views */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                  <TabsTrigger value="overview">{content["stats.tabs.overview"]}</TabsTrigger>
                  <TabsTrigger value="schedule">{content["stats.tabs.schedule"]}</TabsTrigger>
                  <TabsTrigger value="history">{content["stats.tabs.history"]}</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Weekly Chart */}
                    <div className="card-elevated p-6">
                      <h3 className="font-display text-xl text-foreground mb-6">{content["stats.overview.weekly_title"]}</h3>
                      <div className="h-64">
                        {weeklyData.some((w) => w.present > 0 || w.absent > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                              <XAxis dataKey="name" stroke="hsl(220 15% 60%)" fontSize={12} />
                              <YAxis stroke="hsl(220 15% 60%)" fontSize={12} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(222 40% 12%)",
                                  border: "1px solid hsl(222 30% 20%)",
                                  borderRadius: "8px",
                                }}
                              />
                              <Bar
                                dataKey="present"
                                name={content["stats.common.present"]}
                                fill="hsl(145 65% 45%)"
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="absent"
                                name={content["stats.common.absent"]}
                                fill="hsl(0 75% 55%)"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            {content["stats.common.no_data"]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="card-elevated p-6">
                      <h3 className="font-display text-xl text-foreground mb-6">{content["stats.overview.pie_title"]}</h3>
                      <div className="h-64">
                        {totalPresent + totalAbsent > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(222 40% 12%)",
                                  border: "1px solid hsl(222 30% 20%)",
                                  borderRadius: "8px",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            {content["stats.common.no_data"]}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-success" />
                          <span className="text-sm text-muted-foreground">{content["stats.common.present"]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-destructive" />
                          <span className="text-sm text-muted-foreground">{content["stats.common.absent"]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Schedule Tab - Personal Timetable */}
                <TabsContent value="schedule">
                  <div className="card-elevated p-6">
                    <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      {content["stats.schedule.title"]}
                    </h3>

                    {!userGroup ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{content["stats.schedule.no_group"]}</p>
                        <p className="text-sm mt-1">{content["stats.schedule.no_group_help"]}</p>
                      </div>
                    ) : userSchedules.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{content["stats.schedule.no_schedule"]}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userSchedules.map((schedule) => {
                          const slotAttendance = attendanceHistory.filter(
                            (a) =>
                              a.time === `${schedule.startTime} - ${schedule.endTime}` &&
                              a.groupName === userGroup?.name &&
                              a.dayName.toLowerCase() === schedule.day.toLowerCase()
                          );
                          const presentCount = slotAttendance.filter((a) => a.status === "present").length;
                          const absentCount = slotAttendance.filter((a) => a.status === "absent").length;

                          return (
                            <div
                              key={schedule.id}
                              className={`p-4 rounded-lg border-2 ${getGroupColorClasses(userGroup.color).filledCell}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="text-center min-w-[80px]">
                                    <div className="font-display text-lg text-foreground">{schedule.day}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {schedule.startTime} - {schedule.endTime}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-center">
                                    <div className="text-success font-display text-lg">{presentCount}</div>
                                    <div className="text-xs text-muted-foreground">{content["stats.schedule.present_count"]}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-destructive font-display text-lg">{absentCount}</div>
                                    <div className="text-xs text-muted-foreground">{content["stats.schedule.absent_count"]}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* History Tab - Detailed Attendance */}
                <TabsContent value="history">
                  <div className="card-elevated p-6">
                    <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      {content["stats.history.title"]}
                    </h3>

                    {attendanceHistory.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{content["stats.history.empty"]}</p>
                        <p className="text-sm mt-1">{content["stats.history.empty_help"]}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {attendanceHistory.map((record, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                              record.status === "present" ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  record.status === "present" ? "bg-success/20" : "bg-destructive/20"
                                }`}
                              >
                                {record.status === "present" ? (
                                  <CheckCircle className="w-5 h-5 text-success" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-destructive" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-foreground capitalize">
                                  {record.dayName} - {record.formattedDate}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  {record.time}
                                  {record.groupName && (
                                    <>
                                      <span className="mx-1">|</span>
                                      {record.groupName}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                record.status === "present" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                              }`}
                            >
                              {record.status === "present"
                                ? content["stats.history.status.present"]
                                : content["stats.history.status.absent"]}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* User info */}
              {user && (
                <div className="mt-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    {content["stats.user.connected_as"]} <span className="text-primary font-medium">{user.name}</span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Stats;
