import {
  APP_CONTENT_UPDATED_EVENT,
  getAppContent,
  saveAppContent,
  type AppContentMap,
} from "@/lib/storage";

export const DEFAULT_APP_CONTENT: AppContentMap = {
  "navbar.link.home": "Accueil",
  "navbar.link.about": "A Propos",
  "navbar.link.schedule": "Emploi du Temps",
  "navbar.link.stats": "Mes Statistiques",
  "navbar.link.gallery": "Galerie",
  "navbar.button.login": "Connexion",
  "navbar.button.admin": "Admin",
  "navbar.button.admin_mobile": "Administration",
  "navbar.button.logout": "Deconnexion",
  "footer.description":
    "Aranha Brazilian Jiu Jitsu Academy - l'excellence dans l'art du combat depuis plus de 15 ans.",
  "footer.quick_links": "LIENS RAPIDES",
  "footer.contact": "CONTACT",
  "footer.location": "Morocco",
  "footer.email": "contact@aranha.ma",
  "footer.phone": "+212 600 000 000",
  "footer.rights": "Tous droits reserves.",
  "auth.back_home": "Retour a l'accueil",
  "auth.title_login": "CONNEXION",
  "auth.title_register": "INSCRIPTION",
  "auth.subtitle_login": "Accedez a votre espace membre",
  "auth.subtitle_register": "Creez votre compte membre",
  "auth.admin_access": "Acces Admin",
  "auth.admin_email_label": "Email",
  "auth.admin_password_label": "Mot de passe",
  "auth.name_label": "Nom complet",
  "auth.email_label": "Email",
  "auth.password_label": "Mot de passe",
  "auth.name_placeholder": "Jean Dupont",
  "auth.email_placeholder": "votre@email.com",
  "auth.button_login": "Se connecter",
  "auth.button_register": "S'inscrire",
  "auth.toggle_login_prompt": "Pas encore de compte ?",
  "auth.toggle_register_prompt": "Deja un compte ?",
  "auth.toggle_login_action": "S'inscrire",
  "auth.toggle_register_action": "Se connecter",
  "not_found.title": "Page Non Trouvee",
  "not_found.message": "Desole, la page que vous recherchez n'existe pas ou a ete deplacee.",
  "not_found.back_home": "Retour a l'accueil",
  "not_found.back_previous": "Page precedente",
  "profile.title_default": "Mon Profil",
  "profile.progress_label": "Progression",
  "profile.training_label": "Temps de pratique",
  "profile.info.last_name": "Nom",
  "profile.info.first_name": "Prenom",
  "profile.info.birth_date": "Date de naissance",
  "profile.info.registration_date": "Date d'inscription",
  "profile.info.license_number": "Numero licence",
  "profile.info.belt": "Ceinture",
  "profile.edit.belt_category": "Categorie ceinture",
  "profile.edit.belt_selection": "Selection ceinture (image)",
  "profile.edit.degree_stripes": "Degre / barrettes",
  "profile.edit.last_promotion_date": "Date derniere promotion",
  "schedule.badge": "Planning Hebdomadaire",
  "schedule.title_prefix": "EMPLOI DU",
  "schedule.title_highlight": "TEMPS",
  "schedule.description": "Consultez les horaires de vos seances et planifiez vos entrainements",
  "schedule.user_group_label": "Votre groupe:",
  "schedule.table.day": "Jour",
  "schedule.info.authenticated": "Les creneaux de votre groupe sont mis en evidence",
  "schedule.info.guest": "Connectez-vous pour voir votre emploi du temps personnalise",
  "stats.loading": "Chargement...",
  "stats.badge": "Tableau de Bord",
  "stats.title_prefix": "MES",
  "stats.title_highlight": "STATISTIQUES",
  "stats.description": "Suivez votre assiduite et votre progression d'entrainement",
  "stats.login.title": "Acces Restreint",
  "stats.login.description":
    "Connectez-vous pour voir vos statistiques de presence et suivre votre progression.",
  "stats.login.button": "Se connecter",
  "stats.group_label": "Mon Groupe:",
  "stats.card.present": "Seances presentes",
  "stats.card.absent": "Seances absentes",
  "stats.card.rate": "Taux de presence",
  "stats.tabs.overview": "Vue d'ensemble",
  "stats.tabs.schedule": "Mon Emploi",
  "stats.tabs.history": "Historique",
  "stats.overview.weekly_title": "Presences par Semaine",
  "stats.overview.pie_title": "Repartition Globale",
  "stats.common.no_data": "Aucune donnee disponible",
  "stats.common.present": "Present",
  "stats.common.absent": "Absent",
  "stats.schedule.title": "Mon Emploi du Temps",
  "stats.schedule.no_group": "Vous n'etes pas encore assigne a un groupe",
  "stats.schedule.no_group_help":
    "Contactez l'administration pour etre ajoute a un groupe d'entrainement",
  "stats.schedule.no_schedule": "Aucun horaire defini pour votre groupe",
  "stats.schedule.present_count": "Presences",
  "stats.schedule.absent_count": "Absences",
  "stats.history.title": "Historique Detaille",
  "stats.history.empty": "Aucune presence enregistree",
  "stats.history.empty_help":
    "Vos presences apparaitront ici apres que l'administration les ait enregistrees",
  "stats.history.status.present": "Present",
  "stats.history.status.absent": "Absent",
  "stats.user.connected_as": "Connecte en tant que",
  "home.hero.badge": "Ecole de Jujutsu Bresilien",
  "home.hero.title_prefix": "MAITRISEZ L'ART DU",
  "home.hero.title_highlight": "COMBAT",
  "home.hero.description":
    "Rejoignez notre academie et apprenez aupres des meilleurs maitres. Discipline, respect et excellence sont nos valeurs fondamentales.",
  "home.hero.cta_primary": "COMMENCER MAINTENANT",
  "home.hero.cta_secondary": "VOIR LES HORAIRES",
  "home.hero.stat_1_value": "15+",
  "home.hero.stat_1_label": "Annees d'experience",
  "home.hero.stat_2_value": "500+",
  "home.hero.stat_2_label": "Etudiants formes",
  "home.hero.stat_3_value": "10+",
  "home.hero.stat_3_label": "Champions",
  "home.features.badge": "Nos Services",
  "home.features.title_prefix": "POURQUOI NOUS",
  "home.features.title_highlight": "CHOISIR",
  "home.features.item_1_title": "Emploi du Temps Flexible",
  "home.features.item_1_description":
    "Choisissez parmi nos groupes du matin et du soir selon votre disponibilite",
  "home.features.item_2_title": "Groupes Personnalises",
  "home.features.item_2_description":
    "Entrainez-vous avec des pratiquants de votre niveau dans des groupes adaptes",
  "home.features.item_3_title": "Suivi de Progression",
  "home.features.item_3_description": "Visualisez vos statistiques de presence et suivez votre evolution",
  "home.features.item_4_title": "Encadrement Expert",
  "home.features.item_4_description":
    "Beneficiez de l'expertise de nos maitres ceintures noires certifies",
  "home.coaches.badge": "Aranha Association",
  "home.coaches.title_prefix": "ARANHA BRAZILIAN",
  "home.coaches.title_highlight": "JIU JITSU",
  "home.coaches.title_suffix": "ACADEMY",
  "home.coaches.description":
    "Apprenez aupres de pratiquants experimentes dans la lignee directe des maitres Gracie",
  "home.coaches.lineage_title_prefix": "OUR BLACK BELT",
  "home.coaches.lineage_title_highlight": "LINEAGE",
  "home.coaches.lineage_1_name": "Carlos Gracie",
  "home.coaches.lineage_1_initials": "CG",
  "home.coaches.lineage_2_name": "Carlson Gracie",
  "home.coaches.lineage_2_initials": "CG",
  "home.coaches.lineage_3_name": "Andre Pederneiras",
  "home.coaches.lineage_3_initials": "AP",
  "home.coaches.lineage_4_name": "Their Cleveland",
  "home.coaches.lineage_4_initials": "TC",
  "home.coaches.lineage_5_name": "Imad Bourziz",
  "home.coaches.lineage_5_initials": "IB",
  "home.coaches.coach_1_name": "Imad Bourziz",
  "home.coaches.coach_1_title": "Maitre Principal",
  "home.coaches.coach_1_belt": "Ceinture Noire",
  "home.coaches.coach_1_description":
    "Fondateur de l'Academie Aranha Maroc, forme par Their Cleveland dans la lignee Gracie",
  "home.coaches.coach_2_name": "Their Cleveland",
  "home.coaches.coach_2_title": "Instructeur Senior",
  "home.coaches.coach_2_belt": "Ceinture Noire",
  "home.coaches.coach_2_description":
    "Eleve direct d'Andre Pederneiras, representant de l'association Aranha",
  "home.gallery.badge": "Nos Moments",
  "home.gallery.title_prefix": "Galerie",
  "home.gallery.title_highlight": "Photos",
  "home.gallery.description": "Decouvrez nos moments d'entrainement, competitions et evenements",
  "home.gallery.image_alt_prefix": "Galerie photo",
  "home.gallery.delete_title": "Supprimer cette image?",
  "home.gallery.delete_description": "Cette action est irreversible",
  "home.gallery.delete_cancel": "Annuler",
  "home.gallery.delete_confirm": "Supprimer",
  "home.gallery.add_label": "Ajouter",
  "home.gallery.view_more": "VOIR PLUS DE PHOTOS",
};

export const getResolvedAppContent = (): AppContentMap => {
  return {
    ...DEFAULT_APP_CONTENT,
    ...getAppContent(),
  };
};

export const getContentValue = (key: string, fallback?: string): string => {
  const overrides = getAppContent();
  const fromOverride = overrides[key];
  if (typeof fromOverride === "string") return fromOverride;
  if (typeof fallback === "string") return fallback;
  return DEFAULT_APP_CONTENT[key] ?? "";
};

export const saveContentOverrides = (content: AppContentMap): void => {
  const sanitized = Object.entries(content).reduce<AppContentMap>((accumulator, [key, value]) => {
    if (typeof value === "string") {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
  saveAppContent(sanitized);
};

export const resetContentOverrides = (): void => {
  saveAppContent({});
};

export const subscribeContentUpdates = (callback: () => void): (() => void) => {
  const listener = () => callback();
  window.addEventListener(APP_CONTENT_UPDATED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(APP_CONTENT_UPDATED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
};
