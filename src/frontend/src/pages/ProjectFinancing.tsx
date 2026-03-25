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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Edit, Landmark, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface FinancingRecord {
  id: string;
  tur: string;
  tutar: string;
  verenBanka: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  proje: string;
  durum: string;
  aciklama: string;
}

const FINANCING_TYPES = [
  "Banka Kredisi",
  "Geçici Teminat Mektubu",
  "Kesin Teminat Mektubu",
  "Avans Teminat Mektubu",
  "Banka Garantisi",
  "Akreditif",
  "Diğer",
];

const STATUS_OPTIONS = ["Aktif", "Sona Erdi", "Serbest Bırakıldı"];

function daysUntil(dateStr: string): number {
  if (!dateStr) return 9999;
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

const empty: FinancingRecord = {
  id: "",
  tur: "",
  tutar: "",
  verenBanka: "",
  baslangicTarihi: "",
  bitisTarihi: "",
  proje: "",
  durum: "Aktif",
  aciklama: "",
};

export default function ProjectFinancing() {
  const { activeCompanyId, projects } = useApp();
  const storageKey = `pv_project_financing_${activeCompanyId}`;

  const [records, setRecords] = useState<FinancingRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinancingRecord | null>(null);
  const [form, setForm] = useState<FinancingRecord>(empty);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...empty, id: crypto.randomUUID() });
    setDialogOpen(true);
  };

  const openEdit = (r: FinancingRecord) => {
    setEditing(r);
    setForm({ ...r });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.tur || !form.tutar || !form.verenBanka) return;
    if (editing) {
      setRecords((prev) => prev.map((r) => (r.id === form.id ? form : r)));
    } else {
      setRecords((prev) => [...prev, form]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const totalTutar = records.reduce(
    (s, r) => s + (Number.parseFloat(r.tutar) || 0),
    0,
  );
  const aktifSayi = records.filter((r) => r.durum === "Aktif").length;
  const soon = records.filter(
    (r) => r.durum === "Aktif" && daysUntil(r.bitisTarihi) <= 30,
  ).length;
  const krediler = records
    .filter((r) => r.tur === "Banka Kredisi")
    .reduce((s, r) => s + (Number.parseFloat(r.tutar) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" />
            Finansman & Teminat Takibi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Banka kredileri, teminat mektupları ve banka garantileri
          </p>
        </div>
        <Button data-ocid="financing.add_button" onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Kayıt Ekle
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Toplam Teminat
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-foreground">
              {totalTutar.toLocaleString("tr-TR")} ₺
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Aktif Teminat
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-primary">{aktifSayi}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              30 Günde Bitecek
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-destructive">{soon}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Toplam Kredi
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-foreground">
              {krediler.toLocaleString("tr-TR")} ₺
            </p>
          </CardContent>
        </Card>
      </div>

      {records.length === 0 ? (
        <div
          data-ocid="financing.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Landmark className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Henüz kayıt eklenmedi.</p>
          <Button
            onClick={openAdd}
            variant="outline"
            className="mt-4"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" /> İlk Kaydı Ekle
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-auto">
          <Table data-ocid="financing.table">
            <TableHeader>
              <TableRow>
                <TableHead>Tür</TableHead>
                <TableHead>Tutar (₺)</TableHead>
                <TableHead>Veren Banka</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead>Bitiş Tarihi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r, idx) => {
                const days = daysUntil(r.bitisTarihi);
                const warning = r.durum === "Aktif" && days <= 30;
                return (
                  <TableRow data-ocid={`financing.item.${idx + 1}`} key={r.id}>
                    <TableCell className="font-medium">{r.tur}</TableCell>
                    <TableCell>
                      {Number.parseFloat(r.tutar || "0").toLocaleString(
                        "tr-TR",
                      )}
                    </TableCell>
                    <TableCell>{r.verenBanka}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.proje || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {warning && (
                          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                        )}
                        <span className={warning ? "text-destructive" : ""}>
                          {r.bitisTarihi || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={r.durum === "Aktif" ? "default" : "secondary"}
                      >
                        {r.durum}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          data-ocid={`financing.edit_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEdit(r)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`financing.delete_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="financing.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Kaydı Düzenle" : "Yeni Kayıt Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tür *</Label>
              <Select
                value={form.tur}
                onValueChange={(v) => setForm((f) => ({ ...f, tur: v }))}
              >
                <SelectTrigger
                  data-ocid="financing.tur.select"
                  className="bg-background border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {FINANCING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tutar (₺) *</Label>
              <Input
                data-ocid="financing.tutar.input"
                value={form.tutar}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tutar: e.target.value }))
                }
                placeholder="0"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Veren Banka *</Label>
              <Input
                data-ocid="financing.verenBanka.input"
                value={form.verenBanka}
                onChange={(e) =>
                  setForm((f) => ({ ...f, verenBanka: e.target.value }))
                }
                placeholder="Banka adı"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Durum</Label>
              <Select
                value={form.durum}
                onValueChange={(v) => setForm((f) => ({ ...f, durum: v }))}
              >
                <SelectTrigger
                  data-ocid="financing.durum.select"
                  className="bg-background border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Başlangıç Tarihi</Label>
              <Input
                data-ocid="financing.baslangic.input"
                type="date"
                value={form.baslangicTarihi}
                onChange={(e) =>
                  setForm((f) => ({ ...f, baslangicTarihi: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Bitiş Tarihi</Label>
              <Input
                data-ocid="financing.bitis.input"
                type="date"
                value={form.bitisTarihi}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bitisTarihi: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>İlgili Proje</Label>
              <Select
                value={form.proje}
                onValueChange={(v) => setForm((f) => ({ ...f, proje: v }))}
              >
                <SelectTrigger
                  data-ocid="financing.proje.select"
                  className="bg-background border-border"
                >
                  <SelectValue placeholder="Proje seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">—</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.title}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Açıklama</Label>
              <Textarea
                data-ocid="financing.aciklama.textarea"
                value={form.aciklama}
                onChange={(e) =>
                  setForm((f) => ({ ...f, aciklama: e.target.value }))
                }
                rows={2}
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="financing.cancel_button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button data-ocid="financing.save_button" onClick={handleSave}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
