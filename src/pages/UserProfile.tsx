import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Calendar, Clock3, Edit, FileText, IdCard, RotateCw, Save, Shield, User as UserIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppContent } from "@/hooks/useAppContent";
import { cn } from "@/lib/utils";
import { getGroupColorClasses } from "@/lib/groupColors";
import { getUserGroupIds } from "@/lib/userGroups";
import { getGroups, getSchedules, getUserById, updateUser } from "@/lib/storage";
import { Group, ScheduleSlot } from "@/lib/types";
import { SCHEDULE_DAYS, SCHEDULE_DAY_END_LABEL, parseTimeToMinutes } from "@/lib/schedule";
import {
  BELT_CATEGORY_LABELS,
  BELT_OPTIONS,
  BeltCategory,
  BeltOption,
  formatBeltRank,
  getBeltDegreeValues,
  getBeltOption,
  getPromotionResult,
  normalizeBeltDegree,
} from "@/lib/belts";

const formatDateFr = (date?: string): string => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
};

const hasValidDate = (date?: string): boolean => {
  if (!date) return false;
  return !Number.isNaN(new Date(date).getTime());
};

const displayOrDash = (value?: string): string => {
  const normalized = value?.trim();
  return normalized ? normalized : "-";
};

const getAgeValue = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) years -= 1;
  return Math.max(0, years);
};

const getAgeLabel = (birthDate?: string): string => {
  const age = getAgeValue(birthDate);
  if (age === null) return "-";
  return `${age} ans`;
};

const getTrainingDuration = (registrationDate?: string): string => {
  if (!registrationDate) return "-";
  const start = new Date(registrationDate);
  if (Number.isNaN(start.getTime())) return "-";
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${Math.max(0, years)} an(s) et ${Math.max(0, months)} mois`;
};

const getAgeWarning = (category: BeltCategory, birthDate?: string): string | null => {
  const age = getAgeValue(birthDate);
  if (age === null) return null;
  if (category === "kids_4_15" && age > 15) {
    return "Cette categorie est prevue pour les 4-15 ans.";
  }
  if (category === "adult_16_plus" && age < 16) {
    return "La categorie adulte demande au moins 16 ans.";
  }
  if (category === "black_belt" && age < 19) {
    return "La categorie ceinture noire demande en pratique un age adulte confirme.";
  }
  return null;
};

const DegreeStripes = ({
  category,
  beltName,
  beltDegree,
  compact = false,
}: {
  category: BeltCategory;
  beltName: string;
  beltDegree: number;
  compact?: boolean;
}) => {
  if (beltDegree <= 0) return null;
  if (category === "black_belt" && (beltName === "red_black" || beltName === "red_white" || beltName === "red")) return null;

  const stripeCount = Math.max(0, Math.min(beltName === "black" ? 6 : 4, beltDegree));
  if (stripeCount === 0) return null;

  const stripeColor = "#ffffff";

  return (
    <div
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 flex items-center justify-center ${
        compact ? "right-[8%] h-3 w-8" : "right-[8%] h-5 w-12"
      }`}
    >
      <div className="flex items-center gap-[2px]">
        {Array.from({ length: stripeCount }, (_, index) => (
          <span
            key={`${beltName}-stripe-${index}`}
            className={`${compact ? "h-2.5 w-[2px]" : "h-4 w-[3px]"} rounded-sm shadow-[0_0_2px_rgba(0,0,0,0.6)]`}
            style={{ backgroundColor: stripeColor }}
          />
        ))}
      </div>
    </div>
  );
};

const BeltVisual = ({
  belt,
  category,
  beltDegree,
  className,
  size = "md",
}: {
  belt: BeltOption;
  category: BeltCategory;
  beltDegree: number;
  className?: string;
  size?: "sm" | "md";
}) => (
  <div
    className={`relative w-full overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-navy-light/70 to-navy-lighter/55 ${
      size === "sm"
        ? "p-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
        : "p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
    } ${className ?? ""}`}
  >
    <div className="relative mx-auto w-fit">
      <img
        src={belt.image}
        alt={`Ceinture ${belt.label}`}
        className={`w-auto rounded-md object-contain ${size === "sm" ? "h-8 md:h-10" : "h-14 md:h-16"}`}
      />
      <DegreeStripes category={category} beltName={belt.value} beltDegree={beltDegree} compact={size === "sm"} />
    </div>
  </div>
);

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div
    className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/35 p-3 transition-colors hover:bg-secondary/50"
  >
    <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  </div>
);

const PROFILE_PLANNING_ANCHORS = ["12:00", "13:00", "14:00", "16:00", "18:00", "19:00", "21:00", SCHEDULE_DAY_END_LABEL];

const formatPlanningHour = (time: string): string => {
  const [hourText = "0", minuteText = "00"] = time.split(":");
  const hour = Number(hourText);
  if (Number.isNaN(hour)) return time;
  if (minuteText === "00") return `${hour}H`;
  return `${hour}H${minuteText}`;
};

const formatPlanningRange = (start: string, end: string): string => {
  return `${formatPlanningHour(start)}-${formatPlanningHour(end)}`;
};

export default function UserProfile() {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isPlanningMobileRotated, setIsPlanningMobileRotated] = useState(false);
  const content = useAppContent();
  const [profileData, setProfileData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    profilePicture: "",
    bio: "",
    birthDate: "",
    registrationDate: "",
    licenseNumber: "",
    beltCategory: "adult_16_plus" as BeltCategory,
    beltName: "white",
    beltDegree: 0,
    beltPromotionDate: "",
    editingEnabled: true,
  });
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const canEdit = !!currentUser;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const loadPlanningData = () => {
      setSchedules(getSchedules());
      setGroups(getGroups());
    };

    loadPlanningData();

    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || event.key === "jj_schedules" || event.key === "jj_groups") {
        loadPlanningData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const userData = getUserById(currentUser.id) ?? currentUser;
    const [lastName = "", firstName = ""] = (userData.name || "").split(" ");
    const category = userData.beltCategory || "adult_16_plus";
    const beltName = userData.beltName || BELT_OPTIONS[category][0].value;
    const beltDegree = normalizeBeltDegree(category, beltName, userData.beltDegree ?? 0);

    setProfileData({
      name: userData.name || "",
      firstName: userData.firstName || firstName,
      lastName: userData.lastName || lastName || "wsw",
      email: userData.email || "",
      profilePicture: userData.profilePicture || "",
      bio: userData.bio || "",
      birthDate: userData.birthDate || "",
      registrationDate: userData.registrationDate || userData.joinDate || "",
      licenseNumber: userData.licenseNumber || "",
      beltCategory: category,
      beltName,
      beltDegree,
      beltPromotionDate: userData.beltPromotionDate || userData.joinDate || "",
      editingEnabled: userData.editingEnabled !== false,
    });
  }, [currentUser]);

  const beltOptions = useMemo(() => BELT_OPTIONS[profileData.beltCategory], [profileData.beltCategory]);

  const selectedBelt = useMemo(
    () => getBeltOption(profileData.beltCategory, profileData.beltName),
    [profileData.beltCategory, profileData.beltName]
  );

  const beltDegree = useMemo(
    () => normalizeBeltDegree(profileData.beltCategory, selectedBelt.value, profileData.beltDegree),
    [profileData.beltCategory, profileData.beltDegree, selectedBelt.value]
  );

  const degreeValues = useMemo(() => getBeltDegreeValues(selectedBelt), [selectedBelt]);

  useEffect(() => {
    if (profileData.beltDegree === beltDegree) return;
    setProfileData((previous) => ({ ...previous, beltDegree }));
  }, [beltDegree, profileData.beltDegree]);

  const promotion = useMemo(
    () => getPromotionResult(profileData.beltCategory, selectedBelt.value, beltDegree),
    [beltDegree, profileData.beltCategory, selectedBelt.value]
  );

  const promotionStatus = useMemo(() => {
    if (!promotion) {
      return {
        eligibleDate: "-",
        remaining: "Niveau maximal",
        progress: 100,
      };
    }

    if (!profileData.beltPromotionDate) {
      return {
        eligibleDate: "-",
        remaining: "Ajouter la date de derniere promotion",
        progress: 0,
      };
    }

    const start = new Date(profileData.beltPromotionDate);
    if (Number.isNaN(start.getTime())) {
      return {
        eligibleDate: "-",
        remaining: "Date de promotion invalide",
        progress: 0,
      };
    }

    const eligible = new Date(start);
    eligible.setMonth(eligible.getMonth() + Math.round(promotion.waitYears * 12));

    const now = new Date();
    const total = eligible.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progress = Math.max(0, Math.min(100, total > 0 ? (elapsed / total) * 100 : 0));

    if (now >= eligible) {
      return {
        eligibleDate: formatDateFr(eligible.toISOString()),
        remaining: "Eligible maintenant",
        progress: 100,
      };
    }

    const monthsLeft = Math.max(0, Math.ceil((eligible.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return {
      eligibleDate: formatDateFr(eligible.toISOString()),
      remaining: `${monthsLeft} mois restants`,
      progress,
    };
  }, [profileData.beltPromotionDate, promotion]);

  const ageWarning = useMemo(
    () => getAgeWarning(profileData.beltCategory, profileData.birthDate),
    [profileData.beltCategory, profileData.birthDate]
  );

  const trainingDuration = useMemo(
    () => getTrainingDuration(profileData.registrationDate),
    [profileData.registrationDate]
  );
  const userGroupIds = useMemo(() => getUserGroupIds(currentUser), [currentUser]);
  const groupsById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);
  const userTrainingGroups = useMemo(
    () => groups.filter((group) => userGroupIds.includes(group.id)),
    [groups, userGroupIds]
  );
  const planningSlotsByDay = useMemo(() => {
    const map = new Map<string, ScheduleSlot[]>();
    SCHEDULE_DAYS.forEach((day) => {
      map.set(day, []);
    });

    schedules.forEach((slot) => {
      map.get(slot.day)?.push(slot);
    });

    map.forEach((daySlots, day) => {
      map.set(
        day,
        [...daySlots].sort(
          (left, right) => parseTimeToMinutes(left.startTime) - parseTimeToMinutes(right.startTime)
        )
      );
    });

    return map;
  }, [schedules]);

  const planningBoundaries = useMemo(() => {
    const minMinutes = 6 * 60;
    const maxMinutes = parseTimeToMinutes(SCHEDULE_DAY_END_LABEL);
    const values = new Set<number>();

    PROFILE_PLANNING_ANCHORS.forEach((time) => {
      const minutes = parseTimeToMinutes(time);
      if (minutes >= minMinutes && minutes <= maxMinutes) values.add(minutes);
    });

    schedules.forEach((slot) => {
      const start = parseTimeToMinutes(slot.startTime);
      const end = parseTimeToMinutes(slot.endTime);
      if (start >= minMinutes && start <= maxMinutes) values.add(start);
      if (end >= minMinutes && end <= maxMinutes) values.add(end);
    });

    const sorted = Array.from(values).sort((left, right) => left - right);
    if (sorted.length < 2) {
      return ["21:00", SCHEDULE_DAY_END_LABEL];
    }

    return sorted.map((minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
  }, [schedules]);

  const planningRows = useMemo(() => {
    return planningBoundaries.slice(0, -1).map((start, index) => ({
      start,
      end: planningBoundaries[index + 1],
    }));
  }, [planningBoundaries]);

  const planningBoundaryIndex = useMemo(() => {
    return new Map(planningBoundaries.map((time, index) => [time, index]));
  }, [planningBoundaries]);

  const planningSlotStartMap = useMemo(() => {
    const map = new Map<string, ScheduleSlot>();
    schedules.forEach((slot) => {
      map.set(`${slot.day}|${slot.startTime}`, slot);
    });
    return map;
  }, [schedules]);

  const planningActiveSlotMap = useMemo(() => {
    const map = new Map<string, ScheduleSlot>();
    SCHEDULE_DAYS.forEach((day) => {
      const daySlots = planningSlotsByDay.get(day) || [];
      planningRows.forEach((row) => {
        const rowStartMinutes = parseTimeToMinutes(row.start);
        const activeSlot = daySlots.find((slot) => {
          const startMinutes = parseTimeToMinutes(slot.startTime);
          const endMinutes = parseTimeToMinutes(slot.endTime);
          return rowStartMinutes >= startMinutes && rowStartMinutes < endMinutes;
        });
        if (activeSlot) {
          map.set(`${day}|${row.start}`, activeSlot);
        }
      });
    });
    return map;
  }, [planningRows, planningSlotsByDay]);

  const latestScheduleEndTime = useMemo(() => {
    if (schedules.length === 0) return "--:--";
    return schedules.reduce((latest, slot) => {
      return parseTimeToMinutes(slot.endTime) > parseTimeToMinutes(latest) ? slot.endTime : latest;
    }, "00:00");
  }, [schedules]);

  const getPlanningSlotSpan = (slot: ScheduleSlot): number => {
    const startIndex = planningBoundaryIndex.get(slot.startTime);
    const endIndex = planningBoundaryIndex.get(slot.endTime);
    if (typeof startIndex === "number" && typeof endIndex === "number" && endIndex > startIndex) {
      return endIndex - startIndex;
    }
    return 1;
  };

  const hasRegistrationDate = hasValidDate(profileData.registrationDate);
  const hasPromotionDate = hasValidDate(profileData.beltPromotionDate);

  const progressLabel = useMemo(() => {
    if (!hasRegistrationDate) return "-";
    if (!promotion) return "Niveau maximal";
    if (!hasPromotionDate) return "-";
    return `${Math.round(promotionStatus.progress)}%`;
  }, [hasPromotionDate, hasRegistrationDate, promotion, promotionStatus.progress]);

  const progressBarValue = useMemo(() => {
    if (!hasRegistrationDate) return 0;
    if (!promotion) return 100;
    if (!hasPromotionDate) return 0;
    return promotionStatus.progress;
  }, [hasPromotionDate, hasRegistrationDate, promotion, promotionStatus.progress]);

  const onPictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readEvent) => {
      setProfileData((previous) => ({ ...previous, profilePicture: (readEvent.target?.result as string) || "" }));
    };
    reader.readAsDataURL(file);
  };

  const selectBeltCategory = (category: BeltCategory) => {
    const firstBelt = BELT_OPTIONS[category][0];
    setProfileData((previous) => ({
      ...previous,
      beltCategory: category,
      beltName: firstBelt.value,
      beltDegree: firstBelt.minDegree,
    }));
  };

  const selectBelt = (belt: BeltOption) => {
    setProfileData((previous) => ({
      ...previous,
      beltName: belt.value,
      beltDegree: normalizeBeltDegree(previous.beltCategory, belt.value, previous.beltDegree),
    }));
  };

  const saveProfile = () => {
    if (!currentUser) return;
    const fullName = `${profileData.lastName} ${profileData.firstName}`.trim();

    const updated = updateUser(currentUser.id, {
      ...currentUser,
      name: fullName || profileData.name,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      profilePicture: profileData.profilePicture,
      bio: profileData.bio,
      birthDate: profileData.birthDate,
      registrationDate: profileData.registrationDate,
      joinDate: profileData.registrationDate,
      licenseNumber: profileData.licenseNumber,
      beltCategory: profileData.beltCategory,
      beltName: selectedBelt.value,
      beltDegree,
      beltPromotionDate: profileData.beltPromotionDate,
      beltLevel: formatBeltRank(profileData.beltCategory, selectedBelt.value, beltDegree),
      editingEnabled: profileData.editingEnabled,
    });

    if (!updated) return;
    toast({
      title: "Profil mis a jour",
      description: "Les informations ont ete enregistrees.",
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
        <p className="text-sm text-muted-foreground">Chargement du profil...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen overflow-hidden bg-gradient-hero pb-14 pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute bottom-8 right-1/4 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        </div>
        <div className="container relative z-10 mx-auto max-w-4xl px-4">
          <Card className="rounded-[30px] border border-border/60 bg-card/85 shadow-[0_24px_64px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            <CardContent className="space-y-8 p-6 md:p-8">
              <section className="space-y-5 text-center">
                <h1 className="text-4xl font-display tracking-wide text-foreground md:text-5xl">
                  {profileData.firstName || profileData.lastName
                    ? `${profileData.firstName} ${profileData.lastName}`.trim()
                    : content["profile.title_default"]}
                </h1>

                <div className="mx-auto h-48 w-48 overflow-hidden rounded-full border border-primary/40 bg-secondary/60 ring-4 ring-primary/10 md:h-64 md:w-64">
                  {profileData.profilePicture ? (
                    <img src={profileData.profilePicture} alt="Profil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserIcon className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="mx-auto w-full max-w-md">
                  <BeltVisual belt={selectedBelt} category={profileData.beltCategory} beltDegree={beltDegree} size="sm" />
                </div>

                <div className="mx-auto h-5 w-full max-w-xl overflow-hidden rounded-full border border-border/60 bg-secondary/70">
                  <div
                    className="h-full rounded-r-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                    style={{ width: `${progressBarValue}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {content["profile.progress_label"]}: {progressLabel} | {content["profile.training_label"]}: {trainingDuration}
                </p>
              </section>

              <section className="grid gap-3 md:grid-cols-2">
                <InfoRow
                  icon={<UserIcon className="h-5 w-5" />}
                  label={content["profile.info.last_name"]}
                  value={displayOrDash(profileData.lastName || "wsw")}
                />
                <InfoRow
                  icon={<UserIcon className="h-5 w-5" />}
                  label={content["profile.info.first_name"]}
                  value={displayOrDash(profileData.firstName)}
                />
                <InfoRow
                  icon={<Calendar className="h-5 w-5" />}
                  label={content["profile.info.birth_date"]}
                  value={`${formatDateFr(profileData.birthDate)}${profileData.birthDate ? ` (${getAgeLabel(profileData.birthDate)})` : ""}`}
                />
                <InfoRow
                  icon={<Calendar className="h-5 w-5" />}
                  label={content["profile.info.registration_date"]}
                  value={formatDateFr(profileData.registrationDate)}
                />
                <InfoRow
                  icon={<IdCard className="h-5 w-5" />}
                  label={content["profile.info.license_number"]}
                  value={displayOrDash(profileData.licenseNumber)}
                />
                <InfoRow
                  icon={<Award className="h-5 w-5" />}
                  label={content["profile.info.belt"]}
                  value={formatBeltRank(profileData.beltCategory, selectedBelt.value, beltDegree)}
                />
              </section>

              <Card className="border-border/60 bg-secondary/30 backdrop-blur-sm">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg text-foreground">Planning Academie</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Vue emploi du temps inspiree du tableau club. La fin de journee est incluse jusqu a {SCHEDULE_DAY_END_LABEL}.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userTrainingGroups.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Mes groupes</p>
                      {userTrainingGroups.map((group) => {
                        const colorClasses = getGroupColorClasses(group.color);
                        return (
                          <span
                            key={group.id}
                            className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs", colorClasses.badge)}
                          >
                            <span className={cn("h-2 w-2 rounded-full", colorClasses.dot)} />
                            {group.name}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-3 md:hidden">
                    {!isPlanningMobileRotated ? (
                      <div className="space-y-3">
                        {SCHEDULE_DAYS.map((day) => {
                          const daySlots = planningSlotsByDay.get(day) || [];
                          return (
                            <article key={day} className="rounded-xl border border-border/60 bg-card/70 p-3">
                              <h3 className="font-display text-base text-foreground">{day}</h3>
                              <div className="mt-2 space-y-2">
                                {daySlots.length === 0 ? (
                                  <p className="rounded-md border border-dashed border-border/35 bg-secondary/15 px-3 py-2 text-xs text-muted-foreground">
                                    Aucune session
                                  </p>
                                ) : (
                                  daySlots.map((slot) => {
                                    const group = groupsById.get(slot.groupId);
                                    const colorClasses = getGroupColorClasses(group?.color);
                                    const isUserGroup = !!group && userGroupIds.includes(group.id);
                                    return (
                                      <div
                                        key={slot.id}
                                        className={cn(
                                          "rounded-md border px-3 py-2",
                                          colorClasses.filledCell,
                                          isUserGroup && "ring-2 ring-primary/50 ring-offset-1 ring-offset-card"
                                        )}
                                      >
                                        <p className="text-xs font-semibold text-foreground">{group?.name || "Groupe"}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                          {formatPlanningRange(slot.startTime, slot.endTime)}
                                        </p>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/60">
                        <table className="w-full min-w-[680px] border-separate border-spacing-0">
                          <thead>
                            <tr>
                              <th className="sticky left-0 top-0 z-20 min-w-[112px] bg-card/95 p-2 text-left font-display text-xs text-foreground">
                                Horaire
                              </th>
                              {SCHEDULE_DAYS.map((day) => (
                                <th
                                  key={day}
                                  className="sticky top-0 z-10 min-w-[92px] bg-card/90 p-2 text-center font-display text-xs text-foreground"
                                >
                                  {day.slice(0, 3).toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {planningRows.map((row, rowIndex) => (
                              <tr key={`${row.start}-${row.end}`} className={rowIndex % 2 === 0 ? "bg-secondary/10" : ""}>
                                <th className="sticky left-0 z-10 border-t border-border/30 bg-card/95 p-2 text-left text-[11px] text-foreground">
                                  {formatPlanningRange(row.start, row.end)}
                                </th>
                                {SCHEDULE_DAYS.map((day) => {
                                  const activeSlot = planningActiveSlotMap.get(`${day}|${row.start}`);
                                  if (!activeSlot) {
                                    return (
                                      <td key={`${day}-${row.start}`} className="border-t border-border/30 p-1 align-top">
                                        <div className="h-[42px] rounded-md border border-dashed border-border/30 bg-secondary/10" />
                                      </td>
                                    );
                                  }

                                  const group = groupsById.get(activeSlot.groupId);
                                  const colorClasses = getGroupColorClasses(group?.color);
                                  const isUserGroup = !!group && userGroupIds.includes(group.id);

                                  return (
                                    <td key={`${day}-${row.start}-${activeSlot.id}`} className="border-t border-border/30 p-1 align-top">
                                      <div
                                        className={cn(
                                          "min-h-[42px] rounded-md border px-2 py-1",
                                          colorClasses.filledCell,
                                          isUserGroup && "ring-2 ring-primary/50 ring-offset-1 ring-offset-card"
                                        )}
                                      >
                                        <p className="line-clamp-1 text-[11px] font-semibold text-foreground">
                                          {group?.name || "Groupe"}
                                        </p>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setIsPlanningMobileRotated((value) => !value)}
                        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/35 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
                      >
                        <RotateCw className={cn("h-3.5 w-3.5 transition-transform", isPlanningMobileRotated && "rotate-180")} />
                        {isPlanningMobileRotated ? "Revenir a la vue jour" : "Rotation de l'emploi"}
                      </button>
                    </div>
                  </div>

                  <div className="hidden md:block overflow-x-auto rounded-xl border border-border/60 bg-card/60">
                    <table className="w-full min-w-[780px] border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className="sticky left-0 top-0 z-20 min-w-[120px] bg-card/90 p-2 text-left font-display text-xs uppercase tracking-wide text-foreground">
                            Horaire
                          </th>
                          {SCHEDULE_DAYS.map((day) => (
                            <th
                              key={day}
                              className="sticky top-0 z-10 min-w-[100px] bg-card/90 p-2 text-center font-display text-xs uppercase tracking-wide text-foreground"
                            >
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {planningRows.map((row, rowIndex) => (
                          <tr key={`${row.start}-${row.end}`} className={rowIndex % 2 === 0 ? "bg-secondary/10" : ""}>
                            <th className="sticky left-0 z-10 border-t border-border/30 bg-card/95 p-2 text-left text-xs font-semibold text-foreground">
                              {formatPlanningRange(row.start, row.end)}
                            </th>
                            {SCHEDULE_DAYS.map((day) => {
                              const startingSlot = planningSlotStartMap.get(`${day}|${row.start}`);
                              if (startingSlot) {
                                const group = groupsById.get(startingSlot.groupId);
                                const colorClasses = getGroupColorClasses(group?.color);
                                const span = Math.max(1, Math.min(getPlanningSlotSpan(startingSlot), planningRows.length));
                                const isUserGroup = !!group && userGroupIds.includes(group.id);

                                return (
                                  <td key={`${day}-${startingSlot.id}`} rowSpan={span} className="border-t border-border/30 p-1 align-top">
                                    <div
                                      className={cn(
                                        "h-full min-h-[48px] rounded-md border px-2 py-1.5 text-left",
                                        "flex flex-col justify-between gap-1",
                                        colorClasses.filledCell,
                                        isUserGroup && "ring-2 ring-primary/60 ring-offset-1 ring-offset-card"
                                      )}
                                    >
                                      <p className="text-xs font-semibold text-foreground">{group?.name || "Groupe"}</p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {formatPlanningRange(startingSlot.startTime, startingSlot.endTime)}
                                      </p>
                                    </div>
                                  </td>
                                );
                              }

                              if (planningActiveSlotMap.has(`${day}|${row.start}`)) {
                                return null;
                              }

                              return (
                                <td key={`${day}-${row.start}`} className="border-t border-border/30 p-1 align-top">
                                  <div className="h-[48px] rounded-md border border-dashed border-border/35 bg-secondary/15" />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    Fin de journee academie: {SCHEDULE_DAY_END_LABEL} incluse. Fin la plus tardive planifiee: {latestScheduleEndTime}.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-secondary/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Systeme de promotion IBJJF</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Categorie: <span className="font-medium text-foreground">{BELT_CATEGORY_LABELS[profileData.beltCategory]}</span>
                  </p>
                  <p>
                    Ceinture actuelle:{" "}
                    <span className="font-medium text-foreground">
                      {formatBeltRank(profileData.beltCategory, selectedBelt.value, beltDegree)}
                    </span>
                  </p>
                  <p>
                    Prochaine promotion:{" "}
                    <span className="font-medium text-foreground">{promotion?.nextLabel || "Niveau maximal"}</span>
                  </p>
                  <p>
                    Delai minimum:{" "}
                    <span className="font-medium text-foreground">{promotion ? `${promotion.waitYears} an(s)` : "-"}</span>
                  </p>
                  <p>
                    Date d'eligibilite: <span className="font-medium text-foreground">{promotionStatus.eligibleDate}</span>
                  </p>
                  <p>
                    Statut: <span className="font-medium text-foreground">{promotionStatus.remaining}</span>
                  </p>
                  {promotion?.notes && (
                    <p className="rounded-md border border-border/60 bg-card/70 p-2 text-xs text-muted-foreground">
                      {promotion.notes}
                    </p>
                  )}
                  {ageWarning && (
                    <p className="rounded-md border border-warning/50 bg-warning/10 p-2 text-xs text-warning">
                      {ageWarning}
                    </p>
                  )}
                </CardContent>
              </Card>

              {isEditing && (
                <Card className="border-border/60 bg-secondary/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">Edition du profil</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Nom</Label>
                        <Input value={profileData.lastName} onChange={(event) => setProfileData((previous) => ({ ...previous, lastName: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Prenom</Label>
                        <Input value={profileData.firstName} onChange={(event) => setProfileData((previous) => ({ ...previous, firstName: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Date de naissance</Label>
                        <Input type="date" value={profileData.birthDate} onChange={(event) => setProfileData((previous) => ({ ...previous, birthDate: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Date d'inscription</Label>
                        <Input type="date" value={profileData.registrationDate} onChange={(event) => setProfileData((previous) => ({ ...previous, registrationDate: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Numero licence</Label>
                        <Input value={profileData.licenseNumber} onChange={(event) => setProfileData((previous) => ({ ...previous, licenseNumber: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Photo de profil</Label>
                        <Input type="file" accept="image/*" onChange={onPictureChange} />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Bio
                        </Label>
                        <textarea
                          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={profileData.bio}
                          onChange={(event) => setProfileData((previous) => ({ ...previous, bio: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>{content["profile.edit.belt_category"]}</Label>
                      <div className="grid gap-2 md:grid-cols-3">
                        {(Object.keys(BELT_CATEGORY_LABELS) as BeltCategory[]).map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => selectBeltCategory(category)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              profileData.beltCategory === category
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/60 bg-secondary/25 text-foreground hover:border-primary/40"
                            }`}
                          >
                            {BELT_CATEGORY_LABELS[category]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>{content["profile.edit.degree_stripes"]}</Label>
                      <div className="flex flex-wrap gap-2">
                        {degreeValues.map((degree) => (
                          <button
                            key={degree}
                            type="button"
                            onClick={() => setProfileData((previous) => ({ ...previous, beltDegree: degree }))}
                            className={`min-w-10 rounded-md border px-3 py-2 text-sm font-medium ${
                              degree === beltDegree
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/60 bg-secondary/25 text-foreground hover:border-primary/40"
                            }`}
                          >
                            {degree}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>{content["profile.edit.belt_selection"]}</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {beltOptions.map((belt) => (
                          <button
                            key={belt.value}
                            type="button"
                            onClick={() => selectBelt(belt)}
                            className={`rounded-xl border p-3 text-left transition ${
                              profileData.beltName === belt.value
                                ? "border-primary bg-primary/10"
                                : "border-border/60 bg-secondary/20 hover:border-primary/40"
                            }`}
                          >
                            <BeltVisual
                              belt={belt}
                              category={profileData.beltCategory}
                              beltDegree={profileData.beltName === belt.value ? beltDegree : belt.minDegree}
                              className="max-w-sm"
                              size="sm"
                            />
                            <p className="mt-2 text-sm font-medium text-foreground">Ceinture {belt.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>{content["profile.edit.last_promotion_date"]}</Label>
                      <Input
                        type="date"
                        value={profileData.beltPromotionDate}
                        onChange={(event) => setProfileData((previous) => ({ ...previous, beltPromotionDate: event.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentUser?.role === "admin" && (
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/35 p-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-foreground">Autoriser modifications</p>
                    <Switch
                      checked={profileData.editingEnabled}
                      onCheckedChange={(checked) => setProfileData((previous) => ({ ...previous, editingEnabled: checked }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 rounded-xl border border-border/60 bg-secondary/25 p-2">
                {!isEditing ? (
                  <Button
                    className="flex-1"
                    variant="gold"
                    onClick={() => setIsEditing(true)}
                    disabled={!canEdit || !profileData.editingEnabled}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier le profil
                  </Button>
                ) : (
                  <>
                    <Button className="flex-1" variant="gold" onClick={saveProfile}>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </Button>
                    <Button className="flex-1" variant="outline" onClick={() => setIsEditing(false)}>
                      Annuler
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
