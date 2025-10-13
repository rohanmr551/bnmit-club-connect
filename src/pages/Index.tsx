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
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="glass sticky top-0 z-50 border-b border-glass-border">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && <Sidebar />}
            <img src="/logo.svg" alt="EMC Club Connect Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gradient">PES Club Connect</h1>
              <p className="text-xs text-muted-foreground">EMC - BNMIT</p>
            </div>
          </div>

          {!isMobile && (
            <div className="flex gap-2">
              <Link to="/check-status">
                <Button variant="outline" className="glass-hover">
                  <Search className="w-4 h-4 mr-2" />
                  Check Status
                </Button>
              </Link>
              <Link to="/club-admin">
                <Button variant="outline" className="glass-hover">
                  <Shield className="w-4 h-4 mr-2" />
                  Club Admin
                </Button>
              </Link>
              <Link to="/admin">
                <Button className="gradient-primary">
                  <Shield className="w-4 h-4 mr-2" />
                  Root Admin
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-6xl font-bold text-gradient mb-3 md:mb-4">
            Discover Clubs at BNMIT
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Event Management Committee - Explore your passions and connect with like-minded people.
          </p>
        </div>
      </section>

      {/* Check Status Section */}
      <section className="container mx-auto px-4 md:px-6 py-8 md:py-16 text-center bg-glass rounded-xl border border-glass-border mb-8 md:mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-3 md:mb-4">
          Already Registered?
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-6 md:mb-8 px-4">
          You can check the status of your club membership application by clicking the button below. You'll need your USN to proceed.
        </p>
        <Link to="/check-status">
          <Button size="lg" className="gradient-primary">
            <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Check Membership Status
          </Button>
        </Link>
      </section>

      {/* Clubs Grid */}
      <section className="container mx-auto px-2 md:px-6 pb-12 md:pb-20">
        {loading ? (
          <div className="text-center py-12 md:py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-sm md:text-base text-muted-foreground">Loading clubs...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-12 md:py-20">
            <p className="text-lg md:text-xl text-muted-foreground">No clubs available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {clubs.map((club) => (
              <ClubCard key={club.id} {...club} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="glass border-t border-glass-border py-6 md:py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm md:text-base">© 2025 Event Management Committee - BNMIT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
