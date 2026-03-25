import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Copy,
  Eye,
  Globe,
  Link2,
  PlusCircle,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";

interface PortalAccess {
  id: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  status: "active" | "revoked" | "expired";
  viewCount: number;
  permissions: {
    progress: boolean;
    budget: boolean;
    hakedis: boolean;
    documents: boolean;
    photos: boolean;
    risks: boolean;
  };
}

const STORAGE_KEY = "pv_portal_access";

function generateToken() {
  return (
    Math.random().toString(36).substring(2, 10).toUpperCase() +
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
}

export default function CustomerPortal() {
  const { projects, currentCompany, tasks, expenses, hakedisItems, riskItems } =
    useApp();

  const companyProjects = projects.filter(
    (p) => p.companyId === currentCompany?.id,
  );

  const [accesses, setAccesses] = useState<PortalAccess[]>(() => {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${currentCompany?.id}`);
    return raw ? JSON.parse(raw) : [];
  });

  const save = (data: PortalAccess[]) => {
    setAccesses(data);
    localStorage.setItem(
      `${STORAGE_KEY}_${currentCompany?.id}`,
      JSON.stringify(data),
    );
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [previewAccess, setPreviewAccess] = useState<PortalAccess | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    projectId: "",
    clientName: "",
    clientEmail: "",
    expiresAt: "",
    progress: true,
    budget: true,
    hakedis: true,
    documents: false,
    photos: true,
    risks: false,
  });

  const handleCreate = () => {
    if (!form.projectId || !form.clientName) return;
    const newAccess: PortalAccess = {
      id: Date.now().toString(),
      projectId: form.projectId,
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      token: generateToken(),
      createdAt: new Date().toISOString().split("T")[0],
      expiresAt: form.expiresAt || "",
      status: "active",
      viewCount: 0,
      permissions: {
        progress: form.progress,
        budget: form.budget,
        hakedis: form.hakedis,
        documents: form.documents,
        photos: form.photos,
        risks: form.risks,
      },
    };
    save([...accesses, newAccess]);
    setCreateOpen(false);
    setForm({
      projectId: "",
      clientName: "",
      clientEmail: "",
      expiresAt: "",
      progress: true,
      budget: true,
      hakedis: true,
      documents: false,
      photos: true,
      risks: false,
    });
  };

  const handleRevoke = (id: string) => {
    save(
      accesses.map((a) =>
        a.id === id ? { ...a, status: "revoked" as const } : a,
      ),
    );
  };

  const handleDelete = (id: string) => {
    save(accesses.filter((a) => a.id !== id));
  };

  const handleCopy = (token: string) => {
    navigator.clipboard
      .writeText(`${window.location.origin}/portal?t=${token}`)
      .catch(() => {});
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const getProject = (id: string) => companyProjects.find((p) => p.id === id);

  const statusStyle: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    revoked: "bg-red-500/20 text-red-400",
    expired: "bg-muted text-muted-foreground",
  };
  const statusLabel: Record<string, string> = {
    active: "Aktif",
    revoked: "İptal Edildi",
    expired: "Süresi Doldu",
  };

  // Portal preview data
  const previewProject = previewAccess
    ? getProject(previewAccess.projectId)
    : null;
  const previewTasks = previewAccess
    ? tasks.filter((t) => t.projectId === previewAccess.projectId)
    : [];
  const previewExpenses = previewAccess
    ? expenses.filter(
        (e) =>
          e.projectId === previewAccess.projectId && e.status === "Onaylandı",
      )
    : [];
  const previewTotalExp = previewExpenses.reduce((s, e) => s + e.amount, 0);
  const previewHakedis = previewAccess
    ? (hakedisItems || []).filter(
        (h) => h.projectId === previewAccess.projectId,
      )
    : [];
  const previewRisks = previewAccess
    ? (riskItems || []).filter(
        (r) => r.projectId === previewAccess.projectId && r.status !== "Kapalı",
      )
    : [];
  const budgetPct =
    previewProject?.budget && previewProject.budget > 0
      ? Math.min(
          100,
          Math.round((previewTotalExp / previewProject.budget) * 100),
        )
      : 0;
  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);

  const activeCount = accesses.filter((a) => a.status === "active").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Müşteri Portalı</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Müşterilere proje bazlı kısıtlı erişim linki oluşturun
          </p>
        </div>
        <Button
          data-ocid="customer_portal.create.button"
          className="gradient-bg text-white"
          onClick={() => setCreateOpen(true)}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Yeni Portal Erişimi
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Toplam Erişim
            </p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {accesses.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
            </p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {activeCount}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Farklı Proje
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {new Set(accesses.map((a) => a.projectId)).size}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Toplam Görüntüleme
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {accesses.reduce((s, a) => s + a.viewCount, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4 text-amber-400" />
            Portal Erişim Listesi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {accesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Shield className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                Henüz portal erişimi oluşturulmadı
              </p>
              <Button
                variant="outline"
                className="border-amber-500/30 text-amber-400"
                onClick={() => setCreateOpen(true)}
              >
                <PlusCircle className="w-4 h-4 mr-2" /> İlk Erişimi Oluştur
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">
                    Müşteri
                  </TableHead>
                  <TableHead className="text-muted-foreground">Proje</TableHead>
                  <TableHead className="text-muted-foreground">Durum</TableHead>
                  <TableHead className="text-muted-foreground">
                    Oluşturulma
                  </TableHead>
                  <TableHead className="text-muted-foreground">Bitiş</TableHead>
                  <TableHead className="text-muted-foreground text-center">
                    Görüntüleme
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    İşlemler
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accesses.map((a, idx) => (
                  <TableRow
                    key={a.id}
                    data-ocid={`customer_portal.row.${idx + 1}`}
                    className="border-border"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {a.clientName}
                        </p>
                        {a.clientEmail && (
                          <p className="text-xs text-muted-foreground">
                            {a.clientEmail}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getProject(a.projectId)?.title || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusStyle[a.status]}>
                        {statusLabel[a.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.createdAt}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.expiresAt || "Süresiz"}
                    </TableCell>
                    <TableCell className="text-center text-foreground">
                      {a.viewCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-amber-400 hover:text-amber-300"
                          onClick={() => handleCopy(a.token)}
                          title="Linki kopyala"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        {copied === a.token && (
                          <span className="text-xs text-green-400">
                            Kopyalandı!
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300"
                          onClick={() => setPreviewAccess(a)}
                          title="Portal önizleme"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {a.status === "active" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                            onClick={() => handleRevoke(a.id)}
                            title="Erişimi iptal et"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                          onClick={() => handleDelete(a.id)}
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          data-ocid="customer_portal.create.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Yeni Portal Erişimi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Proje *</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm({ ...form, projectId: v })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Proje seçin..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companyProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Müşteri Adı *</Label>
                <Input
                  className="bg-background border-border"
                  value={form.clientName}
                  onChange={(e) =>
                    setForm({ ...form, clientName: e.target.value })
                  }
                  placeholder="Firma veya kişi adı"
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-posta</Label>
                <Input
                  className="bg-background border-border"
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) =>
                    setForm({ ...form, clientEmail: e.target.value })
                  }
                  placeholder="ornek@firma.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Erişim Bitiş Tarihi</Label>
              <Input
                className="bg-background border-border"
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>İzinler</Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["progress", "İlerleme"],
                    ["budget", "Bütçe"],
                    ["hakedis", "Hakediş"],
                    ["documents", "Belgeler"],
                    ["photos", "Fotoğraflar"],
                    ["risks", "Riskler"],
                  ] as [keyof typeof form, string][]
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.checked })
                      }
                      className="accent-amber-500"
                    />
                    <span className="text-sm text-muted-foreground">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              İptal
            </Button>
            <Button
              data-ocid="customer_portal.create.submit"
              className="gradient-bg text-white"
              onClick={handleCreate}
              disabled={!form.projectId || !form.clientName}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewAccess}
        onOpenChange={() => setPreviewAccess(null)}
      >
        <DialogContent
          data-ocid="customer_portal.preview.dialog"
          className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              Portal Önizleme — {previewAccess?.clientName}
            </DialogTitle>
          </DialogHeader>
          {previewProject && previewAccess && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                <h3 className="text-lg font-bold text-foreground">
                  {previewProject.title}
                </h3>
                {previewProject.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {previewProject.description}
                  </p>
                )}
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-muted-foreground">
                    Başlangıç:{" "}
                    <span className="text-foreground">
                      {previewProject.startDate || "—"}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Bitiş:{" "}
                    <span className="text-foreground">
                      {previewProject.endDate || "—"}
                    </span>
                  </span>
                </div>
              </div>

              {previewAccess.permissions.progress && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    İlerleme
                  </p>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={previewProject.progress ?? 0}
                      className="flex-1 h-3"
                    />
                    <span className="text-amber-400 font-bold">
                      %{previewProject.progress ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {previewTasks.filter((t) => t.status === "done").length} /{" "}
                    {previewTasks.length} görev tamamlandı
                  </p>
                </div>
              )}

              {previewAccess.permissions.budget && previewProject.budget && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Bütçe Durumu
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <p className="text-xs text-muted-foreground">
                        Toplam Bütçe
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {fmt(previewProject.budget)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <p className="text-xs text-muted-foreground">Harcanan</p>
                      <p className="text-base font-bold text-amber-400">
                        {fmt(previewTotalExp)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <p className="text-xs text-muted-foreground">Kullanım</p>
                      <p className="text-base font-bold text-foreground">
                        %{budgetPct}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {previewAccess.permissions.hakedis &&
                previewHakedis.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Hakediş Durumu ({previewHakedis.length} kayıt)
                    </p>
                    <div className="space-y-2">
                      {previewHakedis.slice(0, 5).map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-2 rounded bg-background border border-border"
                        >
                          <span className="text-sm text-foreground">
                            HAK-{h.id.slice(-5).toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {h.period}
                          </span>
                          <Badge className="text-xs bg-amber-500/20 text-amber-400">
                            {h.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {previewAccess.permissions.risks && previewRisks.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Açık Riskler ({previewRisks.length})
                  </p>
                  <div className="space-y-1">
                    {previewRisks.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-2 p-2 rounded bg-background border border-border"
                      >
                        <Badge className="text-xs bg-red-500/20 text-red-400">
                          {r.status}
                        </Badge>
                        <span className="text-sm text-foreground">
                          {r.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-400"
              onClick={() => handleCopy(previewAccess?.token || "")}
            >
              <Copy className="w-3.5 h-3.5 mr-2" />
              Linki Kopyala
            </Button>
            <Button variant="ghost" onClick={() => setPreviewAccess(null)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
