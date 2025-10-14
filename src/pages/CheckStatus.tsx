import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface Registration {
  id: number;
  created_at: string;
  payment_status: string;
  clubs: {
    name: string;
  };
}

const CheckStatus = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("id, created_at, payment_status, clubs(name)")
        .eq("phone_number", phoneNumber)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "Pending":
        return <Clock className="w-5 h-5 text-warning" />;
      case "Rejected":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Paid: "bg-success text-success-foreground",
      Pending: "bg-warning text-warning-foreground",
      Rejected: "bg-destructive text-destructive-foreground",
    };

    return (
      <Badge className={variants[status] || ""}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto max-w-3xl">
        <Link to="/">
          <Button variant="ghost" className="mb-4 md:mb-6 glass-hover">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card className="glass p-6 md:p-8">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gradient">Check Registration Status</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Event Management Committee - BNMIT</p>
          </div>
          
          <form onSubmit={handleSearch} className="space-y-4 mb-6 md:mb-8">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm md:text-base">Enter Your Phone Number</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="phoneNumber"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="glass h-10 md:h-11"
                  required
                />
                <Button type="submit" disabled={loading} className="gradient-primary h-10 md:h-11 shrink-0">
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </form>

          {searched && (
            <div className="space-y-3 md:space-y-4">
              {registrations.length === 0 ? (
                <div className="text-center py-8 md:py-12 glass rounded-lg">
                  <p className="text-sm md:text-base text-muted-foreground">No registrations found for this Phone Number.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h2 className="text-lg md:text-xl font-semibold">Your Registrations ({registrations.length}/3)</h2>
                  </div>
                  {registrations.map((reg) => (
                    <Card key={reg.id} className="glass-hover p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="space-y-1 md:space-y-2 flex-1">
                          <h3 className="text-lg md:text-xl font-bold">{reg.clubs.name}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Registered on {new Date(reg.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                          {getStatusIcon(reg.payment_status)}
                          {getStatusBadge(reg.payment_status)}
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CheckStatus;
