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
import { AlertTriangle, Edit, Plus, Siren, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface EscalationEntry {
  zaman: string;
  kisi: string;
  not: string;
}

interface SiteAlarm {
  id: string;
  baslik: string;
  tur: string;
  aciliyet: string;
  santiye: string;
  alarmZamani: string;
  bildiren: string;
  aciklama: string;
  durum: string;
  kapatmaNotu: string;
  escalations: EscalationEntry[];
}

const ALARM_TURLERI = [
  "Kaza",
  "Yangın",
  "Güvenlik İhlali",
  "Ekipman Arızası",
  "Acil Durum",
  "Diğer",
];
const ACILIYET_OPTIONS = ["Kritik", "Yüksek", "Orta", "Düşük"];
const DURUM_OPTIONS = ["Açık", "Müdahale Ediliyor", "Kapatıldı"];

function aciliyetBadge(a: string) {
  if (a === "Kritik")
    return (
      <Badge className="bg-destructive text-destructive-foreground">
        Kritik
      </Badge>
    );
  if (a === "Yüksek")
    return (
      <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
        Yüksek
      </Badge>
    );
  if (a === "Orta")
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        Orta
      </Badge>
    );
  return (
    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
      Düşük
    </Badge>
  );
}

const empty: SiteAlarm = {
  id: "",
  baslik: "",
  tur: "",
  aciliyet: "Orta",
  santiye: "",
  alarmZamani: new Date().toISOString().slice(0, 16),
  bildiren: "",
  aciklama: "",
  durum: "Açık",
  kapatmaNotu: "",
  escalations: [],
};

export default function SiteAlarms() {
  const { activeCompanyId, projects } = useApp();
  const storageKey = `pv_site_alarms_${activeCompanyId}`;

  const [alarms, setAlarms] = useState<SiteAlarm[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [escalationAlarm, setEscalationAlarm] = useState<SiteAlarm | null>(
    null,
  );
  const [escalationNote, setEscalationNote] = useState("");
  const [escalationPerson, setEscalationPerson] = useState("");
  const [editing, setEditing] = useState<SiteAlarm | null>(null);
  const [form, setForm] = useState<SiteAlarm>(empty);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(alarms));
  }, [alarms, storageKey]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...empty,
      id: crypto.randomUUID(),
      alarmZamani: new Date().toISOString().slice(0, 16),
      escalations: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (a: SiteAlarm) => {
    setEditing(a);
    setForm({ ...a, escalations: [...(a.escalations || [])] });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.baslik || !form.tur) return;
    if (editing) {
      setAlarms((prev) => prev.map((a) => (a.id === form.id ? form : a)));
    } else {
      setAlarms((prev) => [...prev, form]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const addEscalation = () => {
    if (!escalationAlarm || !escalationNote) return;
    const entry: EscalationEntry = {
      zaman: new Date().toISOString(),
      kisi: escalationPerson,
      not: escalationNote,
    };
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === escalationAlarm.id
          ? { ...a, escalations: [...(a.escalations || []), entry] }
          : a,
      ),
    );
    setEscalationNote("");
    setEscalationPerson("");
    setEscalationAlarm(null);
  };

  const acik = alarms.filter((a) => a.durum === "Açık").length;
  const kritik = alarms.filter(
    (a) => a.aciliyet === "Kritik" && a.durum !== "Kapatıldı",
  ).length;
  const thisMonth = alarms.filter((a) => {
    const d = new Date(a.alarmZamani);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear() &&
      a.durum === "Kapatıldı"
    );
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Siren className="w-6 h-6 text-destructive" />
            Saha Alarmları & Eskalasyon
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Anlık saha alarmları, müdahale ve eskalasyon yönetimi
          </p>
        </div>
        <Button data-ocid="alarms.add_button" onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Alarm Oluştur
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Açık Alarm
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-destructive">{acik}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Kritik Alarm
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-destructive">{kritik}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Bu Ay Kapatılan
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-primary">{thisMonth}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Toplam
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-foreground">{alarms.length}</p>
          </CardContent>
        </Card>
      </div>

      {alarms.length === 0 ? (
        <div
          data-ocid="alarms.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Siren className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aktif alarm bulunmuyor.</p>
          <Button
            onClick={openAdd}
            variant="outline"
            className="mt-4"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Alarm Oluştur
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-auto">
          <Table data-ocid="alarms.table">
            <TableHeader>
              <TableRow>
                <TableHead>Başlık</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Aciliyet</TableHead>
                <TableHead>Santiye</TableHead>
                <TableHead>Zaman</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Eskalasyon</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alarms.map((a, idx) => (
                <TableRow data-ocid={`alarms.item.${idx + 1}`} key={a.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      {a.aciliyet === "Kritik" && (
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                      )}
                      {a.baslik}
                    </div>
                  </TableCell>
                  <TableCell>{a.tur}</TableCell>
                  <TableCell>{aciliyetBadge(a.aciliyet)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.santiye || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {a.alarmZamani
                      ? new Date(a.alarmZamani).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        a.durum === "Kapatıldı"
                          ? "secondary"
                          : a.durum === "Açık"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {a.durum}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setEscalationAlarm(a)}
                    >
                      +Log ({(a.escalations || []).length})
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        data-ocid={`alarms.edit_button.${idx + 1}`}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(a)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-ocid={`alarms.delete_button.${idx + 1}`}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(a.id)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="alarms.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Alarmı Düzenle" : "Yeni Alarm Oluştur"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Alarm Başlığı *</Label>
              <Input
                data-ocid="alarms.baslik.input"
                value={form.baslik}
                onChange={(e) =>
                  setForm((f) => ({ ...f, baslik: e.target.value }))
                }
                placeholder="Kısa açıklama"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Tür *</Label>
              <Select
                value={form.tur}
                onValueChange={(v) => setForm((f) => ({ ...f, tur: v }))}
              >
                <SelectTrigger
                  data-ocid="alarms.tur.select"
                  className="bg-background border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {ALARM_TURLERI.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Aciliyet</Label>
              <Select
                value={form.aciliyet}
                onValueChange={(v) => setForm((f) => ({ ...f, aciliyet: v }))}
              >
                <SelectTrigger
                  data-ocid="alarms.aciliyet.select"
                  className="bg-background border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACILIYET_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Santiye/Proje</Label>
              <Select
                value={form.santiye}
                onValueChange={(v) => setForm((f) => ({ ...f, santiye: v }))}
              >
                <SelectTrigger
                  data-ocid="alarms.santiye.select"
                  className="bg-background border-border"
                >
                  <SelectValue placeholder="Proje seçin" />
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
                  data-ocid="alarms.durum.select"
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
            <div className="space-y-1">
              <Label>Alarm Zamanı</Label>
              <Input
                data-ocid="alarms.zaman.input"
                type="datetime-local"
                value={form.alarmZamani}
                onChange={(e) =>
                  setForm((f) => ({ ...f, alarmZamani: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Bildiren Kişi</Label>
              <Input
                data-ocid="alarms.bildiren.input"
                value={form.bildiren}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bildiren: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Açıklama</Label>
              <Textarea
                data-ocid="alarms.aciklama.textarea"
                value={form.aciklama}
                onChange={(e) =>
                  setForm((f) => ({ ...f, aciklama: e.target.value }))
                }
                rows={2}
                className="bg-background border-border"
              />
            </div>
            {form.durum === "Kapatıldı" && (
              <div className="col-span-2 space-y-1">
                <Label>Kapatma Notu</Label>
                <Textarea
                  data-ocid="alarms.kapatmaNotu.textarea"
                  value={form.kapatmaNotu}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, kapatmaNotu: e.target.value }))
                  }
                  rows={2}
                  className="bg-background border-border"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              data-ocid="alarms.cancel_button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button data-ocid="alarms.save_button" onClick={handleSave}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalation Log Dialog */}
      <Dialog
        open={!!escalationAlarm}
        onOpenChange={() => setEscalationAlarm(null)}
      >
        <DialogContent
          data-ocid="alarms.escalation.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Eskalasyon Logu</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setEscalationAlarm(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(escalationAlarm?.escalations || []).length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Log girişi yok
                </p>
              ) : (
                escalationAlarm?.escalations.map((e) => (
                  <div
                    key={e.zaman + e.kisi}
                    className="text-sm border border-border rounded p-2 bg-background"
                  >
                    <div className="flex justify-between text-muted-foreground text-xs mb-1">
                      <span>{e.kisi || "—"}</span>
                      <span>
                        {new Date(e.zaman).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-foreground">{e.not}</p>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Kişi adı"
                value={escalationPerson}
                onChange={(e) => setEscalationPerson(e.target.value)}
                className="bg-background border-border"
              />
              <Textarea
                placeholder="Not ekle..."
                value={escalationNote}
                onChange={(e) => setEscalationNote(e.target.value)}
                rows={2}
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="alarms.escalation.cancel_button"
              variant="ghost"
              onClick={() => setEscalationAlarm(null)}
            >
              Kapat
            </Button>
            <Button
              data-ocid="alarms.escalation.confirm_button"
              onClick={addEscalation}
            >
              Log Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
