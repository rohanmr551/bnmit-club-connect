import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Eye, Filter } from "lucide-react";
import { Link } from "react-router-dom";

interface Registration {
  id: number;
  name: string;
  usn: string;
  email: string;
  branch: string;
  year: number;
  payment_proof_url: string | null;
  payment_status: string;
  created_at: string;
}

const ClubAdmin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [clubId, setClubId] = useState<number | null>(null);
  const [clubName, setClubName] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [proofModal, setProofModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authenticated && clubId) {
      fetchRegistrations();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('club-registrations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'registrations',
            filter: `club_id=eq.${clubId}`
          },
          () => {
            fetchRegistrations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authenticated, clubId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name")
        .eq("username", username)
        .eq("password", password)
        .single();

      if (error || !data) {
        toast.error("Invalid credentials");
      } else {
        setAuthenticated(true);
        setClubId(data.id);
        setClubName(data.name);
        toast.success(`Welcome, ${data.name}!`);
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!clubId) return;

    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ payment_status: status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Registration ${status.toLowerCase()}`);
      fetchRegistrations();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === "all") return true;
    return reg.payment_status === filter;
  });

  const stats = {
    total: registrations.length,
    paid: registrations.filter((r) => r.payment_status === "Paid").length,
    pending: registrations.filter((r) => r.payment_status === "Pending").length,
    rejected: registrations.filter((r) => r.payment_status === "Rejected").length,
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass w-full max-w-md p-8">
          <h1 className="text-3xl font-bold text-gradient mb-6">Club Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary">
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <Link to="/" className="block mt-4">
            <Button variant="ghost" className="w-full glass-hover">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient">{clubName} Dashboard</h1>
            <p className="text-muted-foreground">Manage your club registrations</p>
          </div>
          <Link to="/">
            <Button variant="outline" className="glass-hover">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-hover p-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </Card>
          <Card className="glass-hover p-6 bg-success/10">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-3xl font-bold text-success">{stats.paid}</p>
          </Card>
          <Card className="glass-hover p-6 bg-warning/10">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold text-warning">{stats.pending}</p>
          </Card>
          <Card className="glass-hover p-6 bg-destructive/10">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-3xl font-bold text-destructive">{stats.rejected}</p>
          </Card>
        </div>

        {/* Filter */}
        <Card className="glass p-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
            <div className="flex gap-2">
              {["all", "Pending", "Paid", "Rejected"].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={filter === f ? "gradient-primary" : "glass-hover"}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.name}</TableCell>
                    <TableCell>{reg.usn}</TableCell>
                    <TableCell>{reg.branch}</TableCell>
                    <TableCell>{reg.year}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          reg.payment_status === "Paid"
                            ? "bg-success"
                            : reg.payment_status === "Pending"
                            ? "bg-warning"
                            : "bg-destructive"
                        }
                      >
                        {reg.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reg.payment_proof_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setProofModal(reg.payment_proof_url)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(reg.id, "Paid")}
                          disabled={reg.payment_status === "Paid"}
                          className="text-success hover:bg-success/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(reg.id, "Rejected")}
                          disabled={reg.payment_status === "Rejected"}
                          className="text-destructive hover:bg-destructive/20"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Proof Modal */}
        <Dialog open={!!proofModal} onOpenChange={() => setProofModal(null)}>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
              <DialogDescription>This is the payment proof uploaded by the student.</DialogDescription>
            </DialogHeader>
            <img src={proofModal || ""} alt="Payment Proof" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClubAdmin;
