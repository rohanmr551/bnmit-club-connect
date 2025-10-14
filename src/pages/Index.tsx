import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ClubCard from "@/components/ClubCard";
import { Button } from "@/components/ui/button";
import { Shield, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/ui/sidebar";

interface Club {
  id: number;
  name: string;
  description: string;
  logo_url: string | null;
  qr_url: string | null;
  payment_link?: string | null;
}

const Index = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .order("name");

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error("Error fetching clubs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section - Enhanced with better backdrop blur and subtle glow */}
      <header className="glass sticky top-0 z-50 border-b border-glass-border backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && <Sidebar />}
            <div className="relative">
              <img src="/logo.svg" alt="EMC Club Connect Logo" className="h-10 w-10 transition-transform hover:scale-110 duration-300" />
              {/* Subtle glow effect on logo */}
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gradient">BNMIT Club Connect</h1>
              <p className="text-xs text-muted-foreground">EMC - BNMIT</p>
            </div>
          </div>

          {!isMobile && (
            <div className="flex gap-2">
              <Link to="/check-status">
                <Button variant="outline" className="glass-hover transition-all duration-300 hover:scale-105">
                  <Search className="w-4 h-4 mr-2" />
                  Check Status
                </Button>
              </Link>
              <Link to="/club-admin">
                <Button variant="outline" className="glass-hover transition-all duration-300 hover:scale-105">
                  <Shield className="w-4 h-4 mr-2" />
                  Club Admin
                </Button>
              </Link>
              <Link to="/admin">
                <Button className="gradient-primary transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <Shield className="w-4 h-4 mr-2" />
                  Root Admin
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Banner - Enhanced with better spacing and gradient overlay */}
      <section className="relative py-16 md:py-28 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-background"></div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <div className="animate-fade-in">
            <h2 className="text-4xl md:text-7xl font-bold text-gradient mb-4 md:mb-6 leading-tight">
              Discover Clubs at BNMIT
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed mb-8">
              Event Management Committee - Explore your passions and connect with like-minded people.
            </p>
            <a href="#clubs-section">
              <Button size="lg" className="gradient-primary transition-all duration-300 hover:scale-105 hover:shadow-xl text-base md:text-lg px-8 py-6">
                Explore Clubs
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Check Status Section - Enhanced with card elevation and icon */}
      <section className="container mx-auto px-4 md:px-6 -mt-8 md:-mt-12 mb-12 md:mb-20 relative z-20">
        <div className="bg-glass rounded-2xl border border-glass-border p-8 md:p-12 text-center shadow-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-primary/10 hover:border-primary/30">
          <div className="max-w-2xl mx-auto">
            {/* Icon badge */}
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 mb-4 md:mb-6">
              <Search className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-gradient mb-3 md:mb-4">
              Already Registered?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8 px-4 leading-relaxed">
              You can check the status of your club membership application by clicking the button below. You'll need your USN to proceed.
            </p>
            <Link to="/check-status">
              <Button size="lg" className="gradient-primary transition-all duration-300 hover:scale-105 hover:shadow-xl text-base md:text-lg px-6 md:px-8 py-5 md:py-6">
                <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Check Membership Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Clubs Grid - Enhanced with section header and staggered animations */}
      <section id="clubs-section" className="container mx-auto px-4 md:px-6 pb-16 md:pb-24">
        <div className="text-center mb-10 md:mb-14">
          <h3 className="text-2xl md:text-4xl font-bold text-gradient mb-3 md:mb-4">
            Our Clubs
          </h3>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Find your community and join exciting activities
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 md:py-24">
            <div className="inline-block h-12 w-12 md:h-16 md:w-16 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
            <p className="text-sm md:text-base text-muted-foreground">Loading clubs...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted mb-4 md:mb-6">
              <Shield className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
            </div>
            <p className="text-lg md:text-xl text-muted-foreground">No clubs available yet.</p>
            <p className="text-sm text-muted-foreground/60 mt-2">Check back soon for updates!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {clubs.map((club, index) => (
              <div 
                key={club.id} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ClubCard {...club} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer - Enhanced with logo and better spacing */}
      <footer className="glass border-t border-glass-border py-8 md:py-10 backdrop-blur-xl">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
            <img src="/logo.svg" alt="EMC Logo" className="h-6 w-6 opacity-60" />
            <span className="text-sm font-semibold text-muted-foreground">EMC - BNMIT</span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground/80">
            © 2025 Event Management Committee - BNMIT. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Custom animations */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Index;
