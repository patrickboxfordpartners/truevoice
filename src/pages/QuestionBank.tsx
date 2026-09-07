import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Play, Pencil, Trash2, GripVertical, Volume2, Loader2, Brain, CheckCircle2, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "convex/react";

type Category = "behavioral" | "technical" | "culture-fit" | "situational" | "general";

interface Question {
  _id: Id<"interview_questions">;
  text: string;
  audioUrl?: string;
  position: number;
  category: Category;
  companyId: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface SortableQuestionProps {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (id: Id<"interview_questions">) => void;
  onPlayAudio: (audioUrl?: string) => void;
  onGenerateAudio: (question: Question) => void;
  isGenerating: boolean;
}

const SortableQuestion = ({ question, onEdit, onDelete, onPlayAudio, onGenerateAudio, isGenerating }: SortableQuestionProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryColor = (category: Category) => {
    const colors = {
      behavioral: "bg-blue-100 text-blue-800",
      technical: "bg-purple-100 text-purple-800",
      "culture-fit": "bg-green-100 text-green-800",
      situational: "bg-yellow-100 text-yellow-800",
      general: "bg-gray-100 text-gray-800",
    };
    return colors[category];
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={getCategoryColor(question.category)}>{question.category}</Badge>
            {!question.isActive && <Badge variant="outline">Inactive</Badge>}
          </div>
          <p className="text-sm">{question.text}</p>
          {question.audioUrl && (
            <div className="flex items-center gap-2 mt-2">
              <Volume2 className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Audio generated</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {question.audioUrl ? (
            <Button variant="outline" size="sm" onClick={() => onPlayAudio(question.audioUrl)}>
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerateAudio(question)}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onEdit(question)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(question._id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const QuestionBank = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [generatingQuestionId, setGeneratingQuestionId] = useState<Id<"interview_questions"> | null>(null);

  // Form state
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("general");

  // Queries and mutations
  const questions = useQuery(api.queries.getQuestionsByCompany, {
    companyId: user?.company_id || "",
    activeOnly: false,
  });

  const createQuestion = useMutation(api.mutations.createInterviewQuestion);
  const updateQuestion = useMutation(api.mutations.updateInterviewQuestion);
  const deleteQuestion = useMutation(api.mutations.deleteInterviewQuestion);
  const generateAudio = useAction(api.actions.generateQuestionAudio.generateQuestionAudio);

  const suggestedQuestions = useQuery(api.queries.getRecentSuggestedQuestions, {
    companyId: user?.company_id || "",
  });
  const [savedSuggestions, setSavedSuggestions] = useState<Set<number>>(new Set());
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (questions) {
      setLocalQuestions(questions as Question[]);
    }
  }, [questions]);

  const filteredQuestions = localQuestions.filter((q) =>
    filterCategory === "all" ? true : q.category === filterCategory
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localQuestions.findIndex((q) => q._id === active.id);
      const newIndex = localQuestions.findIndex((q) => q._id === over.id);

      const newOrder = arrayMove(localQuestions, oldIndex, newIndex);
      setLocalQuestions(newOrder);

      // Update positions in database
      for (let i = 0; i < newOrder.length; i++) {
        if (newOrder[i].position !== i) {
          await updateQuestion({
            questionId: newOrder[i]._id,
            position: i,
          });
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingQuestion) {
        await updateQuestion({
          questionId: editingQuestion._id,
          text,
          category,
        });
        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      } else {
        const nextPosition = localQuestions.length;
        await createQuestion({
          text,
          category,
          position: nextPosition,
          companyId: user?.company_id || "",
          isActive: true,
        });
        toast({
          title: "Success",
          description: "Question created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save question",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAudio = async (question: Question) => {
    setGeneratingQuestionId(question._id);
    try {
      const result = await generateAudio({
        questionId: question._id,
        questionText: question.text,
      });

      if (result.success && result.audioUrl) {
        await updateQuestion({
          questionId: question._id,
          audioUrl: result.audioUrl,
        });
        toast({
          title: "Success",
          description: "Audio generated successfully",
        });
      } else {
        throw new Error(result.error || "Failed to generate audio");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate audio",
        variant: "destructive",
      });
    } finally {
      setGeneratingQuestionId(null);
    }
  };

  const handlePlayAudio = (audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setText(question.text);
    setCategory(question.category);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: Id<"interview_questions">) => {
    if (confirm("Are you sure you want to delete this question?")) {
      try {
        await deleteQuestion({ questionId: id });
        toast({
          title: "Success",
          description: "Question deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete question",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setText("");
    setCategory("general");
    setEditingQuestion(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (!questions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {suggestedQuestions && suggestedQuestions.length > 0 && (
        <Card className="mb-6 border-purple-200 bg-purple-50/30">
          <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base">Joan's Suggestions</CardTitle>
                  <Badge variant="secondary" className="text-xs">{suggestedQuestions.length}</Badge>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${suggestionsOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CardDescription className="text-xs mt-1">
                Questions suggested by Joan based on recent candidate analyses
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                {suggestedQuestions.map((sq, i) => (
                  <div key={i} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{sq.question}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 h-7 px-2"
                        disabled={savedSuggestions.has(i)}
                        onClick={async () => {
                          try {
                            await createQuestion({
                              text: sq.question,
                              category: "behavioral" as const,
                              position: localQuestions.length,
                              companyId: user?.company_id || "",
                              isActive: true,
                            });
                            setSavedSuggestions((prev) => new Set(prev).add(i));
                            toast({ title: "Question added to bank" });
                          } catch {
                            toast({ title: "Failed to add question", variant: "destructive" });
                          }
                        }}
                      >
                        {savedSuggestions.has(i) ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 italic">{sq.rationale}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      <Badge variant="secondary" className="text-xs">{sq.targetGap}</Badge>
                      <Badge variant="outline" className="text-xs">{sq.candidateName}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Async Interview Questions</CardTitle>
              <CardDescription>
                Manage AI-voiced questions for asynchronous interviews
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as Category | "all")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="culture-fit">Culture Fit</SelectItem>
                <SelectItem value="situational">Situational</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No questions yet. Create your first question to get started.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredQuestions.map((q) => q._id)} strategy={verticalListSortingStrategy}>
                {filteredQuestions.map((question) => (
                  <SortableQuestion
                    key={question._id}
                    question={question}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPlayAudio={handlePlayAudio}
                    onGenerateAudio={handleGenerateAudio}
                    isGenerating={generatingQuestionId === question._id}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Create Question"}</DialogTitle>
            <DialogDescription>
              {editingQuestion ? "Update the interview question" : "Add a new question to your async interview"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question Text</label>
              <Textarea
                placeholder="e.g., Tell me about a time when you had to overcome a significant challenge"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="culture-fit">Culture Fit</SelectItem>
                  <SelectItem value="situational">Situational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingQuestion ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionBank;
