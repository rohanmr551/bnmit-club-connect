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

const ClubCard = ({ id, name, description, logo_url, qr_url, memberCount }: ClubCardProps) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="glass glass-hover overflow-hidden group">
        <div className="relative h-48 overflow-hidden">
          {logo_url ? (
            <img
              src={logo_url}
              alt={`${name} logo`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
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
        
        <div className="p-6 space-y-4">
          <h3 className="text-2xl font-bold text-gradient">{name}</h3>
          <p className="text-muted-foreground line-clamp-2">{description || "Join this amazing club!"}</p>
          
          <Button
            onClick={() => setShowModal(true)}
            className="w-full gradient-primary hover:shadow-glow transition-all duration-300"
          >
            Join Club
          </Button>
        </div>
      </Card>

      <RegistrationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        clubId={id}
        clubName={name}
        qrUrl={qr_url}
      />
    </>
  );
};

export default ClubCard;
