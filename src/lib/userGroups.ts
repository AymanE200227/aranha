import type { User } from "@/lib/types";

type UserGroupShape = Pick<User, "groupId" | "groupIds">;

export const normalizeGroupIds = (groupIds: Array<string | null | undefined>): string[] => {
  const unique = new Set<string>();
  groupIds.forEach((groupId) => {
    const normalized = (groupId || "").trim();
    if (normalized) unique.add(normalized);
  });
  return Array.from(unique);
};

export const getUserGroupIds = (user?: UserGroupShape | null): string[] => {
  if (!user) return [];
  return normalizeGroupIds([...(user.groupIds || []), user.groupId]);
};

export const getPrimaryUserGroupId = (user?: UserGroupShape | null): string | null => {
  return getUserGroupIds(user)[0] || null;
};

export const isUserInGroup = (user: UserGroupShape | null | undefined, groupId: string): boolean => {
  if (!groupId) return false;
  return getUserGroupIds(user).includes(groupId);
};

export const withNormalizedUserGroups = <T extends UserGroupShape>(user: T): T => {
  const groupIds = getUserGroupIds(user);
  return {
    ...user,
    groupId: groupIds[0] || null,
    groupIds,
  };
};
