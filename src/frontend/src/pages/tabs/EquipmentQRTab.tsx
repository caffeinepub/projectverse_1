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
import { LogIn, LogOut, QrCode } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../contexts/AppContext";

interface CheckLog {
  id: string;
  equipmentId: string;
  site: string;
  personnel: string;
  date: string;
  type: "Giriş" | "Çıkış";
}

export default function EquipmentQRTab({
  companyId,
  equipment,
}: {
  companyId: string;
  equipment: { id: string; name: string; serial?: string; type?: string }[];
}) {
  const { hrPersonnel: allPersonnel, projects } = useApp();
  const logKey = `equipment_qr_${companyId}`;

  const loadLogs = (): CheckLog[] => {
    try {
      return JSON.parse(localStorage.getItem(logKey) || "[]");
    } catch {
      return [];
    }
  };

  const [logs, setLogs] = useState<CheckLog[]>(loadLogs);
  const [logOpen, setLogOpen] = useState(false);
  const [qrPreview, setQrPreview] = useState<{
    id: string;
    name: string;
    qrCode: string;
  } | null>(null);

  const saveLogs = (data: CheckLog[]) => {
    setLogs(data);
    localStorage.setItem(logKey, JSON.stringify(data));
  };

  const emptyLog = {
    equipmentId: "",
    site: "",
    personnel: "",
    date: new Date().toISOString().slice(0, 10),
    type: "Giriş" as CheckLog["type"],
  };
  const [logForm, setLogForm] = useState(emptyLog);

  const companyPersonnel = allPersonnel;
  const companyProjects = projects.filter((p) => p.companyId === companyId);

  const getQrCode = (equip: { id: string }) =>
    `EQ-${equip.id.slice(-6).toUpperCase()}`;

  const handleAddLog = () => {
    if (!logForm.equipmentId || !logForm.personnel) return;
    saveLogs([...logs, { id: Date.now().toString(), ...logForm }]);
    setLogForm(emptyLog);
    setLogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Equipment QR Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.length === 0 ? (
          <div
            data-ocid="equipment_qr.empty_state"
            className="col-span-3 text-center py-16 text-muted-foreground"
          >
            <QrCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>QR takibi için önce ekipman ekleyin</p>
          </div>
        ) : (
          equipment.map((e) => {
            const qr = getQrCode(e);
            const lastLog = [...logs]
              .reverse()
              .find((l) => l.equipmentId === e.id);
            return (
              <Card
                key={e.id}
                className="bg-card border-border hover:border-amber-500/30 transition-colors"
              >
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-foreground">
                        {e.name}
                      </div>
                      {e.type && (
                        <div className="text-xs text-muted-foreground">
                          {e.type}
                        </div>
                      )}
                    </div>
                    <Badge className="text-xs bg-amber-500/15 text-amber-400 border-amber-500/30">
                      {qr}
                    </Badge>
                  </div>
                  {/* QR Code visual */}
                  <button
                    type="button"
                    className="rounded-lg bg-white p-3 flex items-center justify-center cursor-pointer w-full"
                    onClick={() =>
                      setQrPreview({ id: e.id, name: e.name, qrCode: qr })
                    }
                  >
                    <div className="text-center">
                      <div className="grid grid-cols-5 gap-0.5 mx-auto w-fit mb-1">
                        {Array.from({ length: 25 }, (_, idx) => (
                          <div
                            key={`qr-${e.id}-${idx}`}
                            className={`w-3 h-3 rounded-sm ${(idx * 7 + e.id.charCodeAt(idx % e.id.length)) % 3 === 0 ? "bg-gray-900" : "bg-white border border-gray-200"}`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-gray-700 font-mono font-bold">
                        {qr}
                      </div>
                    </div>
                  </button>
                  {e.serial && (
                    <div className="text-xs text-muted-foreground">
                      Seri No:{" "}
                      <span className="font-mono text-foreground">
                        {e.serial}
                      </span>
                    </div>
                  )}
                  {lastLog && (
                    <div className="flex items-center gap-1 text-xs">
                      {lastLog.type === "Giriş" ? (
                        <LogIn className="w-3 h-3 text-green-400" />
                      ) : (
                        <LogOut className="w-3 h-3 text-red-400" />
                      )}
                      <span className="text-muted-foreground">
                        {lastLog.type}: {lastLog.site} ({lastLog.date})
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Check-in/out log */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          Giriş / Çıkış Logu
        </h3>
        <Button
          size="sm"
          className="gradient-bg text-white"
          data-ocid="equipment_qr.open_modal_button"
          onClick={() => setLogOpen(true)}
        >
          <QrCode className="w-4 h-4 mr-1" /> Giriş/Çıkış Ekle
        </Button>
      </div>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              Ekipman Giriş/Çıkış
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ekipman *</Label>
              <Select
                value={logForm.equipmentId}
                onValueChange={(v) =>
                  setLogForm({ ...logForm, equipmentId: v })
                }
              >
                <SelectTrigger className="bg-background border-border mt-1">
                  <SelectValue placeholder="Ekipman seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {equipment.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({getQrCode(e)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>İşlem Türü</Label>
              <Select
                value={logForm.type}
                onValueChange={(v) =>
                  setLogForm({ ...logForm, type: v as CheckLog["type"] })
                }
              >
                <SelectTrigger className="bg-background border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Giriş">Giriş</SelectItem>
                  <SelectItem value="Çıkış">Çıkış</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Şantiye / Proje *</Label>
              <Select
                value={logForm.site}
                onValueChange={(v) => setLogForm({ ...logForm, site: v })}
              >
                <SelectTrigger className="bg-background border-border mt-1">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companyProjects.map((p) => (
                    <SelectItem key={p.id} value={p.title}>
                      {p.title}
                    </SelectItem>
                  ))}
                  <SelectItem value="Depo">Depo</SelectItem>
                  <SelectItem value="Atölye">Atölye</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Personel *</Label>
              <Select
                value={logForm.personnel}
                onValueChange={(v) => setLogForm({ ...logForm, personnel: v })}
              >
                <SelectTrigger className="bg-background border-border mt-1">
                  <SelectValue placeholder="Personel seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {companyPersonnel.map((p: { id: string; name: string }) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tarih</Label>
              <Input
                type="date"
                className="bg-background border-border mt-1"
                value={logForm.date}
                onChange={(e) =>
                  setLogForm({ ...logForm, date: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setLogOpen(false)}
            >
              İptal
            </Button>
            <Button
              className="gradient-bg text-white"
              data-ocid="equipment_qr.submit_button"
              onClick={handleAddLog}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Preview Dialog */}
      <Dialog open={!!qrPreview} onOpenChange={() => setQrPreview(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Kodu: {qrPreview?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-6 rounded-xl">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {Array.from({ length: 49 }, (_, idx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: visual pixel grid
                    key={`qrp-${idx}`}
                    className={`w-5 h-5 rounded-sm ${idx % 3 === 0 || idx % 7 === 0 ? "bg-gray-900" : "bg-white border border-gray-100"}`}
                  />
                ))}
              </div>
              <div className="text-center font-mono font-bold text-lg text-gray-900">
                {qrPreview?.qrCode}
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Bu kodu ekipman üzerine yapıştırarak saha takibinde
              kullanabilirsiniz.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-border"
            >
              Yazdır
            </Button>
            <Button
              onClick={() => setQrPreview(null)}
              className="gradient-bg text-white"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log table */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Ekipman</TableHead>
                <TableHead className="text-muted-foreground">İşlem</TableHead>
                <TableHead className="text-muted-foreground">Şantiye</TableHead>
                <TableHead className="text-muted-foreground">
                  Personel
                </TableHead>
                <TableHead className="text-muted-foreground">Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...logs]
                .reverse()
                .slice(0, 50)
                .map((log, i) => {
                  const eq = equipment.find((e) => e.id === log.equipmentId);
                  return (
                    <TableRow
                      key={log.id}
                      data-ocid={`equipment_qr.item.${i + 1}`}
                      className="border-border hover:bg-muted/30"
                    >
                      <TableCell className="font-medium text-foreground">
                        {eq?.name || log.equipmentId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs border ${log.type === "Giriş" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}`}
                        >
                          {log.type === "Giriş" ? (
                            <LogIn className="w-3 h-3 mr-1" />
                          ) : (
                            <LogOut className="w-3 h-3 mr-1" />
                          )}
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {log.site}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {log.personnel}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {log.date}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
