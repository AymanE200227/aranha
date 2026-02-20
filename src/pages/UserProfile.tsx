import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Calendar, Edit, FileText, IdCard, Save, Shield, User as UserIcon } from "lucide-react";
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
import { getUserById, updateUser } from "@/lib/storage";
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

export default function UserProfile() {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
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

  const canEdit = !!currentUser;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isAuthenticated, isLoading, navigate]);

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
    window.location.reload();
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
