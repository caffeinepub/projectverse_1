import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Eye, FileText, GitBranch, Plus, Ruler } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

interface Drawing {
  id: string;
  drawingNo: string;
  title: string;
  discipline: string;
  revision: string;
  status: "Aktif" | "Taslak" | "İnceleme" | "Geçersiz";
  notes: string;
  uploadDate: string;
  revisions: { rev: string; notes: string; date: string }[];
}

const DISCIPLINES = [
  "Tümü",
  "Mimari",
  "Statik",
  "Mekanik",
  "Elektrik",
  "Sıhhi Tesisat",
];
const STATUSES: Drawing["status"][] = [
  "Aktif",
  "Taslak",
  "İnceleme",
  "Geçersiz",
];

const STATUS_COLORS: Record<Drawing["status"], string> = {
  Aktif: "bg-green-500/20 text-green-400 border-green-500/30",
  Taslak: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  İnceleme: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Geçersiz: "bg-red-500/20 text-red-400 border-red-500/30",
};

const DISC_COLORS: Record<string, string> = {
  Mimari: "bg-purple-500/20 text-purple-400",
  Statik: "bg-orange-500/20 text-orange-400",
  Mekanik: "bg-blue-500/20 text-blue-400",
  Elektrik: "bg-yellow-500/20 text-yellow-400",
  "Sıhhi Tesisat": "bg-cyan-500/20 text-cyan-400",
};

export default function Drawings() {
  const { currentCompany } = useApp();
  const companyId = currentCompany?.id ?? "default";
  const storageKey = `pv_drawings_${companyId}`;

  const [drawings, setDrawings] = useState<Drawing[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [discipline, setDiscipline] = useState("Tümü");
  const [openNew, setOpenNew] = useState(false);
  const [openRev, setOpenRev] = useState<string | null>(null);
  const [form, setForm] = useState({
    drawingNo: "",
    title: "",
    discipline: "Mimari",
    revision: "Rev 0",
    status: "Taslak" as Drawing["status"],
    notes: "",
  });
  const [revForm, setRevForm] = useState({ rev: "", notes: "" });

  const save = (updated: Drawing[]) => {
    setDrawings(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.drawingNo || !form.title) {
      toast.error("Çizim no ve başlık zorunludur");
      return;
    }
    const d: Drawing = {
      id: Date.now().toString(),
      ...form,
      uploadDate: new Date().toISOString().split("T")[0],
      revisions: [
        {
          rev: form.revision,
          notes: form.notes,
          date: new Date().toISOString().split("T")[0],
        },
      ],
    };
    save([d, ...drawings]);
    toast.success("Çizim eklendi");
    setOpenNew(false);
    setForm({
      drawingNo: "",
      title: "",
      discipline: "Mimari",
      revision: "Rev 0",
      status: "Taslak",
      notes: "",
    });
  };

  const handleAddRevision = (id: string) => {
    if (!revForm.rev) {
      toast.error("Revizyon numarası zorunludur");
      return;
    }
    const updated = drawings.map((d) =>
      d.id === id
        ? {
            ...d,
            revision: revForm.rev,
            revisions: [
              ...d.revisions,
              {
                rev: revForm.rev,
                notes: revForm.notes,
                date: new Date().toISOString().split("T")[0],
              },
            ],
          }
        : d,
    );
    save(updated);
    toast.success("Revizyon eklendi");
    setOpenRev(null);
    setRevForm({ rev: "", notes: "" });
  };

  const filtered =
    discipline === "Tümü"
      ? drawings
      : drawings.filter((d) => d.discipline === discipline);

  const kpis = {
    total: drawings.length,
    active: drawings.filter((d) => d.status === "Aktif").length,
    review: drawings.filter((d) => d.status === "İnceleme").length,
    superseded: drawings.filter((d) => d.status === "Geçersiz").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Çizim & Planlar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Teknik çizim ve revizyon yönetimi
          </p>
        </div>
        <Button
          data-ocid="drawings.open_modal_button"
          onClick={() => setOpenNew(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Çizim
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam",
            value: kpis.total,
            icon: <Ruler className="w-5 h-5" />,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Aktif",
            value: kpis.active,
            icon: <Eye className="w-5 h-5" />,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
          {
            label: "İncelemede",
            value: kpis.review,
            icon: <FileText className="w-5 h-5" />,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Geçersiz",
            value: kpis.superseded,
            icon: <GitBranch className="w-5 h-5" />,
            color: "text-red-400",
            bg: "bg-red-500/10",
          },
        ].map((k) => (
          <Card key={k.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${k.bg} ${k.color}`}>
                {k.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={discipline} onValueChange={setDiscipline}>
        <TabsList className="bg-muted/30">
          {DISCIPLINES.map((d) => (
            <TabsTrigger key={d} value={d} data-ocid="drawings.tab">
              {d}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div
          data-ocid="drawings.empty_state"
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="text-6xl mb-4">📐</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Henüz çizim yok
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            İlk teknik çizimi ekleyin
          </p>
          <Button
            onClick={() => setOpenNew(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Çizim Ekle
          </Button>
        </div>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Çizim No</TableHead>
                <TableHead>Başlık</TableHead>
                <TableHead>Disiplin</TableHead>
                <TableHead>Revizyon</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d, i) => (
                <TableRow
                  key={d.id}
                  className="border-border hover:bg-muted/30"
                  data-ocid={`drawings.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-sm text-amber-400">
                    {d.drawingNo}
                  </TableCell>
                  <TableCell className="text-sm text-foreground font-medium">
                    {d.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border ${DISC_COLORS[d.discipline] ?? "bg-muted"}`}
                    >
                      {d.discipline}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.revision}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border ${STATUS_COLORS[d.status]}`}
                    >
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.uploadDate}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOpenRev(d.id);
                        setRevForm({ rev: "", notes: "" });
                      }}
                      className="text-amber-400 hover:text-amber-300"
                      data-ocid={`drawings.edit_button.${i + 1}`}
                    >
                      <GitBranch className="w-3 h-3 mr-1" />
                      Rev Ekle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* New Drawing Dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent
          className="max-w-md bg-card border-border"
          data-ocid="drawings.dialog"
        >
          <DialogHeader>
            <DialogTitle>Yeni Çizim</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Çizim No *</Label>
                <Input
                  value={form.drawingNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, drawingNo: e.target.value }))
                  }
                  placeholder="A-101"
                  data-ocid="drawings.input"
                />
              </div>
              <div>
                <Label>Revizyon</Label>
                <Input
                  value={form.revision}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, revision: e.target.value }))
                  }
                  placeholder="Rev 0"
                  data-ocid="drawings.input"
                />
              </div>
            </div>
            <div>
              <Label>Başlık *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Zemin Kat Planı"
                data-ocid="drawings.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Disiplin</Label>
                <Select
                  value={form.discipline}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, discipline: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.filter((d) => d !== "Tümü").map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durum</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as Drawing["status"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                data-ocid="drawings.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpenNew(false)}
              data-ocid="drawings.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="drawings.submit_button"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={!!openRev} onOpenChange={(o) => !o && setOpenRev(null)}>
        <DialogContent
          className="max-w-sm bg-card border-border"
          data-ocid="drawings.dialog"
        >
          <DialogHeader>
            <DialogTitle>Revizyon Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Yeni Revizyon No *</Label>
              <Input
                value={revForm.rev}
                onChange={(e) =>
                  setRevForm((f) => ({ ...f, rev: e.target.value }))
                }
                placeholder="Rev 1"
                data-ocid="drawings.input"
              />
            </div>
            <div>
              <Label>Değişiklik Notları</Label>
              <Textarea
                rows={3}
                value={revForm.notes}
                onChange={(e) =>
                  setRevForm((f) => ({ ...f, notes: e.target.value }))
                }
                data-ocid="drawings.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpenRev(null)}
              data-ocid="drawings.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={() => openRev && handleAddRevision(openRev)}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="drawings.submit_button"
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
