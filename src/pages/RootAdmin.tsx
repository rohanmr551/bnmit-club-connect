import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Upload, Edit } from "lucide-react";
import { Link } from "react-router-dom";

// Hardcoded admin credentials from env
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
    if (authenticated) {
      fetchClubs();
    }
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
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .order("name");

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

      // Upload logo
      if (logoFile) {
        const fileName = `${newClub.username}_logo_${Date.now()}.${logoFile.name.split(".").pop()}`;
        const { error: uploadError } = await supabase.storage
          .from("club_logos")
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("club_logos")
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      // Upload QR
      if (qrFile) {
        const fileName = `${newClub.username}_qr_${Date.now()}.${qrFile.name.split(".").pop()}`;
        const { error: uploadError } = await supabase.storage
          .from("payment_qr")
          .upload(fileName, qrFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("payment_qr")
          .getPublicUrl(fileName);
        
        qrUrl = publicUrl;
      }

      // Insert club
      const { data, error } = await supabase.from("clubs").insert({
        name: newClub.name,
        description: newClub.description,
        username: newClub.username,
        password: newClub.password,
        logo_url: logoUrl,
        qr_url: qrUrl,
      }).select();

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

      // Upload logo
      if (logoFile) {
        const fileName = `${editingClub.username}_logo_${Date.now()}.${logoFile.name.split(".").pop()}`;
        const { error: uploadError } = await supabase.storage
          .from("club_logos")
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("club_logos")
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      // Upload QR
      if (qrFile) {
        const fileName = `${editingClub.username}_qr_${Date.now()}.${qrFile.name.split(".").pop()}`;
        const { error: uploadError } = await supabase.storage
          .from("payment_qr")
          .upload(fileName, qrFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("payment_qr")
          .getPublicUrl(fileName);
        
        qrUrl = publicUrl;
      }
      
      const updateData: any = {
        name: editingClub.name,
        description: editingClub.description,
        username: editingClub.username,
        logo_url: logoUrl,
        qr_url: qrUrl,
      };

      if (newPassword) {
        updateData.password = newPassword;
      }

      // Update club
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
    } catch (error) {
      toast.error("Failed to delete club");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass w-full max-w-md p-8">
          <h1 className="text-3xl font-bold text-gradient mb-6">Root Admin Login</h1>
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
            <Button type="submit" className="w-full gradient-primary">
              Login
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
            <h1 className="text-3xl font-bold text-gradient">Root Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage clubs and registrations</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddModal(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Club
            </Button>
            <Link to="/">
              <Button variant="outline" className="glass-hover">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Clubs Table */}
        <Card className="glass overflow-hidden">
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
                    <TableCell className="font-medium">{club.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{club.description}</TableCell>
                    <TableCell>{club.username}</TableCell>
                    <TableCell>
                      {club.logo_url && (
                        <img src={club.logo_url} alt="Logo" className="w-10 h-10 rounded object-cover" />
                      )}
                    </TableCell>
                    <TableCell>
                      {club.qr_url && (
                        <img src={club.qr_url} alt="QR" className="w-10 h-10 rounded object-cover" />
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

        {/* Add Club Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="glass max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gradient">Add New Club</DialogTitle>
              <DialogDescription>Fill in the details to create a new club.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddClub} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input
                  id="name"
                  required
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  className="glass"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="club-username">Admin Username *</Label>
                  <Input
                    id="club-username"
                    required
                    value={newClub.username}
                    onChange={(e) => setNewClub({ ...newClub, username: e.target.value })}
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="club-password">Admin Password *</Label>
                  <Input
                    id="club-password"
                    type="password"
                    required
                    value={newClub.password}
                    onChange={(e) => setNewClub({ ...newClub, password: e.target.value })}
                    className="glass"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Club Logo</Label>
                  <div className="glass p-4 rounded-lg">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qr">Payment QR Code</Label>
                  <div className="glass p-4 rounded-lg">
                    <Input
                      id="qr"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 gradient-primary">
                  {loading ? "Adding..." : "Add Club"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Club Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="glass max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gradient">Edit Club</DialogTitle>
              <DialogDescription>Update the details for the selected club.</DialogDescription>
            </DialogHeader>

            {editingClub && (
              <form onSubmit={handleEditClub} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Club Name *</Label>
                  <Input
                    id="edit-name"
                    required
                    value={editingClub.name}
                    onChange={(e) => setEditingClub({ ...editingClub, name: e.target.value })}
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingClub.description}
                    onChange={(e) => setEditingClub({ ...editingClub, description: e.target.value })}
                    className="glass"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-club-username">Admin Username *</Label>
                    <Input
                      id="edit-club-username"
                      required
                      value={editingClub.username}
                      onChange={(e) => setEditingClub({ ...editingClub, username: e.target.value })}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-club-password">New Password</Label>
                    <Input
                      id="edit-club-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="glass"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-logo">Club Logo</Label>
                    <div className="glass p-4 rounded-lg">
                      <Input
                        id="edit-logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-qr">Payment QR Code</Label>
                    <div className="glass p-4 rounded-lg">
                      <Input
                        id="edit-qr"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 gradient-primary">
                    {loading ? "Updating..." : "Update Club"}
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
