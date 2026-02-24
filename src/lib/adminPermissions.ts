import type { AdminPrivilege, User } from "@/lib/types";

export const ADMIN_PRIVILEGE_DEFINITIONS: Array<{
  key: AdminPrivilege;
  label: string;
  description: string;
}> = [
  {
    key: "manage_users",
    label: "Utilisateurs",
    description: "Creer, modifier et supprimer les utilisateurs.",
  },
  {
    key: "manage_groups",
    label: "Groupes",
    description: "Gerer les groupes d'entrainement.",
  },
  {
    key: "manage_schedules",
    label: "Emplois du temps",
    description: "Creer et ajuster les seances du planning.",
  },
  {
    key: "manage_attendance",
    label: "Presences",
    description: "Marquer et corriger la presence des membres.",
  },
  {
    key: "manage_media",
    label: "Medias & branding",
    description: "Gerer galerie, logo, hero et contenu media.",
  },
  {
    key: "manage_about",
    label: "A propos",
    description: "Modifier timeline, equipe et galerie de la page A propos.",
  },
];

export const ALL_ADMIN_PRIVILEGES: AdminPrivilege[] = ADMIN_PRIVILEGE_DEFINITIONS.map(
  (privilege) => privilege.key
);

const normalizePrivilegeList = (privileges: AdminPrivilege[] = []): AdminPrivilege[] => {
  const valid = privileges.filter((privilege) => ALL_ADMIN_PRIVILEGES.includes(privilege));
  return Array.from(new Set(valid));
};

export const normalizeAdminPrivileges = (
  role: User["role"],
  privileges: AdminPrivilege[] = []
): AdminPrivilege[] => {
  if (role === "admin") {
    return ALL_ADMIN_PRIVILEGES;
  }

  if (role === "co_admin") {
    return normalizePrivilegeList(privileges);
  }

  return [];
};

export const userCanAccessAdminPanel = (
  user?: Pick<User, "role" | "privileges"> | null
): boolean => {
  if (!user) return false;
  return user.role === "admin" || user.role === "co_admin";
};

export const userHasAdminPrivilege = (
  user: Pick<User, "role" | "privileges"> | null | undefined,
  privilege: AdminPrivilege
): boolean => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "co_admin") return false;
  return normalizeAdminPrivileges(user.role, user.privileges || []).includes(privilege);
};

const ADMIN_ROUTE_PRIVILEGE_MAP: Record<string, AdminPrivilege | null> = {
  "/admin": null,
  "/admin/users": "manage_users",
  "/admin/groups": "manage_groups",
  "/admin/schedules": "manage_schedules",
  "/admin/attendance": "manage_attendance",
  "/admin/media": "manage_media",
  "/admin/about": "manage_about",
};

export const getRequiredPrivilegeForAdminPath = (path: string): AdminPrivilege | null => {
  if (path in ADMIN_ROUTE_PRIVILEGE_MAP) {
    return ADMIN_ROUTE_PRIVILEGE_MAP[path];
  }

  const matchedKey = Object.keys(ADMIN_ROUTE_PRIVILEGE_MAP)
    .filter((knownPath) => knownPath !== "/admin")
    .find((knownPath) => path.startsWith(`${knownPath}/`));

  if (!matchedKey) return null;
  return ADMIN_ROUTE_PRIVILEGE_MAP[matchedKey];
};

export const userCanAccessAdminPath = (
  user: Pick<User, "role" | "privileges"> | null | undefined,
  path: string
): boolean => {
  if (!userCanAccessAdminPanel(user)) return false;
  const requiredPrivilege = getRequiredPrivilegeForAdminPath(path);
  if (!requiredPrivilege) return true;
  return userHasAdminPrivilege(user, requiredPrivilege);
};
