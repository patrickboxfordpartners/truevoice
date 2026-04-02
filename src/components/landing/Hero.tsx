import { motion } from "framer-motion";
import { ArrowRight, Shield, Mic, Camera, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      <div className="container relative z-10 mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
            <Shield className="h-3.5 w-3.5" />
            Fight AI-assisted interview fraud
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Know who you're{" "}
            <span className="gradient-text">actually hiring</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time speech, visual, and behavioral analysis detects scripted
            and AI-assisted interview responses. Make confident hiring decisions
            with objective authenticity data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/dashboard">
              <Button size="lg" className="text-base px-8 h-12 gap-2">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                View Pricing
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mic className="h-4 w-4 text-success" />
              Speech Analysis
            </span>
            <span className="flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-success" />
              Visual Monitoring
            </span>
            <span className="flex items-center gap-1.5">
              <Keyboard className="h-4 w-4 text-success" />
              Behavior Tracking
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
