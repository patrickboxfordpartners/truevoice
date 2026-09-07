import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-28 px-6 bg-card border-t border-border">
    <ScrollReveal className="max-w-3xl mx-auto text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
        Stop guessing. Start knowing.
      </h2>
      <p className="text-muted-foreground text-lg mb-10">
        Try 3 interviews free. See exactly what TrueVoice detects, no credit card required.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button size="lg" asChild className="rounded-md bg-foreground text-background hover:bg-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
          <Link to="/signup?plan=starter">
            Start Free Trial
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="rounded-md">
          <a href="https://cal.com/boxfordpartners/truevoice-demo" target="_blank" rel="noopener noreferrer">
            Book a Demo
          </a>
        </Button>
      </div>
    </ScrollReveal>
  </section>
);

export default CTASection;
