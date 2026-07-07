import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-28 px-6 bg-card border-t border-border">
    <ScrollReveal className="max-w-3xl mx-auto text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
        Ready to bring intelligence to your hiring process?
      </h2>
      <p className="text-muted-foreground text-lg mb-10">
        See how TrueVoice turns every interview into structured, comparable data.
      </p>
      <Button size="lg" asChild className="rounded-md bg-foreground text-background hover:bg-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
        <Link to="/demo">
          Book a Demo
          <ArrowRight size={16} className="ml-2" />
        </Link>
      </Button>
    </ScrollReveal>
  </section>
);

export default CTASection;
