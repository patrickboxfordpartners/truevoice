import { useEffect } from "react"
import { useTheme } from "next-themes"
import Navbar from "@/components/Navbar"
import Footer from "@/components/landing/Footer"

const Privacy = () => {
  const { setTheme } = useTheme()
  useEffect(() => { setTheme("light") }, [setTheme])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: July 7, 2026</p>

        <div className="prose prose-neutral mt-12 max-w-none text-foreground/80 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:space-y-1 [&_ul]:pl-5 [&_li]:list-disc [&_li]:leading-relaxed">

          <p>Boxford Partners LLC ("TrueVoice HQ," "we," "us," or "our") operates truevoicehq.com and the TrueVoice HQ interview intelligence platform. This Privacy Policy explains what information we collect, how we use it, and your rights with respect to it.</p>

          <h2>Information We Collect</h2>
          <p>We collect information you provide directly to us:</p>
          <ul>
            <li><strong>Account and contact data</strong> — name, email address, company name, and role submitted through our demo request form or account setup.</li>
            <li><strong>Interview data</strong> — for users of the TrueVoice HQ platform, we collect interview recordings (audio and video), transcripts, candidate names and email addresses, and analysis outputs (scores, flags, reports) generated during platform use.</li>
            <li><strong>Billing information</strong> — processed through Stripe; we do not store full card numbers.</li>
            <li><strong>Usage data</strong> — pages visited, features used, and interactions within the platform, collected via analytics tools.</li>
          </ul>

          <h2>Candidate Data</h2>
          <p>TrueVoice HQ processes interview data on behalf of our customers (hiring organizations). Customers are responsible for obtaining appropriate consent from interview candidates before using our platform to analyze their interviews. We process candidate data solely to deliver the platform's features and do not use it for any other purpose. Candidates who have questions about their data should contact the hiring organization that conducted their interview.</p>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To respond to demo requests and onboard customers</li>
            <li>To operate, maintain, and improve the TrueVoice HQ platform</li>
            <li>To generate interview intelligence reports and analysis</li>
            <li>To process payments and manage subscriptions</li>
            <li>To send transactional communications related to your account</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2>Third-Party Service Providers</h2>
          <p>We use trusted third-party providers to operate our services. These providers process data only as directed by us:</p>
          <ul>
            <li><strong>Supabase</strong> — database and authentication infrastructure</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Postmark</strong> — transactional email delivery</li>
            <li><strong>Deepgram</strong> — speech-to-text transcription for interview analysis</li>
            <li><strong>LiveKit</strong> — real-time video infrastructure</li>
            <li><strong>xAI (Grok)</strong> — AI-powered interview analysis features</li>
            <li><strong>Vercel</strong> — hosting and infrastructure</li>
          </ul>

          <h2>Cookies and Tracking</h2>
          <p>We use cookies and similar technologies to maintain sessions, remember preferences, and understand how visitors use our site. You can disable cookies in your browser settings, though some features may not function correctly.</p>

          <h2>Data Retention</h2>
          <p>We retain your account data for as long as your account is active or as needed to provide services. Interview data and reports are retained for the duration of your subscription. You may request deletion of your data at any time by contacting us at the address below.</p>

          <h2>Your Rights</h2>
          <p>Depending on your location, you may have the right to access, correct, delete, or restrict processing of your personal data. California residents have additional rights under the CCPA, including the right to know what data we have collected and the right to opt out of any sale of personal information. We do not sell personal information.</p>

          <h2>Children's Privacy</h2>
          <p>Our services are not directed to individuals under 18. We do not knowingly collect personal information from minors.</p>

          <h2>Changes to This Policy</h2>
          <p>We may update this policy from time to time. Material changes will be noted with a new "Last updated" date. Continued use of our services after changes constitutes acceptance.</p>

          <h2>Contact</h2>
          <p>Questions about this policy or requests related to your data:</p>
          <p>
            Boxford Partners LLC DBA TrueVoice HQ<br />
            <a href="mailto:hello@truevoicehq.com" className="text-primary hover:underline">hello@truevoicehq.com</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Privacy
