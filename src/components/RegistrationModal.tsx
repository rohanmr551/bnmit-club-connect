import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Upload,
  QrCode,
  User,
  Mail,
  GraduationCap,
  BookOpen,
  Calendar,
  Receipt,
} from "lucide-react";

interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
  clubId: number;
  clubName: string;
  qrUrl: string | null;
}

const RegistrationModal = ({
  open,
  onClose,
  clubId,
  clubName,
  qrUrl,
}: RegistrationModalProps) => {
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
  const navigate = useNavigate();

  // ✅ Handle back button navigation on mobile
  useEffect(() => {
    if (open) {
      window.history.pushState({ modalOpen: true }, "");
    }

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      if (open) onClose();
      else navigate("/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, onClose, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.branch || !formData.year) {
      toast.error("Incomplete Form", {
        description: "Please select your branch and year.",
      });
      return;
    }

    if (!paymentProof) {
      toast.error("Payment Proof Required", {
        description: "Please upload a payment proof screenshot.",
      });
      return;
    }

    setLoading(true);

    try {
      const fileExt = paymentProof.name.split(".").pop();
      const fileName = `${formData.usn}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("payment_proofs")
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("payment_proofs").getPublicUrl(fileName);

      const { error } = await supabase.from("registrations").insert({
        name: formData.name,
        usn: formData.usn.toUpperCase(),
        email: formData.email,
        branch: formData.branch,
        year: parseInt(formData.year),
        club_id: clubId,
        payment_proof_url: publicUrl,
        upi_transaction_id: formData.upi_transaction_id,
      });

      if (error) {
        if (error.message.includes("club limit")) {
          toast.error("Club Limit Reached", {
            description: "You can only join a maximum of 3 clubs.",
          });
        } else throw error;
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
      <DialogContent
        className="bg-card text-card-foreground w-[95%] sm:w-auto max-w-3xl max-h-[90vh]
                   overflow-y-auto p-4 sm:p-0 rounded-2xl shadow-lg mx-auto 
                   [&>button]:text-foreground [&>button]:opacity-100 [&>button:hover]:opacity-80 mt-2"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm px-6 pt-8 pb-5 border-b rounded-t-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1B475D]">
              Join {clubName}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/90 text-sm mt-1">
              Complete the form below and upload your payment proof to finalize
              your registration.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* QR Section */}
          {qrUrl && (
            <div className="bg-muted/40 p-5 rounded-xl border border-border/70">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1B475D]/10 rounded-lg">
                    <QrCode className="w-5 h-5 text-[#1B475D]" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Scan to Pay</p>
                    <p className="text-sm text-muted-foreground/90">
                      Registration Fee: ₹100
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-background p-3 rounded-xl shadow-md border border-border/70">
                  <img
                    src={qrUrl}
                    alt="Payment QR Code"
                    className="w-56 h-56 rounded-lg"
                  />
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground/90 mt-3">
                Use any UPI app to scan and complete the payment.
              </p>
            </div>
          )}

          {/* Personal Info */}
          <div className="space-y-5">
            <div className="border-l-4 border-[#1B475D] pl-4 py-1">
              <h3 className="font-semibold text-foreground text-lg">
                Personal Information
              </h3>
              <p className="text-sm text-muted-foreground/90">
                Enter your basic details
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-[#1B475D]" />
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-11 transition-all bg-muted/40 border border-border/70 
                             placeholder:italic placeholder:text-foreground/90 text-foreground"
                />
              </div>

              {/* USN */}
              <div className="space-y-2">
                <Label
                  htmlFor="usn"
                  className="font-medium flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4 text-[#1B475D]" />
                  USN <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="usn"
                  required
                  placeholder="1BG22CS001"
                  value={formData.usn}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usn: e.target.value.toUpperCase(),
                    })
                  }
                  className="h-11 transition-all uppercase bg-muted/40 border border-border/70 
                             placeholder:italic placeholder:text-foreground/90 text-foreground"
                />
              </div>

              {/* Email */}
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="email"
                  className="font-medium flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-[#1B475D]" />
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="johndoe@bnmit.in"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-11 transition-all bg-muted/40 border border-border/70 
                             placeholder:italic placeholder:text-foreground/90 text-foreground"
                />
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <Label
                  htmlFor="branch"
                  className="font-medium flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-[#1B475D]" />
                  Branch <span className="text-destructive">*</span>
                </Label>
                <Select
                  required
                  value={formData.branch}
                  onValueChange={(v) =>
                    setFormData({ ...formData, branch: v })
                  }
                >
                  <SelectTrigger className="h-11 bg-muted/40 border border-border/70 text-foreground">
                    <SelectValue placeholder="Choose your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSE">Computer Science</SelectItem>
                    <SelectItem value="ECE">
                      Electronics & Communication
                    </SelectItem>
                    <SelectItem value="MECH">Mechanical</SelectItem>
                    <SelectItem value="AI/ML">
                      Artificial Intelligence & ML
                    </SelectItem>
                    <SelectItem value="ISE">Information Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <Label
                  htmlFor="year"
                  className="font-medium flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-[#1B475D]" />
                  Year <span className="text-destructive">*</span>
                </Label>
                <Select
                  required
                  value={formData.year}
                  onValueChange={(v) =>
                    setFormData({ ...formData, year: v })
                  }
                >
                  <SelectTrigger className="h-11 bg-muted/40 border border-border/70 text-foreground">
                    <SelectValue placeholder="Select your year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-5">
            <div className="border-l-4 border-[#1B475D] pl-4 py-1">
              <h3 className="font-semibold text-foreground text-lg">
                Payment Details
              </h3>
              <p className="text-sm text-muted-foreground/90">
                Provide payment confirmation
              </p>
            </div>

            {/* UPI Transaction ID */}
            <div className="space-y-2">
              <Label
                htmlFor="upi"
                className="font-medium flex items-center gap-2"
              >
                <Receipt className="w-4 h-4 text-[#1B475D]" />
                UPI Transaction ID{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (Optional)
                </span>
              </Label>
              <Input
                id="upi"
                placeholder="Enter transaction ID if available"
                value={formData.upi_transaction_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    upi_transaction_id: e.target.value,
                  })
                }
                className="h-11 transition-all bg-muted/40 border border-border/70 
                           placeholder:italic placeholder:text-foreground/90 text-foreground"
              />
            </div>

            {/* Payment Proof */}
            <div className="space-y-2">
              <Label
                htmlFor="proof"
                className="font-medium flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-[#1B475D]" />
                Payment Proof Screenshot{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <div className="bg-muted/30 p-6 rounded-xl border-2 border-dashed hover:border-[#1B475D] transition-all cursor-pointer group">
                  <Input
                    id="proof"
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) =>
                      setPaymentProof(e.target.files?.[0] || null)
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="text-center space-y-2 pointer-events-none">
                    <div className="w-12 h-12 mx-auto bg-[#1B475D]/15 rounded-full flex items-center justify-center group-hover:bg-[#1B475D]/25 transition-all">
                      <Upload className="w-6 h-6 text-[#1B475D]" />
                    </div>
                    {paymentProof ? (
                      <div>
                        <p className="font-medium">{paymentProof.name}</p>
                        <p className="text-xs text-[#1B475D] mt-1">
                          File selected successfully
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground/90 mt-1">
                          PNG, JPG, JPEG up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/90 flex items-start gap-2 mt-2">
                <span className="text-warning mt-0.5">⚠</span>
                Please ensure your payment screenshot is clear and shows the
                transaction details.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-border/70">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 gradient-primary font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationModal;
