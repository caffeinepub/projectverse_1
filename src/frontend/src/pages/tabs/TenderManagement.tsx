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
  Award,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TenderStatus =
  | "Taslak"
  | "Aktif"
  | "Değerlendirmede"
  | "Tamamlandı"
  | "İptal";

interface TenderBid {
  supplierId: string;
  supplierName: string;
  amount: number;
  deliveryDays: number;
  notes: string;
}

interface Tender {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  deadline: string;
  description: string;
  invitedSuppliers: string[];
  bids: TenderBid[];
  status: TenderStatus;
  winnerId?: string;
  createdAt: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Project {
  id: string;
  title: string;
}

const STATUS_STYLES: Record<TenderStatus, string> = {
  Taslak: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Aktif: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Değerlendirmede: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Tamamlandı: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  İptal: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function TenderManagement({
  companyId,
  suppliers,
  projects,
}: {
  companyId: string;
  suppliers: Supplier[];
  projects: Project[];
}) {
  const storageKey = `pv_${companyId}_tenders`;

  const load = (): Tender[] => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  };

  const [tenders, setTenders] = useState<Tender[]>(load);
  const [open, setOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    projectId: "",
    deadline: "",
    description: "",
    invitedSuppliers: [] as string[],
  });

  const [bidForm, setBidForm] = useState({
    supplierId: "",
    amount: "",
    deliveryDays: "",
    notes: "",
  });

  const [winnerId, setWinnerId] = useState("");

  const save = (data: Tender[]) => {
    setTenders(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const handleCreate = () => {
    if (!form.title.trim() || !form.deadline) {
      toast.error("Başlık ve son başvuru tarihi zorunludur.");
      return;
    }
    const project = projects.find((p) => p.id === form.projectId);
    const tender: Tender = {
      id: `tender_${Date.now()}`,
      title: form.title.trim(),
      projectId: form.projectId,
      projectName: project?.title || "—",
      deadline: form.deadline,
      description: form.description,
      invitedSuppliers: form.invitedSuppliers,
      bids: [],
      status: "Aktif",
      createdAt: new Date().toISOString(),
    };
    save([tender, ...tenders]);
    setForm({
      title: "",
      projectId: "",
      deadline: "",
      description: "",
      invitedSuppliers: [],
    });
    setOpen(false);
    toast.success("İhale oluşturuldu.");
  };

  const handleAddBid = () => {
    if (!selectedTender || !bidForm.supplierId || !bidForm.amount) {
      toast.error("Tedarikçi ve tutar zorunludur.");
      return;
    }
    const supplier = suppliers.find((s) => s.id === bidForm.supplierId);
    const bid: TenderBid = {
      supplierId: bidForm.supplierId,
      supplierName: supplier?.name || bidForm.supplierId,
      amount: Number(bidForm.amount),
      deliveryDays: Number(bidForm.deliveryDays),
      notes: bidForm.notes,
    };
    const updated = tenders.map((t) =>
      t.id === selectedTender.id
        ? {
            ...t,
            bids: [
              ...t.bids.filter((b) => b.supplierId !== bid.supplierId),
              bid,
            ],
            status: "Değerlendirmede" as TenderStatus,
          }
        : t,
    );
    save(updated);
    setBidForm({ supplierId: "", amount: "", deliveryDays: "", notes: "" });
    setBidDialogOpen(false);
    toast.success("Teklif eklendi.");
  };

  const handleAward = () => {
    if (!selectedTender || !winnerId) {
      toast.error("Kazanan tedarikçi seçiniz.");
      return;
    }
    const updated = tenders.map((t) =>
      t.id === selectedTender.id
        ? { ...t, status: "Tamamlandı" as TenderStatus, winnerId }
        : t,
    );
    save(updated);
    setAwardDialogOpen(false);
    setWinnerId("");
    toast.success("İhale tamamlandı.");
  };

  const handleDelete = (id: string) => {
    save(tenders.filter((t) => t.id !== id));
    toast.success("İhale silindi.");
  };

  const toggleSupplier = (id: string) => {
    setForm((f) => ({
      ...f,
      invitedSuppliers: f.invitedSuppliers.includes(id)
        ? f.invitedSuppliers.filter((s) => s !== id)
        : [...f.invitedSuppliers, id],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            İhale Yönetimi
          </h2>
          <p className="text-sm text-muted-foreground">
            Tedarikçi teklif davetleri ve ihale süreçleri
          </p>
        </div>
        <Button
          data-ocid="tender.open_modal_button"
          onClick={() => setOpen(true)}
          className="gradient-bg text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Yeni İhale
        </Button>
      </div>

      {tenders.length === 0 ? (
        <div
          data-ocid="tender.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <ClipboardList className="w-12 h-12 text-amber-500/40 mb-3" />
          <p className="text-muted-foreground font-medium">
            Henüz ihale bulunmuyor
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            İlk ihalenizi oluşturmak için "Yeni İhale" butonuna tıklayın.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tenders.map((tender, idx) => (
            <Card
              key={tender.id}
              data-ocid={`tender.item.${idx + 1}`}
              className="bg-card border-border"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-foreground truncate">
                      {tender.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Proje: {tender.projectName} · Son Başvuru:{" "}
                      {tender.deadline}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      className={`text-xs border ${STATUS_STYLES[tender.status]}`}
                    >
                      {tender.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setExpandedId(
                          expandedId === tender.id ? null : tender.id,
                        )
                      }
                    >
                      {expandedId === tender.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedId === tender.id && (
                <CardContent className="pt-0 space-y-4">
                  {tender.description && (
                    <p className="text-sm text-muted-foreground">
                      {tender.description}
                    </p>
                  )}

                  {/* Bid Comparison Table */}
                  {tender.bids.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        Teklif Karşılaştırması
                      </h4>
                      <div className="overflow-x-auto rounded-md border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border">
                              <TableHead>Tedarikçi</TableHead>
                              <TableHead>Tutar</TableHead>
                              <TableHead>Teslimat (gün)</TableHead>
                              <TableHead>Notlar</TableHead>
                              {tender.status !== "Tamamlandı" && <TableHead />}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tender.bids.map((bid) => (
                              <TableRow
                                key={bid.supplierId}
                                className={`border-border ${
                                  tender.winnerId === bid.supplierId
                                    ? "bg-emerald-500/10"
                                    : ""
                                }`}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-1.5">
                                    {tender.winnerId === bid.supplierId && (
                                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                                    )}
                                    {bid.supplierName}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(bid.amount)}
                                </TableCell>
                                <TableCell>{bid.deliveryDays || "—"}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {bid.notes || "—"}
                                </TableCell>
                                {tender.status !== "Tamamlandı" && (
                                  <TableCell />
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Henüz teklif alınmadı.
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {tender.status !== "Tamamlandı" &&
                      tender.status !== "İptal" && (
                        <>
                          <Button
                            data-ocid={`tender.add_bid.button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            className="border-border text-foreground"
                            onClick={() => {
                              setSelectedTender(tender);
                              setBidDialogOpen(true);
                            }}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Teklif Ekle
                          </Button>
                          {tender.bids.length > 0 && (
                            <Button
                              data-ocid={`tender.award.button.${idx + 1}`}
                              size="sm"
                              className="gradient-bg text-white"
                              onClick={() => {
                                setSelectedTender(tender);
                                setAwardDialogOpen(true);
                              }}
                            >
                              <Award className="w-3.5 h-3.5 mr-1" />
                              Kazananı Belirle
                            </Button>
                          )}
                        </>
                      )}
                    <Button
                      data-ocid={`tender.delete_button.${idx + 1}`}
                      size="sm"
                      variant="ghost"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      onClick={() => handleDelete(tender.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Sil
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Tender Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-ocid="tender.dialog"
          className="bg-card border-border max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Yeni İhale Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Başlık *</Label>
              <Input
                data-ocid="tender.input"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="İhale başlığı"
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label>İlgili Proje</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}
              >
                <SelectTrigger
                  data-ocid="tender.select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Son Başvuru Tarihi *</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deadline: e.target.value }))
                }
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                data-ocid="tender.textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="İhale detayları..."
                rows={3}
                className="bg-background border-border mt-1"
              />
            </div>
            {suppliers.length > 0 && (
              <div>
                <Label>Davet Edilecek Tedarikçiler</Label>
                <div className="mt-1 space-y-1 max-h-40 overflow-y-auto border border-border rounded-md p-2">
                  {suppliers.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-accent/30 rounded px-2 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={form.invitedSuppliers.includes(s.id)}
                        onChange={() => toggleSupplier(s.id)}
                        className="accent-amber-500"
                      />
                      <span className="text-sm text-foreground">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="tender.submit_button"
              onClick={handleCreate}
              className="gradient-bg text-white"
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent
          data-ocid="tender.bid.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Teklif Ekle — {selectedTender?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tedarikçi *</Label>
              <Select
                value={bidForm.supplierId}
                onValueChange={(v) =>
                  setBidForm((f) => ({ ...f, supplierId: v }))
                }
              >
                <SelectTrigger className="bg-background border-border mt-1">
                  <SelectValue placeholder="Tedarikçi seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {(selectedTender?.invitedSuppliers.length
                    ? suppliers.filter((s) =>
                        selectedTender.invitedSuppliers.includes(s.id),
                      )
                    : suppliers
                  ).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tutar (₺) *</Label>
                <Input
                  type="number"
                  value={bidForm.amount}
                  onChange={(e) =>
                    setBidForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="0"
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label>Teslimat (gün)</Label>
                <Input
                  type="number"
                  value={bidForm.deliveryDays}
                  onChange={(e) =>
                    setBidForm((f) => ({ ...f, deliveryDays: e.target.value }))
                  }
                  placeholder="30"
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                value={bidForm.notes}
                onChange={(e) =>
                  setBidForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Teklif notları..."
                rows={2}
                className="bg-background border-border mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBidDialogOpen(false)}
              data-ocid="tender.bid.cancel_button"
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="tender.bid.submit_button"
              onClick={handleAddBid}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Dialog */}
      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent
          data-ocid="tender.award.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>
              Kazananı Belirle — {selectedTender?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Teklif veren tedarikçilerden kazananı seçin:
            </p>
            <div className="space-y-2">
              {selectedTender?.bids.map((bid) => (
                <label
                  key={bid.supplierId}
                  className="flex items-center gap-3 cursor-pointer border border-border rounded-lg p-3 hover:bg-accent/30"
                >
                  <input
                    type="radio"
                    name="winner"
                    value={bid.supplierId}
                    checked={winnerId === bid.supplierId}
                    onChange={() => setWinnerId(bid.supplierId)}
                    className="accent-amber-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {bid.supplierName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(bid.amount)} · {bid.deliveryDays} gün
                    </p>
                  </div>
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAwardDialogOpen(false)}
              data-ocid="tender.award.cancel_button"
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="tender.award.confirm_button"
              onClick={handleAward}
              className="gradient-bg text-white"
            >
              Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
