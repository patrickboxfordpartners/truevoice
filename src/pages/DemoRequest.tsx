// src/pages/DemoRequest.tsx
import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import Footer from "@/components/landing/Footer"

const ease = [0.16, 1, 0.3, 1]

const DemoRequest = () => {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [volume, setVolume] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: fnError } = await supabase.functions.invoke("send-demo-request", {
        body: { name, company, role, volume, message: message || undefined },
      })
      if (fnError) throw fnError
      setSubmitted(true)
    } catch (err) {
      setError("Something went wrong. Please email us directly at hello@truevoicehq.com")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back
          </Link>

          {submitted ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-8 w-8 text-success" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">We'll be in touch</h1>
              <p className="text-muted-foreground leading-relaxed">
                Thanks, {name.split(" ")[0]}. Expect to hear from us within 24 hours.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Book a Demo</h1>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Tell us a bit about your team and we'll set up a personalized walkthrough.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jordan Smith"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    placeholder="Acme Corp"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role">Your role</Label>
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    placeholder="VP of Talent, Head of People, etc."
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="volume">Estimated interviews per month</Label>
                  <Select value={volume} onValueChange={setVolume} required>
                    <SelectTrigger id="volume" className="h-10">
                      <SelectValue placeholder="Select a range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<10">Fewer than 10</SelectItem>
                      <SelectItem value="10-50">10 – 50</SelectItem>
                      <SelectItem value="50-200">50 – 200</SelectItem>
                      <SelectItem value="200+">More than 200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">
                    Anything else? <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your hiring process, current pain points, or specific questions."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting || !volume}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Request Demo"
                  )}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export default DemoRequest
