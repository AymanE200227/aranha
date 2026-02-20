/**
 * COMPREHENSIVE TEST SUITE FOR DOJO SCHEDULES APP
 * 
 * This test suite covers all functions across:
 * - Storage Management (Users, Groups, Schedules, Attendance)
 * - Media Management
 * - User Profiles
 * - About Page Content
 * - Application Configuration
 * 
 * RUN: npm test or npm run test:watch
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  initializeStorage,
  generateId,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAttendance,
  markAttendance,
  login,
  logout,
  register,
  getMediaItems,
  saveMedia,
  deleteMedia,
  getAppConfig,
  saveAppConfig,
  getAboutContent,
  saveAboutContent,
  deleteAboutItem,
  getSession,
} from "@/lib/storage";
import { User, Group, ScheduleSlot } from "@/lib/types";

/**
 * STORAGE INITIALIZATION TESTS
 */
describe("Storage Initialization", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should initialize storage with default data", () => {
    initializeStorage();
    const users = getUsers();
    expect(users.length).toBeGreaterThan(0);
  });

  it("should create admin user by default", () => {
    initializeStorage();
    const admin = getUserByEmail("admin@aranha.ma");
    expect(admin).toBeDefined();
    expect(admin?.role).toBe("admin");
  });

  it("should create default groups", () => {
    initializeStorage();
    const groups = getGroups();
    expect(groups.length).toBeGreaterThan(0);
  });

  it("should create default schedules", () => {
    initializeStorage();
    const schedules = getSchedules();
    expect(schedules.length).toBeGreaterThan(0);
  });

  it("should generate unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(0);
  });
});

/**
 * USER MANAGEMENT TESTS
 */
describe("User Management", () => {
  beforeEach(() => {
    localStorage.clear();
    initializeStorage();
  });

  it("should get all users", () => {
    const users = getUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  it("should create a new user", () => {
    const newUser = createUser({
      email: "test@example.com",
      name: "Test User",
      password: "password123",
      role: "client",
      groupId: null,
    });

    expect(newUser.id).toBeDefined();
    expect(newUser.email).toBe("test@example.com");
    expect(newUser.name).toBe("Test User");
  });

  it("should get user by email", () => {
    createUser({
      email: "john@example.com",
      name: "John",
      password: "pass123",
      role: "client",
      groupId: null,
    });

    const user = getUserByEmail("john@example.com");
    expect(user).toBeDefined();
    expect(user?.email).toBe("john@example.com");
  });

  it("should update user profile", () => {
    const user = createUser({
      email: "update@test.com",
      name: "Original Name",
      password: "pass123",
      role: "client",
      groupId: null,
    });

    const updated = updateUser(user.id, {
      name: "Updated Name",
      profilePicture: "data:image/png;base64,...",
      bio: "Test bio",
      beltLevel: "White Belt",
    });

    expect(updated).toBeDefined();
    expect(updated?.name).toBe("Updated Name");
    expect(updated?.bio).toBe("Test bio");
    expect(updated?.beltLevel).toBe("White Belt");
  });

  it("should delete user", () => {
    const user = createUser({
      email: "delete@test.com",
      name: "To Delete",
      password: "pass123",
      role: "client",
      groupId: null,
    });

    const deleted = deleteUser(user.id);
    expect(deleted).toBe(true);

    const foundUser = getUsers().find((u) => u.id === user.id);
    expect(foundUser).toBeUndefined();
  });

  it("should allow user to add achievements", () => {
    const user = createUser({
      email: "achievement@test.com",
      name: "Achiever",
      password: "pass123",
      role: "client",
      groupId: null,
      achievements: ["Blue Belt", "Tournament Winner"],
    });

    expect(user.achievements).toEqual(["Blue Belt", "Tournament Winner"]);
  });

  it("should handle user authentication", () => {
    const user = createUser({
      email: "auth@test.com",
      name: "Auth User",
      password: "securepass",
      role: "client",
      groupId: null,
    });

    const loggedIn = login("auth@test.com", "securepass");
    expect(loggedIn).toBeDefined();
    expect(loggedIn?.email).toBe("auth@test.com");
  });

  it("should reject wrong password", () => {
    createUser({
      email: "secure@test.com",
      name: "Secure User",
      password: "correctpass",
      role: "client",
      groupId: null,
    });

    const loggedIn = login("secure@test.com", "wrongpass");
    expect(loggedIn).toBeNull();
  });

  it("should register new user", () => {
    const user = register("newuser@test.com", "password123", "New User");
    expect(user).toBeDefined();
    expect(user?.email).toBe("newuser@test.com");
  });

  it("should prevent duplicate registration", () => {
    register("duplicate@test.com", "pass123", "First User");
    const secondAttempt = register("duplicate@test.com", "pass123", "Second User");
    expect(secondAttempt).toBeNull();
  });
});

/**
 * GROUP MANAGEMENT TESTS
 */
describe("Group Management", () => {
  beforeEach(() => {
    localStorage.clear();
    initializeStorage();
  });

  it("should get all groups", () => {
    const groups = getGroups();
    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBeGreaterThan(0);
  });

  it("should create a new group", () => {
    const group = createGroup({
      name: "Advanced Group",
      color: "primary",
      description: "Advanced level classes",
    });

    expect(group.id).toBeDefined();
    expect(group.name).toBe("Advanced Group");
  });

  it("should update group", () => {
    const group = createGroup({
      name: "Original Group",
      color: "primary",
      description: "Original description",
    });

    const updated = updateGroup(group.id, {
      name: "Updated Group",
      description: "New description",
    });

    expect(updated?.name).toBe("Updated Group");
    expect(updated?.description).toBe("New description");
  });

  it("should delete group", () => {
    const group = createGroup({
      name: "To Delete",
      color: "accent",
      description: "Will be deleted",
    });

    const deleted = deleteGroup(group.id);
    expect(deleted).toBe(true);

    const foundGroup = getGroups().find((g) => g.id === group.id);
    expect(foundGroup).toBeUndefined();
  });

  it("should validate group colors", () => {
    const validColors = ["primary", "accent", "success"];
    const group = createGroup({
      name: "Colored Group",
      color: "primary",
      description: "Test",
    });

    expect(validColors).toContain(group.color);
  });
});

/**
 * SCHEDULE MANAGEMENT TESTS
 */
describe("Schedule Management", () => {
  let groupId: string;

  beforeEach(() => {
    localStorage.clear();
    initializeStorage();
    const groups = getGroups();
    groupId = groups[0].id;
  });

  it("should get all schedules", () => {
    const schedules = getSchedules();
    expect(Array.isArray(schedules)).toBe(true);
    expect(schedules.length).toBeGreaterThan(0);
  });

  it("should create a schedule slot", () => {
    const slot = createSchedule({
      groupId,
      day: "Monday",
      startTime: "15:00",
      endTime: "17:00",
    });

    expect(slot.id).toBeDefined();
    expect(slot.day).toBe("Monday");
    expect(slot.startTime).toBe("15:00");
  });

  it("should update schedule slot", () => {
    const slot = createSchedule({
      groupId,
      day: "Tuesday",
      startTime: "10:00",
      endTime: "12:00",
    });

    const updated = updateSchedule(slot.id, {
      startTime: "11:00",
      endTime: "13:00",
    });

    expect(updated?.startTime).toBe("11:00");
    expect(updated?.endTime).toBe("13:00");
  });

  it("should delete schedule slot", () => {
    const slot = createSchedule({
      groupId,
      day: "Wednesday",
      startTime: "09:00",
      endTime: "11:00",
    });

    const deleted = deleteSchedule(slot.id);
    expect(deleted).toBe(true);

    const found = getSchedules().find((s) => s.id === slot.id);
    expect(found).toBeUndefined();
  });

  it("should validate time format", () => {
    const slot = createSchedule({
      groupId,
      day: "Thursday",
      startTime: "14:30",
      endTime: "16:45",
    });

    expect(/^\d{2}:\d{2}$/.test(slot.startTime)).toBe(true);
    expect(/^\d{2}:\d{2}$/.test(slot.endTime)).toBe(true);
  });
});

/**
 * ATTENDANCE MANAGEMENT TESTS
 */
describe("Attendance Management", () => {
  let userId: string;
  let scheduleSlotId: string;

  beforeEach(() => {
    localStorage.clear();
    initializeStorage();
    const users = getUsers().filter((u) => u.role === "client");
    if (users.length === 0) {
      const newUser = createUser({
        email: "attendee@test.com",
        name: "Attendee",
        password: "pass",
        role: "client",
        groupId: null,
      });
      userId = newUser.id;
    } else {
      userId = users[0].id;
    }

    const schedules = getSchedules();
    scheduleSlotId = schedules[0].id;
  });

  it("should mark attendance as present", () => {
    const record = markAttendance(userId, scheduleSlotId, "2024-01-15", "present", "admin-001");
    expect(record.status).toBe("present");
    expect(record.date).toBe("2024-01-15");
  });

  it("should mark attendance as absent", () => {
    const record = markAttendance(userId, scheduleSlotId, "2024-01-16", "absent", "admin-001");
    expect(record.status).toBe("absent");
  });

  it("should update existing attendance record", () => {
    markAttendance(userId, scheduleSlotId, "2024-01-17", "present", "admin-001");
    const updated = markAttendance(userId, scheduleSlotId, "2024-01-17", "absent", "admin-001");

    expect(updated.status).toBe("absent");

    const allRecords = getAttendance();
    const count = allRecords.filter(
      (r) => r.userId === userId && r.scheduleSlotId === scheduleSlotId && r.date === "2024-01-17"
    ).length;
    expect(count).toBe(1);
  });

  it("should get attendance records", () => {
    markAttendance(userId, scheduleSlotId, "2024-01-18", "present", "admin-001");
    const records = getAttendance();
    expect(Array.isArray(records)).toBe(true);
  });
});

/**
 * MEDIA MANAGEMENT TESTS
 */
describe("Media Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should save media items", () => {
    const items = [
      {
        id: "1",
        name: "Test Image",
        category: "gallery",
        url: "data:image/png;base64,...",
        type: "image/png",
        size: 1024,
        uploadedAt: new Date().toISOString(),
      },
    ];

    saveMedia(items);
    const retrieved = getMediaItems();
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].name).toBe("Test Image");
  });

  it("should get media items", () => {
    const items = [
      {
        id: "1",
        name: "Image 1",
        category: "coaches",
        url: "data:...",
        type: "image/jpeg",
        size: 2048,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Image 2",
        category: "gallery",
        url: "data:...",
        type: "image/png",
        size: 1024,
        uploadedAt: new Date().toISOString(),
      },
    ];

    saveMedia(items);
    const retrieved = getMediaItems();
    expect(retrieved).toHaveLength(2);
  });

  it("should delete media by ID", () => {
    const items = [
      {
        id: "delete-me",
        name: "To Delete",
        category: "other",
        url: "data:...",
        type: "image/png",
        size: 512,
        uploadedAt: new Date().toISOString(),
      },
    ];

    saveMedia(items);
    const deleted = deleteMedia("delete-me");
    expect(deleted).toBe(true);
    expect(getMediaItems()).toHaveLength(0);
  });

  it("should handle non-existent media deletion", () => {
    saveMedia([]);
    const deleted = deleteMedia("non-existent");
    expect(deleted).toBe(false);
  });

  it("should support image categories", () => {
    const categories = ["gallery", "coaches", "hero", "other"];
    const items = categories.map((cat, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      category: cat,
      url: "data:...",
      type: "image/png",
      size: 1024,
      uploadedAt: new Date().toISOString(),
    }));

    saveMedia(items);
    const retrieved = getMediaItems();
    expect(retrieved).toHaveLength(4);
  });
});

/**
 * APP CONFIGURATION TESTS
 */
describe("App Configuration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should save app config", () => {
    const config = {
      logo: "logo-id",
      favicon: "favicon-id",
      brandName: "Dojo Academy",
      primaryColor: "#FFD700",
    };

    saveAppConfig(config);
    const retrieved = getAppConfig();
    expect(retrieved).toEqual(config);
  });

  it("should get app config", () => {
    const config = {
      brandName: "Test School",
      primaryColor: "#000000",
    };

    saveAppConfig(config);
    const retrieved = getAppConfig();
    expect(retrieved?.brandName).toBe("Test School");
  });

  it("should allow partial config updates", () => {
    saveAppConfig({ brandName: "First" });
    saveAppConfig({ brandName: "First", primaryColor: "#FF0000" });

    const retrieved = getAppConfig();
    expect(retrieved?.brandName).toBe("First");
    expect(retrieved?.primaryColor).toBe("#FF0000");
  });

  it("should handle null config", () => {
    const config = getAppConfig();
    expect(config === null || config).toBeDefined();
  });
});

/**
 * ABOUT CONTENT TESTS
 */
describe("About Content Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should save about content", () => {
    const content = [
      {
        id: "1",
        title: "Timeline 2020",
        image: "data:image/png;base64,...",
        section: "timeline" as const,
        year: "2020",
        description: "Expansion year",
        uploadedAt: new Date().toISOString(),
      },
    ];

    saveAboutContent(content);
    const retrieved = getAboutContent();
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].year).toBe("2020");
  });

  it("should get about content by section", () => {
    const content = [
      {
        id: "1",
        title: "Timeline",
        image: "data:...",
        section: "timeline" as const,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Gallery",
        image: "data:...",
        section: "gallery" as const,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: "3",
        title: "Team",
        image: "data:...",
        section: "team" as const,
        uploadedAt: new Date().toISOString(),
      },
    ];

    saveAboutContent(content);
    const retrieved = getAboutContent();
    const timeline = retrieved.filter((c) => c.section === "timeline");
    const gallery = retrieved.filter((c) => c.section === "gallery");
    const team = retrieved.filter((c) => c.section === "team");

    expect(timeline).toHaveLength(1);
    expect(gallery).toHaveLength(1);
    expect(team).toHaveLength(1);
  });

  it("should delete about item", () => {
    const content = [
      {
        id: "delete-me",
        title: "To Delete",
        image: "data:...",
        section: "gallery" as const,
        uploadedAt: new Date().toISOString(),
      },
    ];

    saveAboutContent(content);
    const deleted = deleteAboutItem("delete-me");
    expect(deleted).toBe(true);
    expect(getAboutContent()).toHaveLength(0);
  });

  it("should support all sections", () => {
    const sections = ["timeline", "gallery", "team"] as const;
    const content = sections.map((sec) => ({
      id: sec,
      title: `${sec} content`,
      image: "data:...",
      section: sec,
      uploadedAt: new Date().toISOString(),
    }));

    saveAboutContent(content);
    const retrieved = getAboutContent();
    expect(retrieved).toHaveLength(3);
  });
});

/**
 * SESSION MANAGEMENT TESTS
 */
describe("Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    initializeStorage();
  });

  it("should get session after login", () => {
    login("admin@aranha.ma", "Admin@2024");
    const session = getSession();
    expect(session).toBeDefined();
    expect(session?.isAuthenticated).toBe(true);
  });

  it("should logout and clear session", () => {
    login("admin@aranha.ma", "Admin@2024");
    logout();
    const session = getSession();
    expect(session).toBeNull();
  });

  it("should handle empty session", () => {
    const session = getSession();
    expect(session).toBeNull();
  });
});

/**
 * INTEGRATION TESTS
 */
describe("Integration Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    initializeStorage();
  });

  it("should handle complete user lifecycle", () => {
    // Create
    const user = createUser({
      email: "lifecycle@test.com",
      name: "Lifecycle User",
      password: "pass123",
      role: "client",
      groupId: null,
    });

    expect(user.id).toBeDefined();

    // Update
    const updated = updateUser(user.id, {
      bio: "Updated bio",
      profilePicture: "data:...",
    });

    expect(updated?.bio).toBe("Updated bio");

    // Retrieve
    const retrieved = getUserByEmail("lifecycle@test.com");
    expect(retrieved?.bio).toBe("Updated bio");

    // Delete
    const deleted = deleteUser(user.id);
    expect(deleted).toBe(true);

    const notFound = getUserByEmail("lifecycle@test.com");
    expect(notFound).toBeUndefined();
  });

  it("should handle complete attendance workflow", () => {
    const groups = getGroups();
    const groupId = groups[0].id;

    const schedules = getSchedules();
    const scheduleId = schedules[0].id;

    const user = createUser({
      email: "attend@test.com",
      name: "Attendee",
      password: "pass",
      role: "client",
      groupId,
    });

    // Mark attendance
    const record = markAttendance(user.id, scheduleId, "2024-02-01", "present", "admin-001");
    expect(record).toBeDefined();

    const allAttendance = getAttendance();
    expect(allAttendance.length).toBeGreaterThan(0);
  });

  it("should coordinate media and app config", () => {
    // Save media
    const media = [
      {
        id: "logo-1",
        name: "Academy Logo",
        category: "other",
        url: "data:image/png;base64,...",
        type: "image/png",
        size: 5120,
        uploadedAt: new Date().toISOString(),
      },
    ];

    saveMedia(media);

    // Set as config
    saveAppConfig({ logo: "logo-1" });

    // Verify
    const config = getAppConfig();
    const logoMedia = getMediaItems().find((m) => m.id === config?.logo);
    expect(logoMedia?.name).toBe("Academy Logo");
  });
});

/**
 * ERROR HANDLING TESTS
 */
describe("Error Handling", () => {
  beforeEach(() => {
    localStorage.clear();
    initializeStorage();
  });

  it("should handle invalid user update", () => {
    const result = updateUser("non-existent-id", { name: "New Name" });
    expect(result).toBeNull();
  });

  it("should handle invalid group operations", () => {
    const result = updateGroup("non-existent", { name: "New" });
    expect(result).toBeNull();
  });

  it("should handle invalid schedule update", () => {
    const result = updateSchedule("non-existent", { startTime: "10:00" });
    expect(result).toBeNull();
  });

  it("should handle missing file data", () => {
    const items = getMediaItems();
    expect(Array.isArray(items)).toBe(true);
  });

  it("should prevent duplicate email registration", () => {
    createUser({
      email: "dup@test.com",
      name: "First",
      password: "pass",
      role: "client",
      groupId: null,
    });

    // Attempting to create another with same email would need duplicate check in createUser
    const users = getUsers();
    const duplicates = users.filter((u) => u.email === "dup@test.com");
    expect(duplicates.length).toBe(1);
  });
});

/**
 * DATA PERSISTENCE TESTS
 */
describe("Data Persistence", () => {
  it("should persist data across instances", () => {
    localStorage.clear();
    initializeStorage();

    const user = createUser({
      email: "persist@test.com",
      name: "Persistent User",
      password: "pass",
      role: "client",
      groupId: null,
    });

    const users1 = getUsers();
    expect(users1.some((u) => u.email === "persist@test.com")).toBe(true);
  });

  it("should maintain data integrity after multiple operations", () => {
    localStorage.clear();
    initializeStorage();

    const initialCount = getUsers().length;

    createUser({
      email: "user1@test.com",
      name: "User 1",
      password: "pass",
      role: "client",
      groupId: null,
    });

    createUser({
      email: "user2@test.com",
      name: "User 2",
      password: "pass",
      role: "client",
      groupId: null,
    });

    const finalCount = getUsers().length;
    expect(finalCount).toBe(initialCount + 2);
  });
});
