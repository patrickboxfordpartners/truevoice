import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-background">
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <img
            src="/truevoice-logo.png"
            alt="TrueVoice HQ"
            className="h-8 w-auto mb-3"
          />
          <a
            href="https://www.boxfordpartners.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-2 py-1 mb-4 border border-border rounded text-[10px] font-semibold text-gray-500 uppercase tracking-wider hover:border-foreground/30 hover:text-foreground transition-colors"
          >
            A Boxford Partners Company
          </a>
          <div className="text-sm text-gray-600 space-y-2">
            <p className="leading-relaxed">
              345 California St, Suite 600<br />
              San Francisco, CA 94104
            </p>
            <p>
              <a href="mailto:hello@boxfordpartners.com" className="hover:text-foreground transition-colors">
                hello@boxfordpartners.com
              </a>
            </p>
          </div>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Product</h4>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><Link to="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
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
              <a href="mailto:hello@boxfordpartners.com" className="hover:text-foreground transition-colors">
                Support
              </a>
            </li>
            <li>
              <a href="mailto:hello@boxfordpartners.com" className="hover:text-foreground transition-colors">
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

      <div className="border-t border-border pt-8 text-xs text-gray-400 text-center">
        &copy; {new Date().getFullYear()} Boxford Partners LLC DBA TrueVoice HQ. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
