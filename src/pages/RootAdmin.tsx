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
}

interface Registration {
  id: number;
  name: string;
  usn: string;
  email: string;
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
      setRegistrations(data || []);
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
      setClubs(data || []);
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
      });

      if (error) throw error;

      toast.success("Club added successfully!");
      setShowAddModal(false);
      setNewClub({ name: "", description: "", username: "", password: "" });
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
            </Button>รา
          </Link>
        </Card>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
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
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Club
            </Button>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Home
              </Button>
            </Link>
          </div>
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/70 p-1 rounded-lg border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {clubs.map((club) => (
              <TabsTrigger key={club.id} value={`club-${club.id}`}>
                {club.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="overflow-hidden border bg-white/90 rounded-xl shadow-sm p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                All Clubs
              </h2>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="hidden sm:table-cell">Members</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clubs.map((club) => {
                      const counts = getStatusCounts(club.id);
                      return (
                        <TableRow key={club.id}>
                          <TableCell>
                            <div className="flex items-center gap-2 md:gap-3">
                              {club.logo_url && (
                                <img
                                  src={`https://lh3.googleusercontent.com/d/${club.logo_url}`}
                                  alt="Logo"
                                  className="w-8 h-8 md:w-10 md:h-10 rounded object-cover"
                                />
                              )}
                              <span className="font-semibold text-sm md:text-base">{club.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs truncate text-sm">
                            {club.description}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="secondary" className="text-xs">{counts.total}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 md:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingClub(club);
                                  setShowEditModal(true);
                                  setNewPassword("");
                                }}
                              >
                                <Edit className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteClub(club.id)}
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
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
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Registrations</h2>
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden sm:table-cell">USN</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
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
                              <div className="flex flex-col sm:flex-row gap-1 md:gap-2">
                                {reg.payment_proof_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedProof(reg.payment_proof_url);
                                      setShowProofModal(true);
                                    }}
                                  >
                                    <FileText className="w-3 h-3 md:w-4 md:h-4" />
                                  </Button>
                                )}
                                {reg.payment_status !== "Paid" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusChange(reg.id, "Paid")}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
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
            </DialogHeader>
            {selectedProof && (
              <img
                src={selectedProof}
                alt="Payment Proof"
                className="w-full h-auto rounded-lg"
              />
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
