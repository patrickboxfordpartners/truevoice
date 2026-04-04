import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Eye, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  const orb1 = useRef<HTMLDivElement>(null);
  const orb2 = useRef<HTMLDivElement>(null);
  const orb3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (orb1.current) orb1.current.style.transform = `translateY(${y * 0.18}px)`;
      if (orb2.current) orb2.current.style.transform = `translateY(${y * -0.12}px)`;
      if (orb3.current) orb3.current.style.transform = `translateY(${y * 0.08}px) translateX(${y * -0.05}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
    {/* Subtle green accent orbs */}
    <div ref={orb1} className="absolute top-1/4 -left-32 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl will-change-transform pointer-events-none" />
    <div ref={orb2} className="absolute bottom-1/4 -right-32 w-[350px] h-[350px] bg-accent/3 rounded-full blur-3xl will-change-transform pointer-events-none" />
    <div ref={orb3} className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-3xl will-change-transform pointer-events-none" />

    <div className="relative max-w-4xl mx-auto px-6 text-center pt-32 pb-24">
      <div className="fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-white mb-8">
          <Shield size={14} className="text-emerald-300" />
          Fight AI-assisted interview fraud
        </div>
      </div>

      <h1 className="fade-in-up fade-in-up-delay-1 text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-gray-900">
        Know who you're{" "}
        <span className="text-gradient">actually hiring</span>
      </h1>

      <p className="fade-in-up fade-in-up-delay-2 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
        Real-time speech, visual, and behavioral analysis detects scripted and
        AI-assisted interview responses. Make confident hiring decisions with
        objective authenticity data.
      </p>

      <div className="fade-in-up fade-in-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button variant="hero" size="xl" asChild>
          <Link to="/dashboard">
            Start Free Trial
            <ArrowRight size={18} />
          </Link>
        </Button>
        <Button variant="hero-outline" size="xl" asChild>
          <Link to="/pricing">View Pricing</Link>
        </Button>
      </div>

      <div className="fade-in-up fade-in-up-delay-3 flex items-center justify-center gap-8 mt-14 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-gray-400" />
          Speech Analysis
        </div>
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-gray-400" />
          Visual Monitoring
        </div>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-gray-400" />
          Behavior Tracking
        </div>
      </div>
    </div>
  </section>
  );
};

export default Hero;
