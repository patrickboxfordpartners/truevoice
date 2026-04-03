import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const CTASection = () => (
  <section className="py-28 px-6" style={{ background: 'var(--section-gradient-2)' }}>
    <ScrollReveal className="max-w-3xl mx-auto text-center">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
        Ready to hire with <span className="text-gradient">confidence</span>?
      </h2>
      <p className="text-muted-foreground text-lg mb-10">
        Start your 14-day free trial today. No credit card required.
      </p>
      <Button variant="hero" size="xl" className="bg-accent text-accent-foreground hover:bg-accent/90">
        Start Free Trial
        <ArrowRight size={18} />
      </Button>
    </ScrollReveal>
  </section>
);

export default CTASection;
