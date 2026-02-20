import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  FileText,
  Image as ImageIcon,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";

export type AdminNavLink = {
  name: string;
  path: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_LINKS: AdminNavLink[] = [
  { name: "Tableau de Bord", icon: Settings, path: "/admin" },
  { name: "Utilisateurs", icon: Users, path: "/admin/users" },
  { name: "Groupes", icon: Users, path: "/admin/groups" },
  { name: "Emplois du Temps", icon: Calendar, path: "/admin/schedules" },
  { name: "Presences", icon: UserCheck, path: "/admin/attendance" },
  { name: "Medias", icon: ImageIcon, path: "/admin/media" },
  { name: "A Propos", icon: FileText, path: "/admin/about" },
];
