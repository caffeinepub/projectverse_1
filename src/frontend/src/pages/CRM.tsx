import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Building2,
  DollarSign,
  Handshake,
  Mail,
  Phone,
  Plus,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type CrmContact, type CrmLead, useApp } from "../contexts/AppContext";
import CSVImportModal from "./tabs/CSVImportModal";
import ComplaintsTab from "./tabs/ComplaintsTab";

type ContactType = CrmContact["type"];
type LeadStatus = CrmLead["status"];
type Contact = CrmContact;
type Lead = CrmLead;

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  yeni: "Yeni",
  iletisim: "İletişim",
  teklif: "Teklif Verildi",
  muzakere: "Müzakere",
  kazanildi: "Kazanıldı",
  kaybedildi: "Kaybedildi",
};

const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  yeni: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  iletisim: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  teklif: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  muzakere: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  kazanildi: "bg-green-500/20 text-green-400 border-green-500/30",
  kaybedildi: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PIPELINE_COLUMNS: LeadStatus[] = [
  "yeni",
  "iletisim",
  "teklif",
  "muzakere",
  "kazanildi",
];

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  musteri: "Müşteri",
  aday: "Aday",
  "is-ortagi": "İş Ortağı",
};

const CONTACT_TYPE_COLORS: Record<ContactType, string> = {
  musteri: "bg-green-500/20 text-green-400 border-green-500/30",
  aday: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "is-ortagi": "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function CRM() {
  const {
    hrPersonnel: personnel,
    activeRoleId,
    checkPermission,
    crmContacts: contacts,
    setCrmContacts: setContacts,
    crmLeads: leads,
    setCrmLeads: setLeads,
    activeCompanyId,
    user: currentUser,
  } = useApp();

  // ── Audit Log ─────────────────────────────────────────────────────────────
  interface CrmAuditEntry {
    id: string;
    action: string;
    details: string;
    user: string;
    timestamp: string;
  }
  const crmCompanyId = activeCompanyId || "default";
  const [crmAuditLog, setCrmAuditLog] = useState<CrmAuditEntry[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`pv_crm_audit_${crmCompanyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      setCrmAuditLog(
        JSON.parse(
          localStorage.getItem(`pv_crm_audit_${crmCompanyId}`) || "[]",
        ),
      );
    } catch {
      setCrmAuditLog([]);
    }
  }, [crmCompanyId]);
  const addCrmAudit = (action: string, details: string) => {
    const entry: CrmAuditEntry = {
      id: `crm_audit_${Date.now()}`,
      action,
      details,
      user: currentUser?.name || "Kullanıcı",
      timestamp: new Date().toISOString(),
    };
    setCrmAuditLog((prev) => {
      const updated = [entry, ...prev];
      localStorage.setItem(
        `pv_crm_audit_${crmCompanyId}`,
        JSON.stringify(updated),
      );
      return updated;
    });
  };

  const canEdit =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    checkPermission("crm", "edit");

  const kpis = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter((l) => l.status === "kazanildi").length;
    const pipelineValue = leads
      .filter((l) => l.status !== "kaybedildi")
      .reduce((s, l) => s + l.value, 0);
    const wonValue = leads
      .filter((l) => l.status === "kazanildi")
      .reduce((s, l) => s + l.value, 0);
    return { totalLeads, wonLeads, pipelineValue, wonValue };
  }, [leads]);

  // New Contact
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newContact, setNewContact] = useState<
    Omit<Contact, "id" | "createdAt">
  >({
    name: "",
    company: "",
    email: "",
    phone: "",
    type: "aday",
    notes: "",
  });

  const [csvContactOpen, setCsvContactOpen] = useState(false);

  const handleAddContact = () => {
    if (!newContact.name) return;
    setContacts([
      {
        ...newContact,
        id: `c-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
      },
      ...contacts,
    ]);
    setNewContact({
      name: "",
      company: "",
      email: "",
      phone: "",
      type: "aday",
      notes: "",
    });
    addCrmAudit("Kişi Eklendi", `${newContact.name}`);
    setNewContactOpen(false);
  };

  // New Lead
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    title: "",
    contactId: "",
    value: "",
    priority: "orta" as Lead["priority"],
    assignedTo: "",
    expectedClose: "",
    notes: "",
  });

  const handleAddLead = () => {
    if (!newLead.title || !newLead.contactId) return;
    const lead: Lead = {
      id: `l-${Date.now()}`,
      title: newLead.title,
      contactId: newLead.contactId,
      value: Number(newLead.value) || 0,
      status: "yeni",
      priority: newLead.priority,
      assignedTo: newLead.assignedTo,
      expectedClose: newLead.expectedClose,
      notes: newLead.notes,
      interactions: [],
      createdAt: new Date().toISOString().split("T")[0],
    };
    setLeads([lead, ...leads]);
    setNewLead({
      title: "",
      contactId: "",
      value: "",
      priority: "orta",
      assignedTo: "",
      expectedClose: "",
      notes: "",
    });
    addCrmAudit("Fırsat Eklendi", `${newLead.title}`);
    setNewLeadOpen(false);
  };

  // Lead detail
  const [_selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");

  const _moveLead = (id: string, status: LeadStatus) => {
    const lead = leads.find((l) => l.id === id);
    if (lead)
      addCrmAudit(
        "Aşama Değiştirildi",
        `${lead.title}: ${lead.status} → ${status}`,
      );
    setLeads(leads.map((l) => (l.id === id ? { ...l, status } : l)));
    setSelectedLead((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  const _addInteraction = (id: string) => {
    if (!newNote.trim()) return;
    const interaction = {
      date: new Date().toISOString().split("T")[0],
      note: newNote,
      type: "not",
    };
    setLeads(
      leads.map((l) =>
        l.id === id
          ? { ...l, interactions: [...l.interactions, interaction] }
          : l,
      ),
    );
    setSelectedLead((prev) =>
      prev?.id === id
        ? { ...prev, interactions: [...prev.interactions, interaction] }
        : prev,
    );
    setNewNote("");
  };

  // Contact detail
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [_editContactOpen, setEditContactOpen] = useState(false);
  const [editContactData, _setEditContactData] = useState<
    Omit<Contact, "id" | "createdAt">
  >({
    name: "",
    company: "",
    email: "",
    phone: "",
    type: "musteri",
    notes: "",
  });
  const [_deleteContactConfirm, setDeleteContactConfirm] = useState(false);

  const _handleEditContact = () => {
    if (!selectedContact || !editContactData.name) return;
    setContacts(
      contacts.map((c) =>
        c.id === selectedContact.id ? { ...c, ...editContactData } : c,
      ),
    );
    setSelectedContact((prev) =>
      prev ? { ...prev, ...editContactData } : prev,
    );
    setEditContactOpen(false);
  };

  const _handleDeleteContact = () => {
    if (!selectedContact) return;
    addCrmAudit("Kişi Silindi", `${selectedContact.name}`);
    setContacts(contacts.filter((c) => c.id !== selectedContact.id));
    setSelectedContact(null);
    setDeleteContactConfirm(false);
  };

  return (
    <div data-ocid="crm.page" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">CRM</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Müşteri ilişkileri ve satış hattı yönetimi
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Toplam Fırsat</p>
                <p className="text-xl font-bold">{kpis.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Handshake className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kazanılan</p>
                <p className="text-xl font-bold">{kpis.wonLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pipeline Değeri</p>
                <p className="text-xl font-bold text-sm">
                  {formatCurrency(kpis.pipelineValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kazanılan Değer</p>
                <p className="text-xl font-bold text-sm">
                  {formatCurrency(kpis.wonValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pipeline" data-ocid="crm.tab">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="pipeline" data-ocid="crm.pipeline_tab">
            <TrendingUp className="w-4 h-4 mr-1.5" />
            Satış Hattı
          </TabsTrigger>
          <TabsTrigger value="contacts" data-ocid="crm.contacts_tab">
            <Users className="w-4 h-4 mr-1.5" />
            Rehber
          </TabsTrigger>
          <TabsTrigger value="audit" data-ocid="crm.audit_tab">
            Denetim Logu
          </TabsTrigger>
          <TabsTrigger value="complaints" data-ocid="crm.complaints_tab">
            Şikayetler
          </TabsTrigger>
        </TabsList>

        {/* PIPELINE TAB - Kanban */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Satış Hattı</h2>
            {canEdit && (
              <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="crm.add_lead_button"
                    size="sm"
                    className="gradient-bg"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Yeni Fırsat
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Yeni Satış Fırsatı</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Başlık</Label>
                      <Input
                        data-ocid="crm.lead_title_input"
                        value={newLead.title}
                        onChange={(e) =>
                          setNewLead((p) => ({ ...p, title: e.target.value }))
                        }
                        placeholder="Fırsat başlığı..."
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                    <div>
                      <Label>Müşteri / Kişi</Label>
                      <Select
                        value={newLead.contactId}
                        onValueChange={(v) =>
                          setNewLead((p) => ({ ...p, contactId: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="crm.lead_contact_select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue placeholder="Kişi seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {contacts.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} - {c.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Tahmini Değer (₺)</Label>
                        <Input
                          data-ocid="crm.lead_value_input"
                          type="number"
                          value={newLead.value}
                          onChange={(e) =>
                            setNewLead((p) => ({ ...p, value: e.target.value }))
                          }
                          className="mt-1 bg-background border-border"
                        />
                      </div>
                      <div>
                        <Label>Öncelik</Label>
                        <Select
                          value={newLead.priority}
                          onValueChange={(v) =>
                            setNewLead((p) => ({
                              ...p,
                              priority: v as Lead["priority"],
                            }))
                          }
                        >
                          <SelectTrigger
                            data-ocid="crm.lead_priority_select"
                            className="mt-1 bg-background border-border"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="dusuk">Düşük</SelectItem>
                            <SelectItem value="orta">Orta</SelectItem>
                            <SelectItem value="yuksek">Yüksek</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Sorumlu</Label>
                      <Select
                        value={newLead.assignedTo}
                        onValueChange={(v) =>
                          setNewLead((p) => ({ ...p, assignedTo: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="crm.lead_assign_select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue placeholder="Personel seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {personnel.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tahmini Kapanış</Label>
                      <Input
                        data-ocid="crm.lead_close_date_input"
                        type="date"
                        value={newLead.expectedClose}
                        onChange={(e) =>
                          setNewLead((p) => ({
                            ...p,
                            expectedClose: e.target.value,
                          }))
                        }
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                    <div>
                      <Label>Notlar</Label>
                      <Textarea
                        data-ocid="crm.lead_notes_input"
                        value={newLead.notes}
                        onChange={(e) =>
                          setNewLead((p) => ({ ...p, notes: e.target.value }))
                        }
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="crm.lead_cancel_button"
                      variant="outline"
                      onClick={() => setNewLeadOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="crm.lead_submit_button"
                      className="gradient-bg"
                      onClick={handleAddLead}
                    >
                      Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Kanban Board */}
          <div className="flex gap-3 overflow-x-auto pb-3">
            {PIPELINE_COLUMNS.map((status) => {
              const colLeads = leads.filter((l) => l.status === status);
              const colValue = colLeads.reduce((s, l) => s + l.value, 0);
              return (
                <div key={status} className="flex-shrink-0 w-64">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs border ${LEAD_STATUS_COLORS[status]}`}
                      >
                        {LEAD_STATUS_LABELS[status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {colLeads.length}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(colValue)}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-24">
                    {colLeads.length === 0 && (
                      <div
                        data-ocid={`crm.pipeline_${status}_empty_state`}
                        className="text-center py-6 text-muted-foreground text-xs border border-dashed border-border rounded-lg"
                      >
                        Fırsat yok
                      </div>
                    )}
                    {colLeads.map((lead, li) => {
                      const contact = contacts.find(
                        (c) => c.id === lead.contactId,
                      );
                      return (
                        <button
                          type="button"
                          key={lead.id}
                          data-ocid={`crm.lead_item.${li + 1}`}
                          className="card-dark p-3 rounded-lg cursor-pointer hover:border-primary/30 transition-colors w-full text-left"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <p className="text-sm font-medium line-clamp-2">
                            {lead.title}
                          </p>
                          {contact && (
                            <div className="flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground truncate">
                                {contact.company}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-semibold text-green-400">
                              {formatCurrency(lead.value)}
                            </span>
                            {lead.assignedTo && (
                              <span className="text-xs text-muted-foreground">
                                {lead.assignedTo}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* CONTACTS TAB */}
        <TabsContent value="contacts" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Müşteri Rehberi</h2>
            {canEdit && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs"
                  data-ocid="crm.csv_import.button"
                  onClick={() => setCsvContactOpen(true)}
                >
                  CSV İçeri Aktar
                </Button>
                <Dialog open={newContactOpen} onOpenChange={setNewContactOpen}>
                  <DialogTrigger asChild>
                    <Button
                      data-ocid="crm.add_contact_button"
                      size="sm"
                      className="gradient-bg"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Yeni Kişi
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Yeni Kişi / Müşteri Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Ad Soyad</Label>
                          <Input
                            data-ocid="crm.contact_name_input"
                            value={newContact.name}
                            onChange={(e) =>
                              setNewContact((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            className="mt-1 bg-background border-border"
                          />
                        </div>
                        <div>
                          <Label>Şirket</Label>
                          <Input
                            data-ocid="crm.contact_company_input"
                            value={newContact.company}
                            onChange={(e) =>
                              setNewContact((p) => ({
                                ...p,
                                company: e.target.value,
                              }))
                            }
                            className="mt-1 bg-background border-border"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>E-posta</Label>
                          <Input
                            data-ocid="crm.contact_email_input"
                            type="email"
                            value={newContact.email}
                            onChange={(e) =>
                              setNewContact((p) => ({
                                ...p,
                                email: e.target.value,
                              }))
                            }
                            className="mt-1 bg-background border-border"
                          />
                        </div>
                        <div>
                          <Label>Telefon</Label>
                          <Input
                            data-ocid="crm.contact_phone_input"
                            value={newContact.phone}
                            onChange={(e) =>
                              setNewContact((p) => ({
                                ...p,
                                phone: e.target.value,
                              }))
                            }
                            className="mt-1 bg-background border-border"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Tür</Label>
                        <Select
                          value={newContact.type}
                          onValueChange={(v) =>
                            setNewContact((p) => ({
                              ...p,
                              type: v as ContactType,
                            }))
                          }
                        >
                          <SelectTrigger
                            data-ocid="crm.contact_type_select"
                            className="mt-1 bg-background border-border"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="musteri">Müşteri</SelectItem>
                            <SelectItem value="aday">Aday</SelectItem>
                            <SelectItem value="is-ortagi">İş Ortağı</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Notlar</Label>
                        <Textarea
                          data-ocid="crm.contact_notes_input"
                          value={newContact.notes}
                          onChange={(e) =>
                            setNewContact((p) => ({
                              ...p,
                              notes: e.target.value,
                            }))
                          }
                          className="mt-1 bg-background border-border"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        data-ocid="crm.contact_cancel_button"
                        variant="outline"
                        onClick={() => setNewContactOpen(false)}
                      >
                        İptal
                      </Button>
                      <Button
                        data-ocid="crm.contact_submit_button"
                        className="gradient-bg"
                        onClick={handleAddContact}
                      >
                        Ekle
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          <CSVImportModal
            open={csvContactOpen}
            onClose={() => setCsvContactOpen(false)}
            type="crm"
            companyId={crmCompanyId}
            onImport={(rows) => {
              const newContacts = rows.map((r) => ({
                id: `c-${Date.now()}-${Math.random()}`,
                name: r.ilgiliKişi || r.firmaAdı || "İsimsiz",
                company: r.firmaAdı || "",
                email: r.email || "",
                phone: r.telefon || "",
                type: "musteri" as const,
                notes: r.sektör || "",
                createdAt: new Date().toISOString().split("T")[0],
              }));
              setContacts([...newContacts, ...contacts]);
            }}
          />

          <div className="grid gap-3">
            {contacts.length === 0 && (
              <div
                data-ocid="crm.contacts_empty_state"
                className="text-center py-12 text-muted-foreground"
              >
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Henüz kişi kaydı yok</p>
              </div>
            )}
            {contacts.map((contact, idx) => (
              <button
                type="button"
                key={contact.id}
                data-ocid={`crm.contact_item.${idx + 1}`}
                className="card-dark rounded-lg p-4 cursor-pointer hover:border-primary/30 transition-colors w-full text-left"
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {contact.company}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`text-xs border ${CONTACT_TYPE_COLORS[contact.type]}`}
                  >
                    {CONTACT_TYPE_LABELS[contact.type]}
                  </Badge>
                </div>
                <div className="flex gap-4 mt-3">
                  {contact.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="mt-4">
          {crmAuditLog.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="font-medium">Henüz denetim kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b border-border"
                    style={{ background: "oklch(0.15 0.018 245)" }}
                  >
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Zaman
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Kullanıcı
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      İşlem
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Detay
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {crmAuditLog.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(entry.timestamp).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {entry.user}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {entry.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="complaints" className="mt-4">
          <ComplaintsTab companyId={crmCompanyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
