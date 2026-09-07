import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

const PHOTOS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop",
]

const DemoRequest = () => {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [volume, setVolume] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPhotoIndex((i) => (i + 1) % PHOTOS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

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
    } catch {
      setError("Something went wrong. Please email us directly at hello@truevoicehq.com")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[400px] mx-auto">
          {/* Logo — centered */}
          <div className="flex justify-center mb-14">
            <Link to="/">
              <img src="/truevoice-logo.png" alt="TrueVoice HQ" className="h-9 w-auto" />
            </Link>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-8 w-8 text-green-600" strokeWidth={1.5} />
              </div>
              <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-3">We'll be in touch</h1>
              <p className="text-gray-500 text-[15px] leading-relaxed">
                Thanks, {name.split(" ")[0]}. Expect to hear from us within 24 hours.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-10">
                <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
                  Book a demo
                </h1>
                <p className="text-gray-500 text-[15px]">
                  Tell us about your team and we'll set up a personalized walkthrough.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="name"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 px-4 bg-gray-50 border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300"
                />

                <Input
                  id="company"
                  placeholder="Company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="h-12 px-4 bg-gray-50 border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300"
                />

                <Input
                  id="role"
                  placeholder="Your role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="h-12 px-4 bg-gray-50 border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300"
                />

                <Select value={volume} onValueChange={setVolume} required>
                  <SelectTrigger className="h-12 px-4 bg-gray-50 border-gray-200 rounded-lg text-[15px] data-[placeholder]:text-gray-400 focus:bg-white focus:border-gray-300">
                    <SelectValue placeholder="Interviews per month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<10">Fewer than 10</SelectItem>
                    <SelectItem value="10-50">10 - 50</SelectItem>
                    <SelectItem value="50-200">50 - 200</SelectItem>
                    <SelectItem value="200+">More than 200</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Anything else? (optional)"
                  rows={3}
                  className="px-4 py-3 bg-gray-50 border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300 resize-none"
                />

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-[15px] font-medium bg-gray-900 text-white hover:bg-gray-800 rounded-lg"
                  disabled={submitting || !volume}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Request demo"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Legal footer */}
          <p className="mt-10 text-xs text-gray-400 text-center">
            By submitting, you agree to our{" "}
            <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
            {" "}and{" "}
            <Link to="/terms" className="underline hover:text-gray-600">Terms of Service</Link>.
          </p>
        </div>
      </div>

      {/* Right side - Rotating photos */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        {PHOTOS.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `url('${src}')`,
              opacity: i === photoIndex ? 1 : 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default DemoRequest
