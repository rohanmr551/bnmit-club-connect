import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight } from "lucide-react";
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
  const [imageLoaded, setImageLoaded] = useState(false);

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
        className="glass glass-hover overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl m-3 md:m-0 border-2 border-transparent hover:border-[#1B475D]/20"
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowModal(true);
          }
        }}
        aria-label={`Join ${name} club`}
      >
        {/* Club Logo Section */}
        <div className="relative h-40 md:h-48 overflow-hidden bg-gradient-to-br from-white/80 to-white/60 flex items-center justify-center">
          {resolvedLogoUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-white/50 relative">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-[#1B475D]/20 border-t-[#1B475D] rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={resolvedLogoUrl}
                alt={`${name} logo`}
                className={`max-h-full max-w-full object-contain p-6 transition-all duration-500 group-hover:scale-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  console.error("Logo failed to load:", resolvedLogoUrl);
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
              <span className="text-7xl md:text-8xl font-bold text-white opacity-30 transform transition-transform duration-500 group-hover:scale-110">
                {name.charAt(0)}
              </span>
            </div>
          )}
          
          {memberCount !== undefined && (
            <Badge className="absolute top-3 right-3 bg-white/95 text-[#1B475D] font-semibold shadow-lg backdrop-blur-sm border border-[#1B475D]/10 transition-all duration-300 group-hover:scale-110">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              {memberCount}
            </Badge>
          )}

          {/* Decorative Corner Accent */}
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-[#FFF5D0]/30 rounded-tl-full transform translate-x-10 translate-y-10 transition-transform duration-500 group-hover:translate-x-8 group-hover:translate-y-8"></div>
        </div>

        {/* Club Info Section */}
        <div className="p-5 md:p-6 space-y-3 md:space-y-4 bg-gradient-to-br from-[#FFF5D0]/60 to-[#FFF5D0]/40 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-[#1B475D] to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl md:text-2xl font-bold text-[#1B475D] mb-2 leading-tight group-hover:text-[#163746] transition-colors duration-300">
              {name}
            </h3>
            
            <p className="text-sm md:text-base text-[#1B475D]/80 line-clamp-2 leading-relaxed min-h-[2.5rem] md:min-h-[3rem]">
              {description || "Join this amazing club!"}
            </p>
          </div>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            className="w-full bg-[#1B475D] text-white hover:bg-[#163746] transition-all duration-300 rounded-full font-semibold py-5 md:py-6 shadow-lg hover:shadow-xl group/btn relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Join Club
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </span>
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
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