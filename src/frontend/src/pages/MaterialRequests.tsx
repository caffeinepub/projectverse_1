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
import {
  Check,
  ClipboardList,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import AccessDenied from "../components/AccessDenied";
import { useApp } from "../contexts/AppContext";

const URGENCY_STYLES: Record<string, string> = {
  Normal: "bg-muted text-muted-foreground",
  Acil: "bg-amber-500/20 text-amber-400",
  "Çok Acil": "bg-red-500/20 text-red-400",
};

const MR_STATUS_STYLES: Record<string, string> = {
  Beklemede: "bg-amber-500/20 text-amber-400",
  Onaylandı: "bg-green-500/20 text-green-400",
  Reddedildi: "bg-red-500/20 text-red-400",
  "Satın Almaya Aktarıldı": "bg-blue-500/20 text-blue-400",
};

const RFI_STATUS_STYLES: Record<string, string> = {
  Açık: "bg-amber-500/20 text-amber-400",
  Yanıtlandı: "bg-green-500/20 text-green-400",
  Kapatıldı: "bg-muted text-muted-foreground",
};

export default function MaterialRequests() {
  const {
    materialRequests,
    setMaterialRequests,
    rfis,
    setRfis,
    projects,
    hrPersonnel,
    currentCompany,
    checkPermission,
    user,
    addAuditLog,
  } = useApp();

  const canView = checkPermission("materialRequests", "view");
  const canEdit = checkPermission("materialRequests", "edit");

  const [mrOpen, setMrOpen] = useState(false);
  const [rfiOpen, setRfiOpen] = useState(false);
  const [responseRfiId, setResponseRfiId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const [newMR, setNewMR] = useState({
    projectId: "",
    requestedBy: "",
    urgency: "Normal" as const,
    notes: "",
    items: [{ id: "item-0", materialName: "", quantity: "", unit: "Adet" }] as {
      id: string;
      materialName: string;
      quantity: string;
      unit: string;
    }[],
  });

  const [newRFI, setNewRFI] = useState({
    projectId: "",
    subject: "",
    question: "",
    askedBy: "",
    assignedTo: "",
    dueDate: "",
  });

  const companyMRs = materialRequests.filter(
    (r) => r.companyId === currentCompany?.id,
  );
  const companyRFIs = rfis.filter((r) => r.companyId === currentCompany?.id);

  if (!canView) return <AccessDenied />;

  const handleAddMR = () => {
    if (!newMR.projectId || newMR.items.every((i) => !i.materialName)) return;
    const project = projects.find((p) => p.id === newMR.projectId);
    const mr = {
      id: `mr${Date.now()}`,
      companyId: currentCompany?.id || "",
      requestNo: `TR-${Date.now().toString().slice(-5)}`,
      projectId: newMR.projectId,
      projectName: project?.title || "",
      requestedBy: newMR.requestedBy || user?.name || "",
      urgency: newMR.urgency,
      items: newMR.items
        .filter((i) => i.materialName)
        .map((i) => ({
          materialName: i.materialName,
          quantity: Number(i.quantity) || 1,
          unit: i.unit,
        })),
      status: "Beklemede" as const,
      notes: newMR.notes,
      createdAt: new Date().toISOString(),
    };
    setMaterialRequests([mr, ...materialRequests]);
    addAuditLog({
      module: "materialRequests",
      action: "Malzeme Talebi Eklendi",
      description: `${mr.requestNo} - ${project?.title}`,
      performedBy: user?.name || "",
    });
    setNewMR({
      projectId: "",
      requestedBy: "",
      urgency: "Normal",
      notes: "",
      items: [{ id: "item-0", materialName: "", quantity: "", unit: "Adet" }],
    });
    setMrOpen(false);
  };

  const handleAddRFI = () => {
    if (!newRFI.subject || !newRFI.question) return;
    const project = projects.find((p) => p.id === newRFI.projectId);
    const rfi = {
      id: `rfi${Date.now()}`,
      companyId: currentCompany?.id || "",
      rfiNo: `RFI-${Date.now().toString().slice(-5)}`,
      projectId: newRFI.projectId,
      subject: newRFI.subject,
      question: newRFI.question,
      askedBy: newRFI.askedBy || user?.name || "",
      assignedTo: newRFI.assignedTo,
      dueDate: newRFI.dueDate,
      status: "Açık" as const,
      response: "",
      createdAt: new Date().toISOString(),
    };
    void project;
    setRfis([rfi, ...rfis]);
    setNewRFI({
      projectId: "",
      subject: "",
      question: "",
      askedBy: "",
      assignedTo: "",
      dueDate: "",
    });
    setRfiOpen(false);
  };

  const handleMRStatus = (
    id: string,
    status: "Onaylandı" | "Reddedildi" | "Satın Almaya Aktarıldı",
  ) => {
    setMaterialRequests(
      materialRequests.map((r) => (r.id === id ? { ...r, status } : r)),
    );
  };

  const handleRFIResponse = () => {
    if (!responseRfiId || !responseText) return;
    setRfis(
      rfis.map((r) =>
        r.id === responseRfiId
          ? { ...r, response: responseText, status: "Yanıtlandı" as const }
          : r,
      ),
    );
    setResponseRfiId(null);
    setResponseText("");
  };

  const addMRItem = () =>
    setNewMR({
      ...newMR,
      items: [
        ...newMR.items,
        {
          id: `item-${Date.now()}`,
          materialName: "",
          quantity: "",
          unit: "Adet",
        },
      ],
    });
  const removeMRItem = (idx: number) =>
    setNewMR({ ...newMR, items: newMR.items.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">
          Malzeme Talep & RFI
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Malzeme talepleri ve bilgi talepleri
        </p>
      </div>

      <Tabs defaultValue="materialRequests">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="materialRequests" data-ocid="mr.material.tab">
            Malzeme Talepleri
          </TabsTrigger>
          <TabsTrigger value="rfi" data-ocid="mr.rfi.tab">
            RFI Takibi
          </TabsTrigger>
        </TabsList>

        {/* Material Requests Tab */}
        <TabsContent value="materialRequests" className="mt-4 space-y-4">
          {canEdit && (
            <div className="flex justify-end">
              <Dialog open={mrOpen} onOpenChange={setMrOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="mr.add.primary_button"
                    className="gradient-bg text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Talep
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="mr.add.dialog"
                  className="bg-card border-border max-w-lg"
                >
                  <DialogHeader>
                    <DialogTitle>Yeni Malzeme Talebi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Proje *</Label>
                        <Select
                          value={newMR.projectId}
                          onValueChange={(v) =>
                            setNewMR({ ...newMR, projectId: v })
                          }
                        >
                          <SelectTrigger
                            data-ocid="mr.project.select"
                            className="bg-background border-border mt-1"
                          >
                            <SelectValue placeholder="Seçin..." />
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
                        <Label>Aciliyet</Label>
                        <Select
                          value={newMR.urgency}
                          onValueChange={(v) =>
                            setNewMR({ ...newMR, urgency: v as any })
                          }
                        >
                          <SelectTrigger
                            data-ocid="mr.urgency.select"
                            className="bg-background border-border mt-1"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {["Normal", "Acil", "Çok Acil"].map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Talep Eden</Label>
                      <Input
                        data-ocid="mr.requester.input"
                        value={newMR.requestedBy}
                        onChange={(e) =>
                          setNewMR({ ...newMR, requestedBy: e.target.value })
                        }
                        className="bg-background border-border mt-1"
                        placeholder="Ad Soyad"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Malzeme Listesi *</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={addMRItem}
                          className="h-6 text-xs text-amber-400"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Satır Ekle
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {newMR.items.map((item, idx) => (
                          <div key={item.id} className="flex gap-2">
                            <Input
                              data-ocid={`mr.material_name.input.${idx + 1}`}
                              value={item.materialName}
                              onChange={(e) => {
                                const items = [...newMR.items];
                                items[idx].materialName = e.target.value;
                                setNewMR({ ...newMR, items });
                              }}
                              placeholder="Malzeme adı"
                              className="bg-background border-border flex-1"
                            />
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const items = [...newMR.items];
                                items[idx].quantity = e.target.value;
                                setNewMR({ ...newMR, items });
                              }}
                              placeholder="Miktar"
                              className="bg-background border-border w-20"
                            />
                            <Input
                              value={item.unit}
                              onChange={(e) => {
                                const items = [...newMR.items];
                                items[idx].unit = e.target.value;
                                setNewMR({ ...newMR, items });
                              }}
                              placeholder="Birim"
                              className="bg-background border-border w-20"
                            />
                            {newMR.items.length > 1 && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-red-400"
                                onClick={() => removeMRItem(idx)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Notlar</Label>
                      <Textarea
                        data-ocid="mr.notes.textarea"
                        value={newMR.notes}
                        onChange={(e) =>
                          setNewMR({ ...newMR, notes: e.target.value })
                        }
                        className="bg-background border-border mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="ghost" onClick={() => setMrOpen(false)}>
                      İptal
                    </Button>
                    <Button
                      data-ocid="mr.add.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddMR}
                    >
                      Talep Oluştur
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {companyMRs.length === 0 ? (
            <Card data-ocid="mr.empty_state" className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <ClipboardList className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Henüz malzeme talebi oluşturulmadı
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Talep No
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Proje
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Talep Eden
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Malzemeler
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Aciliyet
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Durum
                      </TableHead>
                      {canEdit && (
                        <TableHead className="text-muted-foreground">
                          İşlem
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyMRs.map((mr, idx) => (
                      <TableRow
                        key={mr.id}
                        data-ocid={`mr.item.${idx + 1}`}
                        className="border-border"
                      >
                        <TableCell className="font-medium text-foreground">
                          {mr.requestNo}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {mr.projectName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {mr.requestedBy}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {mr.items
                            .map(
                              (i) =>
                                `${i.materialName} (${i.quantity} ${i.unit})`,
                            )
                            .join(", ")}
                        </TableCell>
                        <TableCell>
                          <Badge className={URGENCY_STYLES[mr.urgency]}>
                            {mr.urgency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={MR_STATUS_STYLES[mr.status]}>
                            {mr.status}
                          </Badge>
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            {mr.status === "Beklemede" && (
                              <div className="flex gap-1">
                                <Button
                                  data-ocid={`mr.approve.button.${idx + 1}`}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-green-400"
                                  onClick={() =>
                                    handleMRStatus(mr.id, "Onaylandı")
                                  }
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Onayla
                                </Button>
                                <Button
                                  data-ocid={`mr.transfer.button.${idx + 1}`}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-blue-400"
                                  onClick={() =>
                                    handleMRStatus(
                                      mr.id,
                                      "Satın Almaya Aktarıldı",
                                    )
                                  }
                                >
                                  Satın Almaya
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* RFI Tab */}
        <TabsContent value="rfi" className="mt-4 space-y-4">
          {canEdit && (
            <div className="flex justify-end">
              <Dialog open={rfiOpen} onOpenChange={setRfiOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="mr.rfi.primary_button"
                    className="gradient-bg text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni RFI
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="mr.rfi.dialog"
                  className="bg-card border-border"
                >
                  <DialogHeader>
                    <DialogTitle>Yeni Bilgi Talebi (RFI)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Konu *</Label>
                      <Input
                        data-ocid="mr.rfi.subject.input"
                        value={newRFI.subject}
                        onChange={(e) =>
                          setNewRFI({ ...newRFI, subject: e.target.value })
                        }
                        className="bg-background border-border mt-1"
                        placeholder="RFI konusu"
                      />
                    </div>
                    <div>
                      <Label>Proje</Label>
                      <Select
                        value={newRFI.projectId}
                        onValueChange={(v) =>
                          setNewRFI({ ...newRFI, projectId: v })
                        }
                      >
                        <SelectTrigger
                          data-ocid="mr.rfi.project.select"
                          className="bg-background border-border mt-1"
                        >
                          <SelectValue placeholder="Proje seçin..." />
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Soran</Label>
                        <Input
                          data-ocid="mr.rfi.asked_by.input"
                          value={newRFI.askedBy}
                          onChange={(e) =>
                            setNewRFI({ ...newRFI, askedBy: e.target.value })
                          }
                          className="bg-background border-border mt-1"
                          placeholder="Ad Soyad"
                        />
                      </div>
                      <div>
                        <Label>Atanan</Label>
                        <Select
                          value={newRFI.assignedTo}
                          onValueChange={(v) =>
                            setNewRFI({ ...newRFI, assignedTo: v })
                          }
                        >
                          <SelectTrigger
                            data-ocid="mr.rfi.assigned.select"
                            className="bg-background border-border mt-1"
                          >
                            <SelectValue placeholder="Kişi seçin..." />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {hrPersonnel.map((p) => (
                              <SelectItem key={p.id} value={p.name}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Son Tarih</Label>
                      <Input
                        data-ocid="mr.rfi.due_date.input"
                        type="date"
                        value={newRFI.dueDate}
                        onChange={(e) =>
                          setNewRFI({ ...newRFI, dueDate: e.target.value })
                        }
                        className="bg-background border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label>Soru *</Label>
                      <Textarea
                        data-ocid="mr.rfi.question.textarea"
                        value={newRFI.question}
                        onChange={(e) =>
                          setNewRFI({ ...newRFI, question: e.target.value })
                        }
                        className="bg-background border-border mt-1"
                        rows={3}
                        placeholder="Sorunuzu yazın..."
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="ghost" onClick={() => setRfiOpen(false)}>
                      İptal
                    </Button>
                    <Button
                      data-ocid="mr.rfi.submit_button"
                      className="gradient-bg text-white"
                      onClick={handleAddRFI}
                    >
                      RFI Oluştur
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {companyRFIs.length === 0 ? (
            <Card
              data-ocid="mr.rfi.empty_state"
              className="bg-card border-border"
            >
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <MessageSquare className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">Henüz RFI oluşturulmadı</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {companyRFIs.map((rfi, idx) => {
                const project = projects.find((p) => p.id === rfi.projectId);
                return (
                  <Card
                    key={rfi.id}
                    data-ocid={`mr.rfi.item.${idx + 1}`}
                    className="bg-card border-border"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-sm">
                              {rfi.rfiNo}
                            </span>
                            <Badge className={RFI_STATUS_STYLES[rfi.status]}>
                              {rfi.status}
                            </Badge>
                          </div>
                          <CardTitle className="text-base mt-1">
                            {rfi.subject}
                          </CardTitle>
                          {project && (
                            <p className="text-xs text-muted-foreground">
                              {project.title}
                            </p>
                          )}
                        </div>
                        {canEdit && rfi.status === "Açık" && (
                          <Button
                            data-ocid={`mr.rfi.respond.button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            className="border-amber-500/30 text-amber-400"
                            onClick={() => setResponseRfiId(rfi.id)}
                          >
                            Yanıtla
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {rfi.question}
                      </p>
                      {rfi.response && (
                        <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <p className="text-xs text-green-400 font-semibold mb-1">
                            Yanıt:
                          </p>
                          <p className="text-sm text-foreground">
                            {rfi.response}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Soran: {rfi.askedBy}</span>
                        {rfi.assignedTo && (
                          <span>Atanan: {rfi.assignedTo}</span>
                        )}
                        {rfi.dueDate && <span>Son: {rfi.dueDate}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog
        open={!!responseRfiId}
        onOpenChange={(o) => {
          if (!o) {
            setResponseRfiId(null);
            setResponseText("");
          }
        }}
      >
        <DialogContent
          data-ocid="mr.rfi.response.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>RFI Yanıtla</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Yanıt</Label>
            <Textarea
              data-ocid="mr.rfi.response.textarea"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="bg-background border-border mt-1"
              rows={4}
              placeholder="Yanıtınızı yazın..."
            />
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              data-ocid="mr.rfi.response.cancel_button"
              onClick={() => {
                setResponseRfiId(null);
                setResponseText("");
              }}
            >
              İptal
            </Button>
            <Button
              data-ocid="mr.rfi.response.confirm_button"
              className="gradient-bg text-white"
              onClick={handleRFIResponse}
            >
              Yanıtı Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
