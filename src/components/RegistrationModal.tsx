import { useState } from "react";
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
import { Upload, QrCode, User, Mail, GraduationCap, BookOpen, Calendar, Receipt } from "lucide-react";

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
      let proofUrl = null;
      const fileExt = paymentProof.name.split(".").pop();
      const fileName = `${formData.usn}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment_proofs")
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("payment_proofs").getPublicUrl(fileName);

      proofUrl = publicUrl;

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
      <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto text-gray-900 p-0">
        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm px-6 py-5 border-b border-gray-200/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Join {clubName}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm mt-1">
              Complete the form below and upload your payment proof to finalize your registration
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {qrUrl && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Scan to Pay</p>
                    <p className="text-sm text-slate-600">Registration Fee: ₹100</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200">
                  <img
                    src={qrUrl}
                    alt="Payment QR Code"
                    className="w-56 h-56 rounded-lg"
                  />
                </div>
              </div>
              <p className="text-xs text-center text-slate-600 mt-3">
                Use any UPI app to scan and complete the payment
              </p>
            </div>
          )}

          <div className="space-y-5">
            <div className="border-l-4 border-blue-600 pl-4 py-1">
              <h3 className="font-semibold text-gray-900 text-lg">Personal Information</h3>
              <p className="text-sm text-gray-500">Enter your basic details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-800 font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Full Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-gray-50/50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/50 h-11 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usn" className="text-gray-800 font-medium flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  USN <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="usn"
                  required
                  placeholder="1BG22CS001"
                  value={formData.usn}
                  onChange={(e) =>
                    setFormData({ ...formData, usn: e.target.value.toUpperCase() })
                  }
                  className="bg-gray-50/50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/50 h-11 transition-all uppercase"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email" className="text-gray-800 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Email Address <span className="text-red-400">*</span>
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
                  className="bg-gray-50/50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/50 h-11 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch" className="text-gray-800 font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Branch <span className="text-red-400">*</span>
                </Label>
                <Select
                  required
                  value={formData.branch}
                  onValueChange={(v) => setFormData({ ...formData, branch: v })}
                >
                  <SelectTrigger className="bg-gray-50/50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/50 h-11">
                    <SelectValue placeholder="Choose your branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900 border-gray-200">
                    <SelectItem value="CSE">Computer Science</SelectItem>
                    <SelectItem value="ECE">Electronics & Communication</SelectItem>
                    <SelectItem value="MECH">Mechanical</SelectItem>
                    <SelectItem value="AI/ML">Artificial Intelligence & ML</SelectItem>
                    <SelectItem value="ISE">Information Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year" className="text-gray-800 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Year <span className="text-red-400">*</span>
                </Label>
                <Select
                  required
                  value={formData.year}
                  onValueChange={(v) => setFormData({ ...formData, year: v })}
                >
                  <SelectTrigger className="bg-gray-50/50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/50 h-11">
                    <SelectValue placeholder="Select your year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900 border-gray-200">
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="border-l-4 border-emerald-600 pl-4 py-1">
              <h3 className="font-semibold text-gray-900 text-lg">Payment Details</h3>
              <p className="text-sm text-gray-500">Provide payment confirmation</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upi" className="text-gray-800 font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                UPI Transaction ID <span className="text-gray-500 text-xs font-normal">(Optional)</span>
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
                className="bg-gray-50/50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/50 h-11 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof" className="text-gray-800 font-medium flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                Payment Proof Screenshot <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <div className="bg-gray-100/30 p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 transition-all cursor-pointer group">
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
                    <div className="w-12 h-12 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center group-hover:bg-emerald-500/30 transition-all">
                      <Upload className="w-6 h-6 text-emerald-400" />
                    </div>
                    {paymentProof ? (
                      <div>
                        <p className="text-gray-900 font-medium">{paymentProof.name}</p>
                        <p className="text-xs text-emerald-400 mt-1">File selected successfully</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-900 font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-start gap-2 mt-2">
                <span className="text-amber-400 mt-0.5">⚠</span>
                Please ensure your payment screenshot is clear and shows the transaction details
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 text-gray-800 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-800/30 border-t-gray-800 rounded-full animate-spin" />
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