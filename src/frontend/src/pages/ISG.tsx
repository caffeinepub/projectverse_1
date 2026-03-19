import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  HardHat,
  Plus,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  type IsgIncident,
  type KkdRecord,
  type ToolboxTalk,
  useApp,
} from "../contexts/AppContext";

const SEVERITY_COLORS: Record<string, string> = {
  Düşük: "bg-green-500/20 text-green-400 border-green-500/30",
  Orta: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Yüksek: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Kritik: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  Açık: "bg-red-500/20 text-red-400 border-red-500/30",
  Soruşturuluyor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Kapatıldı: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function ISG() {
  const {
    isgIncidents,
    setIsgIncidents,
    isgKkd,
    setIsgKkd,
    isgToolboxTalks,
    setIsgToolboxTalks,
    hrPersonnel,
    projects,
    activeRoleId,
    checkPermission,
  } = useApp();

  const canEdit =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    checkPermission("qualitySafety", "edit");

  const [searchQuery, setSearchQuery] = useState("");

  // ─── Incident Dialog ───────────────────────────────────────────────────────
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [newIncident, setNewIncident] = useState({
    type: "Ramak Kala" as IsgIncident["type"],
    date: new Date().toISOString().split("T")[0],
    location: "",
    description: "",
    injuredPerson: "",
    severity: "Düşük" as IsgIncident["severity"],
    assignedTo: "",
  });

  const handleAddIncident = () => {
    if (!newIncident.location || !newIncident.description) return;
    const item: IsgIncident = {
      id: `isg${Date.now()}`,
      companyId: "",
      ...newIncident,
      status: "Açık",
    };
    setIsgIncidents([item, ...isgIncidents]);
    setIncidentOpen(false);
    setNewIncident({
      type: "Ramak Kala",
      date: new Date().toISOString().split("T")[0],
      location: "",
      description: "",
      injuredPerson: "",
      severity: "Düşük",
      assignedTo: "",
    });
  };

  const updateIncidentStatus = (id: string, status: IsgIncident["status"]) => {
    setIsgIncidents(
      isgIncidents.map((i) => (i.id === id ? { ...i, status } : i)),
    );
  };

  // ─── KKD Dialog ───────────────────────────────────────────────────────────
  const [kkdOpen, setKkdOpen] = useState(false);
  const [newKkd, setNewKkd] = useState({
    personnelId: "",
    personnelName: "",
    item: "Baret",
    size: "",
    issuedDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  });

  const handleAddKkd = () => {
    if (!newKkd.personnelId) return;
    const record: KkdRecord = {
      id: `kkd${Date.now()}`,
      companyId: "",
      ...newKkd,
      status: "Aktif",
    };
    setIsgKkd([record, ...isgKkd]);
    setKkdOpen(false);
    setNewKkd({
      personnelId: "",
      personnelName: "",
      item: "Baret",
      size: "",
      issuedDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
    });
  };

  // ─── Toolbox Talk Dialog ──────────────────────────────────────────────────
  const [tbtOpen, setTbtOpen] = useState(false);
  const [newTbt, setNewTbt] = useState({
    date: new Date().toISOString().split("T")[0],
    topic: "",
    trainer: "",
    projectId: "",
    notes: "",
    attendeesInput: "",
  });

  const handleAddTbt = () => {
    if (!newTbt.topic || !newTbt.trainer) return;
    const talk: ToolboxTalk = {
      id: `tbt${Date.now()}`,
      companyId: "",
      date: newTbt.date,
      topic: newTbt.topic,
      trainer: newTbt.trainer,
      projectId: newTbt.projectId,
      notes: newTbt.notes,
      attendees: newTbt.attendeesInput
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    };
    setIsgToolboxTalks([talk, ...isgToolboxTalks]);
    setTbtOpen(false);
    setNewTbt({
      date: new Date().toISOString().split("T")[0],
      topic: "",
      trainer: "",
      projectId: "",
      notes: "",
      attendeesInput: "",
    });
  };

  // ─── KPI ──────────────────────────────────────────────────────────────────
  const thisMonth = new Date().toISOString().slice(0, 7);
  const kpiTotal = isgIncidents.length;
  const kpiOpen = isgIncidents.filter((i) => i.status === "Açık").length;
  const kpiThisMonthAccident = isgIncidents.filter(
    (i) => i.type === "Kaza" && i.date.startsWith(thisMonth),
  ).length;
  const kpiRamakKala = isgIncidents.filter(
    (i) => i.type === "Ramak Kala",
  ).length;

  // KKD expiry
  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const filteredIncidents = useMemo(() => {
    if (!searchQuery) return isgIncidents;
    const q = searchQuery.toLowerCase();
    return isgIncidents.filter(
      (i) =>
        i.location.toLowerCase().includes(q) ||
        i.injuredPerson.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
    );
  }, [isgIncidents, searchQuery]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-7 w-7 text-amber-400" />
            İş Sağlığı ve Güvenliği
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Olay bildirimleri, KKD takibi ve toolbox talk kayıtları
          </p>
        </div>
      </div>

      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            data-ocid="isg.incidents.tab"
            value="incidents"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Olaylar
          </TabsTrigger>
          <TabsTrigger
            data-ocid="isg.kkd.tab"
            value="kkd"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <HardHat className="h-4 w-4 mr-2" />
            KKD Takibi
          </TabsTrigger>
          <TabsTrigger
            data-ocid="isg.toolbox.tab"
            value="toolbox"
            className="data-[state=active]:gradient-bg data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Toolbox Talk
          </TabsTrigger>
        </TabsList>

        {/* ── INCIDENTS TAB ───────────────────────────────────────────────── */}
        <TabsContent value="incidents" className="space-y-5 mt-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">
                  Toplam Olay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{kpiTotal}</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-red-400">
                  Açık Olaylar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-400">{kpiOpen}</p>
              </CardContent>
            </Card>
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-orange-400">
                  Bu Ay Kaza
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-400">
                  {kpiThisMonthAccident}
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-amber-400">
                  Ramak Kala
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">
                  {kpiRamakKala}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-ocid="isg.search_input"
                placeholder="Olay ara..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {canEdit && (
              <Dialog open={incidentOpen} onOpenChange={setIncidentOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="isg.incident.open_modal_button"
                    className="gradient-bg text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Olay Bildir
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="isg.incident.dialog"
                  className="max-w-lg"
                >
                  <DialogHeader>
                    <DialogTitle>Olay Bildir</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Olay Türü</Label>
                        <Select
                          value={newIncident.type}
                          onValueChange={(v) =>
                            setNewIncident({
                              ...newIncident,
                              type: v as IsgIncident["type"],
                            })
                          }
                        >
                          <SelectTrigger data-ocid="isg.incident.type.select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Kaza">Kaza</SelectItem>
                            <SelectItem value="Ramak Kala">
                              Ramak Kala
                            </SelectItem>
                            <SelectItem value="Hastalık">Hastalık</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Tarih</Label>
                        <Input
                          data-ocid="isg.incident.date.input"
                          type="date"
                          value={newIncident.date}
                          onChange={(e) =>
                            setNewIncident({
                              ...newIncident,
                              date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Konum / Yer</Label>
                      <Input
                        data-ocid="isg.incident.location.input"
                        placeholder="Şantiye, bina, kat..."
                        value={newIncident.location}
                        onChange={(e) =>
                          setNewIncident({
                            ...newIncident,
                            location: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Etkilenen Kişi</Label>
                      <Input
                        data-ocid="isg.incident.person.input"
                        placeholder="Ad Soyad"
                        value={newIncident.injuredPerson}
                        onChange={(e) =>
                          setNewIncident({
                            ...newIncident,
                            injuredPerson: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Şiddet</Label>
                        <Select
                          value={newIncident.severity}
                          onValueChange={(v) =>
                            setNewIncident({
                              ...newIncident,
                              severity: v as IsgIncident["severity"],
                            })
                          }
                        >
                          <SelectTrigger data-ocid="isg.incident.severity.select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Düşük">Düşük</SelectItem>
                            <SelectItem value="Orta">Orta</SelectItem>
                            <SelectItem value="Yüksek">Yüksek</SelectItem>
                            <SelectItem value="Kritik">Kritik</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Atanan Kişi</Label>
                        <Input
                          data-ocid="isg.incident.assignee.input"
                          placeholder="Sorumlu"
                          value={newIncident.assignedTo}
                          onChange={(e) =>
                            setNewIncident({
                              ...newIncident,
                              assignedTo: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Açıklama</Label>
                      <Textarea
                        data-ocid="isg.incident.description.textarea"
                        placeholder="Olayı detaylıca açıklayın..."
                        value={newIncident.description}
                        onChange={(e) =>
                          setNewIncident({
                            ...newIncident,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="isg.incident.cancel_button"
                      variant="outline"
                      onClick={() => setIncidentOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="isg.incident.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddIncident}
                    >
                      Bildir
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Incidents Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Tür
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Tarih
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Yer
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Kişi
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Şiddet
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Durum
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                    Aksiyon
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div
                        data-ocid="isg.incidents.empty_state"
                        className="flex flex-col items-center gap-3 text-muted-foreground"
                      >
                        <Shield className="h-10 w-10 opacity-30" />
                        <p>Henüz olay kaydı yok</p>
                        <p className="text-xs">
                          Güvenli çalışma ortamı korunuyor ✓
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident, idx) => (
                    <tr
                      key={incident.id}
                      data-ocid={`isg.incidents.item.${idx + 1}`}
                      className="border-t border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {incident.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {incident.date}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {incident.location}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {incident.injuredPerson || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${SEVERITY_COLORS[incident.severity]}`}
                        >
                          {incident.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_COLORS[incident.status]}`}
                        >
                          {incident.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {incident.status === "Açık" && canEdit && (
                            <Button
                              data-ocid={`isg.incident.investigate.${idx + 1}`}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() =>
                                updateIncidentStatus(
                                  incident.id,
                                  "Soruşturuluyor",
                                )
                              }
                            >
                              Soruştur
                            </Button>
                          )}
                          {incident.status !== "Kapatıldı" && canEdit && (
                            <Button
                              data-ocid={`isg.incident.close.${idx + 1}`}
                              variant="outline"
                              size="sm"
                              className="text-xs text-green-400 border-green-500/30"
                              onClick={() =>
                                updateIncidentStatus(incident.id, "Kapatıldı")
                              }
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Kapat
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── KKD TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="kkd" className="space-y-5 mt-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold">KKD Dağıtım Takibi</h2>
            {canEdit && (
              <Dialog open={kkdOpen} onOpenChange={setKkdOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="isg.kkd.open_modal_button"
                    className="gradient-bg text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    KKD Dağıt
                  </Button>
                </DialogTrigger>
                <DialogContent data-ocid="isg.kkd.dialog" className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>KKD Dağıtım Kaydı</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Personel</Label>
                      <Select
                        value={newKkd.personnelId}
                        onValueChange={(v) => {
                          const p = hrPersonnel.find((p) => p.id === v);
                          setNewKkd({
                            ...newKkd,
                            personnelId: v,
                            personnelName: p?.name || "",
                          });
                        }}
                      >
                        <SelectTrigger data-ocid="isg.kkd.personnel.select">
                          <SelectValue placeholder="Personel seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {hrPersonnel.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Ekipman Türü</Label>
                        <Select
                          value={newKkd.item}
                          onValueChange={(v) =>
                            setNewKkd({ ...newKkd, item: v })
                          }
                        >
                          <SelectTrigger data-ocid="isg.kkd.item.select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Baret",
                              "Yelek",
                              "Eldiven",
                              "Gözlük",
                              "Ayakkabı",
                              "Maske",
                              "Emniyet Kemeri",
                              "Kulaklık",
                            ].map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Beden/Numara</Label>
                        <Input
                          data-ocid="isg.kkd.size.input"
                          placeholder="M, L, 42..."
                          value={newKkd.size}
                          onChange={(e) =>
                            setNewKkd({ ...newKkd, size: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Dağıtım Tarihi</Label>
                        <Input
                          data-ocid="isg.kkd.issued.input"
                          type="date"
                          value={newKkd.issuedDate}
                          onChange={(e) =>
                            setNewKkd({ ...newKkd, issuedDate: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Son Kullanım</Label>
                        <Input
                          data-ocid="isg.kkd.expiry.input"
                          type="date"
                          value={newKkd.expiryDate}
                          onChange={(e) =>
                            setNewKkd({ ...newKkd, expiryDate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="isg.kkd.cancel_button"
                      variant="outline"
                      onClick={() => setKkdOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="isg.kkd.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddKkd}
                    >
                      Kaydet
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Personel
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Ekipman
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Beden
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Dağıtım
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Son Kullanım
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody>
                {isgKkd.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <div
                        data-ocid="isg.kkd.empty_state"
                        className="flex flex-col items-center gap-3 text-muted-foreground"
                      >
                        <HardHat className="h-10 w-10 opacity-30" />
                        <p>Henüz KKD dağıtım kaydı yok</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  isgKkd.map((record, idx) => {
                    const expiry = record.expiryDate
                      ? new Date(record.expiryDate)
                      : null;
                    const isExpired = expiry && expiry < today;
                    const isSoon = expiry && !isExpired && expiry < in30Days;
                    return (
                      <tr
                        key={record.id}
                        data-ocid={`isg.kkd.item.${idx + 1}`}
                        className="border-t border-border hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {record.personnelName}
                        </td>
                        <td className="px-4 py-3">{record.item}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {record.size || "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {record.issuedDate}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`${
                              isExpired
                                ? "text-red-400"
                                : isSoon
                                  ? "text-amber-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {record.expiryDate || "-"}
                            {isExpired && " ⚠ Süresi Geçmiş"}
                            {isSoon && " ⚠ Yaklaşıyor"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {record.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── TOOLBOX TALK TAB ─────────────────────────────────────────────── */}
        <TabsContent value="toolbox" className="space-y-5 mt-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold">Toolbox Talk Kayıtları</h2>
            {canEdit && (
              <Dialog open={tbtOpen} onOpenChange={setTbtOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="isg.toolbox.open_modal_button"
                    className="gradient-bg text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Toolbox Talk
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="isg.toolbox.dialog"
                  className="max-w-lg"
                >
                  <DialogHeader>
                    <DialogTitle>Toolbox Talk Kaydı</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Tarih</Label>
                        <Input
                          data-ocid="isg.toolbox.date.input"
                          type="date"
                          value={newTbt.date}
                          onChange={(e) =>
                            setNewTbt({ ...newTbt, date: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Proje</Label>
                        <Select
                          value={newTbt.projectId}
                          onValueChange={(v) =>
                            setNewTbt({ ...newTbt, projectId: v })
                          }
                        >
                          <SelectTrigger data-ocid="isg.toolbox.project.select">
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
                    </div>
                    <div className="space-y-1">
                      <Label>Konu</Label>
                      <Input
                        data-ocid="isg.toolbox.topic.input"
                        placeholder="Toolbox talk konusu"
                        value={newTbt.topic}
                        onChange={(e) =>
                          setNewTbt({ ...newTbt, topic: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Eğitmen</Label>
                      <Input
                        data-ocid="isg.toolbox.trainer.input"
                        placeholder="Eğitmen adı"
                        value={newTbt.trainer}
                        onChange={(e) =>
                          setNewTbt({ ...newTbt, trainer: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Katılımcılar (virgülle ayırın)</Label>
                      <Textarea
                        data-ocid="isg.toolbox.attendees.textarea"
                        placeholder="Ali Yılmaz, Mehmet Demir..."
                        value={newTbt.attendeesInput}
                        onChange={(e) =>
                          setNewTbt({
                            ...newTbt,
                            attendeesInput: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Notlar</Label>
                      <Textarea
                        data-ocid="isg.toolbox.notes.textarea"
                        placeholder="Toplantı notları..."
                        value={newTbt.notes}
                        onChange={(e) =>
                          setNewTbt({ ...newTbt, notes: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="isg.toolbox.cancel_button"
                      variant="outline"
                      onClick={() => setTbtOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="isg.toolbox.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddTbt}
                    >
                      Kaydet
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Tarih
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Konu
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Eğitmen
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Katılımcı
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                    Proje
                  </th>
                </tr>
              </thead>
              <tbody>
                {isgToolboxTalks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <div
                        data-ocid="isg.toolbox.empty_state"
                        className="flex flex-col items-center gap-3 text-muted-foreground"
                      >
                        <Users className="h-10 w-10 opacity-30" />
                        <p>Henüz toolbox talk kaydı yok</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  isgToolboxTalks.map((talk, idx) => (
                    <tr
                      key={talk.id}
                      data-ocid={`isg.toolbox.item.${idx + 1}`}
                      className="border-t border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {talk.date}
                      </td>
                      <td className="px-4 py-3 font-medium">{talk.topic}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {talk.trainer}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {talk.attendees.length} kişi
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {projects.find((p) => p.id === talk.projectId)?.title ||
                          "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
