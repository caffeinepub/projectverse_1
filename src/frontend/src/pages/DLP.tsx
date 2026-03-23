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
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

type DLPStatus = "Aktif" | "Tamamlandı" | "Sona Erdi";

interface DLPDefect {
  id: string;
  description: string;
  reportedDate: string;
  closedDate: string;
  status: "Açık" | "Kapatıldı";
}

interface DLPRecord {
  id: string;
  projectName: string;
  handoverDate: string;
  dlpEnd: string;
  durationMonths: string;
  status: DLPStatus;
  notes: string;
  defects: DLPDefect[];
}

const STATUS_STYLES: Record<DLPStatus, string> = {
  Aktif: "bg-green-500/15 text-green-400 border-green-500/30",
  Tamamlandı: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Sona Erdi": "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const STATUS_ICONS: Record<DLPStatus, React.ReactNode> = {
  Aktif: <Clock className="w-3.5 h-3.5" />,
  Tamamlandı: <CheckCircle2 className="w-3.5 h-3.5" />,
  "Sona Erdi": <AlertTriangle className="w-3.5 h-3.5" />,
};

const EMPTY: Omit<DLPRecord, "id" | "defects"> = {
  projectName: "",
  handoverDate: "",
  dlpEnd: "",
  durationMonths: "12",
  status: "Aktif",
  notes: "",
};

export default function DLP() {
  const { activeCompanyId } = useApp();
  const storageKey = `pv_dlp_${activeCompanyId}`;

  const [records, setRecords] = useState<DLPRecord[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_dlp_${activeCompanyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<DLPRecord, "id" | "defects">>(EMPTY);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [defectDialogId, setDefectDialogId] = useState<string | null>(null);
  const [defectForm, setDefectForm] = useState<{
    description: string;
    reportedDate: string;
    closedDate: string;
    status: "Açık" | "Kapatıldı";
  }>({
    description: "",
    reportedDate: "",
    closedDate: "",
    status: "Açık",
  });

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (r: DLPRecord) => {
    setEditId(r.id);
    setForm({
      projectName: r.projectName,
      handoverDate: r.handoverDate,
      dlpEnd: r.dlpEnd,
      durationMonths: r.durationMonths,
      status: r.status,
      notes: r.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.projectName || !form.handoverDate) return;
    if (editId) {
      setRecords((p) =>
        p.map((r) => (r.id === editId ? { ...r, ...form } : r)),
      );
    } else {
      setRecords((p) => [
        ...p,
        { id: crypto.randomUUID(), ...form, defects: [] },
      ]);
    }
    setDialogOpen(false);
  };

  const addDefect = (dlpId: string) => {
    if (!defectForm.description) return;
    setRecords((p) =>
      p.map((r) =>
        r.id === dlpId
          ? {
              ...r,
              defects: [
                ...r.defects,
                {
                  id: crypto.randomUUID(),
                  ...defectForm,
                  closedDate: defectForm.closedDate || "",
                },
              ],
            }
          : r,
      ),
    );
    setDefectForm({
      description: "",
      reportedDate: "",
      closedDate: "",
      status: "Açık",
    });
    setDefectDialogId(null);
  };

  const activeCount = records.filter((r) => r.status === "Aktif").length;
  const totalDefects = records.reduce((s, r) => s + r.defects.length, 0);
  const openDefects = records.reduce(
    (s, r) => s + r.defects.filter((d) => d.status === "Açık").length,
    0,
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">DLP Takibi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kusur Sorumluluk Dönemi yönetimi
          </p>
        </div>
        <Button
          data-ocid="dlp.open_modal_button"
          onClick={openAdd}
          className="gradient-bg text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> DLP Kaydı Ekle
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam", value: records.length, color: "text-amber-400" },
          { label: "Aktif DLP", value: activeCount, color: "text-green-400" },
          {
            label: "Toplam Kusur",
            value: totalDefects,
            color: "text-blue-400",
          },
          { label: "Açık Kusur", value: openDefects, color: "text-red-400" },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            DLP Kayıtları
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div
              data-ocid="dlp.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                Henüz DLP kaydı yok
              </p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                İlk DLP kaydını eklemek için butonu kullanın
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-8" />
                  <TableHead className="text-muted-foreground">Proje</TableHead>
                  <TableHead className="text-muted-foreground">
                    Teslim Tarihi
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    DLP Bitiş
                  </TableHead>
                  <TableHead className="text-muted-foreground">Süre</TableHead>
                  <TableHead className="text-muted-foreground">
                    Kusurlar
                  </TableHead>
                  <TableHead className="text-muted-foreground">Durum</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r, idx) => (
                  <>
                    <TableRow
                      key={r.id}
                      data-ocid={`dlp.item.${idx + 1}`}
                      className="border-border hover:bg-muted/30"
                    >
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() =>
                            setExpandedId(expandedId === r.id ? null : r.id)
                          }
                        >
                          {expandedId === r.id ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {r.projectName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.handoverDate}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.dlpEnd}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.durationMonths} ay
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          <span className="text-red-400">
                            {
                              r.defects.filter((d) => d.status === "Açık")
                                .length
                            }
                          </span>
                          <span className="text-muted-foreground">
                            /{r.defects.length} açık
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs border flex items-center gap-1 w-fit ${STATUS_STYLES[r.status]}`}
                        >
                          {STATUS_ICONS[r.status]}
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            data-ocid={`dlp.edit_button.${idx + 1}`}
                            onClick={() => openEdit(r)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            data-ocid={`dlp.delete_button.${idx + 1}`}
                            onClick={() =>
                              setRecords((p) => p.filter((x) => x.id !== r.id))
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === r.id && (
                      <TableRow
                        key={`${r.id}-defects`}
                        className="border-border bg-muted/10"
                      >
                        <TableCell colSpan={8} className="px-8 py-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Kusur Listesi
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-border"
                                data-ocid={`dlp.defect.open_modal_button.${idx + 1}`}
                                onClick={() => {
                                  setDefectDialogId(r.id);
                                  setDefectForm({
                                    description: "",
                                    reportedDate: "",
                                    closedDate: "",
                                    status: "Açık",
                                  });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Kusur Ekle
                              </Button>
                            </div>
                            {r.defects.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">
                                Henüz kusur kaydı yok
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {r.defects.map((d) => (
                                  <div
                                    key={d.id}
                                    className="flex items-center gap-3 text-xs bg-card rounded px-3 py-2"
                                  >
                                    <Badge
                                      className={`text-xs border shrink-0 ${d.status === "Açık" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-green-500/15 text-green-400 border-green-500/30"}`}
                                    >
                                      {d.status}
                                    </Badge>
                                    <span className="text-foreground flex-1">
                                      {d.description}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {d.reportedDate}
                                    </span>
                                    {d.status === "Açık" && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs text-green-400"
                                        onClick={() =>
                                          setRecords((p) =>
                                            p.map((rec) =>
                                              rec.id === r.id
                                                ? {
                                                    ...rec,
                                                    defects: rec.defects.map(
                                                      (df) =>
                                                        df.id === d.id
                                                          ? {
                                                              ...df,
                                                              status:
                                                                "Kapatıldı",
                                                              closedDate:
                                                                new Date()
                                                                  .toISOString()
                                                                  .split(
                                                                    "T",
                                                                  )[0],
                                                            }
                                                          : df,
                                                    ),
                                                  }
                                                : rec,
                                            ),
                                          )
                                        }
                                      >
                                        Kapat
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* DLP Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="dlp.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editId ? "DLP Kaydını Düzenle" : "Yeni DLP Kaydı"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">Proje Adı *</Label>
              <Input
                data-ocid="dlp.input"
                className="border-border bg-background"
                placeholder="Proje adı"
                value={form.projectName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, projectName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Teslim Tarihi *</Label>
              <Input
                type="date"
                className="border-border bg-background"
                value={form.handoverDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, handoverDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">DLP Bitiş Tarihi</Label>
              <Input
                type="date"
                className="border-border bg-background"
                value={form.dlpEnd}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dlpEnd: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Süre (ay)</Label>
              <Input
                type="number"
                className="border-border bg-background"
                value={form.durationMonths}
                onChange={(e) =>
                  setForm((p) => ({ ...p, durationMonths: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Durum</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as DLPStatus }))
                }
              >
                <SelectTrigger
                  className="border-border bg-background"
                  data-ocid="dlp.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                  <SelectItem value="Sona Erdi">Sona Erdi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">Notlar</Label>
              <Textarea
                className="border-border bg-background resize-none"
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="dlp.cancel_button"
              variant="outline"
              className="border-border"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="dlp.submit_button"
              className="gradient-bg text-white"
              onClick={handleSave}
              disabled={!form.projectName || !form.handoverDate}
            >
              {editId ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Defect Dialog */}
      <Dialog
        open={!!defectDialogId}
        onOpenChange={(o) => {
          if (!o) setDefectDialogId(null);
        }}
      >
        <DialogContent
          data-ocid="dlp.defect.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Kusur Kaydı Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Açıklama *</Label>
              <Textarea
                data-ocid="dlp.defect.textarea"
                className="border-border bg-background resize-none"
                rows={3}
                placeholder="Kusur açıklaması..."
                value={defectForm.description}
                onChange={(e) =>
                  setDefectForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Bildirim Tarihi</Label>
                <Input
                  type="date"
                  className="border-border bg-background"
                  value={defectForm.reportedDate}
                  onChange={(e) =>
                    setDefectForm((p) => ({
                      ...p,
                      reportedDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Durum</Label>
                <Select
                  value={defectForm.status}
                  onValueChange={(v) =>
                    setDefectForm((p) => ({
                      ...p,
                      status: v as "Açık" | "Kapatıldı",
                    }))
                  }
                >
                  <SelectTrigger
                    className="border-border bg-background"
                    data-ocid="dlp.defect.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Açık">Açık</SelectItem>
                    <SelectItem value="Kapatıldı">Kapatıldı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="dlp.defect.cancel_button"
              variant="outline"
              className="border-border"
              onClick={() => setDefectDialogId(null)}
            >
              İptal
            </Button>
            <Button
              data-ocid="dlp.defect.submit_button"
              className="gradient-bg text-white"
              onClick={() => defectDialogId && addDefect(defectDialogId)}
              disabled={!defectForm.description}
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
