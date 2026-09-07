import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Tag, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CandidateTagsProps {
  candidateId: Id<"hiring_pipeline">;
  companyId: string;
  className?: string;
}

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

export function CandidateTags({
  candidateId,
  companyId,
  className = "",
}: CandidateTagsProps) {
  const tags = useQuery(api.queries.getCandidateTags, { candidateId });
  const companyTags = useQuery(api.queries.getAllCompanyTags, { companyId });
  const addTag = useMutation(api.mutations.addTagToCandidate);
  const removeTag = useMutation(api.mutations.removeTagFromCandidate);

  const [showAdd, setShowAdd] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[4]);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAdd) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showAdd]);

  useEffect(() => {
    if (!showAdd) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setShowAdd(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAdd]);

  const handleAdd = async () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    try {
      await addTag({
        candidateId,
        companyId,
        tag: trimmed,
        color: selectedColor,
        addedBy: "Hiring Manager",
      });
      setNewTag("");
      setShowAdd(false);
    } catch {
      // tag already exists
    }
  };

  const handleQuickAdd = async (tag: string, color: string) => {
    try {
      await addTag({
        candidateId,
        companyId,
        tag,
        color,
        addedBy: "Hiring Manager",
      });
    } catch {
      // duplicate
    }
  };

  const handleRemove = async (tagId: Id<"candidate_tags">) => {
    await removeTag({ tagId });
  };

  const currentTagNames = new Set((tags ?? []).map((t) => t.tag));
  const suggestedTags = (companyTags ?? []).filter(
    (t) => !currentTagNames.has(t.tag)
  );

  if (tags === undefined) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      <AnimatePresence mode="popLayout">
        {tags.map((t) => (
          <motion.span
            key={t._id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${t.color}26`,
              color: t.color,
            }}
          >
            {t.tag}
            <button
              onClick={() => handleRemove(t._id)}
              className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>

      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground border border-dashed border-border hover:border-foreground/30 hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add tag
        </button>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 z-50 w-64 rounded-xl border border-border bg-popover p-3 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") setShowAdd(false);
                  }}
                  placeholder="Tag name..."
                  className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newTag.trim()}
                  className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-40 hover:bg-accent/90 transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-1.5 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        selectedColor === color
                          ? "white"
                          : "transparent",
                      boxShadow:
                        selectedColor === color
                          ? `0 0 0 2px ${color}`
                          : "none",
                    }}
                  />
                ))}
              </div>

              {suggestedTags.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                    Existing tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedTags.slice(0, 8).map((t) => (
                      <button
                        key={t.tag}
                        onClick={() => handleQuickAdd(t.tag, t.color)}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: `${t.color}26`,
                          color: t.color,
                        }}
                      >
                        <Plus className="h-2.5 w-2.5" />
                        {t.tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CandidateTags;
