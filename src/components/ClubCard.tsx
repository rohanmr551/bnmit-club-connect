import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useState } from "react";
import RegistrationModal from "./RegistrationModal";

interface ClubCardProps {
  id: number;
  name: string;
  description: string;
  logo_url: string | null;
  qr_url: string | null;
  memberCount?: number;
}

const ClubCard = ({
  id,
  name,
  description,
  logo_url,
  qr_url,
  memberCount,
}: ClubCardProps) => {
  const [showModal, setShowModal] = useState(false);

  // ✅ Ensure QR works even if only fileId is stored
  const resolvedQrUrl = qr_url
    ? qr_url.includes("http")
      ? qr_url
      : `https://lh3.googleusercontent.com/d/${qr_url}`
    : null;

  // ✅ Ensure logo also loads if only fileId is stored
  const resolvedLogoUrl = logo_url
    ? logo_url.includes("http")
      ? logo_url
      : `https://lh3.googleusercontent.com/d/${logo_url}`
    : null;

  return (
    <>
      <Card
        className="glass glass-hover overflow-hidden group cursor-pointer transition-transform duration-300 hover:scale-[1.02] m-3 md:m-0"
        onClick={() => setShowModal(true)}
      >
        {/* Club Logo Section */}
        <div className="relative h-40 md:h-48 overflow-hidden bg-white/60 flex items-center justify-center">
          {resolvedLogoUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-white/50">
              <img
                src={resolvedLogoUrl}
                alt={`${name} logo`}
                className="max-h-full max-w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  console.error("Logo failed to load:", resolvedLogoUrl);
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center">
              <span className="text-6xl font-bold text-white opacity-20">
                {name.charAt(0)}
              </span>
            </div>
          )}

          {memberCount !== undefined && (
            <Badge className="absolute top-4 right-4 bg-white/90 text-primary">
              <Users className="w-3 h-3 mr-1" />
              {memberCount}
            </Badge>
          )}
        </div>

        {/* Club Info Section */}
        <div className="p-4 md:p-6 space-y-3 md:space-y-4 bg-[#FFF5D0]/50">
          <h3 className="text-xl md:text-2xl font-bold text-[#1B475D]">{name}</h3>
          <p className="text-sm md:text-base text-[#1B475D]/70 line-clamp-2">
            {description || "Join this amazing club!"}
          </p>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            className="w-full bg-[#1B475D] text-white hover:bg-[#163746] transition-all duration-300 rounded-full"
          >
            Join Club
          </Button>
        </div>
      </Card>

      {/* ✅ Uses updated RegistrationModal */}
      <RegistrationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        clubId={id}
        clubName={name}
        qrUrl={resolvedQrUrl}
      />
    </>
  );
};

export default ClubCard;
