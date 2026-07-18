import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-[hsl(155,20%,92%)]">
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Logo */}
          <img src="/truevoice-logo.png" alt="TrueVoice HQ" className="h-8 w-auto opacity-70" />

          {/* Tagline */}
          <p className="max-w-sm text-sm text-gray-500">
            Real-time AI interview analysis for hiring teams.
          </p>

          {/* Nav row */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            <Link to="/#features" className="text-sm text-gray-500 transition-colors hover:text-foreground">
              Features
            </Link>
            <Link to="/demo" className="text-sm text-gray-500 transition-colors hover:text-foreground">
              Book a Demo
            </Link>
            <Link to="/#how-it-works" className="text-sm text-gray-500 transition-colors hover:text-foreground">
              How It Works
            </Link>
            <Link to="/dashboard" className="text-sm text-gray-500 transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <a href="https://www.boxfordpartners.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 transition-colors hover:text-foreground">
              About
            </a>
            <a href="mailto:hello@truevoicehq.com" className="text-sm text-gray-500 transition-colors hover:text-foreground">
              Support
            </a>
            <a href="https://www.linkedin.com/company/boxfordpartners" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 transition-colors hover:text-foreground">
              LinkedIn
            </a>
          </nav>

          {/* Contact row */}
          <div className="flex items-center gap-4">
            <a href="mailto:hello@truevoicehq.com" className="text-sm text-gray-500 transition-colors hover:text-foreground">
              hello@truevoicehq.com
            </a>
            <span className="text-gray-400">·</span>
            <a href="https://cal.com/boxfordpartners" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 transition-colors hover:text-foreground">
              Book a call
            </a>
          </div>

          {/* Legal bar */}
          <div className="w-full pt-6 border-t border-border flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
            <p className="text-xs text-gray-400/50">
              &copy; {year} Boxford Partners LLC DBA TRUEVOICE HQ. All rights reserved.
            </p>
            <span className="text-gray-400/30 text-xs hidden sm:inline">·</span>
            <Link to="/privacy" className="text-xs text-gray-400/70 transition-colors hover:text-gray-500">
              Privacy
            </Link>
            <span className="text-gray-400/30 text-xs">·</span>
            <Link to="/terms" className="text-xs text-gray-400/70 transition-colors hover:text-gray-500">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
