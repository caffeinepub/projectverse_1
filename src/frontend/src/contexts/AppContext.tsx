import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
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
  purchasing: { view: true, edit: true, delete: true },
  inventory: { view: true, edit: true, delete: true },
  communication: { view: true, edit: true, delete: true },
  reporting: { view: true, edit: true, delete: true },
  qualitySafety: { view: true, edit: true, delete: true },
  crm: { view: true, edit: true, delete: true },
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
        purchasing: { view: true, edit: true, delete: false },
        inventory: { view: true, edit: true, delete: false },
        communication: { view: true, edit: true, delete: false },
        reporting: { view: true, edit: true, delete: false },
        qualitySafety: { view: true, edit: true, delete: false },
        crm: { view: true, edit: true, delete: false },
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
      purchasing: { view: true, edit: true, delete: false },
      inventory: { view: true, edit: true, delete: false },
      communication: { view: true, edit: true, delete: false },
      reporting: { view: true, edit: true, delete: false },
      qualitySafety: { view: true, edit: true, delete: false },
      crm: { view: true, edit: true, delete: false },
    };
  }
  if (roleId === "personnel") {
    if (subType?.includes("Teknik")) {
      return {
        dashboard: { view: true, edit: false, delete: false },
        projects: { view: true, edit: true, delete: false },
        fieldOps: { view: true, edit: true, delete: false },
        purchasing: { view: true, edit: false, delete: false },
        inventory: { view: true, edit: false, delete: false },
        communication: { view: true, edit: true, delete: false },
        reporting: { view: true, edit: false, delete: false },
        qualitySafety: { view: true, edit: false, delete: false },
        crm: { view: true, edit: false, delete: false },
      };
    }
    // İdari
    return {
      dashboard: { view: true, edit: false, delete: false },
      hr: { view: true, edit: true, delete: false },
      documents: { view: true, edit: true, delete: false },
      purchasing: { view: true, edit: false, delete: false },
      inventory: { view: true, edit: false, delete: false },
      communication: { view: true, edit: true, delete: false },
      reporting: { view: true, edit: false, delete: false },
      qualitySafety: { view: true, edit: false, delete: false },
      crm: { view: true, edit: false, delete: false },
    };
  }
  if (roleId === "subcontractor") {
    return {
      fieldOps: { view: true, edit: false, delete: false },
      projects: { view: true, edit: false, delete: false },
      communication: { view: true, edit: false, delete: false },
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

const MOCK_PROJECTS: Project[] = [];

const MOCK_TASKS: Task[] = [];

const MOCK_WORK_ORDERS: WorkOrder[] = [];

const MOCK_INSPECTIONS: FieldInspection[] = [];

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
  annualLeaveBalance?: number;
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
  projectId?: string;
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
const INITIAL_HR_PERSONNEL: Personnel[] = [];

const INITIAL_HR_LEAVES: LeaveRequest[] = [];

const INITIAL_HR_SHIFTS: ShiftAssignment[] = [];

const INITIAL_EXPENSES: Expense[] = [];

const INITIAL_INVOICES: Invoice[] = [];

const INITIAL_CHANNELS: Channel[] = [];

const INITIAL_MESSAGES: Message[] = [];

const INITIAL_SUPPLIERS: Supplier[] = [];

const INITIAL_PURCHASE_REQUESTS: PurchaseRequest[] = [];

const INITIAL_STOCK_ITEMS: StockItem[] = [];

const INITIAL_STOCK_MOVEMENTS: Movement[] = [];

const INITIAL_DOC_FOLDERS: DocFolder[] = [];

const INITIAL_DOC_FILES: DocFile[] = [];

const MOCK_INVITE_CODES: InviteCode[] = [];

const MOCK_PENDING_INVITES: PendingInvite[] = [];

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
  updateOrder: (id: string, updates: Partial<Order>) => void;
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
  // One-time demo data cleanup
  useEffect(() => {
    const cleaned = localStorage.getItem("pv_demo_cleaned_v1");
    if (!cleaned) {
      const keepKeys = new Set([
        "pv_companies",
        "pv_current_company",
        "pv_current_role",
        "pv_active_company",
        "pv_active_role",
        "pv_active_subtype",
        "pv_lang",
        "pv_invite_codes",
        "pv_pending_invites",
        "pv_user",
      ]);
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith("pv_") && !keepKeys.has(k)) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem("pv_demo_cleaned_v1", "1");
    }
  }, []);

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
    const cid = localStorage.getItem("pv_active_company");
    const s = cid ? localStorage.getItem(`pv_projects_${cid}`) : null;
    return s ? JSON.parse(s) : MOCK_PROJECTS;
  });
  const [tasks, setTasksState] = useState<Task[]>(() => {
    const cid = localStorage.getItem("pv_active_company");
    const s = cid ? localStorage.getItem(`pv_tasks_${cid}`) : null;
    return s ? JSON.parse(s) : MOCK_TASKS;
  });
  const [workOrders, setWorkOrdersState] = useState<WorkOrder[]>(() => {
    const cid = localStorage.getItem("pv_active_company");
    const s = cid ? localStorage.getItem(`pv_work_orders_${cid}`) : null;
    return s ? JSON.parse(s) : MOCK_WORK_ORDERS;
  });
  const [fieldInspections, setFieldInspectionsState] = useState<
    FieldInspection[]
  >(() => {
    const cid = localStorage.getItem("pv_active_company");
    const s = cid ? localStorage.getItem(`pv_inspections_${cid}`) : null;
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
    const cid = localStorage.getItem("pv_active_company");
    const s = cid ? localStorage.getItem(`pv_task_comments_${cid}`) : null;
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
    setProjectsState(loadCompanyData(companyId, "projects", MOCK_PROJECTS));
    setTasksState(loadCompanyData(companyId, "tasks", MOCK_TASKS));
    setWorkOrdersState(
      loadCompanyData(companyId, "work_orders", MOCK_WORK_ORDERS),
    );
    setFieldInspectionsState(
      loadCompanyData(companyId, "inspections", MOCK_INSPECTIONS),
    );
    const tc = localStorage.getItem(`pv_task_comments_${companyId}`);
    setTaskCommentsState(tc ? JSON.parse(tc) : []);
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
    saveCompanyData(activeCompanyId, "projects", p);
  };
  const setTasks = (t: Task[]) => {
    setTasksState(t);
    saveCompanyData(activeCompanyId, "tasks", t);
  };
  const setWorkOrders = (w: WorkOrder[]) => {
    setWorkOrdersState(w);
    saveCompanyData(activeCompanyId, "work_orders", w);
  };
  const setFieldInspections = (f: FieldInspection[]) => {
    setFieldInspectionsState(f);
    saveCompanyData(activeCompanyId, "inspections", f);
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

  const updateOrder = (id: string, updates: Partial<Order>) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, ...updates } : o));
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
    if (activeCompanyId)
      localStorage.setItem(
        `pv_task_comments_${activeCompanyId}`,
        JSON.stringify(updated),
      );
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
    if (activeCompanyId)
      localStorage.setItem(
        `pv_task_comments_${activeCompanyId}`,
        JSON.stringify(updatedComments),
      );
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
        updateOrder,
        deductStock,
        updateCurrentUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
