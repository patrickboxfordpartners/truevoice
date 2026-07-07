// src/components/ShareReportButton.tsx
import { useState } from "react"
import { Share2, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface ShareReportButtonProps {
  interviewId: string
}

export function ShareReportButton({ interviewId }: ShareReportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleShare = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("report_tokens")
        .insert({ interview_id: interviewId })
        .select("token")
        .single()

      if (error) throw error

      const url = `${window.location.origin}/r/${data.token}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({ title: "Report link copied", description: "Anyone with this link can view the report." })
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      toast({ title: "Failed to generate link", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied!" : "Share Report"}
    </Button>
  )
}
