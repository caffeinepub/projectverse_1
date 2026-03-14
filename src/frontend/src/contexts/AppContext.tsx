import { type ReactNode, createContext, useContext, useState } from "react";
import { type Lang, translations } from "../i18n/translations";

export type AccountType = "owner" | "manager" | "personnel" | "subcontractor";

export type ModulePermissions = {
  view: boolean;
  edit: boolean;
  delete: boolean;
};

export interface MemberEntry {
  userId: string;
  name: string;
  loginCode: string;
  roleIds: string[];
  subType?: string;
  permissions: Record<string, ModulePermissions>;
}

export interface PendingInvite {
  id: string;
  code: string;
  name: string;
  email: string;
  companyId: string;
  roleId: string;
  subType?: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  approvedLoginCode?: string;
}

export interface InviteCode {
  id: string;
  code: string;
  companyId: string;
  roleId: string;
  subType?: string;
  createdAt: string;
  usedBy?: string;
  isUsed: boolean;
}

export const ROLE_HIERARCHY = [
  {
    id: "owner",
    name: "Şirket Sahibi",
    level: 0,
    color: "#a855f7",
    subTypes: [],
  },
  {
    id: "manager",
    name: "Şirket Yöneticisi",
    level: 1,
    color: "#3b82f6",
    subTypes: ["Teknik Yönetici", "İdari Yönetici"],
  },
  {
    id: "personnel",
    name: "Şirket Personeli",
    level: 2,
    color: "#06b6d4",
    subTypes: ["Teknik Personel", "İdari Personel"],
  },
  {
    id: "subcontractor",
    name: "Taşeron Personel",
    level: 3,
    color: "#f59e0b",
    subTypes: [],
  },
];

const ALL_MODULE_PERMISSIONS: Record<string, ModulePermissions> = {
  dashboard: { view: true, edit: true, delete: true },
  projects: { view: true, edit: true, delete: true },
  fieldOps: { view: true, edit: true, delete: true },
  hr: { view: true, edit: true, delete: true },
  finance: { view: true, edit: true, delete: true },
  documents: { view: true, edit: true, delete: true },
  settings: { view: true, edit: true, delete: true },
};

function getDefaultPermissionsByRole(
  roleId: string,
  subType?: string,
): Record<string, ModulePermissions> {
  if (roleId === "owner") return ALL_MODULE_PERMISSIONS;
  if (roleId === "manager") {
    if (subType?.includes("Teknik")) {
      return {
        dashboard: { view: true, edit: true, delete: true },
        projects: { view: true, edit: true, delete: true },
        fieldOps: { view: true, edit: true, delete: true },
        hr: { view: true, edit: false, delete: false },
        finance: { view: true, edit: false, delete: false },
        settings: { view: true, edit: false, delete: false },
      };
    }
    // İdari
    return {
      dashboard: { view: true, edit: true, delete: true },
      hr: { view: true, edit: true, delete: true },
      finance: { view: true, edit: true, delete: true },
      documents: { view: true, edit: true, delete: true },
      projects: { view: true, edit: false, delete: false },
      fieldOps: { view: true, edit: false, delete: false },
      settings: { view: true, edit: false, delete: false },
    };
  }
  if (roleId === "personnel") {
    if (subType?.includes("Teknik")) {
      return {
        dashboard: { view: true, edit: false, delete: false },
        projects: { view: true, edit: true, delete: false },
        fieldOps: { view: true, edit: true, delete: false },
      };
    }
    // İdari
    return {
      dashboard: { view: true, edit: false, delete: false },
      hr: { view: true, edit: true, delete: false },
      documents: { view: true, edit: true, delete: false },
    };
  }
  if (roleId === "subcontractor") {
    return {
      fieldOps: { view: true, edit: false, delete: false },
      projects: { view: true, edit: false, delete: false },
    };
  }
  return {};
}

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type WorkOrderStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";
export type InspectionStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "failed";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  projectId: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  text: string;
  author: string;
  timestamp: string;
  isStatusLog: boolean;
  statusTo?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  companyId: string;
  members: string[];
  startDate: string;
  endDate: string;
  budget?: number;
  progress: number;
}

export interface Role {
  id: string;
  name: string;
  isDefault: boolean;
  color: string;
  permissions: Record<
    string,
    {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      approve: boolean;
    }
  >;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  ownerId: string;
  activeModules: string[];
  roles: Role[];
  members: MemberEntry[];
}

export interface User {
  id: string;
  name: string;
  loginCode: string;
  email: string;
  companyIds: string[];
  accountType?: AccountType;
}

export interface WorkOrderAttachment {
  id: string;
  name: string;
  type: "image" | "pdf";
  url: string;
  uploadedAt: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  status: WorkOrderStatus;
  priority: TaskPriority;
  location: string;
  dueDate: string;
  createdAt: string;
  attachments: WorkOrderAttachment[];
  estimatedCost?: number;
  actualCost?: number;
}

export interface InspectionItem {
  id: string;
  label: string;
  checked: boolean;
  note: string;
}

export interface FieldInspection {
  id: string;
  title: string;
  projectId: string;
  inspectionType: string;
  status: InspectionStatus;
  assignedTo: string;
  scheduledDate: string;
  completedAt?: string;
  items: InspectionItem[];
  notes: string;
  failureReason?: string;
  attachments?: { name: string; size: number; type: string }[];
}

const DEFAULT_ROLES: Role[] = [
  {
    id: "owner",
    name: "Şirket Sahibi",
    isDefault: true,
    color: "#a855f7",
    permissions: {},
  },
  {
    id: "manager",
    name: "Yönetici",
    isDefault: true,
    color: "#3b82f6",
    permissions: {},
  },
  {
    id: "pm",
    name: "Proje Yöneticisi",
    isDefault: true,
    color: "#06b6d4",
    permissions: {},
  },
  {
    id: "subcontractor",
    name: "Taşeron",
    isDefault: true,
    color: "#f59e0b",
    permissions: {},
  },
  {
    id: "supervisor",
    name: "Gözetmen",
    isDefault: true,
    color: "#10b981",
    permissions: {},
  },
  {
    id: "staff",
    name: "Personel",
    isDefault: true,
    color: "#6b7280",
    permissions: {},
  },
];

const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Konya Lojistik Merkezi",
    description: "Büyük ölçekli lojistik merkezi inşaatı",
    status: "active",
    companyId: "c1",
    members: ["u1", "u2"],
    startDate: "2025-01-15",
    endDate: "2025-12-31",
    budget: 5000000,
    progress: 62,
  },
  {
    id: "p2",
    title: "İstanbul Ofis Renovasyonu",
    description: "Merkez ofis yenileme projesi",
    status: "planning",
    companyId: "c1",
    members: ["u1"],
    startDate: "2025-03-01",
    endDate: "2025-06-30",
    budget: 850000,
    progress: 15,
  },
  {
    id: "p3",
    title: "Ankara Rezidans Projesi",
    description: "200 daireli konut projesi",
    status: "active",
    companyId: "c1",
    members: ["u1", "u2", "u3"],
    startDate: "2024-08-01",
    endDate: "2026-02-28",
    budget: 12000000,
    progress: 38,
  },
  {
    id: "p4",
    title: "İzmir Sanayi Tesisi",
    description: "Üretim tesisi altyapı projesi",
    status: "completed",
    companyId: "c1",
    members: ["u1"],
    startDate: "2024-01-01",
    endDate: "2024-11-30",
    budget: 3200000,
    progress: 100,
  },
  {
    id: "p5",
    title: "Bursa Köprü Renovasyonu",
    description: "Tarihi köprü restorasyon çalışmaları",
    status: "on_hold",
    companyId: "c1",
    members: ["u2"],
    startDate: "2025-04-01",
    endDate: "2025-09-30",
    budget: 1500000,
    progress: 5,
  },
];

const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    title: "Temel hazırlık tamamla",
    description: "",
    status: "done",
    priority: "critical",
    assignee: "Ahmet Yılmaz",
    dueDate: "2025-02-28",
    projectId: "p1",
  },
  {
    id: "t2",
    title: "Elektrik altyapısı",
    description: "",
    status: "in_progress",
    priority: "high",
    assignee: "Mehmet Kaya",
    dueDate: "2025-04-15",
    projectId: "p1",
  },
  {
    id: "t3",
    title: "Çatı kaplama planı",
    description: "",
    status: "todo",
    priority: "medium",
    assignee: "Ayşe Demir",
    dueDate: "2025-05-30",
    projectId: "p1",
  },
  {
    id: "t4",
    title: "Malzeme tedariki",
    description: "",
    status: "in_progress",
    priority: "high",
    assignee: "Ali Çelik",
    dueDate: "2025-03-20",
    projectId: "p1",
  },
  {
    id: "t5",
    title: "Çevre düzenlemesi",
    description: "",
    status: "todo",
    priority: "low",
    assignee: "Fatma Yıldız",
    dueDate: "2025-10-01",
    projectId: "p1",
  },
  {
    id: "t6",
    title: "Mimari onay belgesi",
    description: "",
    status: "done",
    priority: "critical",
    assignee: "Ahmet Yılmaz",
    dueDate: "2025-01-15",
    projectId: "p2",
  },
  {
    id: "t7",
    title: "Zemin etüdü raporu",
    description: "",
    status: "todo",
    priority: "high",
    assignee: "Mehmet Kaya",
    dueDate: "2025-03-10",
    projectId: "p3",
  },
];

const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: "wo1",
    title: "A Blok Çatı Su Yalıtımı",
    description:
      "A bloğunun çatı katında su sızıntısı tespit edildi. Acil onarım gerekiyor.",
    projectId: "p1",
    assignedTo: "Ahmet Yılmaz",
    status: "in_progress",
    priority: "critical",
    location: "A Blok - Çatı Katı",
    dueDate: "2025-04-10",
    createdAt: "2025-03-05",
    attachments: [
      {
        id: "a1",
        name: "cati_fotograf.jpg",
        type: "image",
        url: "",
        uploadedAt: "2025-03-05",
      },
    ],
  },
  {
    id: "wo2",
    title: "Elektrik Pano Bakımı",
    description: "Ana elektrik panosunun periyodik bakımı yapılacak.",
    projectId: "p1",
    assignedTo: "Mehmet Kaya",
    status: "open",
    priority: "high",
    location: "Bodrum Kat - Teknik Hacim",
    dueDate: "2025-04-20",
    createdAt: "2025-03-06",
    attachments: [],
  },
  {
    id: "wo3",
    title: "Asansör Revizyon",
    description: "2 numaralı asansörün revizyon çalışması.",
    projectId: "p3",
    assignedTo: "Ali Çelik",
    status: "open",
    priority: "high",
    location: "Kule B - Servis Asansörü",
    dueDate: "2025-04-25",
    createdAt: "2025-03-07",
    attachments: [],
  },
  {
    id: "wo4",
    title: "Ofis Boya Tadilat",
    description: "3. kat ofislerinin iç mekan boya işleri.",
    projectId: "p2",
    assignedTo: "Ayşe Demir",
    status: "completed",
    priority: "medium",
    location: "3. Kat - Açık Ofis",
    dueDate: "2025-03-20",
    createdAt: "2025-02-28",
    attachments: [
      {
        id: "a2",
        name: "oncesi.jpg",
        type: "image",
        url: "",
        uploadedAt: "2025-02-28",
      },
      {
        id: "a3",
        name: "sonrasi.jpg",
        type: "image",
        url: "",
        uploadedAt: "2025-03-20",
      },
    ],
  },
  {
    id: "wo5",
    title: "Isı Yalıtım Kontrolü",
    description: "Dış cephe ısı yalıtım levhalarının kontrol edilmesi.",
    projectId: "p3",
    assignedTo: "Fatma Yıldız",
    status: "open",
    priority: "medium",
    location: "Dış Cephe - Güney Yüz",
    dueDate: "2025-05-01",
    createdAt: "2025-03-08",
    attachments: [],
  },
  {
    id: "wo6",
    title: "Jeneratör Bakımı",
    description: "Yedek güç jeneratörünün yıllık bakımı.",
    projectId: "p1",
    assignedTo: "Mehmet Kaya",
    status: "cancelled",
    priority: "low",
    location: "Dış Alan - Jeneratör Odası",
    dueDate: "2025-03-15",
    createdAt: "2025-03-01",
    attachments: [],
  },
];

const MOCK_INSPECTIONS: FieldInspection[] = [
  {
    id: "fi1",
    title: "Yapısal Güvenlik Denetimi - A Blok",
    projectId: "p1",
    inspectionType: "Yapısal Güvenlik",
    status: "in_progress",
    assignedTo: "Ahmet Yılmaz",
    scheduledDate: "2025-04-05",
    notes: "",
    items: [
      {
        id: "i1",
        label: "Kolon ve kirişlerde çatlak kontrolü",
        checked: true,
        note: "",
      },
      {
        id: "i2",
        label: "Zemin oturma belirtileri",
        checked: true,
        note: "Hafif oturma var",
      },
      {
        id: "i3",
        label: "İskele güvenlik kontrolleri",
        checked: false,
        note: "",
      },
      {
        id: "i4",
        label: "Taşıyıcı sistem görsel muayene",
        checked: false,
        note: "",
      },
      {
        id: "i5",
        label: "Kalıp söküm hazırlık kontrolü",
        checked: false,
        note: "",
      },
    ],
  },
  {
    id: "fi2",
    title: "Yangın Güvenliği Denetimi",
    projectId: "p2",
    inspectionType: "Yangın Güvenliği",
    status: "scheduled",
    assignedTo: "Mehmet Kaya",
    scheduledDate: "2025-04-12",
    notes: "",
    items: [
      {
        id: "i6",
        label: "Yangın tüpleri doluluk kontrolü",
        checked: false,
        note: "",
      },
      {
        id: "i7",
        label: "Acil çıkış yollarının açıklığı",
        checked: false,
        note: "",
      },
      {
        id: "i8",
        label: "Yangın alarm sistemi testi",
        checked: false,
        note: "",
      },
      {
        id: "i9",
        label: "Sprinkler sistemi basınç testi",
        checked: false,
        note: "",
      },
    ],
  },
  {
    id: "fi3",
    title: "Elektrik Tesisatı Kontrolü",
    projectId: "p3",
    inspectionType: "Elektrik",
    status: "completed",
    assignedTo: "Ali Çelik",
    scheduledDate: "2025-03-20",
    completedAt: "2025-03-20",
    notes: "Tüm kontroller başarıyla tamamlandı.",
    items: [
      { id: "i10", label: "Topraklama kontrolü", checked: true, note: "" },
      { id: "i11", label: "Kablo yalıtım testi", checked: true, note: "" },
      {
        id: "i12",
        label: "Pano terminalleri sıkılığı",
        checked: true,
        note: "",
      },
      { id: "i13", label: "Aşırı akım koruyucular", checked: true, note: "" },
    ],
  },
  {
    id: "fi4",
    title: "Sıhhi Tesisat Denetimi",
    projectId: "p1",
    inspectionType: "Sıhhi Tesisat",
    status: "scheduled",
    assignedTo: "Fatma Yıldız",
    scheduledDate: "2025-04-18",
    notes: "",
    items: [
      {
        id: "i14",
        label: "Boru bağlantı sızdırmazlık testi",
        checked: false,
        note: "",
      },
      { id: "i15", label: "Su basıncı ölçümü", checked: false, note: "" },
      {
        id: "i16",
        label: "Atık su hattı akış kontrolü",
        checked: false,
        note: "",
      },
    ],
  },
];

// ─── HR Types ───────────────────────────────────────────────────────────────
export type LeaveStatus = "Bekliyor" | "Onaylandı" | "Reddedildi";
export type LeaveType = "Yıllık" | "Hastalık" | "Mazeret";

export interface Personnel {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  status: "Aktif" | "Pasif";
  initials: string;
  color: string;
}

export interface LeaveRequest {
  id: string;
  name: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  note: string;
}

export interface ShiftAssignment {
  day: string;
  shift: string;
  personnel: string[];
}

// ─── Finance Types ───────────────────────────────────────────────────────────
export type ExpenseStatus = "Onaylandı" | "Bekliyor" | "Reddedildi";
export type InvoiceStatus = "Ödendi" | "Bekliyor" | "Gecikmiş";

export interface Expense {
  id: string;
  category: string;
  projectId: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  description: string;
  createdBy: string;
}

export interface Invoice {
  id: string;
  supplier: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  project: string;
}

// ─── Communication Types ─────────────────────────────────────────────────────
export interface Message {
  id: string;
  channelId: string;
  sender: string;
  initials: string;
  color: string;
  text: string;
  timestamp: string;
  attachment?: string;
  isMine?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  section: "Genel" | "Projeler";
  memberCount: number;
  unread: number;
}

// ─── Purchasing Types ────────────────────────────────────────────────────────
export type SupplierCategory = "Malzeme" | "Ekipman" | "Hizmet" | "Taşeron";
export type SupplierStatus = "Aktif" | "Pasif";
export type RequestPriority = "Yüksek" | "Orta" | "Düşük";
export type RequestStatus = "Bekliyor" | "Onaylandı" | "Reddedildi";

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  contact: string;
  email: string;
  phone: string;
  rating: number;
  status: SupplierStatus;
}

export interface PurchaseRequest {
  id: string;
  item: string;
  qty: number;
  unitPrice: number;
  project: string;
  priority: RequestPriority;
  status: RequestStatus;
  requestedBy: string;
  date: string;
  description: string;
}

// ─── Inventory Types ─────────────────────────────────────────────────────────
export type StockStatus = "Normal" | "Kritik" | "Tükendi";
export type MovementType = "Giriş" | "Çıkış";

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  threshold: number;
  status: StockStatus;
  project: string;
  value: number;
}

export interface Movement {
  id: string;
  date: string;
  material: string;
  type: MovementType;
  qty: number;
  unit: string;
  project: string;
  recordedBy: string;
}

// ─── Notification Types ──────────────────────────────────────────────────────
export type NotificationType =
  | "task_assigned"
  | "leave_approved"
  | "leave_rejected"
  | "order_status"
  | "low_stock";
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ─── Order Types (Purchasing) ─────────────────────────────────────────────────
export type OrderStatus =
  | "Taslak"
  | "Sipariş Verildi"
  | "Teslim Edildi"
  | "İptal";
export interface Order {
  id: string;
  supplier: string;
  item: string;
  totalAmount: number;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus;
  notes: string;
  fromRequestId?: string;
}

// ─── Document Types ───────────────────────────────────────────────────────────
export interface DocFolder {
  id: string;
  name: string;
  section: string;
  fileCount: number;
}

export interface DocFile {
  id: string;
  name: string;
  type: "PDF" | "DOC" | "IMG" | "XLS";
  size: string;
  uploadedBy: string;
  date: string;
  folderId: string;
}

// ─── Initial Module Data ─────────────────────────────────────────────────────
const INITIAL_HR_PERSONNEL: Personnel[] = [
  {
    id: "1",
    name: "Ahmet Yılmaz",
    role: "Teknik Yönetici",
    department: "Teknik",
    phone: "0532 111 2233",
    email: "ahmet@sirket.com",
    status: "Aktif",
    initials: "AY",
    color: "#7c3aed",
  },
  {
    id: "2",
    name: "Fatma Kaya",
    role: "İdari Yönetici",
    department: "İdari",
    phone: "0535 222 3344",
    email: "fatma@sirket.com",
    status: "Aktif",
    initials: "FK",
    color: "#0891b2",
  },
  {
    id: "3",
    name: "Mehmet Demir",
    role: "Saha Personeli",
    department: "Teknik",
    phone: "0537 333 4455",
    email: "mehmet@sirket.com",
    status: "Aktif",
    initials: "MD",
    color: "#059669",
  },
  {
    id: "4",
    name: "Zeynep Arslan",
    role: "Muhasebe Personeli",
    department: "İdari",
    phone: "0538 444 5566",
    email: "zeynep@sirket.com",
    status: "Aktif",
    initials: "ZA",
    color: "#d97706",
  },
  {
    id: "5",
    name: "Ali Çelik",
    role: "Proje Yöneticisi",
    department: "Teknik",
    phone: "0539 555 6677",
    email: "ali@sirket.com",
    status: "Pasif",
    initials: "AÇ",
    color: "#dc2626",
  },
  {
    id: "6",
    name: "Selin Öztürk",
    role: "İnsan Kaynakları",
    department: "İdari",
    phone: "0541 666 7788",
    email: "selin@sirket.com",
    status: "Aktif",
    initials: "SÖ",
    color: "#be185d",
  },
];

const INITIAL_HR_LEAVES: LeaveRequest[] = [
  {
    id: "1",
    name: "Mehmet Demir",
    type: "Yıllık",
    startDate: "2026-03-20",
    endDate: "2026-03-25",
    status: "Bekliyor",
    note: "Aile ziyareti",
  },
  {
    id: "2",
    name: "Zeynep Arslan",
    type: "Hastalık",
    startDate: "2026-03-14",
    endDate: "2026-03-15",
    status: "Onaylandı",
    note: "Doktor raporu mevcut",
  },
  {
    id: "3",
    name: "Ali Çelik",
    type: "Mazeret",
    startDate: "2026-03-16",
    endDate: "2026-03-16",
    status: "Bekliyor",
    note: "Resmi işlem",
  },
  {
    id: "4",
    name: "Ahmet Yılmaz",
    type: "Yıllık",
    startDate: "2026-04-01",
    endDate: "2026-04-07",
    status: "Onaylandı",
    note: "Tatil",
  },
  {
    id: "5",
    name: "Selin Öztürk",
    type: "Hastalık",
    startDate: "2026-03-13",
    endDate: "2026-03-13",
    status: "Reddedildi",
    note: "",
  },
];

const INITIAL_HR_SHIFTS: ShiftAssignment[] = [
  { day: "Pzt", shift: "sabah", personnel: ["Ahmet Y.", "Mehmet D."] },
  { day: "Pzt", shift: "ogleden", personnel: ["Fatma K."] },
  { day: "Pzt", shift: "gece", personnel: ["Ali Ç."] },
  { day: "Sal", shift: "sabah", personnel: ["Zeynep A.", "Selin Ö."] },
  { day: "Sal", shift: "ogleden", personnel: ["Mehmet D."] },
  { day: "Çar", shift: "sabah", personnel: ["Ahmet Y."] },
  { day: "Per", shift: "sabah", personnel: ["Fatma K.", "Ali Ç."] },
  { day: "Per", shift: "gece", personnel: ["Zeynep A."] },
  { day: "Cum", shift: "sabah", personnel: ["Ahmet Y.", "Selin Ö."] },
  { day: "Cum", shift: "ogleden", personnel: ["Mehmet D."] },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: "e1",
    category: "Malzeme",
    projectId: "p1",
    amount: 85000,
    date: "2026-03-10",
    status: "Onaylandı",
    description: "Çelik profil alımı",
    createdBy: "Mehmet Demir",
  },
  {
    id: "e2",
    category: "İşçilik",
    projectId: "p2",
    amount: 42000,
    date: "2026-03-11",
    status: "Bekliyor",
    description: "Aylık işçilik gideri",
    createdBy: "Ahmet Yılmaz",
  },
  {
    id: "e3",
    category: "Ekipman",
    projectId: "p3",
    amount: 120000,
    date: "2026-03-08",
    status: "Onaylandı",
    description: "Vinç kiralama",
    createdBy: "Ali Çelik",
  },
  {
    id: "e4",
    category: "Ulaşım",
    projectId: "p1",
    amount: 8500,
    date: "2026-03-09",
    status: "Bekliyor",
    description: "Malzeme nakliyesi",
    createdBy: "Fatma Kaya",
  },
  {
    id: "e5",
    category: "Danışmanlık",
    projectId: "p2",
    amount: 18000,
    date: "2026-03-13",
    status: "Bekliyor",
    description: "Mimari danışmanlık hizmeti",
    createdBy: "Fatma Kaya",
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: "i1",
    supplier: "Demirçelik A.Ş.",
    amount: 285000,
    dueDate: "2026-03-25",
    status: "Bekliyor",
    project: "İstanbul Rezidans",
  },
  {
    id: "i2",
    supplier: "İnşaat Malzeme Ltd.",
    amount: 96000,
    dueDate: "2026-03-10",
    status: "Ödendi",
    project: "Ankara Plaza",
  },
  {
    id: "i3",
    supplier: "Teknik Yapı San.",
    amount: 145000,
    dueDate: "2026-03-05",
    status: "Gecikmiş",
    project: "İzmir Liman",
  },
  {
    id: "i4",
    supplier: "Elektrik Sistemleri",
    amount: 52000,
    dueDate: "2026-04-01",
    status: "Bekliyor",
    project: "Bursa Konutları",
  },
  {
    id: "i5",
    supplier: "Yıldız İnşaat Malz.",
    amount: 78000,
    dueDate: "2026-02-28",
    status: "Gecikmiş",
    project: "İstanbul Rezidans",
  },
];

const INITIAL_CHANNELS: Channel[] = [
  {
    id: "genel",
    name: "Şirket Geneli",
    section: "Genel",
    memberCount: 24,
    unread: 3,
  },
  {
    id: "istanbul",
    name: "İstanbul Rezidans",
    section: "Projeler",
    memberCount: 8,
    unread: 1,
  },
  {
    id: "ankara",
    name: "Ankara Plaza",
    section: "Projeler",
    memberCount: 6,
    unread: 0,
  },
  {
    id: "izmir",
    name: "İzmir Liman",
    section: "Projeler",
    memberCount: 11,
    unread: 5,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    channelId: "genel",
    sender: "Ahmet Yılmaz",
    initials: "AY",
    color: "#7c3aed",
    text: "Merhaba ekip! Bu haftaki toplantı Çarşamba saat 14:00'te yapılacak.",
    timestamp: "09:15",
  },
  {
    id: "2",
    channelId: "genel",
    sender: "Fatma Kaya",
    initials: "FK",
    color: "#0891b2",
    text: "Teşekkürler Ahmet Bey, not aldım. Gündem maddeleri paylaşılacak mı?",
    timestamp: "09:22",
  },
  {
    id: "3",
    channelId: "istanbul",
    sender: "Murat Arslan",
    initials: "MA",
    color: "#059669",
    text: "A Blok temel çalışmaları tamamlandı, kontrol için bekliyor.",
    timestamp: "10:05",
  },
  {
    id: "4",
    channelId: "izmir",
    sender: "Kemal Öztürk",
    initials: "KÖ",
    color: "#d97706",
    text: "Liman projesinde malzeme gecikmesi var, tedarikçi ile görüşüyorum.",
    timestamp: "11:30",
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "s1",
    name: "Demirçelik A.Ş.",
    category: "Malzeme",
    contact: "Ahmet Yılmaz",
    email: "info@demircelik.com.tr",
    phone: "+90 212 555 0101",
    rating: 5,
    status: "Aktif",
  },
  {
    id: "s2",
    name: "Yapı Ekipman Ltd.",
    category: "Ekipman",
    contact: "Fatma Kaya",
    email: "info@yapiekipman.com.tr",
    phone: "+90 216 555 0202",
    rating: 4,
    status: "Aktif",
  },
  {
    id: "s3",
    name: "Teknik Hizmetler San.",
    category: "Hizmet",
    contact: "Ali Demir",
    email: "ali@teknikhizmet.com.tr",
    phone: "+90 312 555 0303",
    rating: 3,
    status: "Aktif",
  },
  {
    id: "s4",
    name: "Liman Taşımacılık",
    category: "Taşeron",
    contact: "Mehmet Çelik",
    email: "m.celik@limantasima.com.tr",
    phone: "+90 232 555 0404",
    rating: 4,
    status: "Pasif",
  },
];

const INITIAL_PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id: "r1",
    item: "Çelik Profil 100x100mm",
    qty: 50,
    unitPrice: 850,
    project: "İstanbul Rezidans",
    priority: "Yüksek",
    status: "Onaylandı",
    requestedBy: "Murat Arslan",
    date: "2026-03-14",
    description: "Yüksek katlı çalışmalar için",
  },
  {
    id: "r2",
    item: "Elektrik Kablosu NYY 4x16",
    qty: 500,
    unitPrice: 45,
    project: "Ankara Plaza",
    priority: "Orta",
    status: "Bekliyor",
    requestedBy: "Selin Yıldız",
    date: "2026-03-08",
    description: "2. kat elektrik tesisatı için",
  },
  {
    id: "r3",
    item: "Portland Çimento (50kg)",
    qty: 200,
    unitPrice: 120,
    project: "İzmir Liman",
    priority: "Yüksek",
    status: "Bekliyor",
    requestedBy: "Kemal Öztürk",
    date: "2026-03-12",
    description: "Zemin döşeme çalışmaları için",
  },
  {
    id: "r4",
    item: "Alçıpan Levha 12.5mm",
    qty: 300,
    unitPrice: 180,
    project: "Bursa Konutları",
    priority: "Düşük",
    status: "Reddedildi",
    requestedBy: "Hasan Şahin",
    date: "2026-03-05",
    description: "İç mekan bölme duvarları için",
  },
  {
    id: "r5",
    item: "Vinç Kiralama (Aylık)",
    qty: 1,
    unitPrice: 45000,
    project: "İstanbul Rezidans",
    priority: "Yüksek",
    status: "Onaylandı",
    requestedBy: "Murat Arslan",
    date: "2026-03-14",
    description: "Yüksek katlı çalışmalar için kule vinç kiralama",
  },
];

const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    id: "st1",
    name: "Çelik Profil",
    unit: "ton",
    quantity: 42.5,
    threshold: 10,
    status: "Normal",
    project: "İstanbul Rezidans",
    value: 28000,
  },
  {
    id: "st2",
    name: "Beton",
    unit: "m³",
    quantity: 120,
    threshold: 30,
    status: "Normal",
    project: "Ankara Plaza",
    value: 1800,
  },
  {
    id: "st3",
    name: "Elektrik Kablosu",
    unit: "m",
    quantity: 850,
    threshold: 200,
    status: "Normal",
    project: "İzmir Liman",
    value: 45,
  },
  {
    id: "st4",
    name: "Boya",
    unit: "lt",
    quantity: 35,
    threshold: 50,
    status: "Kritik",
    project: "Bursa Konutları",
    value: 320,
  },
  {
    id: "st5",
    name: "Keresteler",
    unit: "ton",
    quantity: 8.5,
    threshold: 15,
    status: "Kritik",
    project: "İstanbul Rezidans",
    value: 12000,
  },
  {
    id: "st6",
    name: "Cam Panel",
    unit: "adet",
    quantity: 0,
    threshold: 5,
    status: "Tükendi",
    project: "Ankara Plaza",
    value: 4500,
  },
];

const INITIAL_STOCK_MOVEMENTS: Movement[] = [
  {
    id: "m1",
    date: "2026-03-14",
    material: "Çelik Profil",
    type: "Giriş",
    qty: 15,
    unit: "ton",
    project: "İstanbul Rezidans",
    recordedBy: "Murat Arslan",
  },
  {
    id: "m2",
    date: "2026-03-13",
    material: "Beton",
    type: "Çıkış",
    qty: 40,
    unit: "m³",
    project: "Ankara Plaza",
    recordedBy: "Selin Yıldız",
  },
  {
    id: "m3",
    date: "2026-03-12",
    material: "Elektrik Kablosu",
    type: "Giriş",
    qty: 300,
    unit: "m",
    project: "İzmir Liman",
    recordedBy: "Kemal Öztürk",
  },
  {
    id: "m4",
    date: "2026-03-11",
    material: "Boya",
    type: "Çıkış",
    qty: 20,
    unit: "lt",
    project: "Bursa Konutları",
    recordedBy: "Hasan Şahin",
  },
  {
    id: "m5",
    date: "2026-03-10",
    material: "Keresteler",
    type: "Çıkış",
    qty: 3.5,
    unit: "ton",
    project: "İstanbul Rezidans",
    recordedBy: "Murat Arslan",
  },
  {
    id: "m6",
    date: "2026-03-08",
    material: "Çelik Profil",
    type: "Çıkış",
    qty: 8,
    unit: "ton",
    project: "İstanbul Rezidans",
    recordedBy: "Murat Arslan",
  },
  {
    id: "m7",
    date: "2026-03-07",
    material: "Beton",
    type: "Giriş",
    qty: 60,
    unit: "m³",
    project: "Ankara Plaza",
    recordedBy: "Selin Yıldız",
  },
  {
    id: "m8",
    date: "2026-03-05",
    material: "Cam Panel",
    type: "Çıkış",
    qty: 12,
    unit: "adet",
    project: "Ankara Plaza",
    recordedBy: "Kemal Öztürk",
  },
];

const INITIAL_DOC_FOLDERS: DocFolder[] = [
  { id: "f1", name: "Genel Belgeler", section: "Genel", fileCount: 3 },
  { id: "f2", name: "İstanbul Rezidans", section: "Projeler", fileCount: 5 },
  { id: "f3", name: "Ankara Plaza", section: "Projeler", fileCount: 4 },
  { id: "f4", name: "İzmir Liman", section: "Projeler", fileCount: 2 },
  { id: "f5", name: "Bursa Konutları", section: "Projeler", fileCount: 2 },
];

const INITIAL_DOC_FILES: DocFile[] = [
  {
    id: "d1",
    name: "Şirket Yönetmeliği.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadedBy: "Ahmet Y.",
    date: "2024-01-15",
    folderId: "f1",
  },
  {
    id: "d2",
    name: "İş Sağlığı Prosedürü.pdf",
    type: "PDF",
    size: "1.8 MB",
    uploadedBy: "Mehmet K.",
    date: "2024-02-10",
    folderId: "f1",
  },
  {
    id: "d3",
    name: "Organizasyon Şeması.xls",
    type: "XLS",
    size: "512 KB",
    uploadedBy: "Ayşe D.",
    date: "2024-03-05",
    folderId: "f1",
  },
  {
    id: "d4",
    name: "Zemin Etüdü.pdf",
    type: "PDF",
    size: "5.2 MB",
    uploadedBy: "Ali R.",
    date: "2024-01-20",
    folderId: "f2",
  },
  {
    id: "d5",
    name: "Mimari Proje.pdf",
    type: "PDF",
    size: "12.1 MB",
    uploadedBy: "Fatma S.",
    date: "2024-02-14",
    folderId: "f2",
  },
  {
    id: "d6",
    name: "Sözleşme.doc",
    type: "DOC",
    size: "380 KB",
    uploadedBy: "Ahmet Y.",
    date: "2024-03-01",
    folderId: "f2",
  },
];

const MOCK_INVITE_CODES: InviteCode[] = [
  {
    id: "ic1",
    code: "TK2025AB",
    companyId: "c1",
    roleId: "manager",
    subType: "Teknik Yönetici",
    createdAt: "2026-03-01",
    isUsed: false,
  },
  {
    id: "ic2",
    code: "PR2025XY",
    companyId: "c1",
    roleId: "personnel",
    subType: "Teknik Personel",
    createdAt: "2026-03-01",
    isUsed: false,
  },
];

const MOCK_PENDING_INVITES: PendingInvite[] = [
  {
    id: "pi1",
    code: "TK2025AB",
    name: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    companyId: "c1",
    roleId: "manager",
    subType: "Teknik Yönetici",
    createdAt: "2026-03-10",
    status: "pending",
  },
];

function generateCode(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof translations)["tr"];
  user: User | null;
  setUser: (u: User | null) => void;
  companies: Company[];
  setCompanies: (c: Company[]) => void;
  currentCompany: Company | null;
  setCurrentCompany: (c: Company | null) => void;
  currentRole: Role | null;
  setCurrentRole: (r: Role | null) => void;
  activeCompanyId: string | null;
  activeRoleId: string | null;
  activeSubType: string | null;
  setActiveCompany: (companyId: string) => void;
  setActiveRole: (roleId: string, subType?: string) => void;
  pendingInvites: PendingInvite[];
  inviteCodes: InviteCode[];
  generateInviteCode: (
    companyId: string,
    roleId: string,
    subType?: string,
  ) => string;
  applyInviteCode: (code: string, userName: string, email: string) => boolean;
  approveInvite: (inviteId: string) => string | null;
  rejectInvite: (inviteId: string) => void;
  checkPermission: (
    module: string,
    action: "view" | "edit" | "delete",
  ) => boolean;
  projects: Project[];
  setProjects: (p: Project[]) => void;
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  addProject: (p: Omit<Project, "id" | "progress">) => Project;
  addTask: (t: Omit<Task, "id">) => Task;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  taskComments: TaskComment[];
  addTaskComment: (taskId: string, text: string, author: string) => void;
  notificationPreferences: Record<string, boolean>;
  setNotificationPreferences: (prefs: Record<string, boolean>) => void;
  createCompany: (name: string, desc: string) => Company;
  generateLoginCode: () => string;
  workOrders: WorkOrder[];
  setWorkOrders: (w: WorkOrder[]) => void;
  addWorkOrder: (
    w: Omit<WorkOrder, "id" | "createdAt" | "attachments">,
  ) => WorkOrder;
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  fieldInspections: FieldInspection[];
  setFieldInspections: (f: FieldInspection[]) => void;
  addFieldInspection: (f: Omit<FieldInspection, "id">) => FieldInspection;
  updateInspectionItem: (
    inspectionId: string,
    itemId: string,
    checked: boolean,
    note: string,
  ) => void;
  completeInspection: (id: string, notes: string) => void;
  failInspection: (id: string, failureReason: string, notes: string) => void;
  addMember: (companyId: string, member: Omit<MemberEntry, "userId">) => void;
  removeMember: (companyId: string, userId: string) => void;
  updateMemberPermissions: (
    companyId: string,
    userId: string,
    permissions: Record<string, ModulePermissions>,
  ) => void;
  // HR
  hrPersonnel: Personnel[];
  setHrPersonnel: (p: Personnel[]) => void;
  hrLeaves: LeaveRequest[];
  setHrLeaves: (l: LeaveRequest[]) => void;
  hrShifts: ShiftAssignment[];
  setHrShifts: (s: ShiftAssignment[]) => void;
  // Finance
  expenses: Expense[];
  setExpenses: (e: Expense[]) => void;
  invoices: Invoice[];
  setInvoices: (i: Invoice[]) => void;
  // Communication
  channels: Channel[];
  setChannels: (c: Channel[]) => void;
  appMessages: Message[];
  setAppMessages: (m: Message[]) => void;
  // Purchasing
  suppliers: Supplier[];
  setSuppliers: (s: Supplier[]) => void;
  purchaseRequests: PurchaseRequest[];
  setPurchaseRequests: (r: PurchaseRequest[]) => void;
  // Inventory
  stockItems: StockItem[];
  setStockItems: (s: StockItem[]) => void;
  stockMovements: Movement[];
  setStockMovements: (m: Movement[]) => void;
  // Documents
  docFolders: DocFolder[];
  docFiles: DocFile[];
  addDocFile: (file: DocFile) => void;
  deleteDocFile: (fileId: string) => void;
  addDocFolder: (folder: DocFolder) => void;
  // Notifications
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  // Orders (Purchasing)
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deductStock: (
    materialName: string,
    qty: number,
    project: string,
    recordedBy: string,
  ) => void;
  // Profile update
  updateCurrentUser: (
    fields: Partial<{ displayName: string; phone: string; avatar: string }>,
  ) => void;
}

const AppContext = createContext<AppState>(null!);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("pv_lang") as Lang) || "tr",
  );
  const [user, setUserState] = useState<User | null>(() => {
    const s = localStorage.getItem("pv_user");
    return s ? JSON.parse(s) : null;
  });
  const [companies, setCompaniesState] = useState<Company[]>(() => {
    const s = localStorage.getItem("pv_companies");
    return s ? JSON.parse(s) : [];
  });
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(
    () => {
      const s = localStorage.getItem("pv_current_company");
      return s ? JSON.parse(s) : null;
    },
  );
  const [currentRole, setCurrentRoleState] = useState<Role | null>(() => {
    const s = localStorage.getItem("pv_current_role");
    return s ? JSON.parse(s) : null;
  });
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(
    () => localStorage.getItem("pv_active_company") || null,
  );
  const [activeRoleId, setActiveRoleIdState] = useState<string | null>(
    () => localStorage.getItem("pv_active_role") || null,
  );
  const [activeSubType, setActiveSubTypeState] = useState<string | null>(
    () => localStorage.getItem("pv_active_subtype") || null,
  );
  const [projects, setProjectsState] = useState<Project[]>(() => {
    const s = localStorage.getItem("pv_projects");
    return s ? JSON.parse(s) : MOCK_PROJECTS;
  });
  const [tasks, setTasksState] = useState<Task[]>(() => {
    const s = localStorage.getItem("pv_tasks");
    return s ? JSON.parse(s) : MOCK_TASKS;
  });
  const [workOrders, setWorkOrdersState] = useState<WorkOrder[]>(() => {
    const s = localStorage.getItem("pv_work_orders");
    return s ? JSON.parse(s) : MOCK_WORK_ORDERS;
  });
  const [fieldInspections, setFieldInspectionsState] = useState<
    FieldInspection[]
  >(() => {
    const s = localStorage.getItem("pv_inspections");
    return s ? JSON.parse(s) : MOCK_INSPECTIONS;
  });
  const [pendingInvites, setPendingInvitesState] = useState<PendingInvite[]>(
    () => {
      const s = localStorage.getItem("pv_pending_invites");
      return s ? JSON.parse(s) : MOCK_PENDING_INVITES;
    },
  );
  const [inviteCodes, setInviteCodesState] = useState<InviteCode[]>(() => {
    const s = localStorage.getItem("pv_invite_codes");
    return s ? JSON.parse(s) : MOCK_INVITE_CODES;
  });

  function loadCompanyData<T>(cid: string, key: string, fallback: T): T {
    const s = cid ? localStorage.getItem(`pv_${key}_${cid}`) : null;
    return s ? JSON.parse(s) : fallback;
  }

  function saveCompanyData<T>(cid: string | null, key: string, data: T) {
    if (cid) localStorage.setItem(`pv_${key}_${cid}`, JSON.stringify(data));
  }

  const initCid = localStorage.getItem("pv_active_company") || null;

  const [hrPersonnel, setHrPersonnelState] = useState<Personnel[]>(() =>
    initCid
      ? loadCompanyData(initCid, "hr_personnel", INITIAL_HR_PERSONNEL)
      : INITIAL_HR_PERSONNEL,
  );
  const [hrLeaves, setHrLeavesState] = useState<LeaveRequest[]>(() =>
    initCid
      ? loadCompanyData(initCid, "hr_leaves", INITIAL_HR_LEAVES)
      : INITIAL_HR_LEAVES,
  );
  const [hrShifts, setHrShiftsState] = useState<ShiftAssignment[]>(() =>
    initCid
      ? loadCompanyData(initCid, "hr_shifts", INITIAL_HR_SHIFTS)
      : INITIAL_HR_SHIFTS,
  );
  const [expenses, setExpensesState] = useState<Expense[]>(() =>
    initCid
      ? loadCompanyData(initCid, "expenses", INITIAL_EXPENSES)
      : INITIAL_EXPENSES,
  );
  const [invoices, setInvoicesState] = useState<Invoice[]>(() =>
    initCid
      ? loadCompanyData(initCid, "invoices", INITIAL_INVOICES)
      : INITIAL_INVOICES,
  );
  const [channels, setChannelsState] = useState<Channel[]>(() =>
    initCid
      ? loadCompanyData(initCid, "channels", INITIAL_CHANNELS)
      : INITIAL_CHANNELS,
  );
  const [appMessages, setAppMessagesState] = useState<Message[]>(() =>
    initCid
      ? loadCompanyData(initCid, "messages", INITIAL_MESSAGES)
      : INITIAL_MESSAGES,
  );
  const [suppliers, setSuppliersState] = useState<Supplier[]>(() =>
    initCid
      ? loadCompanyData(initCid, "suppliers", INITIAL_SUPPLIERS)
      : INITIAL_SUPPLIERS,
  );
  const [purchaseRequests, setPurchaseRequestsState] = useState<
    PurchaseRequest[]
  >(() =>
    initCid
      ? loadCompanyData(initCid, "purchase_requests", INITIAL_PURCHASE_REQUESTS)
      : INITIAL_PURCHASE_REQUESTS,
  );
  const [stockItems, setStockItemsState] = useState<StockItem[]>(() =>
    initCid
      ? loadCompanyData(initCid, "stock_items", INITIAL_STOCK_ITEMS)
      : INITIAL_STOCK_ITEMS,
  );
  const [stockMovements, setStockMovementsState] = useState<Movement[]>(() =>
    initCid
      ? loadCompanyData(initCid, "stock_movements", INITIAL_STOCK_MOVEMENTS)
      : INITIAL_STOCK_MOVEMENTS,
  );
  const [docFolders, setDocFoldersState] = useState<DocFolder[]>(() =>
    initCid
      ? loadCompanyData(initCid, "doc_folders", INITIAL_DOC_FOLDERS)
      : INITIAL_DOC_FOLDERS,
  );
  const [docFiles, setDocFilesState] = useState<DocFile[]>(() =>
    initCid
      ? loadCompanyData(initCid, "doc_files", INITIAL_DOC_FILES)
      : INITIAL_DOC_FILES,
  );

  const [notifications, setNotificationsState] = useState<Notification[]>(() =>
    initCid ? loadCompanyData(initCid, "notifications", []) : [],
  );
  const [orders, setOrdersState] = useState<Order[]>(() =>
    initCid ? loadCompanyData(initCid, "orders", []) : [],
  );

  const [taskComments, setTaskCommentsState] = useState<TaskComment[]>(() => {
    const s = localStorage.getItem("pv_task_comments");
    return s ? JSON.parse(s) : [];
  });

  const DEFAULT_NOTIFICATION_PREFS: Record<string, boolean> = {
    task_assigned: true,
    leave_approved: true,
    leave_rejected: true,
    order_status: true,
    low_stock: true,
  };
  const [notificationPreferences, setNotificationPreferencesState] = useState<
    Record<string, boolean>
  >(() => {
    const s = localStorage.getItem("pv_notification_prefs");
    return s ? JSON.parse(s) : DEFAULT_NOTIFICATION_PREFS;
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("pv_lang", l);
  };
  const setUser = (u: User | null) => {
    setUserState(u);
    localStorage.setItem("pv_user", JSON.stringify(u));
  };
  const setCompanies = (c: Company[]) => {
    setCompaniesState(c);
    localStorage.setItem("pv_companies", JSON.stringify(c));
  };
  const setCurrentCompany = (c: Company | null) => {
    setCurrentCompanyState(c);
    localStorage.setItem("pv_current_company", JSON.stringify(c));
  };
  const setCurrentRole = (r: Role | null) => {
    setCurrentRoleState(r);
    localStorage.setItem("pv_current_role", JSON.stringify(r));
  };
  const setActiveCompany = (companyId: string) => {
    setActiveCompanyIdState(companyId);
    localStorage.setItem("pv_active_company", companyId);
    // Reload all module states for the new company
    setHrPersonnelState(
      loadCompanyData(companyId, "hr_personnel", INITIAL_HR_PERSONNEL),
    );
    setHrLeavesState(
      loadCompanyData(companyId, "hr_leaves", INITIAL_HR_LEAVES),
    );
    setHrShiftsState(
      loadCompanyData(companyId, "hr_shifts", INITIAL_HR_SHIFTS),
    );
    setExpensesState(loadCompanyData(companyId, "expenses", INITIAL_EXPENSES));
    setInvoicesState(loadCompanyData(companyId, "invoices", INITIAL_INVOICES));
    setChannelsState(loadCompanyData(companyId, "channels", INITIAL_CHANNELS));
    setAppMessagesState(
      loadCompanyData(companyId, "messages", INITIAL_MESSAGES),
    );
    setSuppliersState(
      loadCompanyData(companyId, "suppliers", INITIAL_SUPPLIERS),
    );
    setPurchaseRequestsState(
      loadCompanyData(
        companyId,
        "purchase_requests",
        INITIAL_PURCHASE_REQUESTS,
      ),
    );
    setStockItemsState(
      loadCompanyData(companyId, "stock_items", INITIAL_STOCK_ITEMS),
    );
    setStockMovementsState(
      loadCompanyData(companyId, "stock_movements", INITIAL_STOCK_MOVEMENTS),
    );
    setDocFoldersState(
      loadCompanyData(companyId, "doc_folders", INITIAL_DOC_FOLDERS),
    );
    setDocFilesState(
      loadCompanyData(companyId, "doc_files", INITIAL_DOC_FILES),
    );
    setNotificationsState(loadCompanyData(companyId, "notifications", []));
    setOrdersState(loadCompanyData(companyId, "orders", []));
  };
  const setActiveRole = (roleId: string, subType?: string) => {
    setActiveRoleIdState(roleId);
    localStorage.setItem("pv_active_role", roleId);
    const st = subType || "";
    setActiveSubTypeState(st || null);
    localStorage.setItem("pv_active_subtype", st);
  };
  const setProjects = (p: Project[]) => {
    setProjectsState(p);
    localStorage.setItem("pv_projects", JSON.stringify(p));
  };
  const setTasks = (t: Task[]) => {
    setTasksState(t);
    localStorage.setItem("pv_tasks", JSON.stringify(t));
  };
  const setWorkOrders = (w: WorkOrder[]) => {
    setWorkOrdersState(w);
    localStorage.setItem("pv_work_orders", JSON.stringify(w));
  };
  const setFieldInspections = (f: FieldInspection[]) => {
    setFieldInspectionsState(f);
    localStorage.setItem("pv_inspections", JSON.stringify(f));
  };
  const setPendingInvites = (invites: PendingInvite[]) => {
    setPendingInvitesState(invites);
    localStorage.setItem("pv_pending_invites", JSON.stringify(invites));
  };
  const setInviteCodes = (codes: InviteCode[]) => {
    setInviteCodesState(codes);
    localStorage.setItem("pv_invite_codes", JSON.stringify(codes));
  };

  const setHrPersonnel = (p: Personnel[]) => {
    setHrPersonnelState(p);
    saveCompanyData(activeCompanyId, "hr_personnel", p);
  };
  const setHrLeaves = (l: LeaveRequest[]) => {
    setHrLeavesState(l);
    saveCompanyData(activeCompanyId, "hr_leaves", l);
  };
  const setHrShifts = (s: ShiftAssignment[]) => {
    setHrShiftsState(s);
    saveCompanyData(activeCompanyId, "hr_shifts", s);
  };
  const setExpenses = (e: Expense[]) => {
    setExpensesState(e);
    saveCompanyData(activeCompanyId, "expenses", e);
  };
  const setInvoices = (i: Invoice[]) => {
    setInvoicesState(i);
    saveCompanyData(activeCompanyId, "invoices", i);
  };
  const setChannels = (c: Channel[]) => {
    setChannelsState(c);
    saveCompanyData(activeCompanyId, "channels", c);
  };
  const setAppMessages = (m: Message[]) => {
    setAppMessagesState(m);
    saveCompanyData(activeCompanyId, "messages", m);
  };
  const setSuppliers = (s: Supplier[]) => {
    setSuppliersState(s);
    saveCompanyData(activeCompanyId, "suppliers", s);
  };
  const setPurchaseRequests = (r: PurchaseRequest[]) => {
    setPurchaseRequestsState(r);
    saveCompanyData(activeCompanyId, "purchase_requests", r);
  };
  const setStockItems = (s: StockItem[]) => {
    setStockItemsState(s);
    saveCompanyData(activeCompanyId, "stock_items", s);
  };
  const setStockMovements = (m: Movement[]) => {
    setStockMovementsState(m);
    saveCompanyData(activeCompanyId, "stock_movements", m);
  };

  const addDocFolder = (folder: DocFolder) => {
    const updated = [...docFolders, folder];
    setDocFoldersState(updated);
    saveCompanyData(activeCompanyId, "doc_folders", updated);
  };

  const addDocFile = (file: DocFile) => {
    const updatedFiles = [file, ...docFiles];
    const updatedFolders = docFolders.map((f) =>
      f.id === file.folderId ? { ...f, fileCount: f.fileCount + 1 } : f,
    );
    setDocFilesState(updatedFiles);
    setDocFoldersState(updatedFolders);
    saveCompanyData(activeCompanyId, "doc_files", updatedFiles);
    saveCompanyData(activeCompanyId, "doc_folders", updatedFolders);
  };

  const deleteDocFile = (fileId: string) => {
    const fileToDelete = docFiles.find((f) => f.id === fileId);
    const updatedFiles = docFiles.filter((f) => f.id !== fileId);
    const updatedFolders = fileToDelete
      ? docFolders.map((f) =>
          f.id === fileToDelete.folderId
            ? { ...f, fileCount: Math.max(0, f.fileCount - 1) }
            : f,
        )
      : docFolders;
    setDocFilesState(updatedFiles);
    setDocFoldersState(updatedFolders);
    saveCompanyData(activeCompanyId, "doc_files", updatedFiles);
    saveCompanyData(activeCompanyId, "doc_folders", updatedFolders);
  };

  // ─── Notifications ─────────────────────────────────────────────────────────
  const addNotification = (
    n: Omit<Notification, "id" | "timestamp" | "read">,
  ) => {
    if (notificationPreferences[n.type] === false) return;
    const newN: Notification = {
      ...n,
      id: `n${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updated = [newN, ...notifications];
    setNotificationsState(updated);
    saveCompanyData(activeCompanyId, "notifications", updated);
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    setNotificationsState(updated);
    saveCompanyData(activeCompanyId, "notifications", updated);
  };

  const clearAllNotifications = () => {
    setNotificationsState([]);
    saveCompanyData(activeCompanyId, "notifications", []);
  };

  // ─── Orders ──────────────────────────────────────────────────────────────────
  const addOrder = (order: Order) => {
    const updated = [order, ...orders];
    setOrdersState(updated);
    saveCompanyData(activeCompanyId, "orders", updated);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    const order = orders.find((o) => o.id === id);
    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrdersState(updated);
    saveCompanyData(activeCompanyId, "orders", updated);
    if (status === "İptal" && order) {
      const updatedExpenses = expenses.map((e) =>
        e.description.includes(order.item) && e.status === "Onaylandı"
          ? { ...e, status: "Reddedildi" as ExpenseStatus }
          : e,
      );
      setExpenses(updatedExpenses);
    }
  };

  // ─── Profile Update ──────────────────────────────────────────────────────────
  const updateCurrentUser = (
    fields: Partial<{ displayName: string; phone: string; avatar: string }>,
  ) => {
    if (!user) return;
    const updated = {
      ...user,
      ...("displayName" in fields ? { name: fields.displayName! } : {}),
    };
    if ("phone" in fields) (updated as any).phone = fields.phone;
    if ("avatar" in fields) (updated as any).avatar = fields.avatar;
    setUserState(updated);
    localStorage.setItem("pv_user", JSON.stringify(updated));
  };

  const setNotificationPreferences = (prefs: Record<string, boolean>) => {
    setNotificationPreferencesState(prefs);
    localStorage.setItem("pv_notification_prefs", JSON.stringify(prefs));
  };

  const addTaskComment = (taskId: string, text: string, author: string) => {
    const comment: TaskComment = {
      id: `tc${Date.now()}`,
      taskId,
      text,
      author,
      timestamp: new Date().toISOString(),
      isStatusLog: false,
    };
    const updated = [comment, ...taskComments];
    setTaskCommentsState(updated);
    localStorage.setItem("pv_task_comments", JSON.stringify(updated));
  };

  const deductStock = (
    materialName: string,
    qty: number,
    project: string,
    recordedBy: string,
  ) => {
    const updatedItems = stockItems.map((s) =>
      s.name === materialName && s.project === project
        ? {
            ...s,
            quantity: Math.max(0, s.quantity - qty),
            status: (Math.max(0, s.quantity - qty) === 0
              ? "Tükendi"
              : Math.max(0, s.quantity - qty) <= s.threshold
                ? "Kritik"
                : "Normal") as StockStatus,
          }
        : s,
    );
    setStockItems(updatedItems);
    const movement: Movement = {
      id: `m${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      material: materialName,
      type: "Çıkış",
      qty,
      unit: stockItems.find((s) => s.name === materialName)?.unit || "adet",
      project,
      recordedBy,
    };
    setStockMovements([movement, ...stockMovements]);
    const affected = updatedItems.find(
      (s) => s.name === materialName && s.project === project,
    );
    if (
      affected &&
      (affected.status === "Kritik" || affected.status === "Tükendi")
    ) {
      addNotification({
        type: "low_stock",
        title: "Kritik Stok Uyarısı",
        message: `${materialName} stoğu kritik seviyeye düştü.`,
      });
    }
  };

  const t = translations[lang];

  const addProject = (p: Omit<Project, "id" | "progress">): Project => {
    const newP = { ...p, id: `p${Date.now()}`, progress: 0 };
    setProjects([...projects, newP]);
    return newP;
  };

  const addTask = (t2: Omit<Task, "id">): Task => {
    const newT = { ...t2, id: `t${Date.now()}` };
    setTasks([...tasks, newT]);
    return newT;
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(tasks.map((t2) => (t2.id === id ? { ...t2, status } : t2)));
    const statusLabels: Record<TaskStatus, string> = {
      todo: "Yapılacak",
      in_progress: "Devam Ediyor",
      done: "Tamamlandı",
    };
    const log: TaskComment = {
      id: `tc${Date.now()}`,
      taskId: id,
      text: `Durum değiştirildi: ${statusLabels[status]}`,
      author: "Sistem",
      timestamp: new Date().toISOString(),
      isStatusLog: true,
      statusTo: status,
    };
    const updatedComments = [log, ...taskComments];
    setTaskCommentsState(updatedComments);
    localStorage.setItem("pv_task_comments", JSON.stringify(updatedComments));
  };

  const createCompany = (name: string, desc: string): Company => {
    const ownerMember: MemberEntry = {
      userId: user?.id || "",
      name: user?.name || "",
      loginCode: user?.loginCode || "",
      roleIds: ["owner"],
      permissions: ALL_MODULE_PERMISSIONS,
    };
    const newC: Company = {
      id: `c${Date.now()}`,
      name,
      description: desc,
      logoUrl: "",
      ownerId: user?.id || "",
      activeModules: [
        "dashboard",
        "projects",
        "communication",
        "documents",
        "hr",
        "finance",
      ],
      roles: DEFAULT_ROLES,
      members: [ownerMember],
    };
    const updatedCompanies = [...companies, newC];
    setCompanies(updatedCompanies);
    return newC;
  };

  const generateLoginCode = () => generateCode(16);

  const generateInviteCode = (
    companyId: string,
    roleId: string,
    subType?: string,
  ): string => {
    const code = generateCode(8);
    const newCode: InviteCode = {
      id: `ic${Date.now()}`,
      code,
      companyId,
      roleId,
      subType,
      createdAt: new Date().toISOString().split("T")[0],
      isUsed: false,
    };
    setInviteCodes([...inviteCodes, newCode]);
    return code;
  };

  const applyInviteCode = (
    code: string,
    userName: string,
    email: string,
  ): boolean => {
    const found = inviteCodes.find((ic) => ic.code === code && !ic.isUsed);
    if (!found) return false;
    const newInvite: PendingInvite = {
      id: `pi${Date.now()}`,
      code,
      name: userName,
      email,
      companyId: found.companyId,
      roleId: found.roleId,
      subType: found.subType,
      createdAt: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    setPendingInvites([...pendingInvites, newInvite]);
    setInviteCodes(
      inviteCodes.map((ic) =>
        ic.id === found.id ? { ...ic, isUsed: true, usedBy: userName } : ic,
      ),
    );
    return true;
  };

  const approveInvite = (inviteId: string): string | null => {
    const invite = pendingInvites.find((i) => i.id === inviteId);
    if (!invite) return null;
    const permissions = getDefaultPermissionsByRole(
      invite.roleId,
      invite.subType,
    );
    const loginCode = generateCode(16);
    const newMember: MemberEntry = {
      userId: `u_${invite.email.replace(/@.*/, "")}_${Date.now()}`,
      name: invite.name,
      loginCode,
      roleIds: [invite.roleId],
      subType: invite.subType,
      permissions,
    };
    const updated = companies.map((c) =>
      c.id === invite.companyId
        ? { ...c, members: [...c.members, newMember] }
        : c,
    );
    setCompanies(updated);
    const updatedCurrent = updated.find((c) => c.id === invite.companyId);
    if (updatedCurrent) setCurrentCompany(updatedCurrent);
    setPendingInvites(
      pendingInvites.map((i) =>
        i.id === inviteId
          ? { ...i, status: "approved", approvedLoginCode: loginCode }
          : i,
      ),
    );
    return loginCode;
  };

  const rejectInvite = (inviteId: string) => {
    setPendingInvites(
      pendingInvites.map((i) =>
        i.id === inviteId ? { ...i, status: "rejected" } : i,
      ),
    );
  };

  const checkPermission = (
    module: string,
    action: "view" | "edit" | "delete",
  ): boolean => {
    if (activeRoleId === "owner") return true;
    if (!activeCompanyId || !user) return false;
    const company = companies.find((c) => c.id === activeCompanyId);
    if (!company) return false;
    const member = company.members.find((m) => m.userId === user.id);
    if (!member) return false;
    return !!member.permissions?.[module]?.[action];
  };

  const addWorkOrder = (
    w: Omit<WorkOrder, "id" | "createdAt" | "attachments">,
  ): WorkOrder => {
    const newW: WorkOrder = {
      ...w,
      id: `wo${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      attachments: [],
    };
    setWorkOrders([...workOrders, newW]);
    return newW;
  };

  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders(
      workOrders.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    );
  };

  const updateWorkOrderStatus = (id: string, status: WorkOrderStatus) => {
    setWorkOrders(workOrders.map((w) => (w.id === id ? { ...w, status } : w)));
  };

  const addFieldInspection = (
    f: Omit<FieldInspection, "id">,
  ): FieldInspection => {
    const newF: FieldInspection = { ...f, id: `fi${Date.now()}` };
    setFieldInspections([...fieldInspections, newF]);
    return newF;
  };

  const updateInspectionItem = (
    inspectionId: string,
    itemId: string,
    checked: boolean,
    note: string,
  ) => {
    setFieldInspections(
      fieldInspections.map((f) =>
        f.id === inspectionId
          ? {
              ...f,
              items: f.items.map((i) =>
                i.id === itemId ? { ...i, checked, note } : i,
              ),
            }
          : f,
      ),
    );
  };

  const completeInspection = (id: string, notes: string) => {
    setFieldInspections(
      fieldInspections.map((f) =>
        f.id === id
          ? {
              ...f,
              status: "completed" as InspectionStatus,
              notes,
              completedAt: new Date().toISOString().split("T")[0],
            }
          : f,
      ),
    );
  };
  const failInspection = (id: string, failureReason: string, notes: string) => {
    setFieldInspections(
      fieldInspections.map((f) =>
        f.id === id
          ? {
              ...f,
              status: "failed" as InspectionStatus,
              notes,
              failureReason,
              completedAt: new Date().toISOString().split("T")[0],
            }
          : f,
      ),
    );
  };

  const addMember = (
    companyId: string,
    member: Omit<MemberEntry, "userId">,
  ) => {
    const newMember: MemberEntry = {
      ...member,
      userId: `u_${member.loginCode}`,
    };
    const updated = companies.map((c) =>
      c.id === companyId ? { ...c, members: [...c.members, newMember] } : c,
    );
    setCompanies(updated);
    const updatedCurrent = updated.find((c) => c.id === companyId);
    if (updatedCurrent) setCurrentCompany(updatedCurrent);
  };

  const removeMember = (companyId: string, userId: string) => {
    const updated = companies.map((c) =>
      c.id === companyId
        ? { ...c, members: c.members.filter((m) => m.userId !== userId) }
        : c,
    );
    setCompanies(updated);
    const updatedCurrent = updated.find((c) => c.id === companyId);
    if (updatedCurrent) setCurrentCompany(updatedCurrent);
  };

  const updateMemberPermissions = (
    companyId: string,
    userId: string,
    permissions: Record<string, ModulePermissions>,
  ) => {
    const updated = companies.map((c) =>
      c.id === companyId
        ? {
            ...c,
            members: c.members.map((m) =>
              m.userId === userId ? { ...m, permissions } : m,
            ),
          }
        : c,
    );
    setCompanies(updated);
    const updatedCurrent = updated.find((c) => c.id === companyId);
    if (updatedCurrent) setCurrentCompany(updatedCurrent);
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        user,
        setUser,
        companies,
        setCompanies,
        currentCompany,
        setCurrentCompany,
        currentRole,
        setCurrentRole,
        activeCompanyId,
        activeRoleId,
        activeSubType,
        setActiveCompany,
        setActiveRole,
        pendingInvites,
        inviteCodes,
        generateInviteCode,
        applyInviteCode,
        approveInvite,
        rejectInvite,
        checkPermission,
        projects,
        setProjects,
        tasks,
        setTasks,
        addProject,
        addTask,
        updateTaskStatus,
        taskComments,
        addTaskComment,
        notificationPreferences,
        setNotificationPreferences,
        createCompany,
        generateLoginCode,
        workOrders,
        setWorkOrders,
        addWorkOrder,
        updateWorkOrderStatus,
        updateWorkOrder,
        fieldInspections,
        setFieldInspections,
        addFieldInspection,
        updateInspectionItem,
        completeInspection,
        failInspection,
        addMember,
        removeMember,
        updateMemberPermissions,
        hrPersonnel,
        setHrPersonnel,
        hrLeaves,
        setHrLeaves,
        hrShifts,
        setHrShifts,
        expenses,
        setExpenses,
        invoices,
        setInvoices,
        channels,
        setChannels,
        appMessages,
        setAppMessages,
        suppliers,
        setSuppliers,
        purchaseRequests,
        setPurchaseRequests,
        stockItems,
        setStockItems,
        stockMovements,
        setStockMovements,
        docFolders,
        docFiles,
        addDocFile,
        deleteDocFile,
        addDocFolder,
        notifications,
        addNotification,
        markNotificationRead,
        clearAllNotifications,
        orders,
        addOrder,
        updateOrderStatus,
        deductStock,
        updateCurrentUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
