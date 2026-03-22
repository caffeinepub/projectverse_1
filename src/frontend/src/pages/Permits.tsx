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
  Building2,
  CheckCircle2,
  Clock,
  Edit,
  FileCheck,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

type PermitStatus = "Aktif" | "Süresi Dolmuş" | "Yenileme Bekliyor";

interface Permit {
  id: string;
  type: string;
  number: string;
  issuingAuthority: string;
  projectId: string;
  issueDate: string;
  expiryDate: string;
  status: PermitStatus;
  notes: string;
  documentName: string;
}

const PERMIT_TYPES = [
  "İmar Ruhsatı",
  "Yapı Ruhsatı",
  "İskan Belgesi",
  "Çevre İzni",
  "Su Bağlantı Ruhsatı",
  "Elektrik Bağlantı Ruhsatı",
  "Yıkım Ruhsatı",
  "Kazı Ruhsatı",
  "Diğer",
];

const STATUS_STYLES: Record<PermitStatus, string> = {
  Aktif: "bg-green-500/15 text-green-400 border-green-500/30",
  "Süresi Dolmuş": "bg-red-500/15 text-red-400 border-red-500/30",
  "Yenileme Bekliyor": "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const STATUS_ICONS: Record<PermitStatus, React.ReactNode> = {
  Aktif: <CheckCircle2 className="w-3.5 h-3.5" />,
  "Süresi Dolmuş": <XCircle className="w-3.5 h-3.5" />,
  "Yenileme Bekliyor": <Clock className="w-3.5 h-3.5" />,
};

import type { ReactNode } from "react";

const BLANK: Omit<Permit, "id"> = {
  type: "",
  number: "",
  issuingAuthority: "",
  projectId: "",
  issueDate: "",
  expiryDate: "",
  status: "Aktif",
  notes: "",
  documentName: "",
};

export default function Permits() {
  const { activeCompanyId, projects } = useApp();

  const storageKey = `pv_permits_${activeCompanyId}`;

  const [permits, setPermits] = useState<Permit[]>(() => {
    try {
      const s = localStorage.getItem(`pv_permits_${activeCompanyId}`);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(permits));
  }, [permits, storageKey]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Permit, "id">>(BLANK);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const companyProjects = projects.filter(
    (p) => p.companyId === activeCompanyId,
  );

  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const expiringSoon = permits.filter((p) => {
    if (!p.expiryDate) return false;
    const d = new Date(p.expiryDate);
    return d >= today && d <= in30Days && p.status === "Aktif";
  });

  const filteredPermits = permits.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterType !== "all" && p.type !== filterType) return false;
    return true;
  });

  const openAdd = () => {
    setEditId(null);
    setForm(BLANK);
    setDialogOpen(true);
  };

  const openEdit = (p: Permit) => {
    setEditId(p.id);
    const { id: _id, ...rest } = p;
    void _id;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.type || !form.number || !form.issuingAuthority) return;
    if (editId) {
      setPermits((prev) =>
        prev.map((p) => (p.id === editId ? { ...form, id: editId } : p)),
      );
    } else {
      setPermits((prev) => [{ ...form, id: Date.now().toString() }, ...prev]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setPermits((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  };

  const getProjectName = (id: string) =>
    companyProjects.find((p) => p.id === id)?.title || (id ? id : "—");

  const kpiActive = permits.filter((p) => p.status === "Aktif").length;
  const kpiExpired = permits.filter((p) => p.status === "Süresi Dolmuş").length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Ruhsat Takibi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            İmar, yapı ve çevre ruhsatlarının yönetimi
          </p>
        </div>
        <Button
          data-ocid="permits.add_button"
          onClick={openAdd}
          className="gradient-bg text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Ruhsat
        </Button>
      </div>

      {/* Alert for expiring soon */}
      {expiringSoon.length > 0 && (
        <div
          data-ocid="permits.expiring.error_state"
          className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">
              {expiringSoon.length} ruhsat 30 gün içinde sona eriyor
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {expiringSoon.map((p) => p.number || p.type).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Toplam Ruhsat
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold text-foreground">
              {permits.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Aktif
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold text-green-400">{kpiActive}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              30 Günde Bitiyor
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold text-amber-400">
              {expiringSoon.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">
              Süresi Dolmuş
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold text-red-400">{kpiExpired}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger
            data-ocid="permits.status.select"
            className="w-44 bg-card border-border"
          >
            <SelectValue placeholder="Tüm Durumlar" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="Aktif">Aktif</SelectItem>
            <SelectItem value="Süresi Dolmuş">Süresi Dolmuş</SelectItem>
            <SelectItem value="Yenileme Bekliyor">Yenileme Bekliyor</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger
            data-ocid="permits.type.select"
            className="w-44 bg-card border-border"
          >
            <SelectValue placeholder="Tüm Tipler" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tüm Tipler</SelectItem>
            {PERMIT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredPermits.length === 0 ? (
        <div
          data-ocid="permits.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <FileCheck className="w-10 h-10 text-amber-400/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Ruhsat Kaydı Yok
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Proje ruhsatlarınızı ekleyerek takibi başlatın
          </p>
          <Button onClick={openAdd} className="gradient-bg text-white gap-2">
            <Plus className="w-4 h-4" /> İlk Ruhsatı Ekle
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30">
                <TableHead>Ruhsat Tipi</TableHead>
                <TableHead>Ruhsat No</TableHead>
                <TableHead>Veren Kurum</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead>Düzenleme</TableHead>
                <TableHead>Son Geçerlilik</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermits.map((permit, idx) => (
                <TableRow
                  key={permit.id}
                  data-ocid={`permits.item.${idx + 1}`}
                  className="border-border hover:bg-muted/20"
                >
                  <TableCell className="font-medium">{permit.type}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {permit.number}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {permit.issuingAuthority}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getProjectName(permit.projectId)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {permit.issueDate || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm ${
                        permit.expiryDate &&
                        new Date(permit.expiryDate) <= in30Days
                          ? "text-amber-400 font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {permit.expiryDate || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`gap-1 border text-xs ${STATUS_STYLES[permit.status]}`}
                    >
                      {STATUS_ICONS[permit.status]}
                      {permit.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        data-ocid={`permits.edit_button.${idx + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(permit)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-ocid={`permits.delete_button.${idx + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-400"
                        onClick={() => setDeleteId(permit.id)}
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
          data-ocid="permits.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>
              {editId ? "Ruhsat Düzenle" : "Yeni Ruhsat Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ruhsat Tipi *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, type: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="permits.type_input"
                    className="bg-background border-border mt-1"
                  >
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {PERMIT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ruhsat No *</Label>
                <Input
                  data-ocid="permits.number_input"
                  value={form.number}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, number: e.target.value }))
                  }
                  placeholder="Ör: 2024/1234"
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Veren Kurum *</Label>
              <Input
                data-ocid="permits.authority_input"
                value={form.issuingAuthority}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    issuingAuthority: e.target.value,
                  }))
                }
                placeholder="Ör: İstanbul Büyükşehir Belediyesi"
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label>Proje</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, projectId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="permits.project_select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue placeholder="Proje seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companyProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Düzenleme Tarihi</Label>
                <Input
                  data-ocid="permits.issue_date_input"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, issueDate: e.target.value }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label>Son Geçerlilik</Label>
                <Input
                  data-ocid="permits.expiry_date_input"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Durum</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, status: v as PermitStatus }))
                }
              >
                <SelectTrigger
                  data-ocid="permits.status_select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Süresi Dolmuş">Süresi Dolmuş</SelectItem>
                  <SelectItem value="Yenileme Bekliyor">
                    Yenileme Bekliyor
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Belge Adı</Label>
              <Input
                data-ocid="permits.document_input"
                value={form.documentName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, documentName: e.target.value }))
                }
                placeholder="Ör: yapi_ruhsati_2024.pdf"
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                data-ocid="permits.notes_textarea"
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="bg-background border-border mt-1 resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="permits.cancel_button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="permits.save_button"
              onClick={handleSave}
              disabled={!form.type || !form.number || !form.issuingAuthority}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent
          data-ocid="permits.delete.dialog"
          className="bg-card border-border max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Ruhsatı Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bu ruhsat kaydı kalıcı olarak silinecek. Emin misiniz?
          </p>
          <DialogFooter>
            <Button
              data-ocid="permits.delete.cancel_button"
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="permits.delete.confirm_button"
              onClick={handleDelete}
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
