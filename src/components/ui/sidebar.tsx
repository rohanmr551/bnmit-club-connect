import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export const Sidebar = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold mb-4"
          >
            <img src="/logo.svg" alt="BNMIT Club Connect Logo" className="h-6 w-6" />
            <span>BNMIT Club Connect</span>
          </Link>
          <Link to="/check-status" className="text-muted-foreground hover:text-foreground">
            <Search className="h-5 w-5 inline-block mr-2" />
            Check Status
          </Link>
          <Link
            to="/club-admin"
            className="text-muted-foreground hover:text-foreground"
          >
            <Shield className="h-5 w-5 inline-block mr-2" />
            Club Admin
          </Link>
          <Link
            to="/admin"
            className="text-muted-foreground hover:text-foreground"
          >
            <Shield className="h-5 w-5 inline-block mr-2" />
            Root Admin
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
