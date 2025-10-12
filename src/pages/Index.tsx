import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ClubCard from "@/components/ClubCard";
import { Button } from "@/components/ui/button";
import { Users, Shield, Search } from "lucide-react";
import { Link } from "react-router-dom";

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">BNMIT Club Connect</h1>
              <p className="text-xs text-muted-foreground">Join Your Favorite Clubs</p>
            </div>
          </div>

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
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Discover Amazing Clubs
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join clubs at BNMIT. Connect with like-minded students and explore your passions.
          </p>
        </div>
      </section>

      {/* Clubs Grid */}
      <section className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading clubs...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No clubs available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <ClubCard key={club.id} {...club} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="glass border-t border-glass-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 BNMIT Club Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
