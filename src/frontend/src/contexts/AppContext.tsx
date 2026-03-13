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
  approveInvite: (inviteId: string) => void;
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
  createCompany: (name: string, desc: string) => Company;
  generateLoginCode: () => string;
  workOrders: WorkOrder[];
  setWorkOrders: (w: WorkOrder[]) => void;
  addWorkOrder: (
    w: Omit<WorkOrder, "id" | "createdAt" | "attachments">,
  ) => WorkOrder;
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus) => void;
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
  addMember: (companyId: string, member: Omit<MemberEntry, "userId">) => void;
  removeMember: (companyId: string, userId: string) => void;
  updateMemberPermissions: (
    companyId: string,
    userId: string,
    permissions: Record<string, ModulePermissions>,
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

  const approveInvite = (inviteId: string) => {
    const invite = pendingInvites.find((i) => i.id === inviteId);
    if (!invite) return;
    const permissions = getDefaultPermissionsByRole(
      invite.roleId,
      invite.subType,
    );
    const newMember: MemberEntry = {
      userId: `u_${invite.email.replace(/@.*/, "")}_${Date.now()}`,
      name: invite.name,
      loginCode: generateCode(16),
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
        i.id === inviteId ? { ...i, status: "approved" } : i,
      ),
    );
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
        createCompany,
        generateLoginCode,
        workOrders,
        setWorkOrders,
        addWorkOrder,
        updateWorkOrderStatus,
        fieldInspections,
        setFieldInspections,
        addFieldInspection,
        updateInspectionItem,
        completeInspection,
        addMember,
        removeMember,
        updateMemberPermissions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
