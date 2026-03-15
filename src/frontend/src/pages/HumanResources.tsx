import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  Personnel,
  ShiftAssignment,
} from "../contexts/AppContext";
import { useApp } from "../contexts/AppContext";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const SHIFT_KEYS = ["sabah", "ogleden", "gece", "izin", ""] as const;
type ShiftKey = (typeof SHIFT_KEYS)[number];

const SHIFT_LABELS: Record<
  string,
  { label: string; time: string; color: string }
> = {
  sabah: {
    label: "Sabah",
    time: "08:00-16:00",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  ogleden: {
    label: "Öğleden",
    time: "16:00-00:00",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  gece: {
    label: "Gece",
    time: "00:00-08:00",
    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
  izin: {
    label: "İzin",
    time: "",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  "": {
    label: "-",
    time: "",
    color: "bg-muted/30 text-muted-foreground border-border",
  },
};

const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  Bekliyor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Onaylandı: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Reddedildi: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const DEPT_COLORS: Record<string, string> = {
  Teknik: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  İdari: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Saha: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Muhasebe: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Proje: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

function getDeptColor(dept: string) {
  return DEPT_COLORS[dept] || "bg-muted/20 text-muted-foreground border-border";
}

interface PersonnelDoc {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
}

const DOCS_STORAGE_KEY = (companyId: string | null) =>
  `${companyId}_hr_personnel_docs`;

function loadPersonnelDocs(
  companyId: string | null,
): Record<string, PersonnelDoc[]> {
  try {
    const raw = localStorage.getItem(DOCS_STORAGE_KEY(companyId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePersonnelDocs(
  companyId: string | null,
  docs: Record<string, PersonnelDoc[]>,
) {
  localStorage.setItem(DOCS_STORAGE_KEY(companyId), JSON.stringify(docs));
}

// Build shift lookup: shiftMap[personnelName][day] = shiftKey
function buildShiftMap(
  shifts: ShiftAssignment[],
): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {};
  for (const s of shifts) {
    for (const person of s.personnel) {
      if (!map[person]) map[person] = {};
      map[person][s.day] = s.shift;
    }
  }
  return map;
}

function setShiftInArray(
  shifts: ShiftAssignment[],
  day: string,
  shiftKey: string,
  personnelName: string,
): ShiftAssignment[] {
  // Remove person from any shift on this day
  let updated = shifts.map((s) => {
    if (s.day === day) {
      return {
        ...s,
        personnel: s.personnel.filter((p) => p !== personnelName),
      };
    }
    return s;
  });
  // Remove empty assignments
  updated = updated.filter((s) => s.personnel.length > 0);
  // Add to new shift if not empty
  if (shiftKey) {
    const existing = updated.find((s) => s.day === day && s.shift === shiftKey);
    if (existing) {
      updated = updated.map((s) =>
        s.day === day && s.shift === shiftKey
          ? { ...s, personnel: [...s.personnel, personnelName] }
          : s,
      );
    } else {
      updated.push({ day, shift: shiftKey, personnel: [personnelName] });
    }
  }
  return updated;
}

// Calendar helpers
const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];
const CAL_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getCalendarDays(year: number, month: number) {
  // month is 0-based
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function HumanResources() {
  const {
    activeRoleId,
    activeCompanyId,
    checkPermission,
    hrPersonnel: personnel,
    setHrPersonnel: setPersonnel,
    hrLeaves: leaves,
    setHrLeaves: setLeaves,
    hrShifts: shifts,
    setHrShifts: setShifts,
    user,
    addNotification,
  } = useApp();

  const isManager =
    activeRoleId === "owner" ||
    activeRoleId === "manager" ||
    activeRoleId === "pm" ||
    activeRoleId === "supervisor" ||
    checkPermission("hr", "edit");

  // Personnel state
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("Tümü");
  const [addPersonnelOpen, setAddPersonnelOpen] = useState(false);
  const [newPersonnel, setNewPersonnel] = useState({
    name: "",
    role: "",
    department: "Teknik",
    phone: "",
    email: "",
    annualLeaveBalance: "14",
  });
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(
    null,
  );

  // Personnel docs
  const [personnelDocs, setPersonnelDocs] = useState<
    Record<string, PersonnelDoc[]>
  >(() => loadPersonnelDocs(activeCompanyId));

  // Reload personnel docs when company changes
  useEffect(() => {
    if (activeCompanyId) setPersonnelDocs(loadPersonnelDocs(activeCompanyId));
  }, [activeCompanyId]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadProgress, setDocUploadProgress] = useState(0);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Leave state
  const [addLeaveOpen, setAddLeaveOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    type: "Yıllık" as LeaveType,
    startDate: "",
    endDate: "",
    note: "",
  });

  // Shift state
  const [shiftEditModal, setShiftEditModal] = useState<{
    personnelName: string;
    day: string;
    currentShift: string;
  } | null>(null);
  const [pendingShift, setPendingShift] = useState<ShiftKey>("");

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const pendingCount = leaves.filter((l) => l.status === "Bekliyor").length;

  const filteredPersonnel = personnel.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "Tümü" || p.department === deptFilter;
    return matchSearch && matchDept;
  });

  const departments = Array.from(new Set(personnel.map((p) => p.department)));

  const handleApprove = (id: string) => {
    const leave = leaves.find((l) => l.id === id);
    setLeaves(
      leaves.map((l) =>
        l.id === id ? { ...l, status: "Onaylandı" as LeaveStatus } : l,
      ),
    );
    if (leave) {
      addNotification({
        type: "leave_approved",
        title: "İzin Onaylandı",
        message: `${leave.name} adlı personelin izin talebi onaylandı.`,
      });
    }
  };

  const handleReject = (id: string) => {
    const leave = leaves.find((l) => l.id === id);
    setLeaves(
      leaves.map((l) =>
        l.id === id ? { ...l, status: "Reddedildi" as LeaveStatus } : l,
      ),
    );
    if (leave) {
      addNotification({
        type: "leave_rejected",
        title: "İzin Reddedildi",
        message: `${leave.name} adlı personelin izin talebi reddedildi.`,
      });
    }
  };

  const handleAddPersonnel = () => {
    if (!newPersonnel.name.trim() || !newPersonnel.role.trim()) return;
    const initials = newPersonnel.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const colors = [
      "#7c3aed",
      "#0891b2",
      "#059669",
      "#d97706",
      "#dc2626",
      "#be185d",
    ];
    const color = colors[personnel.length % colors.length];
    const newPerson: Personnel = {
      id: String(Date.now()),
      name: newPersonnel.name.trim(),
      role: newPersonnel.role.trim(),
      department: newPersonnel.department,
      phone: newPersonnel.phone.trim(),
      email: newPersonnel.email.trim(),
      status: "Aktif",
      initials,
      color,
      annualLeaveBalance: Number(newPersonnel.annualLeaveBalance) || 14,
    };
    setPersonnel([...personnel, newPerson]);
    setNewPersonnel({
      name: "",
      role: "",
      department: "Teknik",
      phone: "",
      email: "",
      annualLeaveBalance: "14",
    });
    setAddPersonnelOpen(false);
  };

  const handleAddLeave = () => {
    if (!newLeave.startDate || !newLeave.endDate) return;
    const senderName = user?.name || selectedPersonnel?.name || "Ben";
    const newReq: LeaveRequest = {
      id: String(Date.now()),
      name: senderName,
      type: newLeave.type,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      status: "Bekliyor",
      note: newLeave.note,
    };
    setLeaves([...leaves, newReq]);
    setNewLeave({ type: "Yıllık", startDate: "", endDate: "", note: "" });
    setAddLeaveOpen(false);
  };

  const handleShiftSave = () => {
    if (!shiftEditModal) return;
    const updated = setShiftInArray(
      shifts,
      shiftEditModal.day,
      pendingShift,
      shiftEditModal.personnelName,
    );
    setShifts(updated);
    setShiftEditModal(null);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPersonnel) return;
    setIsUploadingDoc(true);
    setDocUploadProgress(0);
    const reader = new FileReader();
    reader.onload = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          clearInterval(interval);
          const newDoc: PersonnelDoc = {
            id: String(Date.now()),
            name: file.name,
            type: file.name.split(".").pop()?.toUpperCase() || "DOC",
            date: new Date().toISOString().split("T")[0],
            size: `${(file.size / 1024).toFixed(1)} KB`,
          };
          const updated = {
            ...personnelDocs,
            [selectedPersonnel.id]: [
              ...(personnelDocs[selectedPersonnel.id] || []),
              newDoc,
            ],
          };
          setPersonnelDocs(updated);
          savePersonnelDocs(activeCompanyId, updated);
          setIsUploadingDoc(false);
          setDocUploadProgress(0);
        } else {
          setDocUploadProgress(Math.min(progress, 99));
        }
      }, 100);
    };
    reader.readAsDataURL(file);
    if (docFileInputRef.current) docFileInputRef.current.value = "";
  };

  const handleDeleteDoc = (personnelId: string, docId: string) => {
    const updated = {
      ...personnelDocs,
      [personnelId]: (personnelDocs[personnelId] || []).filter(
        (d) => d.id !== docId,
      ),
    };
    setPersonnelDocs(updated);
    savePersonnelDocs(activeCompanyId, updated);
  };

  const shiftMap = buildShiftMap(shifts);

  // Calendar: leaves for current month
  const calCells = getCalendarDays(calYear, calMonth);
  const monthLeaves = leaves.filter((l) => {
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    const monthStart = new Date(calYear, calMonth, 1);
    const monthEnd = new Date(calYear, calMonth + 1, 0);
    return start <= monthEnd && end >= monthStart;
  });

  function getLeavesForDay(day: number) {
    const ds = dateStr(calYear, calMonth, day);
    return monthLeaves.filter((l) => l.startDate <= ds && l.endDate >= ds);
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold gradient-text">İnsan Kaynakları</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personel yönetimi, izinler ve vardiya planlaması
        </p>
      </div>

      <Tabs defaultValue="personnel" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger data-ocid="hr.personnel.tab" value="personnel">
            Personel
          </TabsTrigger>
          <TabsTrigger data-ocid="hr.leaves.tab" value="leaves">
            İzin Yönetimi
            {pendingCount > 0 && (
              <Badge className="ml-1.5 h-4 px-1.5 text-xs bg-amber-500 text-white">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger data-ocid="hr.shifts.tab" value="shifts">
            Vardiya Planı
          </TabsTrigger>
          <TabsTrigger data-ocid="hr.calendar.tab" value="calendar">
            İzin Takvimi
          </TabsTrigger>
        </TabsList>

        {/* ─── PERSONNEL TAB ─── */}
        <TabsContent value="personnel" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  data-ocid="hr.personnel.search_input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara..."
                  className="pl-8 h-8 bg-card border-border text-sm w-48"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger
                  data-ocid="hr.department.select"
                  className="h-8 w-36 bg-card border-border text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Tümü">Tüm Departmanlar</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isManager && (
              <Dialog
                open={addPersonnelOpen}
                onOpenChange={setAddPersonnelOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    data-ocid="hr.add_personnel_button"
                    className="gradient-bg text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Personel Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="hr.add_personnel.dialog"
                  className="bg-card border-border"
                >
                  <DialogHeader>
                    <DialogTitle>Yeni Personel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Ad Soyad</Label>
                      <Input
                        data-ocid="hr.personnel_name.input"
                        value={newPersonnel.name}
                        onChange={(e) =>
                          setNewPersonnel((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        className="mt-1 bg-background border-border"
                        placeholder="Örn: Ahmet Yılmaz"
                      />
                    </div>
                    <div>
                      <Label>Unvan / Rol</Label>
                      <Input
                        data-ocid="hr.personnel_role.input"
                        value={newPersonnel.role}
                        onChange={(e) =>
                          setNewPersonnel((p) => ({
                            ...p,
                            role: e.target.value,
                          }))
                        }
                        className="mt-1 bg-background border-border"
                        placeholder="Örn: Saha Mühendisi"
                      />
                    </div>
                    <div>
                      <Label>Departman</Label>
                      <Select
                        value={newPersonnel.department}
                        onValueChange={(v) =>
                          setNewPersonnel((p) => ({ ...p, department: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="hr.personnel_dept.select"
                          className="mt-1 bg-background border-border"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="Teknik">Teknik</SelectItem>
                          <SelectItem value="İdari">İdari</SelectItem>
                          <SelectItem value="Saha">Saha</SelectItem>
                          <SelectItem value="Muhasebe">Muhasebe</SelectItem>
                          <SelectItem value="Proje">Proje</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Telefon</Label>
                        <Input
                          data-ocid="hr.personnel_phone.input"
                          value={newPersonnel.phone}
                          onChange={(e) =>
                            setNewPersonnel((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                          className="mt-1 bg-background border-border"
                          placeholder="0532 000 0000"
                        />
                      </div>
                      <div>
                        <Label>E-posta</Label>
                        <Input
                          data-ocid="hr.personnel_email.input"
                          value={newPersonnel.email}
                          onChange={(e) =>
                            setNewPersonnel((p) => ({
                              ...p,
                              email: e.target.value,
                            }))
                          }
                          className="mt-1 bg-background border-border"
                          placeholder="ornek@sirket.com"
                        />
                      </div>
                      <div>
                        <Label>Yıllık İzin (Gün)</Label>
                        <Input
                          data-ocid="hr.personnel_leave_balance.input"
                          type="number"
                          value={newPersonnel.annualLeaveBalance}
                          onChange={(e) =>
                            setNewPersonnel((p) => ({
                              ...p,
                              annualLeaveBalance: e.target.value,
                            }))
                          }
                          className="mt-1 bg-background border-border"
                          placeholder="14"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      data-ocid="hr.add_personnel.cancel_button"
                      onClick={() => setAddPersonnelOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-ocid="hr.add_personnel.confirm_button"
                      className="gradient-bg text-white"
                      onClick={handleAddPersonnel}
                      disabled={
                        !newPersonnel.name.trim() || !newPersonnel.role.trim()
                      }
                    >
                      Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {filteredPersonnel.length === 0 ? (
            <div
              data-ocid="hr.personnel.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Personel bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPersonnel.map((person, idx) => (
                <Card
                  key={person.id}
                  data-ocid={`hr.personnel.item.${idx + 1}`}
                  className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedPersonnel(person)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          style={{
                            backgroundColor: `${person.color}22`,
                            color: person.color,
                          }}
                          className="text-sm font-bold"
                        >
                          {person.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm font-semibold">
                            {person.name}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              person.status === "Aktif"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-muted/20 text-muted-foreground border-border"
                            }`}
                          >
                            {person.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {person.role}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getDeptColor(person.department)}`}
                    >
                      {person.department}
                    </Badge>
                    {person.phone && (
                      <p className="text-xs text-muted-foreground">
                        {person.phone}
                      </p>
                    )}
                    {person.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {person.email}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Paperclip className="h-3 w-3" />
                      <span>
                        {(personnelDocs[person.id] || []).length} belge
                      </span>
                    </div>
                    {(() => {
                      const usedLeaveDays = leaves
                        .filter(
                          (l) =>
                            l.name === person.name && l.status === "Onaylandı",
                        )
                        .reduce((sum, l) => {
                          if (!l.startDate || !l.endDate) return sum + 1;
                          const s = new Date(l.startDate);
                          const e = new Date(l.endDate);
                          return (
                            sum +
                            Math.max(
                              1,
                              Math.ceil(
                                (e.getTime() - s.getTime()) / 86400000,
                              ) + 1,
                            )
                          );
                        }, 0);
                      const remainingLeave = Math.max(
                        0,
                        (person.annualLeaveBalance ?? 14) - usedLeaveDays,
                      );
                      return (
                        <span className="text-xs text-muted-foreground">
                          İzin: {remainingLeave} gün kaldı
                        </span>
                      );
                    })()}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── LEAVES TAB ─── */}
        <TabsContent value="leaves" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">İzin Talepleri</h2>
            <Dialog open={addLeaveOpen} onOpenChange={setAddLeaveOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="hr.add_leave_button"
                  className="gradient-bg text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  İzin Talebi Oluştur
                </Button>
              </DialogTrigger>
              <DialogContent
                data-ocid="hr.add_leave.dialog"
                className="bg-card border-border"
              >
                <DialogHeader>
                  <DialogTitle>İzin Talebi</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>İzin Türü</Label>
                    <Select
                      value={newLeave.type}
                      onValueChange={(v) =>
                        setNewLeave((l) => ({ ...l, type: v as LeaveType }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="hr.leave_type.select"
                        className="mt-1 bg-background border-border"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Yıllık">Yıllık İzin</SelectItem>
                        <SelectItem value="Hastalık">Hastalık İzni</SelectItem>
                        <SelectItem value="Mazeret">Mazeret İzni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Başlangıç</Label>
                      <Input
                        data-ocid="hr.leave_start.input"
                        type="date"
                        value={newLeave.startDate}
                        onChange={(e) =>
                          setNewLeave((l) => ({
                            ...l,
                            startDate: e.target.value,
                          }))
                        }
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                    <div>
                      <Label>Bitiş</Label>
                      <Input
                        data-ocid="hr.leave_end.input"
                        type="date"
                        value={newLeave.endDate}
                        onChange={(e) =>
                          setNewLeave((l) => ({
                            ...l,
                            endDate: e.target.value,
                          }))
                        }
                        className="mt-1 bg-background border-border"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <Textarea
                      data-ocid="hr.leave_note.textarea"
                      value={newLeave.note}
                      onChange={(e) =>
                        setNewLeave((l) => ({ ...l, note: e.target.value }))
                      }
                      className="mt-1 bg-background border-border resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    data-ocid="hr.add_leave.cancel_button"
                    onClick={() => setAddLeaveOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="hr.add_leave.confirm_button"
                    className="gradient-bg text-white"
                    onClick={handleAddLeave}
                    disabled={!newLeave.startDate || !newLeave.endDate}
                  >
                    Gönder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {leaves.length === 0 ? (
            <div
              data-ocid="hr.leaves.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Henüz izin talebi yok.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaves.map((leave, idx) => (
                <div
                  key={leave.id}
                  data-ocid={`hr.leave.item.${idx + 1}`}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {leave.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {leave.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {leave.startDate} — {leave.endDate}
                      </p>
                      {leave.note && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {leave.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${LEAVE_STATUS_COLORS[leave.status]}`}
                    >
                      {leave.status}
                    </Badge>
                    {isManager && leave.status === "Bekliyor" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`hr.leave.approve_button.${idx + 1}`}
                          className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handleApprove(leave.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`hr.leave.reject_button.${idx + 1}`}
                          className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10"
                          onClick={() => handleReject(leave.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── SHIFT TAB ─── */}
        <TabsContent value="shifts" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Haftalık Vardiya Planı
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                {Object.entries(SHIFT_LABELS)
                  .filter(([k]) => k !== "")
                  .map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-sm border ${val.color}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {val.label}
                        {val.time ? ` (${val.time})` : ""}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div
              data-ocid="hr.shifts.panel"
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium w-40">
                        Personel
                      </th>
                      {DAYS.map((d) => (
                        <th
                          key={d}
                          className="text-center px-2 py-3 text-muted-foreground font-medium min-w-[90px]"
                        >
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {personnel.map((person, pIdx) => (
                      <tr
                        key={person.id}
                        data-ocid={`hr.shift.row.${pIdx + 1}`}
                        className="border-b border-border/50 hover:bg-white/3"
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback
                                style={{
                                  backgroundColor: `${person.color}22`,
                                  color: person.color,
                                }}
                                className="text-xs font-bold"
                              >
                                {person.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium truncate max-w-[90px]">
                              {person.name.split(" ")[0]}
                            </span>
                          </div>
                        </td>
                        {DAYS.map((day) => {
                          const shiftKey = shiftMap[person.name]?.[day] || "";
                          const shiftInfo =
                            SHIFT_LABELS[shiftKey] || SHIFT_LABELS[""];
                          return (
                            <td key={day} className="px-1 py-2 text-center">
                              <button
                                type="button"
                                data-ocid={`hr.shift.cell.${pIdx + 1}`}
                                onClick={() => {
                                  setShiftEditModal({
                                    personnelName: person.name,
                                    day,
                                    currentShift: shiftKey,
                                  });
                                  setPendingShift(shiftKey as ShiftKey);
                                }}
                                className={`w-full px-2 py-1 rounded border text-xs transition-all hover:opacity-80 ${shiftInfo.color}`}
                              >
                                {shiftInfo.label}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {personnel.length === 0 && (
                  <div
                    data-ocid="hr.shifts.empty_state"
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    Personel eklendikten sonra vardiya planlayabilirsiniz.
                  </div>
                )}
              </div>
            </div>

            {/* Shift Edit Modal */}
            <Dialog
              open={!!shiftEditModal}
              onOpenChange={(open) => !open && setShiftEditModal(null)}
            >
              <DialogContent
                data-ocid="hr.shift_edit.dialog"
                className="bg-card border-border"
              >
                <DialogHeader>
                  <DialogTitle>
                    Vardiya Düzenle:{" "}
                    <span className="text-primary">
                      {shiftEditModal?.personnelName}
                    </span>{" "}
                    — {shiftEditModal?.day}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  {(["sabah", "ogleden", "gece", "izin", ""] as ShiftKey[]).map(
                    (key) => {
                      const info = SHIFT_LABELS[key];
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setPendingShift(key)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            pendingShift === key
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-white/5"
                          }`}
                        >
                          <p className="text-sm font-medium">{info.label}</p>
                          {info.time && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {info.time}
                            </p>
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    data-ocid="hr.shift_edit.cancel_button"
                    onClick={() => setShiftEditModal(null)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-ocid="hr.shift_edit.save_button"
                    className="gradient-bg text-white"
                    onClick={handleShiftSave}
                  >
                    Kaydet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        {/* ─── CALENDAR TAB ─── */}
        <TabsContent value="calendar" className="mt-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">İzin Takvimi</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
                    <span className="text-xs text-muted-foreground">
                      Onaylandı
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/50" />
                    <span className="text-xs text-muted-foreground">
                      Bekliyor
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-rose-500/30 border border-rose-500/50" />
                    <span className="text-xs text-muted-foreground">
                      Reddedildi
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    data-ocid="hr.calendar.pagination_prev"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalMonth(11);
                        setCalYear((y) => y - 1);
                      } else {
                        setCalMonth((m) => m - 1);
                      }
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium w-32 text-center">
                    {TR_MONTHS[calMonth]} {calYear}
                  </span>
                  <Button
                    data-ocid="hr.calendar.pagination_next"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalMonth(0);
                        setCalYear((y) => y + 1);
                      } else {
                        setCalMonth((m) => m + 1);
                      }
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div
              data-ocid="hr.calendar.panel"
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {CAL_DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center py-2 text-xs font-medium text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar cells */}
              <div className="grid grid-cols-7">
                {calCells.map((day, i) => {
                  const cellKey =
                    day !== null
                      ? `day-${calYear}-${calMonth}-${day}`
                      : `null-${calYear}-${calMonth}-slot${i}`;
                  if (day === null) {
                    return (
                      <div
                        key={cellKey}
                        className="h-20 border-b border-r border-border/30"
                      />
                    );
                  }
                  const dayLeaves = getLeavesForDay(day);
                  const isToday =
                    calYear === today.getFullYear() &&
                    calMonth === today.getMonth() &&
                    day === today.getDate();
                  return (
                    <div
                      key={cellKey}
                      className={`h-20 border-b border-r border-border/30 p-1 ${
                        isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      <div
                        className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-primary text-white"
                            : "text-foreground/70"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayLeaves.slice(0, 2).map((leave) => (
                          <div
                            key={leave.id}
                            className={`text-[10px] px-1 py-0.5 rounded truncate border ${
                              leave.status === "Onaylandı"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : leave.status === "Bekliyor"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {leave.name.split(" ")[0]}
                          </div>
                        ))}
                        {dayLeaves.length > 2 && (
                          <div className="text-[10px] text-muted-foreground px-1">
                            +{dayLeaves.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Personnel Detail Sheet ─── */}
      <Sheet
        open={!!selectedPersonnel}
        onOpenChange={(open) => !open && setSelectedPersonnel(null)}
      >
        <SheetContent
          data-ocid="hr.personnel.sheet"
          className="bg-card border-border w-[420px] sm:max-w-[420px]"
        >
          {selectedPersonnel && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback
                      style={{
                        backgroundColor: `${selectedPersonnel.color}22`,
                        color: selectedPersonnel.color,
                      }}
                      className="text-lg font-bold"
                    >
                      {selectedPersonnel.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{selectedPersonnel.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedPersonnel.role}
                    </p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Departman</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getDeptColor(selectedPersonnel.department)}`}
                    >
                      {selectedPersonnel.department}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Durum</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        selectedPersonnel.status === "Aktif"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      {selectedPersonnel.status}
                    </Badge>
                  </div>
                  {selectedPersonnel.phone && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Telefon</span>
                      <span>{selectedPersonnel.phone}</span>
                    </div>
                  )}
                  {selectedPersonnel.email && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">E-posta</span>
                      <span className="truncate max-w-[200px]">
                        {selectedPersonnel.email}
                      </span>
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Belgeler
                    </h3>
                    <div>
                      <input
                        ref={docFileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                        className="hidden"
                        onChange={handleDocUpload}
                      />
                      <Button
                        data-ocid="hr.personnel_doc.upload_button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-border"
                        onClick={() => docFileInputRef.current?.click()}
                        disabled={isUploadingDoc}
                      >
                        <UploadCloud className="h-3 w-3 mr-1" />
                        Belge Ekle
                      </Button>
                    </div>
                  </div>

                  {isUploadingDoc && (
                    <div className="mb-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Yükleniyor...</span>
                        <span>{Math.round(docUploadProgress)}%</span>
                      </div>
                      <Progress value={docUploadProgress} className="h-1.5" />
                    </div>
                  )}

                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-2">
                      {(personnelDocs[selectedPersonnel.id] || []).length ===
                      0 ? (
                        <div
                          data-ocid="hr.personnel_docs.empty_state"
                          className="text-center py-6 text-muted-foreground"
                        >
                          <Paperclip className="h-6 w-6 mx-auto mb-2 opacity-20" />
                          <p className="text-xs">Henüz belge eklenmemiş.</p>
                        </div>
                      ) : (
                        (personnelDocs[selectedPersonnel.id] || []).map(
                          (doc, dIdx) => (
                            <div
                              key={doc.id}
                              data-ocid={`hr.personnel_doc.item.${dIdx + 1}`}
                              className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 py-2"
                            >
                              <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.date} • {doc.size}
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                data-ocid={`hr.personnel_doc.delete_button.${dIdx + 1}`}
                                className="h-6 w-6 text-muted-foreground hover:text-rose-400"
                                onClick={() =>
                                  handleDeleteDoc(selectedPersonnel.id, doc.id)
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ),
                        )
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Personnel Leave History */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-primary" />
                    İzin Geçmişi
                  </h3>
                  <div className="space-y-2">
                    {leaves
                      .filter((l) => l.name === selectedPersonnel.name)
                      .slice(0, 5)
                      .map((leave, lIdx) => (
                        <div
                          key={leave.id}
                          data-ocid={`hr.leave_history.item.${lIdx + 1}`}
                          className="flex items-center justify-between text-xs bg-background/50 border border-border rounded-lg px-3 py-2"
                        >
                          <div>
                            <span className="font-medium">{leave.type}</span>
                            <span className="text-muted-foreground ml-2">
                              {leave.startDate} – {leave.endDate}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              LEAVE_STATUS_COLORS[leave.status]
                            }`}
                          >
                            {leave.status}
                          </Badge>
                        </div>
                      ))}
                    {leaves.filter((l) => l.name === selectedPersonnel.name)
                      .length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        İzin geçmişi bulunmuyor.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <Button
                    data-ocid="hr.personnel.close_button"
                    variant="outline"
                    className="w-full border-border"
                    onClick={() => setSelectedPersonnel(null)}
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
