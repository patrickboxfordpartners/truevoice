import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ArrowRight, Zap, Shield } from "lucide-react";

const STAGE_COLORS: Record<string, string> = {
  screening: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  technical: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  final: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  offer: "bg-green-500/10 text-green-600 border-green-500/20",
  hired: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  any: "bg-muted text-muted-foreground border-border",
};

const STAGE_LABELS: Record<string, string> = {
  screening: "Screening",
  technical: "Technical",
  final: "Final Round",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
  any: "Any Stage",
};

type FromStage = "screening" | "technical" | "final" | "offer" | "any";
type ToStage = "screening" | "technical" | "final" | "offer" | "hired" | "rejected";
type Recommendation = "advance" | "review" | "reject";

interface NewRuleForm {
  name: string;
  fromStage: FromStage;
  toStage: ToStage;
  minScore: string;
  allActionItemsComplete: boolean;
  briefComplete: boolean;
  minConfidence: string;
  recommendation: Recommendation | "";
  isActive: boolean;
}

const emptyForm: NewRuleForm = {
  name: "",
  fromStage: "screening",
  toStage: "technical",
  minScore: "",
  allActionItemsComplete: false,
  briefComplete: false,
  minConfidence: "",
  recommendation: "",
  isActive: true,
};

export default function StageRulesEditor({ companyId }: { companyId: string }) {
  const rules = useQuery(api.queries.getStageRules, { companyId });
  const saveRule = useMutation(api.mutations.saveStageRule);
  const deleteRule = useMutation(api.mutations.deleteStageRule);
  const toggleRule = useMutation(api.mutations.toggleStageRule);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewRuleForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const conditions: {
        minScore?: number;
        allActionItemsComplete?: boolean;
        briefComplete?: boolean;
        minConfidence?: number;
        recommendation?: "advance" | "review" | "reject";
      } = {};

      if (form.minScore) conditions.minScore = Number(form.minScore);
      if (form.allActionItemsComplete) conditions.allActionItemsComplete = true;
      if (form.briefComplete) conditions.briefComplete = true;
      if (form.minConfidence) conditions.minConfidence = Number(form.minConfidence);
      if (form.recommendation) conditions.recommendation = form.recommendation;

      await saveRule({
        companyId,
        name: form.name,
        fromStage: form.fromStage,
        toStage: form.toStage,
        conditions,
        isActive: form.isActive,
      });
      setForm(emptyForm);
      setShowForm(false);
    } catch (e) {
      console.error("Failed to save rule:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: Id<"stage_rules">) => {
    await deleteRule({ ruleId });
  };

  const handleToggle = async (ruleId: Id<"stage_rules">) => {
    await toggleRule({ ruleId });
  };

  function conditionChips(conditions: {
    minScore?: number;
    allActionItemsComplete?: boolean;
    briefComplete?: boolean;
    minConfidence?: number;
    recommendation?: string;
  }) {
    const chips: string[] = [];
    if (conditions.minScore != null) chips.push(`Score >= ${conditions.minScore}`);
    if (conditions.allActionItemsComplete) chips.push("All action items complete");
    if (conditions.briefComplete) chips.push("Brief complete");
    if (conditions.minConfidence != null) chips.push(`Confidence >= ${conditions.minConfidence}`);
    if (conditions.recommendation) chips.push(`Joan recommends: ${conditions.recommendation}`);
    return chips;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            Stage Transition Rules
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-advance or reject candidates when conditions are met
          </p>
        </div>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add Rule
          </Button>
        )}
      </div>

      {rules && rules.length > 0 && (
        <div className="space-y-2">
          {rules.map((rule) => (
            <Card key={rule._id} className={`border ${rule.isActive ? "border-border" : "border-border/50 opacity-60"}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-medium truncate">{rule.name}</span>
                      {!rule.isActive && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge variant="outline" className={`text-[10px] ${STAGE_COLORS[rule.fromStage]}`}>
                        {STAGE_LABELS[rule.fromStage]}
                      </Badge>
                      <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                      <Badge variant="outline" className={`text-[10px] ${STAGE_COLORS[rule.toStage]}`}>
                        {STAGE_LABELS[rule.toStage]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {conditionChips(rule.conditions).map((chip, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {chip}
                        </span>
                      ))}
                      {conditionChips(rule.conditions).length === 0 && (
                        <span className="text-[10px] text-muted-foreground italic">No conditions (always triggers)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => handleToggle(rule._id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule._id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rules && rules.length === 0 && !showForm && (
        <div className="rounded-md bg-muted/50 border border-border p-4 text-center">
          <Shield size={20} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            No transition rules defined. Add a rule to let Joan automatically move candidates between stages.
          </p>
        </div>
      )}

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="py-4 px-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule name</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Auto-advance high scorers"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From stage</Label>
                <Select value={form.fromStage} onValueChange={(v) => setForm({ ...form, fromStage: v as FromStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Stage</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="final">Final Round</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To stage</Label>
                <Select value={form.toStage} onValueChange={(v) => setForm({ ...form, toStage: v as ToStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="final">Final Round</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conditions</Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="min-score" className="text-xs">Min overall score</Label>
                  <Input
                    id="min-score"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g., 80"
                    value={form.minScore}
                    onChange={(e) => setForm({ ...form, minScore: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="min-confidence" className="text-xs">Min confidence score</Label>
                  <Input
                    id="min-confidence"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g., 70"
                    value={form.minConfidence}
                    onChange={(e) => setForm({ ...form, minConfidence: e.target.value })}
                    className="h-8"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="action-items-complete" className="text-xs">All action items complete</Label>
                <Switch
                  id="action-items-complete"
                  checked={form.allActionItemsComplete}
                  onCheckedChange={(c) => setForm({ ...form, allActionItemsComplete: c })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="brief-complete" className="text-xs">Intelligence brief complete</Label>
                <Switch
                  id="brief-complete"
                  checked={form.briefComplete}
                  onCheckedChange={(c) => setForm({ ...form, briefComplete: c })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Joan recommendation</Label>
                <Select
                  value={form.recommendation || "none"}
                  onValueChange={(v) => setForm({ ...form, recommendation: v === "none" ? "" : v as Recommendation })}
                >
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any / no requirement</SelectItem>
                    <SelectItem value="advance">Advance</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Switch
                  id="rule-active"
                  checked={form.isActive}
                  onCheckedChange={(c) => setForm({ ...form, isActive: c })}
                />
                <Label htmlFor="rule-active" className="text-xs">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowForm(false); setForm(emptyForm); }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!form.name.trim() || saving}
                >
                  {saving ? "Saving..." : "Save Rule"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
