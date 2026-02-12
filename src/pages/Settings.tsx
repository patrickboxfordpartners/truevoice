import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Building2, Clock, Save, Globe, Users, Briefcase, Moon, Sun, UserPlus, Trash2, Mail, Crown, Pencil, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany, useUpdateCompany } from "@/hooks/useCompany";
import { useTeam, useUpdateMemberRole, useRemoveMember, useInviteTeamMember } from "@/hooks/useTeam";
import type { Role } from "@/types";

const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: React.ReactNode }> = {
  owner: { label: "Owner", color: "bg-primary/10 text-primary border-primary/20", icon: <Crown className="h-3 w-3" /> },
  admin: { label: "Admin", color: "bg-warning/10 text-warning border-warning/20", icon: <Shield className="h-3 w-3" /> },
  editor: { label: "Editor", color: "bg-success/10 text-success border-success/20", icon: <Pencil className="h-3 w-3" /> },
  viewer: { label: "Viewer", color: "bg-muted text-muted-foreground border-border", icon: <Eye className="h-3 w-3" /> },
};

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();
  const { data: company, isLoading: companyLoading } = useCompany();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();
  const updateCompany = useUpdateCompany();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const inviteMember = useInviteTeamMember();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");

  // Company profile state — initialized from fetched data
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [industry, setIndustry] = useState("technology");
  const [companySize, setCompanySize] = useState("51-200");

  // Interview preferences state
  const [defaultDuration, setDefaultDuration] = useState("45");
  const [autoRecord, setAutoRecord] = useState(true);
  const [authenticityDetection, setAuthenticityDetection] = useState(true);
  const [candidateCamera, setCandidateCamera] = useState(true);
  const [feedbackDeadline, setFeedbackDeadline] = useState("3");
  const [timezone, setTimezone] = useState("America/New_York");

  // Populate form when company data loads
  useEffect(() => {
    if (company) {
      setCompanyName(company.name || "");
      setCompanyWebsite(company.website || "");
      setCompanyDescription(company.description || "");
      setIndustry(company.industry || "technology");
      setCompanySize(company.company_size || "51-200");
      setDefaultDuration(String(company.default_duration));
      setAutoRecord(company.auto_record);
      setAuthenticityDetection(company.authenticity_detection);
      setCandidateCamera(company.require_candidate_camera);
      setFeedbackDeadline(String(company.feedback_deadline));
      setTimezone(company.timezone);
    }
  }, [company]);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleSave = () => {
    updateCompany.mutate(
      {
        name: companyName,
        website: companyWebsite || null,
        description: companyDescription || null,
        industry,
        company_size: companySize,
        default_duration: parseInt(defaultDuration),
        feedback_deadline: parseInt(feedbackDeadline),
        timezone,
        auto_record: autoRecord,
        authenticity_detection: authenticityDetection,
        require_candidate_camera: candidateCamera,
      },
      {
        onSuccess: () => {
          toast({ title: "Settings saved", description: "Your company profile and preferences have been updated." });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMember.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => {
          toast({ title: "Member added", description: `Added ${inviteEmail} as ${ROLE_CONFIG[inviteRole].label}.` });
          setInviteEmail("");
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleChangeRole = (memberId: string, newRole: string) => {
    updateRole.mutate(
      { memberId, role: newRole as Role },
      {
        onSuccess: () => toast({ title: "Role updated" }),
      }
    );
  };

  const handleRemove = (memberId: string) => {
    removeMember.mutate(memberId, {
      onSuccess: () => toast({ title: "Member removed" }),
    });
  };

  if (companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">AuthentiView</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Interviews</span>
            <span className="font-medium text-foreground">Settings</span>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">{initials}</div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your company profile and interview preferences.</p>
        </div>

        <div className="space-y-8">
          {/* Company Profile */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              Company Profile
            </h2>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="companyWebsite">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="companyWebsite" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="companyDescription">Description</Label>
                <Textarea id="companyDescription" value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} className="min-h-[80px]" maxLength={500} />
                <p className="text-xs text-muted-foreground mt-1">{companyDescription.length}/500 characters</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company Size</Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger>
                      <Users className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-1000">201-1,000 employees</SelectItem>
                      <SelectItem value="1000+">1,000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Interview Preferences */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-primary" />
              Interview Preferences
            </h2>
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Default Duration</Label>
                  <Select value={defaultDuration} onValueChange={setDefaultDuration}>
                    <SelectTrigger>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Feedback Deadline</Label>
                  <Select value={feedbackDeadline} onValueChange={setFeedbackDeadline}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 business day</SelectItem>
                      <SelectItem value="3">3 business days</SelectItem>
                      <SelectItem value="5">5 business days</SelectItem>
                      <SelectItem value="7">7 business days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">GMT / London</SelectItem>
                    <SelectItem value="Europe/Berlin">CET / Berlin</SelectItem>
                    <SelectItem value="Asia/Tokyo">JST / Tokyo</SelectItem>
                    <SelectItem value="Asia/Kolkata">IST / India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-record interviews</p>
                    <p className="text-xs text-muted-foreground">Automatically start recording when the session begins.</p>
                  </div>
                  <Switch checked={autoRecord} onCheckedChange={setAutoRecord} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Authenticity detection</p>
                    <p className="text-xs text-muted-foreground">Enable real-time AI authenticity analysis during interviews.</p>
                  </div>
                  <Switch checked={authenticityDetection} onCheckedChange={setAuthenticityDetection} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Require candidate camera</p>
                    <p className="text-xs text-muted-foreground">Candidates must have their camera on to proceed.</p>
                  </div>
                  <Switch checked={candidateCamera} onCheckedChange={setCandidateCamera} />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Team Members */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              Team Members
            </h2>
            {/* Invite */}
            <div className="flex items-end gap-3 mb-6">
              <div className="flex-1">
                <Label htmlFor="inviteEmail">Invite by email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  />
                </div>
              </div>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} className="gap-1.5 shrink-0" disabled={inviteMember.isPending}>
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </div>
            <Separator className="mb-4" />
            {/* Members list */}
            {teamLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {(teamMembers ?? []).map((member) => {
                  const memberInitials = member.full_name
                    ? member.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : member.email.slice(0, 2).toUpperCase();
                  const memberRole = member.role as Role;
                  return (
                    <div key={member.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs shrink-0">
                          {memberInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{member.full_name || member.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {memberRole === "owner" ? (
                          <Badge variant="outline" className={`gap-1 ${ROLE_CONFIG.owner.color}`}>
                            {ROLE_CONFIG.owner.icon}
                            Owner
                          </Badge>
                        ) : (
                          <>
                            <Select value={memberRole} onValueChange={(v) => handleChangeRole(member.id, v)}>
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <div className="flex items-center gap-1.5">
                                  {ROLE_CONFIG[memberRole].icon}
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemove(member.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              <strong>Admin</strong> — full access &amp; settings · <strong>Editor</strong> — create &amp; manage interviews · <strong>Viewer</strong> — read-only access
            </p>
          </motion.section>

          {/* Save */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2" disabled={updateCompany.isPending}>
              {updateCompany.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
