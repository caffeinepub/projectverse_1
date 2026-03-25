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
import { Edit, Plus, Scale, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface LegalRecord {
  id: string;
  tur: string;
  gonderen: string;
  alici: string;
  tarih: string;
  konu: string;
  dosyaRef: string;
  ilgiliProje: string;
  ilgiliSozlesme: string;
  durum: string;
  onemDerecesi: string;
  notlar: string;
}

const KAYIT_TURLERI = [
  "Noter Tebligatı",
  "İhtar",
  "İhtiyati Haciz",
  "Dava Dilekçesi",
  "Bilirkişi Raporu",
  "Sulh Protokolü",
  "İcra Takibi",
  "Mahkeme Kararı",
  "Diğer",
];
const DURUM_OPTIONS = ["Açık", "Yanıt Bekleniyor", "Kapatıldı", "Arşivlendi"];
const ONEM_OPTIONS = ["Yüksek", "Orta", "Düşük"];

const empty: LegalRecord = {
  id: "",
  tur: "",
  gonderen: "",
  alici: "",
  tarih: "",
  konu: "",
  dosyaRef: "",
  ilgiliProje: "",
  ilgiliSozlesme: "",
  durum: "Açık",
  onemDerecesi: "Orta",
  notlar: "",
};

export default function LegalCorrespondence() {
  const { activeCompanyId, projects } = useApp();
  const storageKey = `pv_legal_correspondence_${activeCompanyId}`;

  const [records, setRecords] = useState<LegalRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LegalRecord | null>(null);
  const [form, setForm] = useState<LegalRecord>(empty);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...empty, id: crypto.randomUUID() });
    setDialogOpen(true);
  };

  const openEdit = (r: LegalRecord) => {
    setEditing(r);
    setForm({ ...r });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.tur || !form.konu) return;
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

  const toplam = records.length;
  const acikDavalar = records.filter(
    (r) =>
      r.durum === "Açık" &&
      ["Dava Dilekçesi", "İhtiyati Haciz", "İcra Takibi"].includes(r.tur),
  ).length;
  const yanitBekleyen = records.filter(
    (r) => r.durum === "Yanıt Bekleniyor",
  ).length;
  const now = new Date();
  const buAy = records.filter((r) => {
    const d = new Date(r.tarih);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" />
            Hukuki Yazışma & Tebligat Arşivi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Noter tebligatları, ihtarlar, dava ve hukuki süreç takibi
          </p>
        </div>
        <Button data-ocid="legal.add_button" onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Kayıt Ekle
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Toplam Kayıt
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-foreground">{toplam}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Açık Davalar
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-destructive">{acikDavalar}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Yanıt Bekleyen
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-warning">{yanitBekleyen}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Bu Ay Eklenen
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-primary">{buAy}</p>
          </CardContent>
        </Card>
      </div>

      {records.length === 0 ? (
        <div
          data-ocid="legal.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Scale className="w-12 h-12 text-muted-foreground mb-4" />
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
          <Table data-ocid="legal.table">
            <TableHeader>
              <TableRow>
                <TableHead>Tür</TableHead>
                <TableHead>Konu</TableHead>
                <TableHead>Gönderen</TableHead>
                <TableHead>Alıcı</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead>Önem</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r, idx) => (
                <TableRow data-ocid={`legal.item.${idx + 1}`} key={r.id}>
                  <TableCell className="font-medium text-xs">{r.tur}</TableCell>
                  <TableCell className="max-w-40 truncate">{r.konu}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {r.gonderen || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {r.alici || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {r.tarih || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {r.ilgiliProje || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.onemDerecesi === "Yüksek"
                          ? "destructive"
                          : r.onemDerecesi === "Orta"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {r.onemDerecesi}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.durum === "Kapatıldı" || r.durum === "Arşivlendi"
                          ? "secondary"
                          : r.durum === "Açık"
                            ? "default"
                            : "outline"
                      }
                    >
                      {r.durum}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        data-ocid={`legal.edit_button.${idx + 1}`}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(r)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-ocid={`legal.delete_button.${idx + 1}`}
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="legal.dialog"
          className="bg-card border-border max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Kaydı Düzenle" : "Yeni Hukuki Kayıt Ekle"}
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
                  data-ocid="legal.tur.select"
                  className="bg-background border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {KAYIT_TURLERI.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Önem Derecesi</Label>
              <Select
                value={form.onemDerecesi}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, onemDerecesi: v }))
                }
              >
                <SelectTrigger
                  data-ocid="legal.onem.select"
                  className="bg-background border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ONEM_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Konu *</Label>
              <Input
                data-ocid="legal.konu.input"
                value={form.konu}
                onChange={(e) =>
                  setForm((f) => ({ ...f, konu: e.target.value }))
                }
                placeholder="Yazışma konusu"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Gönderen</Label>
              <Input
                data-ocid="legal.gonderen.input"
                value={form.gonderen}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gonderen: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Alıcı</Label>
              <Input
                data-ocid="legal.alici.input"
                value={form.alici}
                onChange={(e) =>
                  setForm((f) => ({ ...f, alici: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Tarih</Label>
              <Input
                data-ocid="legal.tarih.input"
                type="date"
                value={form.tarih}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tarih: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Dosya Referansı</Label>
              <Input
                data-ocid="legal.dosyaRef.input"
                value={form.dosyaRef}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dosyaRef: e.target.value }))
                }
                placeholder="Dosya No"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>İlgili Proje</Label>
              <Select
                value={form.ilgiliProje}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, ilgiliProje: v }))
                }
              >
                <SelectTrigger
                  data-ocid="legal.proje.select"
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
            <div className="space-y-1">
              <Label>Durum</Label>
              <Select
                value={form.durum}
                onValueChange={(v) => setForm((f) => ({ ...f, durum: v }))}
              >
                <SelectTrigger
                  data-ocid="legal.durum.select"
                  className="bg-background border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURUM_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>İlgili Sözleşme No</Label>
              <Input
                data-ocid="legal.sozlesme.input"
                value={form.ilgiliSozlesme}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ilgiliSozlesme: e.target.value }))
                }
                placeholder="Sözleşme numarası"
                className="bg-background border-border"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notlar</Label>
              <Textarea
                data-ocid="legal.notlar.textarea"
                value={form.notlar}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notlar: e.target.value }))
                }
                rows={2}
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="legal.cancel_button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button data-ocid="legal.save_button" onClick={handleSave}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
