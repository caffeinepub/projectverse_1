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
import { Edit, FileText, Mail, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

type CorrespondenceType = "Gelen" | "Giden" | "İç";
type CorrespondenceStatus = "Bekliyor" | "Cevaplandı" | "Arşiv";

interface CorrespondenceRecord {
  id: string;
  no: string;
  date: string;
  subject: string;
  sender: string;
  receiver: string;
  type: CorrespondenceType;
  replyDate: string;
  status: CorrespondenceStatus;
  notes: string;
}

const STATUS_STYLES: Record<CorrespondenceStatus, string> = {
  Bekliyor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Cevaplandı: "bg-green-500/15 text-green-400 border-green-500/30",
  Arşiv: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const TYPE_STYLES: Record<CorrespondenceType, string> = {
  Gelen: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Giden: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  İç: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const EMPTY: Omit<CorrespondenceRecord, "id" | "no"> = {
  date: "",
  subject: "",
  sender: "",
  receiver: "",
  type: "Gelen",
  replyDate: "",
  status: "Bekliyor",
  notes: "",
};

export default function Correspondence() {
  const { activeCompanyId } = useApp();
  const storageKey = `pv_correspondence_${activeCompanyId}`;

  const [records, setRecords] = useState<CorrespondenceRecord[]>(() => {
    try {
      const s = localStorage.getItem(`pv_correspondence_${activeCompanyId}`);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] =
    useState<Omit<CorrespondenceRecord, "id" | "no">>(EMPTY);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = records.filter((r) => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (r: CorrespondenceRecord) => {
    setEditId(r.id);
    setForm({
      date: r.date,
      subject: r.subject,
      sender: r.sender,
      receiver: r.receiver,
      type: r.type,
      replyDate: r.replyDate,
      status: r.status,
      notes: r.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.subject || !form.date || !form.sender || !form.receiver) return;
    if (editId) {
      setRecords((prev) =>
        prev.map((r) => (r.id === editId ? { ...r, ...form } : r)),
      );
    } else {
      const no = `YZ-${String(records.length + 1).padStart(4, "0")}`;
      setRecords((prev) => [...prev, { id: crypto.randomUUID(), no, ...form }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Resmi Yazışmalar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kurumsal yazışma ve mektup yönetimi
          </p>
        </div>
        <Button
          data-ocid="correspondence.open_modal_button"
          onClick={openAdd}
          className="gradient-bg text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Yazışma Ekle
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam", value: records.length, color: "text-amber-400" },
          {
            label: "Gelen",
            value: records.filter((r) => r.type === "Gelen").length,
            color: "text-blue-400",
          },
          {
            label: "Giden",
            value: records.filter((r) => r.type === "Giden").length,
            color: "text-purple-400",
          },
          {
            label: "Bekliyor",
            value: records.filter((r) => r.status === "Bekliyor").length,
            color: "text-amber-400",
          },
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

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger
                className="w-40 border-border"
                data-ocid="correspondence.select"
              >
                <SelectValue placeholder="Tür" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                <SelectItem value="Gelen">Gelen</SelectItem>
                <SelectItem value="Giden">Giden</SelectItem>
                <SelectItem value="İç">İç</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger
                className="w-40 border-border"
                data-ocid="correspondence.status.select"
              >
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                <SelectItem value="Cevaplandı">Cevaplandı</SelectItem>
                <SelectItem value="Arşiv">Arşiv</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-400" />
            Yazışma Listesi ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              data-ocid="correspondence.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                Henüz yazışma kaydı yok
              </p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                İlk yazışmayı eklemek için yukarıdaki butonu kullanın
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">No</TableHead>
                  <TableHead className="text-muted-foreground">Tarih</TableHead>
                  <TableHead className="text-muted-foreground">Konu</TableHead>
                  <TableHead className="text-muted-foreground">
                    Gönderen
                  </TableHead>
                  <TableHead className="text-muted-foreground">Alıcı</TableHead>
                  <TableHead className="text-muted-foreground">Tür</TableHead>
                  <TableHead className="text-muted-foreground">Durum</TableHead>
                  <TableHead className="text-muted-foreground">
                    Cevap Tarihi
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, idx) => (
                  <TableRow
                    key={r.id}
                    data-ocid={`correspondence.item.${idx + 1}`}
                    className="border-border hover:bg-muted/30"
                  >
                    <TableCell className="font-mono text-xs text-amber-400">
                      {r.no}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {r.date}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground max-w-48 truncate">
                      {r.subject}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.sender}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.receiver}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border ${TYPE_STYLES[r.type]}`}
                      >
                        {r.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border ${STATUS_STYLES[r.status]}`}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.replyDate || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          data-ocid={`correspondence.edit_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEdit(r)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`correspondence.delete_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
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
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="correspondence.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editId ? "Yazışmayı Düzenle" : "Yeni Yazışma"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Tarih *</Label>
              <Input
                data-ocid="correspondence.input"
                type="date"
                className="border-border bg-background"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Tür *</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, type: v as CorrespondenceType }))
                }
              >
                <SelectTrigger
                  className="border-border bg-background"
                  data-ocid="correspondence.type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gelen">Gelen</SelectItem>
                  <SelectItem value="Giden">Giden</SelectItem>
                  <SelectItem value="İç">İç</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">Konu *</Label>
              <Input
                data-ocid="correspondence.subject.input"
                className="border-border bg-background"
                placeholder="Yazışma konusu"
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Gönderen *</Label>
              <Input
                className="border-border bg-background"
                placeholder="Gönderen"
                value={form.sender}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sender: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Alıcı *</Label>
              <Input
                className="border-border bg-background"
                placeholder="Alıcı"
                value={form.receiver}
                onChange={(e) =>
                  setForm((p) => ({ ...p, receiver: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Cevap Tarihi</Label>
              <Input
                type="date"
                className="border-border bg-background"
                value={form.replyDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, replyDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Durum</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as CorrespondenceStatus }))
                }
              >
                <SelectTrigger
                  className="border-border bg-background"
                  data-ocid="correspondence.dialog.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                  <SelectItem value="Cevaplandı">Cevaplandı</SelectItem>
                  <SelectItem value="Arşiv">Arşiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">Notlar</Label>
              <Textarea
                className="border-border bg-background resize-none"
                rows={2}
                placeholder="Ek notlar..."
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="correspondence.cancel_button"
              variant="outline"
              className="border-border"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="correspondence.submit_button"
              className="gradient-bg text-white"
              onClick={handleSave}
              disabled={
                !form.subject || !form.date || !form.sender || !form.receiver
              }
            >
              {editId ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
