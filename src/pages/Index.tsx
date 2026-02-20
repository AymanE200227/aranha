import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import CoachesSection from "@/components/home/CoachesSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import GallerySection from "@/components/home/GallerySection";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <CoachesSection />
      <FeaturesSection />
      <GallerySection />
      <Footer />
    </div>
  );
};

export default Index;