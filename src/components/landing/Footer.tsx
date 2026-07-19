import { Link } from "react-router-dom";

const BG = "#0a1a12";
const MUTED = "rgba(200,230,210,0.45)";
const DIM = "rgba(200,230,210,0.2)";
const RULE = "rgba(200,230,210,0.07)";
const ACCENT = "#22c55e";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: BG, borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center" }}>

          {/* Logo */}
          <img src="/truevoice-logo.png" alt="TrueVoice HQ" style={{ height: 28, width: "auto", opacity: 0.85 }} />

          {/* Tagline */}
          <p style={{ fontSize: "0.875rem", color: MUTED, maxWidth: 360, lineHeight: 1.6, fontWeight: 300 }}>
            Real-time AI interview analysis for hiring teams.
          </p>

          {/* Boxford badge */}
          <a
            href="https://boxfordpartners.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "5px 12px 5px 10px",
              border: `1px solid ${RULE}`,
              borderRadius: 6, textDecoration: "none",
              backgroundColor: "rgba(200,230,210,0.03)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: ACCENT, flexShrink: 0 }} />
            <span style={{ fontSize: "0.65rem", color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              A Boxford Partners Company
            </span>
          </a>

          {/* Nav */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 32px", marginTop: 8 }}>
            {[
              { label: "Features", to: "/#features", internal: true },
              { label: "How It Works", to: "/#how-it-works", internal: true },
              { label: "Book a Demo", to: "/demo", internal: true },
              { label: "LinkedIn", href: "https://www.linkedin.com/company/boxfordpartners" },
              { label: "Boxford Partners", href: "https://boxfordpartners.com" },
              { label: "Contact", href: "mailto:hello@truevoicehq.com" },
            ].map((item) =>
              item.internal ? (
                <Link key={item.label} to={item.to!} style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>
                  {item.label}
                </Link>
              ) : (
                <a key={item.label} href={item.href} target={item.href?.startsWith("mailto") ? undefined : "_blank"} rel="noopener noreferrer" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>
                  {item.label}
                </a>
              )
            )}
          </div>

          {/* Contact */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.875rem" }}>
            <a href="mailto:hello@truevoicehq.com" style={{ color: MUTED, textDecoration: "none" }}>
              hello@truevoicehq.com
            </a>
            <span style={{ color: DIM }}>·</span>
            <a href="https://cal.com/boxfordpartners" target="_blank" rel="noopener noreferrer" style={{ color: MUTED, textDecoration: "none" }}>
              Book a call
            </a>
          </div>

          {/* Legal bar */}
          <div style={{
            width: "100%", paddingTop: 20, paddingBottom: 24,
            borderTop: `1px solid ${RULE}`,
            display: "flex", flexWrap: "wrap", justifyContent: "center",
            alignItems: "center", gap: "4px 12px",
          }}>
            <span style={{ fontSize: "0.75rem", color: DIM }}>
              © {year} Boxford Partners LLC DBA TRUEVOICE HQ. All rights reserved.
            </span>
            <span style={{ color: DIM, fontSize: "0.75rem" }}>·</span>
            <Link to="/privacy" style={{ fontSize: "0.75rem", color: DIM, textDecoration: "none" }}>Privacy</Link>
            <span style={{ color: DIM, fontSize: "0.75rem" }}>·</span>
            <Link to="/terms" style={{ fontSize: "0.75rem", color: DIM, textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
