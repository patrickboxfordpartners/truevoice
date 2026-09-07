import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-[hsl(155,20%,92%)] px-6 py-4">
        <Link to="/">
          <img src="/truevoice-logo.png" alt="TrueVoice HQ" className="h-8 w-auto" />
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-7xl sm:text-8xl font-extrabold text-accent/20 tabular-nums mb-4">404</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
            Page not found
          </h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="w-full sm:w-auto bg-foreground text-background hover:bg-accent">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/pricing">
                View Pricing
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/demo">
                Request a Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
