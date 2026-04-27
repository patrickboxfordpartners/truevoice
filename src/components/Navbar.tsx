import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [onDarkBg, setOnDarkBg] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  const checkBackground = useCallback(() => {
    if (!navRef.current) return;
    const navHeight = navRef.current.getBoundingClientRect().height;
    const sampleY = navHeight / 2;
    // Temporarily hide navbar so elementFromPoint hits the content behind it
    navRef.current.style.pointerEvents = "none";
    navRef.current.style.visibility = "hidden";
    const el = document.elementFromPoint(window.innerWidth / 2, sampleY);
    navRef.current.style.pointerEvents = "";
    navRef.current.style.visibility = "";

    if (!el) return;

    // Walk up to find the nearest element with a non-transparent background
    let target: Element | null = el;
    let r = 255, g = 255, b = 255;
    while (target) {
      const bg = window.getComputedStyle(target).backgroundColor;
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      if (match) {
        const alpha = match[4] !== undefined ? +match[4] : 1;
        if (alpha > 0.5) {
          r = +match[1]; g = +match[2]; b = +match[3];
          break;
        }
      }
      target = target.parentElement;
    }

    // Only switch to white logo on genuinely dark backgrounds (luminance < 128)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    setOnDarkBg(luminance < 128);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      checkBackground();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Check on mount and route change
    checkBackground();
    return () => window.removeEventListener("scroll", onScroll);
  }, [checkBackground, location.pathname]);

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white shadow-soft py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src={onDarkBg && !scrolled ? "/truevoice-logo-white.png" : "/truevoice-logo.png"}
            alt="TrueVoice HQ"
            className="h-10 w-auto transition-opacity duration-300"
          />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors duration-200 ${
                onDarkBg && !scrolled
                  ? location.pathname === link.href
                    ? "text-white"
                    : "text-white/80 hover:text-white"
                  : location.pathname === link.href
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className={onDarkBg && !scrolled ? "text-white hover:bg-white/10" : ""}>
            <Link to="/auth">Log In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className={`md:hidden ${onDarkBg && !scrolled ? "text-white" : "text-foreground"}`}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-surface mt-2 mx-4 rounded-2xl p-6 shadow-elevated">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-gray-900"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Log In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
