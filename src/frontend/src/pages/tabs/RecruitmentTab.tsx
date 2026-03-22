import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Plus, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface JobPosting {
  id: string;
  title: string;
  department: string;
  requirements: string;
  deadline: string;
  createdAt: string;
}

interface Candidate {
  id: string;
  name: string;
  jobId: string;
  jobTitle: string;
  stage: string;
  notes: string;
  addedAt: string;
}

interface OnboardingItem {
  id: string;
  candidateName: string;
  contractSigned: boolean;
  equipmentGiven: boolean;
  systemAccess: boolean;
  orientationDone: boolean;
  addedAt: string;
}

const STAGES = [
  "Başvuru",
  "Ön Görüşme",
  "Teknik Mülakat",
  "Teklif",
  "İşe Alındı",
  "Reddedildi",
];

const STAGE_COLORS: Record<string, string> = {
  Başvuru: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Ön Görüşme": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Teknik Mülakat": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Teklif: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "İşe Alındı": "bg-green-500/20 text-green-300 border-green-500/30",
  Reddedildi: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function RecruitmentTab({ companyId }: { companyId: string }) {
  const storageJobs = `pv_recruitment_jobs_${companyId}`;
  const storageCandidates = `pv_recruitment_candidates_${companyId}`;
  const storageOnboarding = `pv_recruitment_onboarding_${companyId}`;

  const [jobs, setJobs] = useState<JobPosting[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageJobs) || "[]");
    } catch {
      return [];
    }
  });
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageCandidates) || "[]");
    } catch {
      return [];
    }
  });
  const [onboarding, setOnboarding] = useState<OnboardingItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageOnboarding) || "[]");
    } catch {
      return [];
    }
  });

  const [jobOpen, setJobOpen] = useState(false);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const [newJob, setNewJob] = useState({
    title: "",
    department: "",
    requirements: "",
    deadline: "",
  });
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    jobId: "",
    stage: "Başvuru",
    notes: "",
  });
  const [newOnboarding, setNewOnboarding] = useState({ candidateName: "" });

  useEffect(() => {
    localStorage.setItem(storageJobs, JSON.stringify(jobs));
  }, [jobs, storageJobs]);
  useEffect(() => {
    localStorage.setItem(storageCandidates, JSON.stringify(candidates));
  }, [candidates, storageCandidates]);
  useEffect(() => {
    localStorage.setItem(storageOnboarding, JSON.stringify(onboarding));
  }, [onboarding, storageOnboarding]);

  function addJob() {
    if (!newJob.title || !newJob.department) {
      toast.error("Başlık ve departman zorunludur.");
      return;
    }
    setJobs((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        ...newJob,
        createdAt: new Date().toISOString().split("T")[0],
      },
    ]);
    setNewJob({ title: "", department: "", requirements: "", deadline: "" });
    setJobOpen(false);
    toast.success("İş ilanı oluşturuldu.");
  }

  function addCandidate() {
    if (!newCandidate.name || !newCandidate.jobId) {
      toast.error("Aday adı ve iş ilanı zorunludur.");
      return;
    }
    const job = jobs.find((j) => j.id === newCandidate.jobId);
    setCandidates((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        ...newCandidate,
        jobTitle: job?.title || "",
        addedAt: new Date().toISOString().split("T")[0],
      },
    ]);
    setNewCandidate({ name: "", jobId: "", stage: "Başvuru", notes: "" });
    setCandidateOpen(false);
    toast.success("Aday eklendi.");
  }

  function updateCandidateStage(id: string, stage: string) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage } : c)),
    );
  }

  function deleteCandidate(id: string) {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  }

  function addOnboarding() {
    if (!newOnboarding.candidateName) {
      toast.error("Personel adı zorunludur.");
      return;
    }
    setOnboarding((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        candidateName: newOnboarding.candidateName,
        contractSigned: false,
        equipmentGiven: false,
        systemAccess: false,
        orientationDone: false,
        addedAt: new Date().toISOString().split("T")[0],
      },
    ]);
    setNewOnboarding({ candidateName: "" });
    setOnboardingOpen(false);
    toast.success("Onboarding listesi oluşturuldu.");
  }

  function toggleOnboardingItem(
    id: string,
    field: keyof Pick<
      OnboardingItem,
      "contractSigned" | "equipmentGiven" | "systemAccess" | "orientationDone"
    >,
  ) {
    setOnboarding((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: !o[field] } : o)),
    );
  }

  return (
    <div className="space-y-8">
      {/* İş İlanları */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-amber-400" />
            İş İlanları
          </h3>
          <Button
            data-ocid="hr.recruitment.add_job_button"
            size="sm"
            className="gradient-bg text-white"
            onClick={() => setJobOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> İlan Ekle
          </Button>
        </div>
        {jobs.length === 0 ? (
          <div
            data-ocid="hr.recruitment.jobs.empty_state"
            className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border"
          >
            <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Henüz iş ilanı oluşturulmadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job, idx) => (
              <Card
                key={job.id}
                data-ocid={`hr.recruitment.job.item.${idx + 1}`}
                className="bg-card border-border"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {job.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs"
                    >
                      {job.department}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-xs text-muted-foreground">
                  {job.requirements && <p>{job.requirements}</p>}
                  {job.deadline && <p>Son başvuru: {job.deadline}</p>}
                  <p className="text-foreground/40">
                    Oluşturuldu: {job.createdAt}
                  </p>
                  <p className="text-xs text-amber-400">
                    {candidates.filter((c) => c.jobId === job.id).length} aday
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Aday Boru Hattı */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-amber-400" />
            Aday Boru Hattı
          </h3>
          <Button
            data-ocid="hr.recruitment.add_candidate_button"
            size="sm"
            variant="outline"
            className="border-border"
            onClick={() => setCandidateOpen(true)}
            disabled={jobs.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" /> Aday Ekle
          </Button>
        </div>
        {candidates.length === 0 ? (
          <div
            data-ocid="hr.recruitment.candidates.empty_state"
            className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border"
          >
            <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Henüz aday eklenmedi.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((c, idx) => (
              <div
                key={c.id}
                data-ocid={`hr.recruitment.candidate.item.${idx + 1}`}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-card border border-border rounded-lg px-4 py-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.jobTitle} · {c.addedAt}
                  </p>
                  {c.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={c.stage}
                    onValueChange={(v) => updateCandidateStage(c.id, v)}
                  >
                    <SelectTrigger
                      data-ocid={`hr.recruitment.candidate.stage.${idx + 1}`}
                      className="w-40 h-7 text-xs border-border"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge
                    variant="outline"
                    className={`text-xs ${STAGE_COLORS[c.stage] || ""}`}
                  >
                    {c.stage}
                  </Badge>
                  <Button
                    data-ocid={`hr.recruitment.candidate.delete_button.${idx + 1}`}
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteCandidate(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Onboarding */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Onboarding Kontrol Listesi</h3>
          <Button
            data-ocid="hr.recruitment.add_onboarding_button"
            size="sm"
            variant="outline"
            className="border-border"
            onClick={() => setOnboardingOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Yeni Onboarding
          </Button>
        </div>
        {onboarding.length === 0 ? (
          <div
            data-ocid="hr.recruitment.onboarding.empty_state"
            className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border"
          >
            <p>Henüz onboarding kaydı yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onboarding.map((o, idx) => {
              const done = [
                o.contractSigned,
                o.equipmentGiven,
                o.systemAccess,
                o.orientationDone,
              ].filter(Boolean).length;
              return (
                <Card
                  key={o.id}
                  data-ocid={`hr.recruitment.onboarding.item.${idx + 1}`}
                  className="bg-card border-border"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {o.candidateName}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {done}/4 tamamlandı
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      {
                        field: "contractSigned" as const,
                        label: "Sözleşme imzalandı",
                      },
                      {
                        field: "equipmentGiven" as const,
                        label: "Ekipman verildi",
                      },
                      {
                        field: "systemAccess" as const,
                        label: "Sistem erişimi tanımlandı",
                      },
                      {
                        field: "orientationDone" as const,
                        label: "Oryantasyon tamamlandı",
                      },
                    ].map((item) => (
                      <div key={item.field} className="flex items-center gap-2">
                        <Checkbox
                          data-ocid={`hr.recruitment.onboarding.${item.field}.${idx + 1}`}
                          id={`onboard-${o.id}-${item.field}`}
                          checked={o[item.field]}
                          onCheckedChange={() =>
                            toggleOnboardingItem(o.id, item.field)
                          }
                        />
                        <label
                          htmlFor={`onboard-${o.id}-${item.field}`}
                          className={`text-sm cursor-pointer ${o[item.field] ? "line-through text-muted-foreground" : ""}`}
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Job Dialog */}
      <Dialog open={jobOpen} onOpenChange={setJobOpen}>
        <DialogContent
          data-ocid="hr.recruitment.job.dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Yeni İş İlanı</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Pozisyon Başlığı *</Label>
              <Input
                data-ocid="hr.recruitment.job.title.input"
                value={newJob.title}
                onChange={(e) =>
                  setNewJob((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Saha Mühendisi"
              />
            </div>
            <div>
              <Label>Departman *</Label>
              <Input
                data-ocid="hr.recruitment.job.department.input"
                value={newJob.department}
                onChange={(e) =>
                  setNewJob((p) => ({ ...p, department: e.target.value }))
                }
                placeholder="Teknik"
              />
            </div>
            <div>
              <Label>Gereksinimler</Label>
              <Textarea
                data-ocid="hr.recruitment.job.requirements.input"
                value={newJob.requirements}
                onChange={(e) =>
                  setNewJob((p) => ({ ...p, requirements: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div>
              <Label>Son Başvuru Tarihi</Label>
              <Input
                data-ocid="hr.recruitment.job.deadline.input"
                type="date"
                value={newJob.deadline}
                onChange={(e) =>
                  setNewJob((p) => ({ ...p, deadline: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="hr.recruitment.job.cancel_button"
              variant="outline"
              onClick={() => setJobOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="hr.recruitment.job.submit_button"
              className="gradient-bg text-white"
              onClick={addJob}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Dialog */}
      <Dialog open={candidateOpen} onOpenChange={setCandidateOpen}>
        <DialogContent
          data-ocid="hr.recruitment.candidate.dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Aday Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Aday Adı *</Label>
              <Input
                data-ocid="hr.recruitment.candidate.name.input"
                value={newCandidate.name}
                onChange={(e) =>
                  setNewCandidate((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>İş İlanı *</Label>
              <Select
                value={newCandidate.jobId}
                onValueChange={(v) =>
                  setNewCandidate((p) => ({ ...p, jobId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="hr.recruitment.candidate.job.select"
                  className="border-border"
                >
                  <SelectValue placeholder="İlan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aşama</Label>
              <Select
                value={newCandidate.stage}
                onValueChange={(v) =>
                  setNewCandidate((p) => ({ ...p, stage: v }))
                }
              >
                <SelectTrigger
                  data-ocid="hr.recruitment.candidate.stage.select"
                  className="border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                data-ocid="hr.recruitment.candidate.notes.input"
                value={newCandidate.notes}
                onChange={(e) =>
                  setNewCandidate((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="hr.recruitment.candidate.cancel_button"
              variant="outline"
              onClick={() => setCandidateOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="hr.recruitment.candidate.submit_button"
              className="gradient-bg text-white"
              onClick={addCandidate}
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding Dialog */}
      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent
          data-ocid="hr.recruitment.onboarding.dialog"
          className="sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Yeni Onboarding Kaydı</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Personel Adı *</Label>
            <Input
              data-ocid="hr.recruitment.onboarding.name.input"
              value={newOnboarding.candidateName}
              onChange={(e) =>
                setNewOnboarding({ candidateName: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="hr.recruitment.onboarding.cancel_button"
              variant="outline"
              onClick={() => setOnboardingOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="hr.recruitment.onboarding.submit_button"
              className="gradient-bg text-white"
              onClick={addOnboarding}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
