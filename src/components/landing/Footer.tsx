import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-[hsl(155,20%,92%)]">
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid gap-12 text-center md:grid-cols-4 mb-12">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex justify-center mb-3">
            <img src="/truevoice-logo.png" alt="TrueVoice HQ" className="h-8 w-auto" />
          </div>
          <a
            href="https://www.boxfordpartners.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-1.5 mb-4 border border-border rounded text-[10px] font-semibold text-gray-500 uppercase tracking-widest hover:border-foreground/30 hover:text-foreground transition-colors"
          >
            A Boxford Partners Company
          </a>
          <p>
            <a href="mailto:hello@truevoicehq.com" className="text-sm text-gray-600 hover:text-foreground transition-colors">
              hello@truevoicehq.com
            </a>
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Product</h4>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><Link to="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
            <li><Link to="/demo" className="hover:text-foreground transition-colors">Book a Demo</Link></li>
            <li><Link to="/#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Company</h4>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <a href="https://www.boxfordpartners.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                About
              </a>
            </li>
            <li>
              <a href="mailto:hello@truevoicehq.com" className="hover:text-foreground transition-colors">
                Support
              </a>
            </li>
            <li>
              <a href="mailto:hello@truevoicehq.com" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Legal</h4>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-xs text-gray-400/50">&copy; {new Date().getFullYear()} Boxford Partners LLC DBA TRUEVOICE HQ. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
