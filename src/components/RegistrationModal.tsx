import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, QrCode } from "lucide-react";

interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
  clubId: number;
  clubName: string;
  qrUrl: string | null;
}

const RegistrationModal = ({ open, onClose, clubId, clubName, qrUrl }: RegistrationModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    usn: "",
    email: "",
    branch: "",
    year: "",
    upi_transaction_id: "",
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.branch || !formData.year) {
      toast.error("Incomplete Form", { description: "Please select your branch and year." });
      return;
    }
    
    if (!paymentProof) {
      toast.error("Payment Proof Required", { description: "Please upload a payment proof screenshot." });
      return;
    }

    setLoading(true);

    try {
      // Upload payment proof
      let proofUrl = null;
      const fileExt = paymentProof.name.split(".").pop();
      const fileName = `${formData.usn}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("payment_proofs")
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("payment_proofs")
        .getPublicUrl(fileName);
      
      proofUrl = publicUrl;

      // Insert registration
      const { error } = await supabase.from("registrations").insert({
        name: formData.name,
        usn: formData.usn.toUpperCase(),
        email: formData.email,
        branch: formData.branch,
        year: parseInt(formData.year),
        club_id: clubId,
        payment_proof_url: proofUrl,
        upi_transaction_id: formData.upi_transaction_id,
      });

      if (error) {
        if (error.message.includes("club limit")) {
          toast.error("Club Limit Reached", {
            description: "You can only join a maximum of 3 clubs.",
          });
        } else {
          throw error;
        }
      } else {
        toast.success("Registration Successful!", {
          description: "Your payment is under verification by the club.",
        });
        onClose();
        setFormData({
          name: "",
          usn: "",
          email: "",
          branch: "",
          year: "",
          upi_transaction_id: "",
        });
        setPaymentProof(null);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error("Registration Failed", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gradient">Join {clubName}</DialogTitle>
          <DialogDescription>
            Fill in your details and upload payment proof to complete registration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {qrUrl && (
            <div className="glass p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <QrCode className="w-4 h-4" />
                Payment QR Code (₹100)
              </div>
              <img src={qrUrl} alt="Payment QR" className="w-48 h-48 mx-auto rounded-lg" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usn">USN *</Label>
              <Input
                id="usn"
                required
                placeholder="1BG22CS001"
                value={formData.usn}
                onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                className="glass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="glass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch *</Label>
              <Select required value={formData.branch} onValueChange={(v) => setFormData({ ...formData, branch: v })}>
                <SelectTrigger className="glass">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSE">Computer Science</SelectItem>
                  <SelectItem value="ECE">Electronics & Communication</SelectItem>
                  <SelectItem value="MECH">Mechanical</SelectItem>
                  <SelectItem value="AI/ML">Artificial Intelligence & Machine Learning</SelectItem>
                  <SelectItem value="ISE">Information Science</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Select required value={formData.year} onValueChange={(v) => setFormData({ ...formData, year: v })}>
                <SelectTrigger className="glass">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upi">UPI Transaction ID</Label>
              <Input
                id="upi"
                placeholder="Optional"
                value={formData.upi_transaction_id}
                onChange={(e) => setFormData({ ...formData, upi_transaction_id: e.target.value })}
                className="glass"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof">Payment Proof *</Label>
            <div className="glass p-4 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors">
              <Input
                id="proof"
                type="file"
                accept="image/*"
                required
                onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Upload screenshot of payment confirmation
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-primary">
              {loading ? "Submitting..." : "Submit Registration"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationModal;
