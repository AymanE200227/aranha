import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { bootstrapStorage } from "@/lib/storage";
import { applyBrandingToDocument, subscribeBrandingUpdates } from "@/lib/branding";
import AppLoader from "@/components/layout/AppLoader";

const loadIndexPage = () => import("./pages/Index");
const loadAboutPage = () => import("./pages/About");
const loadAuthPage = () => import("./pages/Auth");
const loadSchedulePage = () => import("./pages/Schedule");
const loadStatsPage = () => import("./pages/Stats");
const loadGalleryPage = () => import("./pages/Gallery");
const loadUserProfilePage = () => import("./pages/UserProfile");
const loadAdminDashboardPage = () => import("./pages/admin/AdminDashboard");
const loadAdminUsersPage = () => import("./pages/admin/AdminUsers");
const loadAdminGroupsPage = () => import("./pages/admin/AdminGroups");
const loadAdminSchedulesPage = () => import("./pages/admin/AdminSchedules");
const loadAdminAttendancePage = () => import("./pages/admin/AdminAttendance");
const loadAdminMediaPage = () => import("./pages/admin/AdminMedia");
const loadAdminAboutPage = () => import("./pages/admin/AdminAbout");
const loadNotFoundPage = () => import("./pages/NotFound");

const Index = lazy(loadIndexPage);
const About = lazy(loadAboutPage);
const Auth = lazy(loadAuthPage);
const Schedule = lazy(loadSchedulePage);
const Stats = lazy(loadStatsPage);
const Gallery = lazy(loadGalleryPage);
const UserProfile = lazy(loadUserProfilePage);
const AdminDashboard = lazy(loadAdminDashboardPage);
const AdminUsers = lazy(loadAdminUsersPage);
const AdminGroups = lazy(loadAdminGroupsPage);
const AdminSchedules = lazy(loadAdminSchedulesPage);
const AdminAttendance = lazy(loadAdminAttendancePage);
const AdminMedia = lazy(loadAdminMediaPage);
const AdminAbout = lazy(loadAdminAboutPage);
const NotFound = lazy(loadNotFoundPage);

const queryClient = new QueryClient();

const AppContent = () => {
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const stopBrandingSubscription = subscribeBrandingUpdates(applyBrandingToDocument);

    const bootstrapApp = async () => {
      try {
        await Promise.race([
          bootstrapStorage(),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, 3000);
          }),
        ]);
      } catch (error) {
        console.warn("Storage bootstrap failed", error);
      }

      applyBrandingToDocument();

      if (isMounted) {
        setIsBootstrapped(true);
      }
    };

    void bootstrapApp();

    return () => {
      isMounted = false;
      stopBrandingSubscription();
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    const preloadRoutes = () => {
      const preloaders = [
        loadIndexPage,
        loadSchedulePage,
        loadGalleryPage,
        loadStatsPage,
        loadUserProfilePage,
        loadAdminDashboardPage,
      ];

      preloaders.forEach((preloadPage, index) => {
        window.setTimeout(() => {
          void preloadPage();
        }, index * 140);
      });
    };

    const preloadTimeout = window.setTimeout(preloadRoutes, 550);
    return () => window.clearTimeout(preloadTimeout);
  }, []);

  const pageTransitionKey = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.hash, location.pathname, location.search]
  );

  if (!isBootstrapped) {
    return <AppLoader message="Initialisation de la plateforme..." />;
  }

  return (
    <Suspense fallback={<AppLoader message="Chargement de la page..." />}>
      <div key={pageTransitionKey} className="page-enter">
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/groups" element={<AdminGroups />} />
          <Route path="/admin/schedules" element={<AdminSchedules />} />
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          <Route path="/admin/media" element={<AdminMedia />} />
          <Route path="/admin/about" element={<AdminAbout />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Suspense>
  );
};

const App = () => {
  const useHashRouter =
    import.meta.env.VITE_USE_HASH_ROUTER === "true" ||
    (typeof window !== "undefined" && window.location.hostname.endsWith(".github.io"));
  const RouterComponent = useHashRouter ? HashRouter : BrowserRouter;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterComponent>
          <AppContent />
        </RouterComponent>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
