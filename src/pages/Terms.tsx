import { useEffect } from "react"
import { useTheme } from "next-themes"
import Navbar from "@/components/Navbar"
import Footer from "@/components/landing/Footer"

const Terms = () => {
  const { setTheme } = useTheme()
  useEffect(() => { setTheme("light") }, [setTheme])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: July 7, 2026</p>

        <div className="prose prose-neutral mt-12 max-w-none text-foreground/80 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:space-y-1 [&_ul]:pl-5 [&_li]:list-disc [&_li]:leading-relaxed">

          <p>These Terms of Service ("Terms") govern your access to and use of the website and services operated by Boxford Partners LLC ("TrueVoice HQ," "we," "us," or "our"), including truevoicehq.com and the TrueVoice HQ interview intelligence platform. By accessing or using our services, you agree to these Terms.</p>

          <h2>Services</h2>
          <p>TrueVoice HQ provides an interview intelligence platform that analyzes video interviews to produce structured scoring and reporting data for hiring teams. We reserve the right to modify, suspend, or discontinue any service at any time with reasonable notice.</p>

          <h2>Accounts</h2>
          <p>You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use. We may suspend or terminate accounts that violate these Terms.</p>

          <h2>Acceptable Use</h2>
          <p>You agree to use our services only for lawful purposes. You may not use our services to engage in any activity that is illegal, harmful, deceptive, discriminatory, or that interferes with the operation of our infrastructure or the experience of other users. Use of TrueVoice HQ for hiring decisions must comply with all applicable employment laws, including anti-discrimination regulations in your jurisdiction.</p>

          <h2>Candidate Consent</h2>
          <p>You are solely responsible for obtaining any legally required consent from interview candidates before using TrueVoice HQ to analyze their interviews. This includes disclosure of AI-assisted analysis where required by applicable law (including the Illinois AI Video Interview Act and similar regulations). We provide consent flow tooling as a convenience; compliance remains your responsibility.</p>

          <h2>Payments and Subscriptions</h2>
          <p>Paid services are billed according to the terms agreed at the time of your engagement. All fees are non-refundable except as required by law or as expressly stated in a separate agreement. We use Stripe to process payments; your payment information is subject to Stripe's terms and privacy policy. We reserve the right to change pricing with 30 days' notice.</p>

          <h2>Intellectual Property</h2>
          <p>All content, software, and materials on our website and within our platform are owned by or licensed to Boxford Partners LLC. Nothing in these Terms grants you any right to use our trademarks, logos, or proprietary materials without prior written consent. You retain ownership of any candidate data, interview recordings, or content you submit to our services.</p>

          <h2>Data and Confidentiality</h2>
          <p>Interview data, candidate information, and reports generated through our platform are confidential to your organization. We process this data solely to provide the service. We will not share your data with third parties except as required to operate the platform or as required by law. See our Privacy Policy for full details.</p>

          <h2>Disclaimer of Warranties</h2>
          <p>Our services are provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement. Interview intelligence scores are analytical outputs to assist human decision-making — they are not a substitute for human judgment and should not be the sole basis for any hiring decision.</p>

          <h2>Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, Boxford Partners LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use our services. Our total liability for any claim arising from these Terms or your use of our services shall not exceed the amount you paid us in the three months preceding the claim.</p>

          <h2>Indemnification</h2>
          <p>You agree to indemnify and hold harmless Boxford Partners LLC and its officers, directors, employees, and agents from any claims, damages, or expenses (including reasonable attorney's fees) arising from your violation of these Terms, your misuse of our services, or your failure to obtain required candidate consents.</p>

          <h2>Governing Law</h2>
          <p>These Terms are governed by the laws of the Commonwealth of Massachusetts, without regard to its conflict of law provisions. Any disputes shall be resolved exclusively in the state or federal courts located in Suffolk County, Massachusetts.</p>

          <h2>Changes to These Terms</h2>
          <p>We may revise these Terms at any time. Material changes will be communicated by updating the "Last updated" date and, where appropriate, by email. Continued use of our services after changes take effect constitutes your acceptance of the revised Terms.</p>

          <h2>Contact</h2>
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

export default Terms
