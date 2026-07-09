import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle, CheckCircle2, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreateInterview } from "@/hooks/useInterviews";

interface ParsedRow {
  name: string;
  email: string;
  position: string;
  scheduled_at?: string;
  notes?: string;
  emailValid: boolean;
  rowIndex: number;
}

type Step = "upload" | "preview" | "done";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCSV(raw: string): ParsedRow[] {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Detect and skip header row if present
  const firstLower = lines[0].toLowerCase();
  const startIdx =
    firstLower.includes("name") || firstLower.includes("email") || firstLower.includes("position")
      ? 1
      : 0;

  const rows: ParsedRow[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [name = "", email = "", position = "", scheduled_at = "", notes = ""] = cols;
    rows.push({
      name,
      email,
      position,
      scheduled_at: scheduled_at || undefined,
      notes: notes || undefined,
      emailValid: EMAIL_REGEX.test(email),
      rowIndex: i + 1,
    });
  }
  return rows;
}

export function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<{ created: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createInterview = useCreateInterview();

  const validRows = rows.filter((r) => r.name && r.email && r.position && r.emailValid);
  const invalidRows = rows.filter((r) => !r.name || !r.email || !r.position || !r.emailValid);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  }

  function handlePreview() {
    if (!csvText.trim()) {
      toast({ title: "No CSV data", description: "Paste or upload a CSV file first.", variant: "destructive" });
      return;
    }
    const parsed = parseCSV(csvText);
    if (parsed.length === 0) {
      toast({ title: "No rows found", description: "Check your CSV format.", variant: "destructive" });
      return;
    }
    setRows(parsed);
    setStep("preview");
  }

  async function handleImport() {
    if (validRows.length === 0) {
      toast({ title: "No valid rows to import", variant: "destructive" });
      return;
    }

    setProgress({ current: 0, total: validRows.length });
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setProgress({ current: i + 1, total: validRows.length });
      try {
        const interview = await new Promise<any>((resolve, reject) => {
          createInterview.mutate(
            {
              candidate_name: row.name,
              candidate_email: row.email,
              position: row.position,
              scheduled_at: row.scheduled_at || null,
              notes: row.notes || null,
            },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });

        created++;
      } catch (err: any) {
        console.warn("[bulk-import] skipped row", row.rowIndex, err?.message);
        skipped++;
      }
    }

    setResults({ created, skipped });
    setProgress(null);
    setStep("done");
  }

  function handleClose() {
    setStep("upload");
    setCsvText("");
    setRows([]);
    setProgress(null);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle>Import Candidates from CSV</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Upload a CSV file</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Columns: <code className="bg-muted px-1 rounded">name, email, position</code> (required) +{" "}
                    <code className="bg-muted px-1 rounded">scheduled_at, notes</code> (optional)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label>Or paste CSV directly</Label>
                <Textarea
                  placeholder={`name,email,position,scheduled_at,notes\nJane Doe,jane@acme.com,Senior Engineer,2026-05-01T10:00,Strong referral\nJohn Smith,john@acme.com,Product Manager`}
                  className="font-mono text-xs min-h-[130px] resize-none"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="button" onClick={handlePreview} className="gap-1.5">
                  Preview
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "preview" && (
          <>
            <DialogHeader>
              <DialogTitle>Preview Import</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {validRows.length} valid
                </span>
                {invalidRows.length > 0 && (
                  <span className="flex items-center gap-1.5 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {invalidRows.length} will be skipped
                  </span>
                )}
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                        <th className="px-3 py-2 font-medium">#</th>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Position</th>
                        <th className="px-3 py-2 font-medium">Scheduled</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const isValid = row.name && row.email && row.position && row.emailValid;
                        return (
                          <tr
                            key={row.rowIndex}
                            className={`border-b border-border/50 ${!isValid ? "bg-destructive/5" : ""}`}
                          >
                            <td className="px-3 py-2 text-muted-foreground text-xs">{row.rowIndex}</td>
                            <td className="px-3 py-2">
                              {row.name || (
                                <span className="text-destructive text-xs">missing</span>
                              )}
                            </td>
                            <td
                              className={`px-3 py-2 ${!row.emailValid ? "text-destructive font-medium" : ""}`}
                            >
                              {row.email || <span className="text-destructive text-xs">missing</span>}
                            </td>
                            <td className="px-3 py-2">
                              {row.position || (
                                <span className="text-destructive text-xs">missing</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground text-xs">
                              {row.scheduled_at || ", "}
                            </td>
                            <td className="px-3 py-2">
                              {isValid ? (
                                <span className="text-xs text-success font-medium">Valid</span>
                              ) : (
                                <span className="text-xs text-destructive font-medium">
                                  {!row.email || !row.emailValid ? "Bad email" : "Incomplete"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidRows.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
                  Rows highlighted in red will be skipped. Fix the CSV and re-upload to include them.
                </p>
              )}

              {progress && (
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1.5 text-primary" />
                  Creating interview {progress.current} of {progress.total}...
                </div>
              )}

              <div className="flex gap-3 justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("upload")}
                  className="gap-1.5"
                  disabled={!!progress}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={!!progress}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImport}
                    disabled={validRows.length === 0 || !!progress}
                    className="gap-1.5"
                  >
                    {progress ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      `Import ${validRows.length} interview${validRows.length !== 1 ? "s" : ""}`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {step === "done" && results && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Import Complete
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="rounded-lg border border-border bg-muted/30 p-5 text-center space-y-2">
                <p className="text-2xl font-bold text-success">{results.created}</p>
                <p className="text-sm text-muted-foreground">
                  interview{results.created !== 1 ? "s" : ""} created
                  {results.skipped > 0 && (
                    <span className="text-destructive">
                      {" "}
                      · {results.skipped} skipped (invalid email or error)
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Invitation emails have been sent to all candidates.
                </p>
              </div>
              <Button className="w-full" onClick={handleClose}>
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
