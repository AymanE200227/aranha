// User types
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  password: string;
  role: "admin" | "client";
  groupId: string | null;
  createdAt: string;
  profilePicture?: string;
  bio?: string;
  beltLevel?: string;
  joinDate?: string;
  birthDate?: string;
  registrationDate?: string;
  licenseNumber?: string;
  beltCategory?: "kids_4_15" | "adult_16_plus" | "black_belt";
  beltName?: string;
  beltDegree?: number;
  beltPromotionDate?: string;
  achievements?: string[];
  editingEnabled?: boolean;
}

// User Profile types
export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  beltLevel?: string;
  joinDate?: string;
  achievements?: string[];
  groupId?: string;
  groupName?: string;
}

// Group types
export type GroupColor =
  | "primary"
  | "accent"
  | "success"
  | "sky"
  | "rose"
  | "amber"
  | "violet"
  | "emerald";

export interface Group {
  id: string;
  name: string;
  color: GroupColor;
  description: string;
  createdAt: string;
}

// Schedule types
export interface ScheduleSlot {
  id: string;
  groupId: string;
  day: string;
  startTime: string;
  endTime: string;
}

// Attendance types
export interface AttendanceRecord {
  id: string;
  userId: string;
  scheduleSlotId: string;
  date: string;
  status: "present" | "absent";
  markedBy: string;
  markedAt: string;
}

// Session type for auth
export interface Session {
  user: User;
  isAuthenticated: boolean;
}
// Gallery types
export interface Album {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFile {
  id: string;
  albumId: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  title: string;
  description: string;
  size: number;
  duration?: number; // for videos in seconds
  createdAt: string;
  updatedAt: string;
}
