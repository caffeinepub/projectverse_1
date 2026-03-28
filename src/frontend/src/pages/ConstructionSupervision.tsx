import {
  AlertTriangle,
  Building2,
  Calendar,
  ClipboardCheck,
  FileText,
  Plus,
  User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { useApp } from "../contexts/AppContext";

interface SupervisionFirm {
  id: string;
  name: string;
  licenseNo: string;
  contactPerson: string;
  phone: string;
  email: string;
  projectId: string;
  projectName: string;
  startDate: string;
  status: "active" | "passive";
}

interface SupervisionVisit {
  id: string;
  firmId: string;
  firmName: string;
  date: string;
  inspector: string;
  type: "routine" | "special" | "final";
  result: "approved" | "rejected" | "conditional";
  notes: string;
  nonConformities: string;
}

interface NonConformity {
  id: string;
  firmId: string;
  firmName: string;
  date: string;
  description: string;
  severity: "minor" | "major" | "critical";
  status: "open" | "in_progress" | "closed";
  dueDate: string;
  closedDate?: string;
  response: string;
}

export default function ConstructionSupervision() {
  const { activeCompanyId: companyId } = useApp();
  const storageKey = `constructionSupervision_${companyId}`;

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  };
  const save = (data: any) =>
    localStorage.setItem(storageKey, JSON.stringify(data));

  const stored = load();
  const [firms, setFirms] = useState<SupervisionFirm[]>(stored.firms || []);
  const [visits, setVisits] = useState<SupervisionVisit[]>(stored.visits || []);
  const [nonConformities, setNonConformities] = useState<NonConformity[]>(
    stored.nonConformities || [],
  );

  const [showFirmDialog, setShowFirmDialog] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showNCDialog, setShowNCDialog] = useState(false);

  const projects = JSON.parse(
    localStorage.getItem(`projects_${companyId}`) || "[]",
  );

  const [firmForm, setFirmForm] = useState({
    name: "",
    licenseNo: "",
    contactPerson: "",
    phone: "",
    email: "",
    projectId: "",
    startDate: "",
    status: "active" as const,
  });
  const [visitForm, setVisitForm] = useState({
    firmId: "",
    date: "",
    inspector: "",
    type: "routine" as const,
    result: "approved" as const,
    notes: "",
    nonConformities: "",
  });
  const [ncForm, setNcForm] = useState({
    firmId: "",
    date: "",
    description: "",
    severity: "minor" as const,
    dueDate: "",
    response: "",
  });

  const persist = (
    f: SupervisionFirm[],
    v: SupervisionVisit[],
    n: NonConformity[],
  ) => {
    save({ firms: f, visits: v, nonConformities: n });
  };

  const addFirm = () => {
    if (!firmForm.name) return;
    const project = projects.find((p: any) => p.id === firmForm.projectId);
    const newFirm: SupervisionFirm = {
      ...firmForm,
      id: Date.now().toString(),
      projectName: project?.name || "-",
    };
    const updated = [...firms, newFirm];
    setFirms(updated);
    persist(updated, visits, nonConformities);
    setShowFirmDialog(false);
    setFirmForm({
      name: "",
      licenseNo: "",
      contactPerson: "",
      phone: "",
      email: "",
      projectId: "",
      startDate: "",
      status: "active",
    });
  };

  const addVisit = () => {
    if (!visitForm.firmId || !visitForm.date) return;
    const firm = firms.find((f) => f.id === visitForm.firmId);
    const newVisit: SupervisionVisit = {
      ...visitForm,
      id: Date.now().toString(),
      firmName: firm?.name || "",
    };
    const updated = [...visits, newVisit];
    setVisits(updated);
    persist(firms, updated, nonConformities);
    setShowVisitDialog(false);
    setVisitForm({
      firmId: "",
      date: "",
      inspector: "",
      type: "routine",
      result: "approved",
      notes: "",
      nonConformities: "",
    });
  };

  const addNC = () => {
    if (!ncForm.firmId || !ncForm.description) return;
    const firm = firms.find((f) => f.id === ncForm.firmId);
    const newNC: NonConformity = {
      ...ncForm,
      id: Date.now().toString(),
      firmName: firm?.name || "",
      status: "open",
    };
    const updated = [...nonConformities, newNC];
    setNonConformities(updated);
    persist(firms, visits, updated);
    setShowNCDialog(false);
    setNcForm({
      firmId: "",
      date: "",
      description: "",
      severity: "minor",
      dueDate: "",
      response: "",
    });
  };

  const updateNCStatus = (id: string, status: NonConformity["status"]) => {
    const updated = nonConformities.map((nc) =>
      nc.id === id
        ? {
            ...nc,
            status,
            ...(status === "closed"
              ? { closedDate: new Date().toISOString().split("T")[0] }
              : {}),
          }
        : nc,
    );
    setNonConformities(updated);
    persist(firms, visits, updated);
  };

  const resultBadge = (result: string) => {
    if (result === "approved")
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          Onaylandı
        </Badge>
      );
    if (result === "rejected")
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          Reddedildi
        </Badge>
      );
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        Koşullu Onay
      </Badge>
    );
  };

  const severityBadge = (s: string) => {
    if (s === "critical")
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          Kritik
        </Badge>
      );
    if (s === "major")
      return (
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
          Büyük
        </Badge>
      );
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        Küçük
      </Badge>
    );
  };

  const ncStatusBadge = (s: string) => {
    if (s === "closed")
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          Kapatıldı
        </Badge>
      );
    if (s === "in_progress")
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          İşlemde
        </Badge>
      );
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        Açık
      </Badge>
    );
  };

  const openNCs = nonConformities.filter((n) => n.status !== "closed").length;
  const criticalNCs = nonConformities.filter(
    (n) => n.severity === "critical" && n.status !== "closed",
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-400" />
            Yapı Denetim Takibi
          </h1>
          <p className="text-gray-400 mt-1">
            Yapı denetim firmaları, ziyaretler ve uygunsuzluk bildirimleri
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-400">
              {firms.filter((f) => f.status === "active").length}
            </div>
            <div className="text-sm text-gray-400">Aktif Denetim Firması</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">
              {visits.length}
            </div>
            <div className="text-sm text-gray-400">Toplam Ziyaret</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-400">{openNCs}</div>
            <div className="text-sm text-gray-400">Açık Uygunsuzluk</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">{criticalNCs}</div>
            <div className="text-sm text-gray-400">Kritik Uygunsuzluk</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="firms">
        <TabsList className="bg-gray-800/50">
          <TabsTrigger value="firms">Denetim Firmaları</TabsTrigger>
          <TabsTrigger value="visits">Denetim Ziyaretleri</TabsTrigger>
          <TabsTrigger value="nonconformities">Uygunsuzluklar</TabsTrigger>
        </TabsList>

        {/* Firms Tab */}
        <TabsContent value="firms">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">
                Yapı Denetim Firmaları
              </CardTitle>
              <Button
                onClick={() => setShowFirmDialog(true)}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                <Plus className="w-4 h-4 mr-1" /> Firma Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {firms.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Henüz yapı denetim firması eklenmemiş</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {firms.map((firm) => (
                    <div
                      key={firm.id}
                      className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {firm.name}
                            </span>
                            <Badge
                              className={
                                firm.status === "active"
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                              }
                            >
                              {firm.status === "active" ? "Aktif" : "Pasif"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Lisans: {firm.licenseNo} | Proje: {firm.projectName}
                          </div>
                          <div className="text-sm text-gray-400">
                            {firm.contactPerson} | {firm.phone} | {firm.email}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Başlangıç: {firm.startDate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visits Tab */}
        <TabsContent value="visits">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Denetim Ziyaretleri</CardTitle>
              <Button
                onClick={() => setShowVisitDialog(true)}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black"
                disabled={firms.length === 0}
              >
                <Plus className="w-4 h-4 mr-1" /> Ziyaret Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Henüz denetim ziyareti kaydedilmemiş</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visits
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((visit) => (
                      <div
                        key={visit.id}
                        className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">
                                {visit.firmName}
                              </span>
                              {resultBadge(visit.result)}
                              <Badge
                                variant="outline"
                                className="border-gray-600 text-gray-300 text-xs"
                              >
                                {visit.type === "routine"
                                  ? "Rutin"
                                  : visit.type === "special"
                                    ? "Özel"
                                    : "Final"}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                              <Calendar className="w-3 h-3" /> {visit.date}
                              <User className="w-3 h-3 ml-2" />{" "}
                              {visit.inspector}
                            </div>
                            {visit.notes && (
                              <div className="text-sm text-gray-300">
                                {visit.notes}
                              </div>
                            )}
                            {visit.nonConformities && (
                              <div className="text-sm text-orange-400">
                                Uygunsuzluk: {visit.nonConformities}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Non-conformities Tab */}
        <TabsContent value="nonconformities">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">
                Uygunsuzluk Bildirimleri
              </CardTitle>
              <Button
                onClick={() => setShowNCDialog(true)}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black"
                disabled={firms.length === 0}
              >
                <Plus className="w-4 h-4 mr-1" /> Uygunsuzluk Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {nonConformities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Henüz uygunsuzluk bildirimi yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nonConformities
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((nc) => (
                      <div
                        key={nc.id}
                        className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white">
                                {nc.firmName}
                              </span>
                              {severityBadge(nc.severity)}
                              {ncStatusBadge(nc.status)}
                            </div>
                            <div className="text-sm text-gray-300">
                              {nc.description}
                            </div>
                            <div className="text-xs text-gray-500">
                              Tarih: {nc.date} | Termin: {nc.dueDate}
                            </div>
                            {nc.response && (
                              <div className="text-sm text-blue-300">
                                Yanıt: {nc.response}
                              </div>
                            )}
                          </div>
                          {nc.status !== "closed" && (
                            <div className="flex gap-2 ml-4">
                              {nc.status === "open" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs"
                                  onClick={() =>
                                    updateNCStatus(nc.id, "in_progress")
                                  }
                                >
                                  İşleme Al
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs"
                                onClick={() => updateNCStatus(nc.id, "closed")}
                              >
                                Kapat
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Firm Dialog */}
      <Dialog open={showFirmDialog} onOpenChange={setShowFirmDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Yapı Denetim Firması Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Firma Adı *"
              value={firmForm.name}
              onChange={(e) =>
                setFirmForm({ ...firmForm, name: e.target.value })
              }
              className="bg-gray-800 border-gray-600"
            />
            <Input
              placeholder="Lisans/Yetki Belge No"
              value={firmForm.licenseNo}
              onChange={(e) =>
                setFirmForm({ ...firmForm, licenseNo: e.target.value })
              }
              className="bg-gray-800 border-gray-600"
            />
            <Input
              placeholder="İlgili Kişi"
              value={firmForm.contactPerson}
              onChange={(e) =>
                setFirmForm({ ...firmForm, contactPerson: e.target.value })
              }
              className="bg-gray-800 border-gray-600"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Telefon"
                value={firmForm.phone}
                onChange={(e) =>
                  setFirmForm({ ...firmForm, phone: e.target.value })
                }
                className="bg-gray-800 border-gray-600"
              />
              <Input
                placeholder="E-posta"
                value={firmForm.email}
                onChange={(e) =>
                  setFirmForm({ ...firmForm, email: e.target.value })
                }
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <Select
              value={firmForm.projectId}
              onValueChange={(v) => setFirmForm({ ...firmForm, projectId: v })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Proje Seç" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Başlangıç Tarihi"
              value={firmForm.startDate}
              onChange={(e) =>
                setFirmForm({ ...firmForm, startDate: e.target.value })
              }
              className="bg-gray-800 border-gray-600"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFirmDialog(false)}
              className="border-gray-600"
            >
              İptal
            </Button>
            <Button
              onClick={addFirm}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Dialog */}
      <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Denetim Ziyareti Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={visitForm.firmId}
              onValueChange={(v) => setVisitForm({ ...visitForm, firmId: v })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Denetim Firması *" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {firms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={visitForm.date}
              onChange={(e) =>
                setVisitForm({ ...visitForm, date: e.target.value })
              }
              className="bg-gray-800 border-gray-600"
            />
            <Input
              placeholder="Denetçi Adı"
              value={visitForm.inspector}
              onChange={(e) =>
                setVisitForm({ ...visitForm, inspector: e.target.value })
              }
              className="bg-gray-800 border-gray-600"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={visitForm.type}
                onValueChange={(v: any) =>
                  setVisitForm({ ...visitForm, type: v })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Ziyaret Türü" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="routine">Rutin</SelectItem>
                  <SelectItem value="special">Özel</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={visitForm.result}
                onValueChange={(v: any) =>
                  setVisitForm({ ...visitForm, result: v })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Sonuç" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="approved">Onaylandı</SelectItem>
                  <SelectItem value="rejected">Reddedildi</SelectItem>
                  <SelectItem value="conditional">Koşullu Onay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Notlar"
              value={visitForm.notes}
              onChange={(e) =>
                setVisitForm({ ...visitForm, notes: e.target.value })
              }
              className="bg-gray-800 border-gray-600"
              rows={2}
            />
            <Textarea
              placeholder="Tespit Edilen Uygunsuzluklar"
              value={visitForm.nonConformities}
              onChange={(e) =>
                setVisitForm({ ...visitForm, nonConformities: e.target.value })
              }
              className="bg-gray-800 border-gray-600"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVisitDialog(false)}
              className="border-gray-600"
            >
              İptal
            </Button>
            <Button
              onClick={addVisit}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NC Dialog */}
      <Dialog open={showNCDialog} onOpenChange={setShowNCDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Uygunsuzluk Bildirimi Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={ncForm.firmId}
              onValueChange={(v) => setNcForm({ ...ncForm, firmId: v })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Denetim Firması *" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {firms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={ncForm.date}
              onChange={(e) => setNcForm({ ...ncForm, date: e.target.value })}
              className="bg-gray-800 border-gray-600"
            />
            <Textarea
              placeholder="Uygunsuzluk Açıklaması *"
              value={ncForm.description}
              onChange={(e) =>
                setNcForm({ ...ncForm, description: e.target.value })
              }
              className="bg-gray-800 border-gray-600"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={ncForm.severity}
                onValueChange={(v: any) =>
                  setNcForm({ ...ncForm, severity: v })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Şiddet" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="minor">Küçük</SelectItem>
                  <SelectItem value="major">Büyük</SelectItem>
                  <SelectItem value="critical">Kritik</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Termin Tarihi"
                value={ncForm.dueDate}
                onChange={(e) =>
                  setNcForm({ ...ncForm, dueDate: e.target.value })
                }
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <Textarea
              placeholder="Yanıt / Yapılan İşlem"
              value={ncForm.response}
              onChange={(e) =>
                setNcForm({ ...ncForm, response: e.target.value })
              }
              className="bg-gray-800 border-gray-600"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNCDialog(false)}
              className="border-gray-600"
            >
              İptal
            </Button>
            <Button
              onClick={addNC}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
