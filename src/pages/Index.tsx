import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import InteractiveDemo from "@/components/landing/InteractiveDemo";
import HowItWorks from "@/components/landing/HowItWorks";
import CTASection from "@/components/landing/CTASection";
import ScrollReveal from "@/components/ScrollReveal";

const PricingTeaser = () => (
  <section className="py-20 px-6 bg-background border-t border-border">
    <ScrollReveal className="max-w-4xl mx-auto text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pricing</p>
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
        Plans that scale with your hiring
      </h2>
      <p className="text-muted-foreground text-lg mb-4 max-w-xl mx-auto">
        Start with 3 free interviews. No credit card required.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground tabular-nums">$99</p>
          <p className="text-xs text-muted-foreground">Starter /mo</p>
        </div>
        <div className="hidden sm:block w-px h-10 bg-border" />
        <div className="text-center">
          <p className="text-3xl font-bold text-accent tabular-nums">$249</p>
          <p className="text-xs text-muted-foreground">Pro /mo</p>
        </div>
        <div className="hidden sm:block w-px h-10 bg-border" />
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground tabular-nums">$499</p>
          <p className="text-xs text-muted-foreground">Scale /mo</p>
        </div>
      </div>
      <Button variant="outline" asChild className="rounded-md">
        <Link to="/pricing">
          View full pricing
          <ArrowRight size={16} className="ml-2" />
        </Link>
      </Button>
    </ScrollReveal>
  </section>
);

const Index = () => {
  const { setTheme } = useTheme();
  useEffect(() => { setTheme("light"); }, [setTheme]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <InteractiveDemo />
      <HowItWorks />
      <PricingTeaser />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
