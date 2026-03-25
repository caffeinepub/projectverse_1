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
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Siren, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

interface EmergencyPlanRecord {
  id: string;
  projectId: string;
  projectName: string;
  planType: string;
  description: string;
  evacuationRoutes: string;
  assemblyPoints: string;
  responsiblePerson: string;
  lastUpdated: string;
  status: string;
}

interface DrillRecord {
  id: string;
  date: string;
  type: string;
  participants: number;
  duration: number;
  result: string;
  notes: string;
}

interface AssemblyPoint {
  id: string;
  name: string;
  locationDesc: string;
  capacity: number;
  gpsCoords: string;
}

const PLAN_TYPES = ["Yangın", "Deprem", "İlk Yardım", "Genel Tahliye"];
const DRILL_RESULTS = ["Başarılı", "Kısmi", "Başarısız"];
const PLAN_STATUSES = ["Aktif", "Güncelleme Gerekli"];

export default function EmergencyPlan() {
  const { activeCompanyId, projects } = useApp();
  const plansKey = `pv_emergencyplans_${activeCompanyId}`;
  const drillsKey = `pv_emergencydrills_${activeCompanyId}`;
  const apKey = `pv_assemblypoints_${activeCompanyId}`;

  const [plans, setPlans] = useState<EmergencyPlanRecord[]>([]);
  const [drills, setDrills] = useState<DrillRecord[]>([]);
  const [assemblyPoints, setAssemblyPoints] = useState<AssemblyPoint[]>([]);

  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showDrillDialog, setShowDrillDialog] = useState(false);
  const [showAPDialog, setShowAPDialog] = useState(false);

  const emptyPlan = (): Omit<EmergencyPlanRecord, "id"> => ({
    projectId: "",
    projectName: "",
    planType: "Yangın",
    description: "",
    evacuationRoutes: "",
    assemblyPoints: "",
    responsiblePerson: "",
    lastUpdated: new Date().toISOString().split("T")[0],
    status: "Aktif",
  });

  const emptyDrill = (): Omit<DrillRecord, "id"> => ({
    date: new Date().toISOString().split("T")[0],
    type: "Yangın",
    participants: 0,
    duration: 30,
    result: "Başarılı",
    notes: "",
  });

  const emptyAP = (): Omit<AssemblyPoint, "id"> => ({
    name: "",
    locationDesc: "",
    capacity: 0,
    gpsCoords: "",
  });

  const [planForm, setPlanForm] = useState(emptyPlan());
  const [drillForm, setDrillForm] = useState(emptyDrill());
  const [apForm, setApForm] = useState(emptyAP());

  useEffect(() => {
    setPlans(JSON.parse(localStorage.getItem(plansKey) || "[]"));
    setDrills(JSON.parse(localStorage.getItem(drillsKey) || "[]"));
    setAssemblyPoints(JSON.parse(localStorage.getItem(apKey) || "[]"));
  }, [plansKey, drillsKey, apKey]);

  const companyProjects = projects.filter(
    (p) => p.companyId === activeCompanyId,
  );

  const handleSavePlan = () => {
    const proj = companyProjects.find((p) => p.id === planForm.projectId);
    const record: EmergencyPlanRecord = {
      id: Date.now().toString(),
      ...planForm,
      projectName: proj?.title ?? planForm.projectName,
    };
    const updated = [...plans, record];
    setPlans(updated);
    localStorage.setItem(plansKey, JSON.stringify(updated));
    setShowPlanDialog(false);
    setPlanForm(emptyPlan());
  };

  const handleSaveDrill = () => {
    const record: DrillRecord = { id: Date.now().toString(), ...drillForm };
    const updated = [...drills, record];
    setDrills(updated);
    localStorage.setItem(drillsKey, JSON.stringify(updated));
    setShowDrillDialog(false);
    setDrillForm(emptyDrill());
  };

  const handleSaveAP = () => {
    const record: AssemblyPoint = { id: Date.now().toString(), ...apForm };
    const updated = [...assemblyPoints, record];
    setAssemblyPoints(updated);
    localStorage.setItem(apKey, JSON.stringify(updated));
    setShowAPDialog(false);
    setApForm(emptyAP());
  };

  const deletePlan = (id: string) => {
    const updated = plans.filter((p) => p.id !== id);
    setPlans(updated);
    localStorage.setItem(plansKey, JSON.stringify(updated));
  };

  const statusColor = (s: string) =>
    s === "Aktif"
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  const resultColor = (r: string) => {
    if (r === "Başarılı")
      return "bg-green-500/20 text-green-400 border-green-500/30";
    if (r === "Kısmi")
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Siren className="w-7 h-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Acil Durum Planı
          </h1>
          <p className="text-muted-foreground text-sm">
            Şantiye bazlı acil durum planları ve tatbikat kayıtları
          </p>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Planlar</TabsTrigger>
          <TabsTrigger value="drills">Tatbikat Kayıtları</TabsTrigger>
          <TabsTrigger value="assembly">Toplanma Noktaları</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Acil Durum Planları</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowPlanDialog(true)}
                data-ocid="emergency_plan.primary_button"
              >
                <Plus className="w-4 h-4 mr-1" /> Plan Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {plans.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="emergency_plan.empty_state"
                >
                  <Siren className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Henüz acil durum planı yok</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proje</TableHead>
                      <TableHead>Plan Türü</TableHead>
                      <TableHead>Sorumlu</TableHead>
                      <TableHead>Son Güncelleme</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((p, i) => (
                      <TableRow
                        key={p.id}
                        data-ocid={`emergency_plan.item.${i + 1}`}
                      >
                        <TableCell className="font-medium">
                          {p.projectName}
                        </TableCell>
                        <TableCell>{p.planType}</TableCell>
                        <TableCell>{p.responsiblePerson}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.lastUpdated}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColor(p.status)}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePlan(p.id)}
                            data-ocid={`emergency_plan.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drills" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tatbikat Kayıtları</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowDrillDialog(true)}
                data-ocid="emergency_plan.drill_button"
              >
                <Plus className="w-4 h-4 mr-1" /> Tatbikat Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {drills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Henüz tatbikat kaydı yok</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Katılımcı</TableHead>
                      <TableHead>Süre (dk)</TableHead>
                      <TableHead>Sonuç</TableHead>
                      <TableHead>Notlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drills.map((d, i) => (
                      <TableRow
                        key={d.id}
                        data-ocid={`emergency_plan.drill.item.${i + 1}`}
                      >
                        <TableCell>{d.date}</TableCell>
                        <TableCell>{d.type}</TableCell>
                        <TableCell>{d.participants}</TableCell>
                        <TableCell>{d.duration}</TableCell>
                        <TableCell>
                          <Badge className={resultColor(d.result)}>
                            {d.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {d.notes}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assembly" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Toplanma Noktaları</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowAPDialog(true)}
                data-ocid="emergency_plan.ap_button"
              >
                <Plus className="w-4 h-4 mr-1" /> Nokta Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {assemblyPoints.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Henüz toplanma noktası yok</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {assemblyPoints.map((ap, i) => (
                    <Card
                      key={ap.id}
                      className="border-border"
                      data-ocid={`emergency_plan.ap.item.${i + 1}`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-amber-400" />
                              {ap.name}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {ap.locationDesc}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Kapasite: {ap.capacity} kişi
                            </p>
                            {ap.gpsCoords && (
                              <p className="text-xs text-muted-foreground">
                                GPS: {ap.gpsCoords}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updated = assemblyPoints.filter(
                                (a) => a.id !== ap.id,
                              );
                              setAssemblyPoints(updated);
                              localStorage.setItem(
                                apKey,
                                JSON.stringify(updated),
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-lg" data-ocid="emergency_plan.dialog">
          <DialogHeader>
            <DialogTitle>Acil Durum Planı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Proje</Label>
              <Select
                value={planForm.projectId}
                onValueChange={(v) =>
                  setPlanForm((f) => ({ ...f, projectId: v }))
                }
              >
                <SelectTrigger data-ocid="emergency_plan.select">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent>
                  {companyProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan Türü</Label>
              <Select
                value={planForm.planType}
                onValueChange={(v) =>
                  setPlanForm((f) => ({ ...f, planType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sorumlu Kişi</Label>
              <Input
                value={planForm.responsiblePerson}
                onChange={(e) =>
                  setPlanForm((f) => ({
                    ...f,
                    responsiblePerson: e.target.value,
                  }))
                }
                data-ocid="emergency_plan.input"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                rows={2}
                value={planForm.description}
                onChange={(e) =>
                  setPlanForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Tahliye Güzergahları</Label>
              <Textarea
                rows={2}
                value={planForm.evacuationRoutes}
                onChange={(e) =>
                  setPlanForm((f) => ({
                    ...f,
                    evacuationRoutes: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Durum</Label>
              <Select
                value={planForm.status}
                onValueChange={(v) => setPlanForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPlanDialog(false)}
              data-ocid="emergency_plan.cancel_button"
            >
              İptal
            </Button>
            <Button
              onClick={handleSavePlan}
              data-ocid="emergency_plan.submit_button"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drill Dialog */}
      <Dialog open={showDrillDialog} onOpenChange={setShowDrillDialog}>
        <DialogContent data-ocid="emergency_plan.drill_dialog">
          <DialogHeader>
            <DialogTitle>Tatbikat Kaydı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={drillForm.date}
                  onChange={(e) =>
                    setDrillForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Tür</Label>
                <Select
                  value={drillForm.type}
                  onValueChange={(v) =>
                    setDrillForm((f) => ({ ...f, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Katılımcı Sayısı</Label>
                <Input
                  type="number"
                  value={drillForm.participants}
                  onChange={(e) =>
                    setDrillForm((f) => ({
                      ...f,
                      participants: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Süre (dk)</Label>
                <Input
                  type="number"
                  value={drillForm.duration}
                  onChange={(e) =>
                    setDrillForm((f) => ({
                      ...f,
                      duration: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Sonuç</Label>
              <Select
                value={drillForm.result}
                onValueChange={(v) =>
                  setDrillForm((f) => ({ ...f, result: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRILL_RESULTS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                rows={2}
                value={drillForm.notes}
                onChange={(e) =>
                  setDrillForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDrillDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveDrill}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assembly Point Dialog */}
      <Dialog open={showAPDialog} onOpenChange={setShowAPDialog}>
        <DialogContent data-ocid="emergency_plan.ap_dialog">
          <DialogHeader>
            <DialogTitle>Toplanma Noktası Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ad</Label>
              <Input
                value={apForm.name}
                onChange={(e) =>
                  setApForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Konum Açıklaması</Label>
              <Textarea
                rows={2}
                value={apForm.locationDesc}
                onChange={(e) =>
                  setApForm((f) => ({ ...f, locationDesc: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kapasite (kişi)</Label>
                <Input
                  type="number"
                  value={apForm.capacity}
                  onChange={(e) =>
                    setApForm((f) => ({
                      ...f,
                      capacity: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label>GPS Koordinatları</Label>
                <Input
                  placeholder="41.0082, 28.9784"
                  value={apForm.gpsCoords}
                  onChange={(e) =>
                    setApForm((f) => ({ ...f, gpsCoords: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAPDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveAP}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
