import { Box } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-md">
            <Box className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">InsightLearn</span>
        </Link>

        {isLandingPage ? (
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              How it Works
            </a>
            <Link to="/app">
              <Button variant="hero" size="sm">
                Get Started
              </Button>
            </Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Home
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};
