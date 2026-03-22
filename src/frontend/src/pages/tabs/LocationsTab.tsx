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
  Building2,
  ChevronRight,
  MoveRight,
  Plus,
  Warehouse,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { StockItem } from "../../contexts/AppContext";

interface Location {
  id: string;
  name: string;
  type: "depo" | "bolge" | "raf";
  parentId?: string;
  capacity?: number;
  createdAt: string;
}

interface StockLocation {
  stockItemId: string;
  locationId: string;
  quantity: number;
}

export default function LocationsTab({
  companyId,
  stockItems,
}: { companyId: string; stockItems: StockItem[] }) {
  const storageLocs = `pv_locations_${companyId}`;
  const storageAssign = `pv_stock_locations_${companyId}`;

  const [locations, setLocations] = useState<Location[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageLocs) || "[]");
    } catch {
      return [];
    }
  });
  const [assignments, setAssignments] = useState<StockLocation[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageAssign) || "[]");
    } catch {
      return [];
    }
  });

  const [locOpen, setLocOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [newLoc, setNewLoc] = useState({
    name: "",
    type: "depo" as Location["type"],
    parentId: "",
    capacity: "",
  });
  const [newAssign, setNewAssign] = useState({
    stockItemId: "",
    locationId: "",
    quantity: "",
  });
  const [transfer, setTransfer] = useState({
    stockItemId: "",
    fromLocationId: "",
    toLocationId: "",
    quantity: "",
  });

  useEffect(() => {
    localStorage.setItem(storageLocs, JSON.stringify(locations));
  }, [locations, storageLocs]);
  useEffect(() => {
    localStorage.setItem(storageAssign, JSON.stringify(assignments));
  }, [assignments, storageAssign]);

  const warehouses = locations.filter((l) => l.type === "depo");
  const zones = locations.filter((l) => l.type === "bolge");

  function addLocation() {
    if (!newLoc.name) {
      toast.error("Lokasyon adı zorunludur.");
      return;
    }
    setLocations((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newLoc.name,
        type: newLoc.type,
        parentId: newLoc.parentId || undefined,
        capacity: newLoc.capacity ? Number(newLoc.capacity) : undefined,
        createdAt: new Date().toISOString().split("T")[0],
      },
    ]);
    setNewLoc({ name: "", type: "depo", parentId: "", capacity: "" });
    setLocOpen(false);
    toast.success("Lokasyon oluşturuldu.");
  }

  function assignStock() {
    if (
      !newAssign.stockItemId ||
      !newAssign.locationId ||
      !newAssign.quantity
    ) {
      toast.error("Tüm alanlar zorunludur.");
      return;
    }
    setAssignments((prev) => {
      const existing = prev.findIndex(
        (a) =>
          a.stockItemId === newAssign.stockItemId &&
          a.locationId === newAssign.locationId,
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + Number(newAssign.quantity),
        };
        return updated;
      }
      return [
        ...prev,
        {
          stockItemId: newAssign.stockItemId,
          locationId: newAssign.locationId,
          quantity: Number(newAssign.quantity),
        },
      ];
    });
    setNewAssign({ stockItemId: "", locationId: "", quantity: "" });
    setAssignOpen(false);
    toast.success("Stok lokasyona atandı.");
  }

  function doTransfer() {
    if (
      !transfer.stockItemId ||
      !transfer.fromLocationId ||
      !transfer.toLocationId ||
      !transfer.quantity
    ) {
      toast.error("Tüm alanlar zorunludur.");
      return;
    }
    const qty = Number(transfer.quantity);
    setAssignments((prev) => {
      let updated = prev
        .map((a) => {
          if (
            a.stockItemId === transfer.stockItemId &&
            a.locationId === transfer.fromLocationId
          ) {
            return { ...a, quantity: Math.max(0, a.quantity - qty) };
          }
          return a;
        })
        .filter((a) => a.quantity > 0);
      const toIdx = updated.findIndex(
        (a) =>
          a.stockItemId === transfer.stockItemId &&
          a.locationId === transfer.toLocationId,
      );
      if (toIdx >= 0) {
        updated[toIdx] = {
          ...updated[toIdx],
          quantity: updated[toIdx].quantity + qty,
        };
      } else {
        updated.push({
          stockItemId: transfer.stockItemId,
          locationId: transfer.toLocationId,
          quantity: qty,
        });
      }
      return updated;
    });
    setTransfer({
      stockItemId: "",
      fromLocationId: "",
      toLocationId: "",
      quantity: "",
    });
    setTransferOpen(false);
    toast.success("Stok transferi tamamlandı.");
  }

  const TYPE_LABELS: Record<string, string> = {
    depo: "Depo",
    bolge: "Bölge",
    raf: "Raf",
  };
  const TYPE_COLORS: Record<string, string> = {
    depo: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    bolge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    raf: "bg-green-500/15 text-green-400 border-green-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          data-ocid="inventory.locations.add_button"
          size="sm"
          className="gradient-bg text-white"
          onClick={() => setLocOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> Lokasyon Ekle
        </Button>
        <Button
          data-ocid="inventory.locations.assign_button"
          size="sm"
          variant="outline"
          className="border-border"
          onClick={() => setAssignOpen(true)}
          disabled={locations.length === 0 || stockItems.length === 0}
        >
          <Warehouse className="h-4 w-4 mr-1" /> Stok Ata
        </Button>
        <Button
          data-ocid="inventory.locations.transfer_button"
          size="sm"
          variant="outline"
          className="border-border"
          onClick={() => setTransferOpen(true)}
          disabled={locations.length < 2}
        >
          <MoveRight className="h-4 w-4 mr-1" /> Transfer
        </Button>
      </div>

      {/* Location Tree */}
      {locations.length === 0 ? (
        <div
          data-ocid="inventory.locations.empty_state"
          className="text-center py-14 text-muted-foreground bg-card rounded-xl border border-border"
        >
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Henüz lokasyon oluşturulmadı</p>
          <p className="text-sm mt-1">
            Depo, bölge ve raf hiyerarşisi oluşturun.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {warehouses.map((wh, idx) => {
            const whZones = zones.filter((z) => z.parentId === wh.id);
            const whAssigns = assignments.filter((a) => {
              const loc = locations.find((l) => l.id === a.locationId);
              return (
                loc?.id === wh.id ||
                loc?.parentId === wh.id ||
                whZones.some((z) => z.id === loc?.parentId)
              );
            });
            const totalItems = whAssigns.reduce((s, a) => s + a.quantity, 0);
            return (
              <Card
                key={wh.id}
                data-ocid={`inventory.locations.item.${idx + 1}`}
                className="bg-card border-border"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Warehouse className="h-4 w-4 text-amber-400" />
                      {wh.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-xs ${TYPE_COLORS[wh.type]}`}
                    >
                      {TYPE_LABELS[wh.type]}
                    </Badge>
                  </div>
                  {wh.capacity && (
                    <p className="text-xs text-muted-foreground">
                      Kapasite: {wh.capacity} | Mevcut: {totalItems}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-1">
                  {whZones.map((z) => {
                    const zoneAssigns = assignments.filter(
                      (a) => a.locationId === z.id,
                    );
                    return (
                      <div
                        key={z.id}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <span>{z.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${TYPE_COLORS[z.type]}`}
                        >
                          {TYPE_LABELS[z.type]}
                        </Badge>
                        {zoneAssigns.length > 0 && (
                          <span className="text-muted-foreground ml-auto">
                            {zoneAssigns.reduce((s, a) => s + a.quantity, 0)}{" "}
                            adet
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {whAssigns.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        Stok
                      </p>
                      {whAssigns.map((a) => {
                        const item = stockItems.find(
                          (s) => s.id === a.stockItemId,
                        );
                        const loc = locations.find(
                          (l) => l.id === a.locationId,
                        );
                        return item ? (
                          <div
                            key={`${a.stockItemId}-${a.locationId}`}
                            className="flex justify-between text-xs py-0.5"
                          >
                            <span>{item.name}</span>
                            <span className="text-muted-foreground">
                              {a.quantity} {item.unit} @ {loc?.name}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {/* Standalone locations not under any warehouse */}
          {locations
            .filter((l) => l.type !== "depo" && !l.parentId)
            .map((l, idx) => (
              <Card
                key={l.id}
                data-ocid={`inventory.locations.standalone.item.${idx + 1}`}
                className="bg-card border-border"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{l.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-xs ${TYPE_COLORS[l.type]}`}
                    >
                      {TYPE_LABELS[l.type]}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
        </div>
      )}

      {/* Add Location Dialog */}
      <Dialog open={locOpen} onOpenChange={setLocOpen}>
        <DialogContent
          data-ocid="inventory.locations.dialog"
          className="sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Lokasyon Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ad *</Label>
              <Input
                data-ocid="inventory.locations.name.input"
                value={newLoc.name}
                onChange={(e) =>
                  setNewLoc((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Tür</Label>
              <Select
                value={newLoc.type}
                onValueChange={(v) =>
                  setNewLoc((p) => ({ ...p, type: v as Location["type"] }))
                }
              >
                <SelectTrigger
                  data-ocid="inventory.locations.type.select"
                  className="border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="depo">Depo</SelectItem>
                  <SelectItem value="bolge">Bölge</SelectItem>
                  <SelectItem value="raf">Raf</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newLoc.type !== "depo" && (
              <div>
                <Label>Üst Lokasyon</Label>
                <Select
                  value={newLoc.parentId}
                  onValueChange={(v) =>
                    setNewLoc((p) => ({ ...p, parentId: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="inventory.locations.parent.select"
                    className="border-border"
                  >
                    <SelectValue placeholder="Seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} ({TYPE_LABELS[l.type]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Kapasite (opsiyonel)</Label>
              <Input
                data-ocid="inventory.locations.capacity.input"
                type="number"
                value={newLoc.capacity}
                onChange={(e) =>
                  setNewLoc((p) => ({ ...p, capacity: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="inventory.locations.cancel_button"
              variant="outline"
              onClick={() => setLocOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="inventory.locations.submit_button"
              className="gradient-bg text-white"
              onClick={addLocation}
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent
          data-ocid="inventory.locations.assign.dialog"
          className="sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Stok Ata</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Malzeme</Label>
              <Select
                value={newAssign.stockItemId}
                onValueChange={(v) =>
                  setNewAssign((p) => ({ ...p, stockItemId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="inventory.locations.assign.item.select"
                  className="border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {stockItems.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lokasyon</Label>
              <Select
                value={newAssign.locationId}
                onValueChange={(v) =>
                  setNewAssign((p) => ({ ...p, locationId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="inventory.locations.assign.loc.select"
                  className="border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} ({TYPE_LABELS[l.type]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Miktar</Label>
              <Input
                data-ocid="inventory.locations.assign.quantity.input"
                type="number"
                value={newAssign.quantity}
                onChange={(e) =>
                  setNewAssign((p) => ({ ...p, quantity: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="inventory.locations.assign.cancel_button"
              variant="outline"
              onClick={() => setAssignOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="inventory.locations.assign.submit_button"
              className="gradient-bg text-white"
              onClick={assignStock}
            >
              Ata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent
          data-ocid="inventory.locations.transfer.dialog"
          className="sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Stok Transferi</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Malzeme</Label>
              <Select
                value={transfer.stockItemId}
                onValueChange={(v) =>
                  setTransfer((p) => ({ ...p, stockItemId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="inventory.locations.transfer.item.select"
                  className="border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {stockItems.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kaynak Lokasyon</Label>
              <Select
                value={transfer.fromLocationId}
                onValueChange={(v) =>
                  setTransfer((p) => ({ ...p, fromLocationId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="inventory.locations.transfer.from.select"
                  className="border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center">
              <MoveRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <Label>Hedef Lokasyon</Label>
              <Select
                value={transfer.toLocationId}
                onValueChange={(v) =>
                  setTransfer((p) => ({ ...p, toLocationId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="inventory.locations.transfer.to.select"
                  className="border-border"
                >
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((l) => l.id !== transfer.fromLocationId)
                    .map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Miktar</Label>
              <Input
                data-ocid="inventory.locations.transfer.quantity.input"
                type="number"
                value={transfer.quantity}
                onChange={(e) =>
                  setTransfer((p) => ({ ...p, quantity: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="inventory.locations.transfer.cancel_button"
              variant="outline"
              onClick={() => setTransferOpen(false)}
            >
              İptal
            </Button>
            <Button
              data-ocid="inventory.locations.transfer.submit_button"
              className="gradient-bg text-white"
              onClick={doTransfer}
            >
              Transfer Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
