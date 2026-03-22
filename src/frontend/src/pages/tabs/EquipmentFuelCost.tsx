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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Fuel, Plus, Trash2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface Equipment {
  id: string;
  name: string;
}

interface FuelLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  date: string;
  liters: number;
  unitPrice: number;
  totalCost: number;
  operator: string;
  companyId: string;
}

interface OperatorHour {
  id: string;
  equipmentId: string;
  equipmentName: string;
  date: string;
  hours: number;
  operator: string;
  companyId: string;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function EquipmentFuelCost({
  companyId,
  equipment,
}: {
  companyId: string;
  equipment: Equipment[];
}) {
  const fuelKey = `pv_${companyId}_equipmentFuelLogs`;
  const hoursKey = `pv_${companyId}_equipmentHours`;

  const loadFuel = (): FuelLog[] => {
    try {
      return JSON.parse(localStorage.getItem(fuelKey) || "[]");
    } catch {
      return [];
    }
  };
  const loadHours = (): OperatorHour[] => {
    try {
      return JSON.parse(localStorage.getItem(hoursKey) || "[]");
    } catch {
      return [];
    }
  };

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(loadFuel);
  const [operatorHours, setOperatorHours] = useState<OperatorHour[]>(loadHours);
  const [fuelOpen, setFuelOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);

  const [fuelForm, setFuelForm] = useState({
    equipmentId: "",
    date: "",
    liters: "",
    unitPrice: "",
    operator: "",
  });
  const [hoursForm, setHoursForm] = useState({
    equipmentId: "",
    date: "",
    hours: "",
    operator: "",
  });

  const saveFuel = (data: FuelLog[]) => {
    setFuelLogs(data);
    localStorage.setItem(fuelKey, JSON.stringify(data));
  };
  const saveHours = (data: OperatorHour[]) => {
    setOperatorHours(data);
    localStorage.setItem(hoursKey, JSON.stringify(data));
  };

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthlyFuelCost = useMemo(
    () =>
      fuelLogs
        .filter((l) => l.date.startsWith(thisMonth))
        .reduce((s, l) => s + l.totalCost, 0),
    [fuelLogs, thisMonth],
  );
  const monthlyHours = useMemo(
    () =>
      operatorHours
        .filter((h) => h.date.startsWith(thisMonth))
        .reduce((s, h) => s + h.hours, 0),
    [operatorHours, thisMonth],
  );
  const costPerHour = monthlyHours > 0 ? monthlyFuelCost / monthlyHours : 0;

  const equipCostReport = useMemo(() => {
    return equipment
      .map((eq) => {
        const fuel = fuelLogs
          .filter((l) => l.equipmentId === eq.id)
          .reduce((s, l) => s + l.totalCost, 0);
        const hours = operatorHours
          .filter((h) => h.equipmentId === eq.id)
          .reduce((s, h) => s + h.hours, 0);
        return { id: eq.id, name: eq.name, fuel, hours, total: fuel };
      })
      .filter((r) => r.total > 0 || r.hours > 0);
  }, [equipment, fuelLogs, operatorHours]);

  const handleAddFuel = () => {
    if (
      !fuelForm.equipmentId ||
      !fuelForm.date ||
      !fuelForm.liters ||
      !fuelForm.unitPrice
    ) {
      toast.error("Tüm zorunlu alanları doldurun.");
      return;
    }
    const eq = equipment.find((e) => e.id === fuelForm.equipmentId);
    const liters = Number(fuelForm.liters);
    const unitPrice = Number(fuelForm.unitPrice);
    const log: FuelLog = {
      id: `fuel_${Date.now()}`,
      equipmentId: fuelForm.equipmentId,
      equipmentName: eq?.name || "",
      date: fuelForm.date,
      liters,
      unitPrice,
      totalCost: liters * unitPrice,
      operator: fuelForm.operator,
      companyId,
    };
    saveFuel([log, ...fuelLogs]);
    setFuelForm({
      equipmentId: "",
      date: "",
      liters: "",
      unitPrice: "",
      operator: "",
    });
    setFuelOpen(false);
    toast.success("Yakıt girişi kaydedildi.");
  };

  const handleAddHours = () => {
    if (!hoursForm.equipmentId || !hoursForm.date || !hoursForm.hours) {
      toast.error("Tüm zorunlu alanları doldurun.");
      return;
    }
    const eq = equipment.find((e) => e.id === hoursForm.equipmentId);
    const rec: OperatorHour = {
      id: `hours_${Date.now()}`,
      equipmentId: hoursForm.equipmentId,
      equipmentName: eq?.name || "",
      date: hoursForm.date,
      hours: Number(hoursForm.hours),
      operator: hoursForm.operator,
      companyId,
    };
    saveHours([rec, ...operatorHours]);
    setHoursForm({ equipmentId: "", date: "", hours: "", operator: "" });
    setHoursOpen(false);
    toast.success("Operatör saati kaydedildi.");
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              Bu Ay Yakıt Maliyeti
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(monthlyFuelCost)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Bu Ay Operatör Saati
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-foreground">
              {monthlyHours.toFixed(1)} saat
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Saat Başı Maliyet
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-foreground">
              {costPerHour > 0 ? formatCurrency(costPerHour) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fuel">
        <TabsList className="bg-card border border-border">
          <TabsTrigger data-ocid="equipment.fuel.tab" value="fuel">
            Yakıt Girişleri
          </TabsTrigger>
          <TabsTrigger data-ocid="equipment.ophours.tab" value="hours">
            Operatör Saatleri
          </TabsTrigger>
          <TabsTrigger data-ocid="equipment.costreport.tab" value="report">
            Maliyet Raporu
          </TabsTrigger>
        </TabsList>

        {/* Fuel Logs */}
        <TabsContent value="fuel" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Yakıt Kayıtları
            </h3>
            <Button
              data-ocid="equipment.fuel.open_modal_button"
              size="sm"
              onClick={() => setFuelOpen(true)}
              className="gradient-bg text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Ekle
            </Button>
          </div>
          {fuelLogs.length === 0 ? (
            <div
              data-ocid="equipment.fuel.empty_state"
              className="text-center py-10 text-muted-foreground"
            >
              <Fuel className="w-10 h-10 mx-auto mb-2 text-amber-500/30" />
              <p>Henüz yakıt kaydı yok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Ekipman</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Litre</TableHead>
                    <TableHead>Birim Fiyat</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Operatör</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelLogs.map((log, idx) => (
                    <TableRow
                      key={log.id}
                      data-ocid={`equipment.fuel.item.${idx + 1}`}
                      className="border-border"
                    >
                      <TableCell className="font-medium">
                        {log.equipmentName}
                      </TableCell>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.liters} L</TableCell>
                      <TableCell>{formatCurrency(log.unitPrice)}/L</TableCell>
                      <TableCell className="font-semibold text-amber-400">
                        {formatCurrency(log.totalCost)}
                      </TableCell>
                      <TableCell>{log.operator || "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-400 hover:text-rose-300"
                          onClick={() =>
                            saveFuel(fuelLogs.filter((l) => l.id !== log.id))
                          }
                          data-ocid={`equipment.fuel.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Operator Hours */}
        <TabsContent value="hours" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Operatör Saatleri
            </h3>
            <Button
              data-ocid="equipment.hours.open_modal_button"
              size="sm"
              onClick={() => setHoursOpen(true)}
              className="gradient-bg text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Ekle
            </Button>
          </div>
          {operatorHours.length === 0 ? (
            <div
              data-ocid="equipment.hours.empty_state"
              className="text-center py-10 text-muted-foreground"
            >
              <Clock className="w-10 h-10 mx-auto mb-2 text-blue-500/30" />
              <p>Henüz operatör saati kaydı yok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Ekipman</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Süre (saat)</TableHead>
                    <TableHead>Operatör</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operatorHours.map((rec, idx) => (
                    <TableRow
                      key={rec.id}
                      data-ocid={`equipment.hours.item.${idx + 1}`}
                      className="border-border"
                    >
                      <TableCell className="font-medium">
                        {rec.equipmentName}
                      </TableCell>
                      <TableCell>{rec.date}</TableCell>
                      <TableCell>{rec.hours} saat</TableCell>
                      <TableCell>{rec.operator || "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-400 hover:text-rose-300"
                          onClick={() =>
                            saveHours(
                              operatorHours.filter((h) => h.id !== rec.id),
                            )
                          }
                          data-ocid={`equipment.hours.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Cost Report */}
        <TabsContent value="report" className="mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Ekipman Başına Maliyet Raporu
          </h3>
          {equipCostReport.length === 0 ? (
            <div
              data-ocid="equipment.report.empty_state"
              className="text-center py-10 text-muted-foreground"
            >
              <TrendingUp className="w-10 h-10 mx-auto mb-2 text-emerald-500/30" />
              <p>Henüz maliyet verisi yok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Ekipman</TableHead>
                    <TableHead>Yakıt Maliyeti</TableHead>
                    <TableHead>Operatör Saati</TableHead>
                    <TableHead>Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipCostReport.map((r, idx) => (
                    <TableRow
                      key={r.id}
                      data-ocid={`equipment.costreport.item.${idx + 1}`}
                      className="border-border"
                    >
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{formatCurrency(r.fuel)}</TableCell>
                      <TableCell>{r.hours.toFixed(1)} saat</TableCell>
                      <TableCell className="font-bold text-amber-400">
                        {formatCurrency(r.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Fuel Dialog */}
      <Dialog open={fuelOpen} onOpenChange={setFuelOpen}>
        <DialogContent
          data-ocid="equipment.fuel.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Yakıt Girişi Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ekipman *</Label>
              <Select
                value={fuelForm.equipmentId}
                onValueChange={(v) =>
                  setFuelForm((f) => ({ ...f, equipmentId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="equipment.fuel.select"
                  className="bg-background border-border mt-1"
                >
                  <SelectValue placeholder="Ekipman seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {equipment.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tarih *</Label>
                <Input
                  type="date"
                  value={fuelForm.date}
                  onChange={(e) =>
                    setFuelForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label>Operatör</Label>
                <Input
                  data-ocid="equipment.fuel.input"
                  value={fuelForm.operator}
                  onChange={(e) =>
                    setFuelForm((f) => ({ ...f, operator: e.target.value }))
                  }
                  placeholder="Operatör adı"
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Litre *</Label>
                <Input
                  type="number"
                  value={fuelForm.liters}
                  onChange={(e) =>
                    setFuelForm((f) => ({ ...f, liters: e.target.value }))
                  }
                  placeholder="0"
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label>Birim Fiyat (₺/L) *</Label>
                <Input
                  type="number"
                  value={fuelForm.unitPrice}
                  onChange={(e) =>
                    setFuelForm((f) => ({ ...f, unitPrice: e.target.value }))
                  }
                  placeholder="0"
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            {fuelForm.liters && fuelForm.unitPrice && (
              <p className="text-sm text-amber-400 font-semibold">
                Toplam:{" "}
                {formatCurrency(
                  Number(fuelForm.liters) * Number(fuelForm.unitPrice),
                )}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFuelOpen(false)}
              data-ocid="equipment.fuel.cancel_button"
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="equipment.fuel.submit_button"
              onClick={handleAddFuel}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hours Dialog */}
      <Dialog open={hoursOpen} onOpenChange={setHoursOpen}>
        <DialogContent
          data-ocid="equipment.hours.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Operatör Saati Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ekipman *</Label>
              <Select
                value={hoursForm.equipmentId}
                onValueChange={(v) =>
                  setHoursForm((f) => ({ ...f, equipmentId: v }))
                }
              >
                <SelectTrigger className="bg-background border-border mt-1">
                  <SelectValue placeholder="Ekipman seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {equipment.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tarih *</Label>
                <Input
                  type="date"
                  value={hoursForm.date}
                  onChange={(e) =>
                    setHoursForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label>Süre (saat) *</Label>
                <Input
                  type="number"
                  value={hoursForm.hours}
                  onChange={(e) =>
                    setHoursForm((f) => ({ ...f, hours: e.target.value }))
                  }
                  placeholder="0"
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Operatör</Label>
              <Input
                value={hoursForm.operator}
                onChange={(e) =>
                  setHoursForm((f) => ({ ...f, operator: e.target.value }))
                }
                placeholder="Operatör adı"
                className="bg-background border-border mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setHoursOpen(false)}
              data-ocid="equipment.hours.cancel_button"
              className="border-border"
            >
              İptal
            </Button>
            <Button
              data-ocid="equipment.hours.submit_button"
              onClick={handleAddHours}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
