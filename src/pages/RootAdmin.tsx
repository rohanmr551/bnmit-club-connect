import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  LogIn,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  FileText,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

// The new Apps Script URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyommBG-1KZP_RreMlDk_QKxybFZ9-8vDbi0He6AsinHX4v8AXt5f_mBM9aXYMb2YGvqg/exec";

// Hardcoded admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";

interface Club {
  id: number;
  name: string;
  description: string;
  username: string;
  logo_url: string | null;
  qr_url: string | null;
  payment_link: string | null;
}

interface Registration {
  id: number;
  name: string;
  usn: string;
  email: string;
  phone_number: string | null;
  branch: string | null;
  year: number | null;
  club_id: number | null;
  payment_proof_url: string | null;
  payment_status: string | null;
  upi_transaction_id: string | null;
  created_at: string | null;
}

// New function to upload the file to Google Apps Script
const uploadFileToAppsScript = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        const fileData = (e.target.result as string).split("base64,")[1];
        const payload = {
          filename: file.name,
          mimeType: file.type,
          file: fileData,
        };

        fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => {
          if (data.status === "success") {
            resolve(data.fileId);
          } else {
            console.error("Apps Script Error:", data);
            reject(data.message || "Upload failed. Please try again.");
          }
        })
        .catch(error => {
            console.error("Fetch Error:", error);
            reject("Upload failed due to a network error.");
        });
      } else {
        reject("Failed to read the file.");
      }
    };
    reader.onerror = () => {
        reject("Error reading file.");
    };
    reader.readAsDataURL(file);
  });
};


const RootAdmin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [newClub, setNewClub] = useState({
    name: "",
    description: "",
    username: "",
    password: "",
    payment_link: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (authenticated) {
      fetchClubs();
      fetchRegistrations();
    }
  }, [authenticated]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRegistrations((data as any[]).map(reg => ({
        ...reg,
        phone_number: reg.phone_number || null
      })) as Registration[]);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ payment_status: status })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Registration ${status.toLowerCase()}`);
      fetchRegistrations();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const getClubRegistrations = (clubId: number) => {
    return registrations.filter((r) => r.club_id === clubId);
  };

  const getStatusCounts = (clubId: number) => {
    const clubRegs = getClubRegistrations(clubId);
    return {
      total: clubRegs.length,
      paid: clubRegs.filter((r) => r.payment_status === "Paid").length,
      pending: clubRegs.filter((r) => r.payment_status === "Pending").length,
      rejected: clubRegs.filter((r) => r.payment_status === "Rejected").length,
    };
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      toast.success("Welcome, Root Admin!");
    } else {
      toast.error("Invalid credentials");
    }
  };

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase.from("clubs").select("*").order("name");
      if (error) throw error;
      setClubs((data as any[]).map(club => ({
        ...club,
        payment_link: club.payment_link || null
      })) as Club[]);
    } catch (error) {
      console.error("Error fetching clubs:", error);
    }
  };

  const handleAddClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let logoUrl = null;
      let qrUrl = null;

      if (logoFile) {
        logoUrl = await uploadFileToAppsScript(logoFile);
      }

      if (qrFile) {
        qrUrl = await uploadFileToAppsScript(qrFile);
      }

      const { error } = await supabase.from("clubs").insert({
        name: newClub.name,
        description: newClub.description,
        username: newClub.username,
        password: newClub.password,
        logo_url: logoUrl,
        qr_url: qrUrl,
        payment_link: newClub.payment_link || null,
      });

      if (error) throw error;

      toast.success("Club added successfully!");
      setShowAddModal(false);
      setNewClub({ name: "", description: "", username: "", password: "", payment_link: "" });
      setLogoFile(null);
      setQrFile(null);
      fetchClubs();
    } catch (error: any) {
      console.error("Error adding club:", error);
      toast.error(error.message || "Failed to add club");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;
    setLoading(true);
  
    try {
      // Step 1: Create a fresh update object from latest input state
      const updateData: any = {
        name: editingClub.name.trim(),
        description: editingClub.description.trim(),
        username: editingClub.username.trim(),
        payment_link: editingClub.payment_link || null,
      };
  
      // Step 2: Upload new files sequentially if selected
      if (logoFile) {
        const newLogoId = await uploadFileToAppsScript(logoFile);
        updateData.logo_url = newLogoId;
      } else if (editingClub.logo_url) {
        updateData.logo_url = editingClub.logo_url; // preserve old one
      }
  
      if (qrFile) {
        const newQrId = await uploadFileToAppsScript(qrFile);
        updateData.qr_url = newQrId;
      } else if (editingClub.qr_url) {
        updateData.qr_url = editingClub.qr_url; // preserve old one
      }
  
      // Step 3: Handle password change separately
      if (newPassword.trim()) {
        updateData.password = newPassword.trim();
      }
  
      // Step 4: Update Supabase
      const { error } = await supabase
        .from("clubs")
        .update(updateData)
        .eq("id", editingClub.id);
  
      if (error) throw error;
  
      toast.success("Club updated successfully!");
      setShowEditModal(false);
      setEditingClub(null);
      setLogoFile(null);
      setQrFile(null);
      setNewPassword("");
      fetchClubs();
    } catch (err: any) {
      console.error("Error updating club:", err);
      toast.error(err.message || "Failed to update club");
    } finally {
      setLoading(false);
    }
  };
  

  const handleDeleteClub = async (id: number) => {
    if (!confirm("Are you sure you want to delete this club?")) return;
    try {
      const { error } = await supabase.from("clubs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Club deleted successfully!");
      fetchClubs();
    } catch {
      toast.error("Failed to delete club");
    }
  };

  // --- LOGIN SCREEN ---
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Card className="w-full max-w-md bg-white/90 border border-primary/10 p-6 md:p-8 rounded-2xl shadow-xl backdrop-blur-sm">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
              EMC Root Admin
            </h1>
            <p className="text-sm text-muted-foreground">Event Management Committee - BNMIT</p>
          </div>
          <div className="flex items-center gap-2 mb-6 justify-center">
            <LogIn className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-primary">Admin Login</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="username" className="text-[#1B475D] font-medium">
                Username
              </Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/70 border border-[#1B475D]/20 h-11 rounded-lg 
                           placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-[#1B475D] font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/70 border border-[#1B475D]/20 h-11 rounded-lg 
                           placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
              />
            </div>
            <Button type="submit" className="w-full bg-[#1B475D] text-white h-11 hover:bg-[#163746]">
              Login
            </Button>
          </form>
          <Link to="/" className="block mt-4">
            <Button variant="ghost" className="w-full text-[#1B475D] hover:bg-[#1B475D]/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4 bg-white/60 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-sm border">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-primary flex items-center gap-2 mb-1">
              <Building2 className="w-6 h-6 md:w-8 md:h-8" />
              EMC Root Admin
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Event Management Committee - BNMIT
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Club
            </Button>
            <Link to="/">
              <Button variant="outline" className="shadow-sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Home
              </Button>
            </Link>
          </div>
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white/60 backdrop-blur-sm p-2 rounded-xl border shadow-sm overflow-x-auto">
            <TabsList className="bg-transparent w-full justify-start">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Building2 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              {clubs.map((club) => (
                <TabsTrigger 
                  key={club.id} 
                  value={`club-${club.id}`}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md whitespace-nowrap"
                >
                  {club.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Total Clubs</p>
                    <p className="text-3xl md:text-4xl font-bold">{clubs.length}</p>
                  </div>
                  <Building2 className="w-12 h-12 opacity-80" />
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Total Members</p>
                    <p className="text-3xl md:text-4xl font-bold">
                      {registrations.length}
                    </p>
                  </div>
                  <Users className="w-12 h-12 opacity-80" />
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Paid</p>
                    <p className="text-3xl md:text-4xl font-bold">
                      {registrations.filter((r) => r.payment_status === "Paid").length}
                    </p>
                  </div>
                  <CheckCircle className="w-12 h-12 opacity-80" />
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Pending</p>
                    <p className="text-3xl md:text-4xl font-bold">
                      {registrations.filter((r) => r.payment_status === "Pending").length}
                    </p>
                  </div>
                  <Clock className="w-12 h-12 opacity-80" />
                </div>
              </Card>
            </div>

            {/* All Clubs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {clubs.map((club) => {
                const counts = getStatusCounts(club.id);
                return (
                  <Card key={club.id} className="bg-white/90 rounded-xl shadow-lg border hover:shadow-xl transition-shadow overflow-hidden">
                    <div className="p-6">
                      {/* Club Header */}
                      <div className="flex items-start gap-4 mb-4">
                        {club.logo_url ? (
                          <img
                            src={`https://lh3.googleusercontent.com/d/${club.logo_url}`}
                            alt={`${club.name} logo`}
                            className="w-16 h-16 rounded-lg object-cover border-2 border-primary/20"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/64?text=Logo';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-primary mb-1 truncate">
                            {club.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {club.description || "No description"}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Total</p>
                          <p className="text-lg font-bold text-blue-600">{counts.total}</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Paid</p>
                          <p className="text-lg font-bold text-green-600">{counts.paid}</p>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Pending</p>
                          <p className="text-lg font-bold text-yellow-600">{counts.pending}</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Rejected</p>
                          <p className="text-lg font-bold text-red-600">{counts.rejected}</p>
                        </div>
                      </div>

                      {/* Payment QR Code */}
                      {club.qr_url && (
                        <div className="mb-4 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Payment QR Code
                          </p>
                          <img
                            src={`https://lh3.googleusercontent.com/d/${club.qr_url}`}
                            alt={`${club.name} payment QR`}
                            className="w-32 h-32 mx-auto rounded-lg object-contain bg-white p-2"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/128?text=QR';
                            }}
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setEditingClub(club);
                            setShowEditModal(true);
                            setNewPassword("");
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClub(club.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {clubs.length === 0 && (
              <Card className="bg-white/90 p-12 rounded-xl text-center">
                <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-primary mb-2">No Clubs Yet</h3>
                <p className="text-muted-foreground mb-4">Get started by adding your first club</p>
                <Button onClick={() => setShowAddModal(true)} className="bg-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Club
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* CLUB TABS */}
          {clubs.map((club) => {
            const clubRegs = getClubRegistrations(club.id);
            const counts = getStatusCounts(club.id);
            
            return (
              <TabsContent key={club.id} value={`club-${club.id}`} className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <Card className="bg-white/90 p-4 md:p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                      <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                        <p className="text-xl md:text-3xl font-bold">{counts.total}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-white/90 p-4 md:p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                      <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Paid</p>
                        <p className="text-xl md:text-3xl font-bold text-green-600">{counts.paid}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-white/90 p-4 md:p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                      <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
                        <p className="text-xl md:text-3xl font-bold text-yellow-600">{counts.pending}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-white/90 p-4 md:p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                      <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Rejected</p>
                        <p className="text-xl md:text-3xl font-bold text-red-600">{counts.rejected}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Registrations Table */}
                <Card className="overflow-hidden border bg-white/90 rounded-xl shadow-sm p-4 md:p-6">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 md:w-6 md:h-6" />
                    Registrations for {club.name}
                  </h2>
                  
                  {clubRegs.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold text-primary mb-2">No Registrations Yet</h3>
                      <p className="text-muted-foreground">Students will appear here once they register</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-4 md:mx-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden sm:table-cell">USN</TableHead>
                            <TableHead className="hidden md:table-cell">Email</TableHead>
                            <TableHead className="hidden lg:table-cell">Branch</TableHead>
                            <TableHead className="hidden lg:table-cell">Year</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clubRegs.map((reg) => (
                            <TableRow key={reg.id}>
                              <TableCell className="font-medium text-sm md:text-base">{reg.name}</TableCell>
                              <TableCell className="hidden sm:table-cell text-sm">{reg.usn}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm">{reg.email}</TableCell>
                              <TableCell className="hidden lg:table-cell text-sm">{reg.branch || "N/A"}</TableCell>
                              <TableCell className="hidden lg:table-cell text-sm">{reg.year || "N/A"}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    reg.payment_status === "Paid"
                                      ? "default"
                                      : reg.payment_status === "Rejected"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {reg.payment_status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1 md:gap-2">
                                  {reg.payment_proof_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedProof(reg.payment_proof_url);
                                        setShowProofModal(true);
                                      }}
                                      title="View Payment Proof"
                                    >
                                      <FileText className="w-3 h-3 md:w-4 md:h-4" />
                                    </Button>
                                  )}
                                  {reg.payment_status !== "Paid" && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleStatusChange(reg.id, "Paid")}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                      title="Approve Payment"
                                    >
                                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                                    </Button>
                                  )}
                                  {reg.payment_status !== "Rejected" && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleStatusChange(reg.id, "Rejected")}
                                      className="text-xs"
                                      title="Reject Payment"
                                    >
                                      <XCircle className="w-3 h-3 md:w-4 md:h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* PROOF MODAL */}
        <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
          <DialogContent className="max-w-3xl bg-white">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
              <DialogDescription>
                Review the payment proof submitted by the student
              </DialogDescription>
            </DialogHeader>
            {selectedProof && (
              <div className="mt-4">
                <img
                  src={
                    selectedProof.includes("http")
                      ? selectedProof
                      : `https://lh3.googleusercontent.com/d/${selectedProof}`
                  }
                  alt="Payment Proof"
                  className="w-full h-auto rounded-lg border object-contain max-h-[80vh]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    toast.error("Unable to load payment proof image");
                  }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ADD CLUB MODAL */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent
            className="max-w-2xl bg-[#FFF5D0] border border-[#1B475D]/20 rounded-2xl shadow-lg 
                       max-h-[90vh] overflow-y-auto text-[#1B475D]"
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#1B475D]">
                Add New Club
              </DialogTitle>
              <DialogDescription className="text-[#1B475D]/70">
                Fill in the details to create a new club.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddClub} className="space-y-4 mt-4">
              <div>
                <Label className="text-[#1B475D] font-medium">Club Name *</Label>
                <Input
                  placeholder="Enter club name"
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  className="bg-white/70 border border-[#1B475D]/20 h-11 rounded-lg
                             placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
                />
              </div>

              <div>
                <Label className="text-[#1B475D] font-medium">Description</Label>
                <Textarea
                  placeholder="Enter description"
                  rows={3}
                  value={newClub.description}
                  onChange={(e) =>
                    setNewClub({ ...newClub, description: e.target.value })
                  }
                  className="bg-white/70 border border-[#1B475D]/20 rounded-lg
                             placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#1B475D] font-medium">Admin Username *</Label>
                  <Input
                    placeholder="Set username"
                    value={newClub.username}
                    onChange={(e) =>
                      setNewClub({ ...newClub, username: e.target.value })
                    }
                    className="bg-white/70 border border-[#1B475D]/20 h-11 rounded-lg
                               placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
                  />
                </div>
                <div>
                  <Label className="text-[#1B475D] font-medium">Admin Password *</Label>
                  <Input
                    type="password"
                    placeholder="Set password"
                    value={newClub.password}
                    onChange={(e) =>
                      setNewClub({ ...newClub, password: e.target.value })
                    }
                    className="bg-white/70 border border-[#1B475D]/20 h-11 rounded-lg
                               placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[#1B475D] font-medium">Payment Link</Label>
                <Input
                  type="url"
                  placeholder="Enter payment link (optional)"
                  value={newClub.payment_link}
                  onChange={(e) =>
                    setNewClub({ ...newClub, payment_link: e.target.value })
                  }
                  className="bg-white/70 border border-[#1B475D]/20 h-11 rounded-lg
                             placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#1B475D] font-medium">Club Logo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="bg-white/70 border border-[#1B475D]/20 rounded-lg p-2 text-[#1B475D]"
                  />
                </div>
                <div>
                  <Label className="text-[#1B475D] font-medium">Payment QR Code</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                    className="bg-white/70 border border-[#1B475D]/20 rounded-lg p-2 text-[#1B475D]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border-[#1B475D]/20 bg-white/80 text-[#1B475D]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#1B475D] text-white hover:bg-[#163746]"
                >
                  {loading ? "Adding..." : "Add Club"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* EDIT CLUB MODAL */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent
            className="max-w-2xl bg-[#FFF5D0] border border-[#1B475D]/20 rounded-2xl shadow-lg
                       max-h-[90vh] overflow-y-auto text-[#1B475D]"
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#1B475D]">
                Edit {editingClub?.name}
              </DialogTitle>
              <DialogDescription className="text-[#1B475D]/70">
                Update the club's details below.
              </DialogDescription>
            </DialogHeader>

            {editingClub && (
              <form onSubmit={handleEditClub} className="space-y-4 mt-4">
                <div>
                  <Label className="text-[#1B475D] font-medium">Club Name *</Label>
                  <Input
                    placeholder="Enter club name"
                    value={editingClub.name}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, name: e.target.value })
                    }
                    className="bg-white/70 border border-[#1B475D]/20 h-11 rounded-lg
                               placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
                  />
                </div>

                <div>
                  <Label className="text-[#1B475D] font-medium">Description</Label>
                  <Textarea
                    placeholder="Enter description"
                    rows={3}
                    value={editingClub.description}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, description: e.target.value })
                    }
                    className="bg-white/70 border border-[#1B475D]/20 rounded-lg
                               placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#1B475D] font-medium">Admin Username *</Label>
                    <Input
                      placeholder="Set username"
                      value={editingClub.username}
                      onChange={(e) =>
                        setEditingClub({ ...editingClub, username: e.target.value })
                      }
                      className="bg-white/70 border border-[#1B475D]/20 h-11 rounded-lg
                                 placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#1B475D] font-medium">New Password</Label>
                    <Input
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white/70 border border-[#1B475D]/20 h-11 rounded-lg
                                 placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[#1B475D] font-medium">Payment Link</Label>
                  <Input
                    type="url"
                    placeholder="Enter payment link (optional)"
                    value={editingClub.payment_link || ""}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, payment_link: e.target.value })
                    }
                    className="bg-white/70 border border-[#1B475D]/20 h-11 rounded-lg
                               placeholder:italic placeholder:text-[#1B475D]/70 text-[#1B475D] mt-1 focus:border-[#1B475D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#1B475D] font-medium">
                      Club Logo (leave blank to keep current)
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="bg-white/70 border border-[#1B475D]/20 rounded-lg p-2 text-[#1B475D]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#1B475D] font-medium">
                      Payment QR Code (leave blank to keep current)
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                      className="bg-white/70 border border-[#1B475D]/20 rounded-lg p-2 text-[#1B475D]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 border-[#1B475D]/20 bg-white/80 text-[#1B475D]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#1B475D] text-white hover:bg-[#163746]"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RootAdmin;