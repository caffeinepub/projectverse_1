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
import { AlertCircle, CheckSquare, Clock, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";

type Priority = "Kritik" | "Yüksek" | "Orta" | "Düşük";
type PunchStatus = "Açık" | "Devam Ediyor" | "Kapalı" | "Tamamlandı";

interface PunchItem {
  id: string;
  itemNo: string;
  description: string;
  location: string;
  projectId: string;
  discipline: string;
  priority: Priority;
  responsible: string;
  dueDate: string;
  status: PunchStatus;
  notes: string;
  createdAt: string;
}

const PRIORITIES: Priority[] = ["Kritik", "Yüksek", "Orta", "Düşük"];
const STATUSES: PunchStatus[] = [
  "Açık",
  "Devam Ediyor",
  "Kapalı",
  "Tamamlandı",
];

const PRIORITY_COLORS: Record<Priority, string> = {
  Kritik: "bg-red-500/20 text-red-400 border-red-500/30",
  Yüksek: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Orta: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Düşük: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const _STATUS_COLORS: Record<PunchStatus, string> = {
  Açık: "bg-red-500/20 text-red-400 border-red-500/30",
  "Devam Ediyor": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Kapalı: "bg-green-500/20 text-green-400 border-green-500/30",
  Tamamlandı: "bg-green-600/20 text-green-300 border-green-600/30",
};

const ROW_BG: Record<Priority, string> = {
  Kritik: "border-l-2 border-l-red-500",
  Yüksek: "border-l-2 border-l-orange-500",
  Orta: "border-l-2 border-l-yellow-500",
  Düşük: "border-l-2 border-l-blue-500",
};

export default function PunchList() {
  const { projects, currentCompany } = useApp();
  const companyId = currentCompany?.id ?? "default";
  const storageKey = `pv_punch_list_${companyId}`;

  const [items, setItems] = useState<PunchItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [priorityFilter, setPriorityFilter] = useState("Tümü");
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({
    description: "",
    location: "",
    projectId: "",
    discipline: "",
    priority: "Orta" as Priority,
    responsible: "",
    dueDate: "",
    notes: "",
  });

  const save = (updated: PunchItem[]) => {
    setItems(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.description) {
      toast.error("Açıklama zorunludur");
      return;
    }
    const item: PunchItem = {
      id: Date.now().toString(),
      itemNo: `#${String(items.length + 1).padStart(3, "0")}`,
      ...form,
      status: "Açık",
      createdAt: new Date().toISOString(),
    };
    save([item, ...items]);
    toast.success("Punch list kalemi eklendi");
    setOpenNew(false);
    setForm({
      description: "",
      location: "",
      projectId: "",
      discipline: "",
      priority: "Orta",
      responsible: "",
      dueDate: "",
      notes: "",
    });
  };

  const updateStatus = (id: string, status: PunchStatus) => {
    save(items.map((it) => (it.id === id ? { ...it, status } : it)));
  };

  const filtered = items.filter((it) => {
    if (priorityFilter !== "Tümü" && it.priority !== priorityFilter)
      return false;
    return true;
  });

  const kpis = {
    total: items.length,
    open: items.filter((i) => i.status === "Açık").length,
    inProgress: items.filter((i) => i.status === "Devam Ediyor").length,
    closed: items.filter(
      (i) => i.status === "Kapalı" || i.status === "Tamamlandı",
    ).length,
  };

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.title ?? "-";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Punch List</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kusur ve eksik iş takibi
          </p>
        </div>
        <Button
          data-ocid="punchlist.open_modal_button"
          onClick={() => setOpenNew(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kusur / Eksik
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam",
            value: kpis.total,
            icon: <AlertCircle className="w-5 h-5" />,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Açık",
            value: kpis.open,
            icon: <AlertCircle className="w-5 h-5" />,
            color: "text-red-400",
            bg: "bg-red-500/10",
          },
          {
            label: "Devam Ediyor",
            value: kpis.inProgress,
            icon: <Clock className="w-5 h-5" />,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
          },
          {
            label: "Kapatıldı",
            value: kpis.closed,
            icon: <CheckSquare className="w-5 h-5" />,
            color: "text-green-400",
            bg: "bg-green-500/10",
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

      <Tabs value={priorityFilter} onValueChange={setPriorityFilter}>
        <TabsList className="bg-muted/30">
          {["Tümü", ...PRIORITIES].map((p) => (
            <TabsTrigger key={p} value={p} data-ocid="punchlist.tab">
              {p}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div
          data-ocid="punchlist.empty_state"
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Punch list boş
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Tespit edilen kusur ve eksiklikleri kaydedin
          </p>
          <Button
            onClick={() => setOpenNew(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Kalem Ekle
          </Button>
        </div>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>No</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Konum</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Sorumlu</TableHead>
                <TableHead>Termin</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => (
                <TableRow
                  key={item.id}
                  className={`border-border hover:bg-muted/30 ${ROW_BG[item.priority]}`}
                  data-ocid={`punchlist.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-xs text-amber-400 font-bold">
                    {item.itemNo}
                  </TableCell>
                  <TableCell className="text-sm text-foreground max-w-xs">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.location}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getProjectName(item.projectId)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border ${PRIORITY_COLORS[item.priority]}`}
                    >
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.responsible}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.dueDate}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(v) =>
                        updateStatus(item.id, v as PunchStatus)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs w-36">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent
          className="max-w-lg bg-card border-border"
          data-ocid="punchlist.dialog"
        >
          <DialogHeader>
            <DialogTitle>Yeni Kusur / Eksik</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Açıklama *</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Kusur veya eksik iş açıklaması"
                data-ocid="punchlist.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Konum</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Kat / Alan"
                  data-ocid="punchlist.input"
                />
              </div>
              <div>
                <Label>Disiplin</Label>
                <Input
                  value={form.discipline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, discipline: e.target.value }))
                  }
                  placeholder="Mimari"
                  data-ocid="punchlist.input"
                />
              </div>
            </div>
            <div>
              <Label>Proje</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}
              >
                <SelectTrigger data-ocid="punchlist.select">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Öncelik</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, priority: v as Priority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Termin</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  data-ocid="punchlist.input"
                />
              </div>
            </div>
            <div>
              <Label>Sorumlu</Label>
              <Input
                value={form.responsible}
                onChange={(e) =>
                  setForm((f) => ({ ...f, responsible: e.target.value }))
                }
                data-ocid="punchlist.input"
              />
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                data-ocid="punchlist.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpenNew(false)}
              data-ocid="punchlist.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              data-ocid="punchlist.submit_button"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
