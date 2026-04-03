import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-background">
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <p className="text-lg font-bold tracking-tight text-foreground mb-3">
            TrueVoice<span className="text-gradient">.</span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI-powered interview authenticity detection.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">Product</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
            <li><Link to="/#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">Legal</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border pt-8 text-sm text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} TrueVoice Insights. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
