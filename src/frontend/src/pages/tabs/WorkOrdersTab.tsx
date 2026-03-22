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
import { ClipboardList, Info, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Subcontractor {
  id: string;
  name: string;
}

interface WorkOrder {
  id: string;
  subcontractorId: string;
  subcontractorName: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedAmount: number;
  project: string;
  status:
    | "Taslak"
    | "Gönderildi"
    | "Devam Ediyor"
    | "Tamamlandı"
    | "Fatura Kesildi";
  deliveryNote: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  Taslak: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  Gönderildi: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Devam Ediyor": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Tamamlandı: "bg-green-500/15 text-green-400 border-green-500/30",
  "Fatura Kesildi": "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const STATUS_NEXT: Record<WorkOrder["status"], WorkOrder["status"] | null> = {
  Taslak: "Gönderildi",
  Gönderildi: "Devam Ediyor",
  "Devam Ediyor": "Tamamlandı",
  Tamamlandı: "Fatura Kesildi",
  "Fatura Kesildi": null,
};

export default function WorkOrdersTab({
  companyId,
  subcontractors,
}: { companyId: string; subcontractors: Subcontractor[] }) {
  const storageKey = `pv_sub_workorders_${companyId}`;

  const [orders, setOrders] = useState<WorkOrder[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subcontractorId: "",
    description: "",
    startDate: "",
    endDate: "",
    estimatedAmount: "",
    project: "",
    deliveryNote: "",
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(orders));
  }, [orders, storageKey]);

  const stats = useMemo(() => {
    const active = orders.filter(
      (o) => o.status === "Devam Ediyor" || o.status === "Gönderildi",
    ).length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    const completedThisMonth = orders.filter(
      (o) => o.status === "Tamamlandı" && o.createdAt.startsWith(thisMonth),
    ).length;
    const total = orders.reduce((s, o) => s + o.estimatedAmount, 0);
    return { active, completedThisMonth, total };
  }, [orders]);

  function addOrder() {
    if (!form.subcontractorId || !form.description) {
      toast.error("Taşeron ve iş tanımı zorunludur.");
      return;
    }
    const sub = subcontractors.find((s) => s.id === form.subcontractorId);
    setOrders((prev) => [
      {
        id: Date.now().toString(),
        subcontractorId: form.subcontractorId,
        subcontractorName: sub?.name || "",
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        estimatedAmount: Number(form.estimatedAmount) || 0,
        project: form.project,
        status: "Taslak",
        deliveryNote: form.deliveryNote,
        createdAt: new Date().toISOString().split("T")[0],
      },
      ...prev,
    ]);
    setForm({
      subcontractorId: "",
      description: "",
      startDate: "",
      endDate: "",
      estimatedAmount: "",
      project: "",
      deliveryNote: "",
    });
    setOpen(false);
    toast.success("İş emri oluşturuldu.");
  }

  function advanceStatus(id: string) {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = STATUS_NEXT[o.status];
        if (!next) return o;
        if (next === "Tamamlandı") {
          toast.info(
            "İş emri tamamlandı. Hakediş sistemiyle ilişkilendirmeyi unutmayın.",
          );
        }
        return { ...o, status: next };
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
              Aktif İş Emirleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-400">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
              Bu Ay Tamamlanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              {stats.completedThisMonth}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
              Toplam Tutar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {stats.total.toLocaleString("tr-TR")} ₺
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">İş Emirleri Listesi</h3>
        <Button
          data-ocid="subcontractor.workorders.add_button"
          size="sm"
          className="gradient-bg text-white"
          onClick={() => setOpen(true)}
          disabled={subcontractors.length === 0}
        >
          <Plus className="h-4 w-4 mr-1" /> İş Emri Oluştur
        </Button>
      </div>

      {subcontractors.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          <Info className="h-4 w-4 shrink-0" />
          İş emri oluşturmak için önce Taşeronlar sekmesinden taşeron firma
          ekleyin.
        </div>
      )}

      {/* List */}
      {orders.length === 0 ? (
        <div
          data-ocid="subcontractor.workorders.empty_state"
          className="text-center py-14 text-muted-foreground bg-card rounded-xl border border-border"
        >
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Henüz iş emri yok</p>
          <p className="text-sm mt-1">
            Taşerona iş emri oluşturun ve sürecini takip edin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o, idx) => (
            <div
              key={o.id}
              data-ocid={`subcontractor.workorders.item.${idx + 1}`}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">
                      {o.description}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[o.status]}`}
                    >
                      {o.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Taşeron:{" "}
                    <span className="text-foreground">
                      {o.subcontractorName}
                    </span>
                    {o.project && (
                      <>
                        {" "}
                        · Proje:{" "}
                        <span className="text-foreground">{o.project}</span>
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    {o.startDate && <span>Başlangıç: {o.startDate}</span>}
                    {o.endDate && <span>Bitiş: {o.endDate}</span>}
                    {o.estimatedAmount > 0 && (
                      <span className="text-amber-400 font-medium">
                        {o.estimatedAmount.toLocaleString("tr-TR")} ₺
                      </span>
                    )}
                  </div>
                  {o.deliveryNote && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Teslim Notu: {o.deliveryNote}
                    </p>
                  )}
                  {o.status === "Tamamlandı" && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-md px-2 py-1">
                      <Info className="h-3.5 w-3.5" />
                      Bu iş emri tamamlandı. Hakediş modülünden ilişkilendirme
                      yapabilirsiniz.
                    </div>
                  )}
                </div>
                {STATUS_NEXT[o.status] && (
                  <Button
                    data-ocid={`subcontractor.workorders.advance_button.${idx + 1}`}
                    size="sm"
                    variant="outline"
                    className="border-border text-xs shrink-0"
                    onClick={() => advanceStatus(o.id)}
                  >
                    → {STATUS_NEXT[o.status]}
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
          data-ocid="subcontractor.workorders.dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Yeni İş Emri</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Taşeron Firma *</Label>
              <Select
                value={form.subcontractorId}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, subcontractorId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="subcontractor.workorders.sub.select"
                  className="border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {subcontractors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>İş Tanımı *</Label>
              <Textarea
                data-ocid="subcontractor.workorders.description.input"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Başlangıç</Label>
                <Input
                  data-ocid="subcontractor.workorders.start.input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Bitiş</Label>
                <Input
                  data-ocid="subcontractor.workorders.end.input"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Tahmini Tutar (₺)</Label>
              <Input
                data-ocid="subcontractor.workorders.amount.input"
                type="number"
                value={form.estimatedAmount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, estimatedAmount: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Proje</Label>
              <Input
                data-ocid="subcontractor.workorders.project.input"
                value={form.project}
                onChange={(e) =>
                  setForm((p) => ({ ...p, project: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Teslim Notu</Label>
              <Textarea
                data-ocid="subcontractor.workorders.delivery.input"
                value={form.deliveryNote}
                onChange={(e) =>
                  setForm((p) => ({ ...p, deliveryNote: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="subcontractor.workorders.cancel_button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="subcontractor.workorders.submit_button"
              className="gradient-bg text-white"
              onClick={addOrder}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
