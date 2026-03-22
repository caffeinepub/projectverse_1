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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface StockItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}

interface CountItem {
  stockItemId: string;
  name: string;
  unit: string;
  systemQty: number;
  physicalQty: number;
  diff: number;
}

interface InventoryCountRecord {
  id: string;
  date: string;
  location: string;
  responsible: string;
  notes: string;
  items: CountItem[];
  status: "Devam Ediyor" | "Tamamlandı";
  createdAt: string;
}

const STATUS_STYLES = {
  "Devam Ediyor": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Tamamlandı: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

function formatDiff(diff: number) {
  if (diff === 0) return <span className="text-muted-foreground">0</span>;
  if (diff > 0) return <span className="text-emerald-400">+{diff}</span>;
  return <span className="text-rose-400">{diff}</span>;
}

export default function InventoryCount({
  companyId,
  stockItems,
}: {
  companyId: string;
  stockItems: StockItem[];
}) {
  const storageKey = `pv_${companyId}_inventoryCounts`;

  const load = (): InventoryCountRecord[] => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  };

  const [counts, setCounts] = useState<InventoryCountRecord[]>(load);
  const [open, setOpen] = useState(false);
  const [selectedCount, setSelectedCount] =
    useState<InventoryCountRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    location: "",
    responsible: "",
    notes: "",
  });

  const [physicalQtys, setPhysicalQtys] = useState<Record<string, string>>({});

  const save = (data: InventoryCountRecord[]) => {
    setCounts(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const handleCreateCount = () => {
    if (!form.date || !form.responsible.trim()) {
      toast.error("Tarih ve sorumlu kişi zorunludur.");
      return;
    }
    const items: CountItem[] = stockItems.map((s) => ({
      stockItemId: s.id,
      name: s.name,
      unit: s.unit,
      systemQty: s.quantity,
      physicalQty: s.quantity,
      diff: 0,
    }));
    const record: InventoryCountRecord = {
      id: `count_${Date.now()}`,
      date: form.date,
      location: form.location,
      responsible: form.responsible,
      notes: form.notes,
      items,
      status: "Devam Ediyor",
      createdAt: new Date().toISOString(),
    };
    const initQtys: Record<string, string> = {};
    for (const s of stockItems) initQtys[s.id] = String(s.quantity);
    setPhysicalQtys(initQtys);
    setSelectedCount(record);
    save([record, ...counts]);
    setForm({
      date: new Date().toISOString().split("T")[0],
      location: "",
      responsible: "",
      notes: "",
    });
    setOpen(false);
    setDetailOpen(true);
  };

  const handleSaveCount = (countId: string) => {
    const updated = counts.map((c) => {
      if (c.id !== countId) return c;
      const items = c.items.map((item) => {
        const physical = Number(
          physicalQtys[item.stockItemId] ?? item.systemQty,
        );
        return {
          ...item,
          physicalQty: physical,
          diff: physical - item.systemQty,
        };
      });
      return { ...c, items };
    });
    save(updated);
    toast.success("Sayım kaydedildi.");
  };

  const handleCompleteCount = (countId: string) => {
    handleSaveCount(countId);
    const updated = counts.map((c) =>
      c.id === countId ? { ...c, status: "Tamamlandı" as const } : c,
    );
    save(updated);
    setDetailOpen(false);
    toast.success("Sayım tamamlandı ve rapor oluşturuldu.");
  };

  const discrepancies = useMemo(() => {
    if (!selectedCount) return [];
    const current = counts.find((c) => c.id === selectedCount.id);
    return current?.items.filter((i) => i.diff !== 0) || [];
  }, [counts, selectedCount]);

  const openDetail = (count: InventoryCountRecord) => {
    const initQtys: Record<string, string> = {};
    for (const item of count.items)
      initQtys[item.stockItemId] = String(item.physicalQty);
    setPhysicalQtys(initQtys);
    setSelectedCount(count);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Fiziksel Stok Sayımı
          </h2>
          <p className="text-sm text-muted-foreground">
            Periyodik sayım formları ve fark raporları
          </p>
        </div>
        <Button
          data-ocid="inventory.count.open_modal_button"
          size="sm"
          onClick={() => setOpen(true)}
          className="gradient-bg text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Yeni Sayım
        </Button>
      </div>

      {counts.length === 0 ? (
        <div
          data-ocid="inventory.count.empty_state"
          className="text-center py-14"
        >
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-amber-500/30" />
          <p className="text-muted-foreground">Henüz stok sayımı yapılmamış.</p>
          <p className="text-sm text-muted-foreground mt-1">
            İlk sayımı başlatmak için "Yeni Sayım" butonuna tıklayın.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {counts.map((count, idx) => {
            const diffs = count.items.filter((i) => i.diff !== 0).length;
            return (
              <Card
                key={count.id}
                data-ocid={`inventory.count.item.${idx + 1}`}
                className="bg-card border-border cursor-pointer hover:border-amber-500/30 transition-colors"
                onClick={() => openDetail(count)}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {count.date} — {count.location || "Genel Depo"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sorumlu: {count.responsible} · {count.items.length}{" "}
                        kalem
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {diffs > 0 && (
                        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 border text-xs">
                          {diffs} fark
                        </Badge>
                      )}
                      <Badge
                        className={`text-xs border ${STATUS_STYLES[count.status]}`}
                      >
                        {count.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-ocid="inventory.count.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Yeni Stok Sayımı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tarih *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label>Depo / Konum</Label>
                <Input
                  data-ocid="inventory.count.input"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Depo adı"
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Sorumlu Kişi *</Label>
              <Input
                value={form.responsible}
                onChange={(e) =>
                  setForm((f) => ({ ...f, responsible: e.target.value }))
                }
                placeholder="Sayımı yapan kişi"
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                data-ocid="inventory.count.textarea"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Ek notlar..."
                rows={2}
                className="bg-background border-border mt-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sayım başlatıldığında {stockItems.length} stok kalemi için
              fiziksel miktar girişi yapılabilecek.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="inventory.count.cancel_button"
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="inventory.count.submit_button"
              onClick={handleCreateCount}
              className="gradient-bg text-white"
            >
              Başlat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Count Detail Dialog */}
      {selectedCount && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent
            data-ocid="inventory.count.detail.dialog"
            className="bg-card border-border max-w-3xl max-h-[85vh] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                Sayım: {selectedCount.date} —{" "}
                {selectedCount.location || "Genel Depo"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sorumlu: {selectedCount.responsible}
              </p>

              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Malzeme</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead>Sistem Miktarı</TableHead>
                      <TableHead>Fiziksel Miktar</TableHead>
                      <TableHead>Fark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      counts.find((c) => c.id === selectedCount.id) ||
                      selectedCount
                    ).items.map((item, idx) => (
                      <TableRow
                        key={item.stockItemId}
                        data-ocid={`inventory.count.detail.item.${idx + 1}`}
                        className="border-border"
                      >
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.systemQty}</TableCell>
                        <TableCell>
                          {selectedCount.status === "Tamamlandı" ? (
                            item.physicalQty
                          ) : (
                            <Input
                              type="number"
                              value={
                                physicalQtys[item.stockItemId] ??
                                String(item.physicalQty)
                              }
                              onChange={(e) =>
                                setPhysicalQtys((prev) => ({
                                  ...prev,
                                  [item.stockItemId]: e.target.value,
                                }))
                              }
                              className="h-8 w-24 bg-background border-border text-sm"
                            />
                          )}
                        </TableCell>
                        <TableCell>{formatDiff(item.diff)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {discrepancies.length > 0 && (
                <Card className="bg-rose-500/10 border-rose-500/30">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm text-rose-400">
                      Fark Raporu — {discrepancies.length} kalem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-1">
                      {discrepancies.map((item) => (
                        <div
                          key={item.stockItemId}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-foreground">{item.name}</span>
                          <span
                            className={
                              item.diff > 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {item.diff > 0 ? "+" : ""}
                            {item.diff} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter className="gap-2">
              {selectedCount.status !== "Tamamlandı" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSaveCount(selectedCount.id)}
                    data-ocid="inventory.count.save_button"
                    className="border-border"
                  >
                    Kaydet
                  </Button>
                  <Button
                    data-ocid="inventory.count.complete_button"
                    onClick={() => handleCompleteCount(selectedCount.id)}
                    className="gradient-bg text-white"
                  >
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Sayımı Tamamla
                  </Button>
                </>
              )}
              {selectedCount.status === "Tamamlandı" && (
                <Button
                  variant="outline"
                  onClick={() => setDetailOpen(false)}
                  data-ocid="inventory.count.close_button"
                  className="border-border"
                >
                  Kapat
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
