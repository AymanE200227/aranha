import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { initializeStorage } from "@/lib/storage";
import { applyBrandingToDocument, subscribeBrandingUpdates } from "@/lib/branding";
import Index from "./pages/Index";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Schedule from "./pages/Schedule";
import Stats from "./pages/Stats";
import Gallery from "./pages/Gallery";
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminGroups from "./pages/admin/AdminGroups";
import AdminSchedules from "./pages/admin/AdminSchedules";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminAbout from "./pages/admin/AdminAbout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    initializeStorage();
    applyBrandingToDocument();
    return subscribeBrandingUpdates(applyBrandingToDocument);
  }, []);

  return (
    <Routes>
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
