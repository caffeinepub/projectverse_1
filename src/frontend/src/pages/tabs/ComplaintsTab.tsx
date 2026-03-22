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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, MessageSquare, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Complaint {
  id: string;
  customer: string;
  subject: string;
  description: string;
  priority: "Düşük" | "Orta" | "Yüksek" | "Kritik";
  responsible: string;
  status: "Açık" | "İşlemde" | "Çözüldü" | "Kapatıldı";
  createdAt: string;
  resolvedAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Açık: "bg-red-500/15 text-red-400 border-red-500/30",
  İşlemde: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Çözüldü: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Kapatıldı: "bg-green-500/15 text-green-400 border-green-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  Düşük: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  Orta: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Yüksek: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Kritik: "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUS_FLOW: Record<Complaint["status"], Complaint["status"] | null> = {
  Açık: "İşlemde",
  İşlemde: "Çözüldü",
  Çözüldü: "Kapatıldı",
  Kapatıldı: null,
};

function daysDiff(from: string): number {
  return Math.floor(
    (Date.now() - new Date(from).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function SlaIndicator({ days }: { days: number }) {
  if (days <= 3)
    return <span className="text-green-400 text-xs">{days}g ✓</span>;
  if (days <= 7)
    return <span className="text-amber-400 text-xs">{days}g ⚠</span>;
  return <span className="text-red-400 text-xs">{days}g !</span>;
}

export default function ComplaintsTab({ companyId }: { companyId: string }) {
  const storageKey = `pv_complaints_${companyId}`;

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Tümü");
  const [filterPriority, setFilterPriority] = useState("Tümü");
  const [form, setForm] = useState({
    customer: "",
    subject: "",
    description: "",
    priority: "Orta" as Complaint["priority"],
    responsible: "",
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(complaints));
  }, [complaints, storageKey]);

  const stats = useMemo(() => {
    const open = complaints.filter(
      (c) => c.status === "Açık" || c.status === "İşlemde",
    ).length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    const resolvedThisMonth = complaints.filter(
      (c) =>
        (c.status === "Çözüldü" || c.status === "Kapatıldı") &&
        c.resolvedAt?.startsWith(thisMonth),
    ).length;
    const resolved = complaints.filter((c) => c.resolvedAt);
    const avgDays =
      resolved.length > 0
        ? Math.round(
            resolved.reduce(
              (s, c) =>
                s +
                Math.floor(
                  (new Date(c.resolvedAt!).getTime() -
                    new Date(c.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              0,
            ) / resolved.length,
          )
        : 0;
    return { open, resolvedThisMonth, avgDays };
  }, [complaints]);

  const filtered = complaints.filter((c) => {
    if (filterStatus !== "Tümü" && c.status !== filterStatus) return false;
    if (filterPriority !== "Tümü" && c.priority !== filterPriority)
      return false;
    return true;
  });

  function addComplaint() {
    if (!form.customer || !form.subject) {
      toast.error("Müşteri ve konu zorunludur.");
      return;
    }
    setComplaints((prev) => [
      {
        id: Date.now().toString(),
        ...form,
        status: "Açık",
        createdAt: new Date().toISOString().split("T")[0],
      },
      ...prev,
    ]);
    setForm({
      customer: "",
      subject: "",
      description: "",
      priority: "Orta",
      responsible: "",
    });
    setOpen(false);
    toast.success("Şikayet kaydedildi.");
  }

  function advance(id: string) {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = STATUS_FLOW[c.status];
        if (!next) return c;
        return {
          ...c,
          status: next,
          resolvedAt:
            next === "Çözüldü"
              ? new Date().toISOString().split("T")[0]
              : c.resolvedAt,
        };
      }),
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
              Açık Şikayetler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">{stats.open}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
              Bu Ay Çözülen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              {stats.resolvedThisMonth}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
              Ort. Çözüm Süresi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-400">
              {stats.avgDays} gün
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger
              data-ocid="crm.complaints.status.select"
              className="w-36 border-border text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tümü">Tüm Durumlar</SelectItem>
              <SelectItem value="Açık">Açık</SelectItem>
              <SelectItem value="İşlemde">İşlemde</SelectItem>
              <SelectItem value="Çözüldü">Çözüldü</SelectItem>
              <SelectItem value="Kapatıldı">Kapatıldı</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger
              data-ocid="crm.complaints.priority.select"
              className="w-36 border-border text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tümü">Tüm Öncelikler</SelectItem>
              <SelectItem value="Düşük">Düşük</SelectItem>
              <SelectItem value="Orta">Orta</SelectItem>
              <SelectItem value="Yüksek">Yüksek</SelectItem>
              <SelectItem value="Kritik">Kritik</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          data-ocid="crm.complaints.add_button"
          size="sm"
          className="gradient-bg text-white"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> Şikayet Ekle
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          data-ocid="crm.complaints.empty_state"
          className="text-center py-14 text-muted-foreground bg-card rounded-xl border border-border"
        >
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Şikayet bulunamadı</p>
          <p className="text-sm mt-1">Yeni şikayet veya talep ekleyin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, idx) => (
            <div
              key={c.id}
              data-ocid={`crm.complaints.item.${idx + 1}`}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{c.subject}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${PRIORITY_COLORS[c.priority]}`}
                    >
                      {c.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[c.status]}`}
                    >
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Müşteri:{" "}
                    <span className="text-foreground">{c.customer}</span>
                    {c.responsible && ` · Sorumlu: ${c.responsible}`}
                  </p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Açıldı: {c.createdAt}
                    </span>
                    {(c.status === "Açık" || c.status === "İşlemde") && (
                      <SlaIndicator days={daysDiff(c.createdAt)} />
                    )}
                    {c.resolvedAt && (
                      <span className="text-xs text-muted-foreground">
                        Çözüldü: {c.resolvedAt}
                      </span>
                    )}
                  </div>
                </div>
                {STATUS_FLOW[c.status] && (
                  <Button
                    data-ocid={`crm.complaints.advance_button.${idx + 1}`}
                    size="sm"
                    variant="outline"
                    className="border-border text-xs"
                    onClick={() => advance(c.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    {STATUS_FLOW[c.status]}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-ocid="crm.complaints.dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Yeni Şikayet / Talep</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Müşteri *</Label>
              <Input
                data-ocid="crm.complaints.customer.input"
                value={form.customer}
                onChange={(e) =>
                  setForm((p) => ({ ...p, customer: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Konu *</Label>
              <Input
                data-ocid="crm.complaints.subject.input"
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Öncelik</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    priority: v as Complaint["priority"],
                  }))
                }
              >
                <SelectTrigger
                  data-ocid="crm.complaints.priority.input"
                  className="border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Düşük">Düşük</SelectItem>
                  <SelectItem value="Orta">Orta</SelectItem>
                  <SelectItem value="Yüksek">Yüksek</SelectItem>
                  <SelectItem value="Kritik">Kritik</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sorumlu</Label>
              <Input
                data-ocid="crm.complaints.responsible.input"
                value={form.responsible}
                onChange={(e) =>
                  setForm((p) => ({ ...p, responsible: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                data-ocid="crm.complaints.description.input"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="crm.complaints.cancel_button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="crm.complaints.submit_button"
              className="gradient-bg text-white"
              onClick={addComplaint}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unused icons suppressor */}
      <span className="hidden">
        <AlertTriangle className="h-0 w-0" />
      </span>
    </div>
  );
}
