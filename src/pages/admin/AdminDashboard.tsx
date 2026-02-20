import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  UserCheck,
  Plus,
  ChevronRight,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUsers, getGroups, getSchedules, getAttendance } from "@/lib/storage";
import AdminShell from "@/components/admin/AdminShell";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, isAdmin, isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeGroups: 0,
    sessionsThisMonth: 0,
    attendanceRate: 0,
  });
  const [recentUsers, setRecentUsers] = useState<{ name: string; group: string; joined: string }[]>([]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  const loadStats = useCallback(() => {
    const users = getUsers();
    const groups = getGroups();
    const schedules = getSchedules();
    const attendance = getAttendance();

    // Calculate attendance rate
    const presentCount = attendance.filter((a) => a.status === "present").length;
    const totalCount = attendance.length;
    const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    setStats({
      totalUsers: users.filter((u) => u.role === "client").length,
      activeGroups: groups.length,
      sessionsThisMonth: schedules.length * 4, // Approximate monthly sessions
      attendanceRate: rate,
    });

    // Get recent users
    const clientUsers = users
      .filter((u) => u.role === "client")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map((u) => ({
        name: u.name,
        group: groups.find((g) => g.id === u.groupId)?.name || "Sans groupe",
        joined: getRelativeTime(u.createdAt),
      }));
    setRecentUsers(clientUsers);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} jours`;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isLoading) return null;

  return (
    <AdminShell onLogout={handleLogout}>
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              TABLEAU DE <span className="text-gradient-gold">BORD</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenue dans votre espace administration
            </p>
          </div>
          <Link to="/admin/users">
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Utilisateur
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="text-muted-foreground text-sm mb-1">Total Utilisateurs</div>
            <div className="font-display text-3xl text-foreground">{stats.totalUsers}</div>
            <div className="text-xs text-primary mt-2">Clients actifs</div>
          </div>
          <div className="stat-card">
            <div className="text-muted-foreground text-sm mb-1">Groupes Actifs</div>
            <div className="font-display text-3xl text-foreground">{stats.activeGroups}</div>
            <div className="text-xs text-primary mt-2">Groupes configures</div>
          </div>
          <div className="stat-card">
            <div className="text-muted-foreground text-sm mb-1">Seances ce Mois</div>
            <div className="font-display text-3xl text-foreground">{stats.sessionsThisMonth}</div>
            <div className="text-xs text-primary mt-2">Creneaux planifies</div>
          </div>
          <div className="stat-card">
            <div className="text-muted-foreground text-sm mb-1">Taux de Presence</div>
            <div className="font-display text-3xl text-foreground">{stats.attendanceRate}%</div>
            <div className="text-xs text-primary mt-2">Ce mois</div>
          </div>
        </div>

        {/* Quick Actions & Recent Users */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="card-elevated p-6">
            <h3 className="font-display text-xl text-foreground mb-4">
              Actions Rapides
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Creer Utilisateur", icon: Users, path: "/admin/users" },
                { name: "Creer Groupe", icon: Plus, path: "/admin/groups" },
                { name: "Gerer Emplois", icon: Calendar, path: "/admin/schedules" },
                { name: "Marquer Presences", icon: UserCheck, path: "/admin/attendance" },
                { name: "Gerer Medias", icon: ImageIcon, path: "/admin/media" },
                { name: "Gerer A Propos", icon: FileText, path: "/admin/about" },
              ].map((action, index) => (
                <Link
                  key={index}
                  to={action.path}
                  className="flex items-center gap-3 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {action.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-foreground">
                Nouveaux Membres
              </h3>
              <Link
                to="/admin/users"
                className="text-primary text-sm hover:underline flex items-center gap-1"
              >
                Voir tous <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Aucun membre pour le moment
                </p>
              ) : (
                recentUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="font-display text-primary">
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.group}</div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{user.joined}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminDashboard;

