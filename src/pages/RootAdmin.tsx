import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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
  Key,
  Image as ImageIcon,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";

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

const RootAdmin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (authenticated) fetchClubs();
  }, [authenticated]);

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
        const fileName = `${newClub.username}_logo_${Date.now()}.${logoFile.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("club_logos").upload(fileName, logoFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("club_logos").getPublicUrl(fileName);
        logoUrl = publicUrl;
      }

      if (qrFile) {
        const fileName = `${newClub.username}_qr_${Date.now()}.${qrFile.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("payment_qr").upload(fileName, qrFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("payment_qr").getPublicUrl(fileName);
        qrUrl = publicUrl;
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
      let logoUrl = editingClub.logo_url;
      let qrUrl = editingClub.qr_url;

      if (logoFile) {
        const fileName = `${editingClub.username}_logo_${Date.now()}.${logoFile.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("club_logos").upload(fileName, logoFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("club_logos").getPublicUrl(fileName);
        logoUrl = publicUrl;
      }

      if (qrFile) {
        const fileName = `${editingClub.username}_qr_${Date.now()}.${qrFile.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("payment_qr").upload(fileName, qrFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("payment_qr").getPublicUrl(fileName);
        qrUrl = publicUrl;
      }

      const updateData: any = {
        name: editingClub.name,
        description: editingClub.description,
        username: editingClub.username,
        logo_url: logoUrl,
        qr_url: qrUrl,
      };
      if (newPassword) updateData.password = newPassword;

      const { error } = await supabase.from("clubs").update(updateData).eq("id", editingClub.id);
      if (error) throw error;

      toast.success("Club updated successfully!");
      setShowEditModal(false);
      setEditingClub(null);
      setLogoFile(null);
      setQrFile(null);
      setNewPassword("");
      fetchClubs();
    } catch (error: any) {
      console.error("Error updating club:", error);
      toast.error(error.message || "Failed to update club");
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF5D0]">
        <Card className="w-full max-w-md bg-white/80 border border-[#1B475D]/20 p-8 rounded-2xl shadow-lg backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-[#1B475D] flex items-center gap-2 mb-6">
            <LogIn className="w-6 h-6 text-[#1B475D]" /> Root Admin Login
          </h1>
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
    <div className="min-h-screen p-4 md:p-8 bg-[#FFF5D0]">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1B475D] flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#1B475D]" />
              Root Admin Dashboard
            </h1>
            <p className="text-[#1B475D]/70">Manage clubs and registrations</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#1B475D] text-white hover:bg-[#163746]"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Club
            </Button>
            <Link to="/">
              <Button variant="outline" className="border-[#1B475D]/40 text-[#1B475D] hover:bg-[#1B475D]/10">
                <ArrowLeft className="w-4 h-4 mr-2" /> Home
              </Button>
            </Link>
          </div>
        </div>

        {/* TABLE */}
        <Card className="overflow-hidden border border-[#1B475D]/20 bg-white/70 rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell className="font-semibold">{club.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{club.description}</TableCell>
                    <TableCell>{club.username}</TableCell>
                    <TableCell>
                      {club.logo_url && (
                        <img
                          src={club.logo_url}
                          alt="Logo"
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {club.qr_url && (
                        <img
                          src={club.qr_url}
                          alt="QR"
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingClub(club);
                            setShowEditModal(true);
                            setNewPassword("");
                          }}
                          className="border-[#1B475D]/30 text-[#1B475D]"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClub(club.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

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
