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
import { AlertTriangle, Car, Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface Vehicle {
  id: string;
  plaka: string;
  marka: string;
  model: string;
  yil: string;
  aracTipi: string;
  surucu: string;
  muayeneBitis: string;
  kaskoBitis: string;
  trafikSigortaBitis: string;
  yakitTipi: string;
  durum: string;
  notlar: string;
}

const ARAC_TIPLERI = [
  "Binek",
  "Kamyonet",
  "Pick-up",
  "Minibüs",
  "Kamyon",
  "Diğer",
];
const YAKIT_TIPLERI = ["Benzin", "Dizel", "LPG", "Hibrit", "Elektrik"];
const DURUM_OPTIONS = ["Aktif", "Bakımda", "Kiralık", "Hurdaya Ayrıldı"];

function daysUntil(dateStr: string): number {
  if (!dateStr) return 9999;
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

const empty: Vehicle = {
  id: "",
  plaka: "",
  marka: "",
  model: "",
  yil: "",
  aracTipi: "",
  surucu: "",
  muayeneBitis: "",
  kaskoBitis: "",
  trafikSigortaBitis: "",
  yakitTipi: "Dizel",
  durum: "Aktif",
  notlar: "",
};

export default function VehicleFleet() {
  const { activeCompanyId } = useApp();
  const storageKey = `pv_vehicle_fleet_${activeCompanyId}`;

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Vehicle>(empty);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(vehicles));
  }, [vehicles, storageKey]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...empty, id: crypto.randomUUID() });
    setDialogOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({ ...v });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.plaka || !form.marka) return;
    if (editing) {
      setVehicles((prev) => prev.map((v) => (v.id === form.id ? form : v)));
    } else {
      setVehicles((prev) => [...prev, form]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const toplam = vehicles.length;
  const aktif = vehicles.filter((v) => v.durum === "Aktif").length;
  const bakimda = vehicles.filter((v) => v.durum === "Bakımda").length;
  const buAyMuayene = vehicles.filter(
    (v) => daysUntil(v.muayeneBitis) <= 30,
  ).length;

  const warningDates = (v: Vehicle) =>
    daysUntil(v.muayeneBitis) <= 30 ||
    daysUntil(v.kaskoBitis) <= 30 ||
    daysUntil(v.trafikSigortaBitis) <= 30;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Car className="w-6 h-6 text-primary" />
            Araç Filosu
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Şirket araçları, sigorta ve muayene takibi
          </p>
        </div>
        <Button data-ocid="fleet.add_button" onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Araç Ekle
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Toplam Araç
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-foreground">{toplam}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Aktif
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-primary">{aktif}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Bakımda
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-warning">{bakimda}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Bu Ay Muayene
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-destructive">{buAyMuayene}</p>
          </CardContent>
        </Card>
      </div>

      {vehicles.length === 0 ? (
        <div
          data-ocid="fleet.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Car className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Henüz araç eklenmedi.</p>
          <Button
            onClick={openAdd}
            variant="outline"
            className="mt-4"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" /> İlk Aracı Ekle
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-auto">
          <Table data-ocid="fleet.table">
            <TableHeader>
              <TableRow>
                <TableHead>Plaka</TableHead>
                <TableHead>Araç</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Sürücü</TableHead>
                <TableHead>Muayene</TableHead>
                <TableHead>Kasko</TableHead>
                <TableHead>Trafik Sig.</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v, idx) => (
                <TableRow data-ocid={`fleet.item.${idx + 1}`} key={v.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      {warningDates(v) && (
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                      )}
                      {v.plaka}
                    </div>
                  </TableCell>
                  <TableCell>
                    {v.marka} {v.model} ({v.yil})
                  </TableCell>
                  <TableCell>{v.aracTipi}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.surucu || "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        daysUntil(v.muayeneBitis) <= 30
                          ? "text-destructive"
                          : ""
                      }
                    >
                      {v.muayeneBitis || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        daysUntil(v.kaskoBitis) <= 30 ? "text-destructive" : ""
                      }
                    >
                      {v.kaskoBitis || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        daysUntil(v.trafikSigortaBitis) <= 30
                          ? "text-destructive"
                          : ""
                      }
                    >
                      {v.trafikSigortaBitis || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        v.durum === "Aktif"
                          ? "default"
                          : v.durum === "Bakımda"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {v.durum}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        data-ocid={`fleet.edit_button.${idx + 1}`}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(v)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-ocid={`fleet.delete_button.${idx + 1}`}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(v.id)}
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
          data-ocid="fleet.dialog"
          className="bg-card border-border max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Aracı Düzenle" : "Yeni Araç Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Plaka *</Label>
              <Input
                data-ocid="fleet.plaka.input"
                value={form.plaka}
                onChange={(e) =>
                  setForm((f) => ({ ...f, plaka: e.target.value }))
                }
                placeholder="34 ABC 123"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Marka *</Label>
              <Input
                data-ocid="fleet.marka.input"
                value={form.marka}
                onChange={(e) =>
                  setForm((f) => ({ ...f, marka: e.target.value }))
                }
                placeholder="Ford, Toyota..."
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Model</Label>
              <Input
                data-ocid="fleet.model.input"
                value={form.model}
                onChange={(e) =>
                  setForm((f) => ({ ...f, model: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Yıl</Label>
              <Input
                data-ocid="fleet.yil.input"
                value={form.yil}
                onChange={(e) =>
                  setForm((f) => ({ ...f, yil: e.target.value }))
                }
                placeholder="2022"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Araç Tipi</Label>
              <Select
                value={form.aracTipi}
                onValueChange={(v) => setForm((f) => ({ ...f, aracTipi: v }))}
              >
                <SelectTrigger
                  data-ocid="fleet.aracTipi.select"
                  className="bg-background border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {ARAC_TIPLERI.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Yakıt Tipi</Label>
              <Select
                value={form.yakitTipi}
                onValueChange={(v) => setForm((f) => ({ ...f, yakitTipi: v }))}
              >
                <SelectTrigger
                  data-ocid="fleet.yakitTipi.select"
                  className="bg-background border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YAKIT_TIPLERI.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sürücü</Label>
              <Input
                data-ocid="fleet.surucu.input"
                value={form.surucu}
                onChange={(e) =>
                  setForm((f) => ({ ...f, surucu: e.target.value }))
                }
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
                  data-ocid="fleet.durum.select"
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
              <Label>Muayene Bitiş</Label>
              <Input
                data-ocid="fleet.muayene.input"
                type="date"
                value={form.muayeneBitis}
                onChange={(e) =>
                  setForm((f) => ({ ...f, muayeneBitis: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Kasko Bitiş</Label>
              <Input
                data-ocid="fleet.kasko.input"
                type="date"
                value={form.kaskoBitis}
                onChange={(e) =>
                  setForm((f) => ({ ...f, kaskoBitis: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Trafik Sigortası Bitiş</Label>
              <Input
                data-ocid="fleet.trafik.input"
                type="date"
                value={form.trafikSigortaBitis}
                onChange={(e) =>
                  setForm((f) => ({ ...f, trafikSigortaBitis: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notlar</Label>
              <Textarea
                data-ocid="fleet.notlar.textarea"
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
              data-ocid="fleet.cancel_button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button data-ocid="fleet.save_button" onClick={handleSave}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
