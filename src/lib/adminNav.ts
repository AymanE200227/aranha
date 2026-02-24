import type { LucideIcon } from "lucide-react";
import type { AdminPrivilege } from "@/lib/types";
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
  requiredPrivilege?: AdminPrivilege;
};

export const ADMIN_NAV_LINKS: AdminNavLink[] = [
  { name: "Tableau de Bord", icon: Settings, path: "/admin" },
  { name: "Utilisateurs", icon: Users, path: "/admin/users", requiredPrivilege: "manage_users" },
  { name: "Groupes", icon: Users, path: "/admin/groups", requiredPrivilege: "manage_groups" },
  { name: "Emplois du Temps", icon: Calendar, path: "/admin/schedules", requiredPrivilege: "manage_schedules" },
  { name: "Presences", icon: UserCheck, path: "/admin/attendance", requiredPrivilege: "manage_attendance" },
  { name: "Medias", icon: ImageIcon, path: "/admin/media", requiredPrivilege: "manage_media" },
  { name: "A Propos", icon: FileText, path: "/admin/about", requiredPrivilege: "manage_about" },
];
