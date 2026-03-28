import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Camera,
  Car,
  CheckSquare,
  ChevronRight,
  ClipboardCheck,
  ClipboardEdit,
  ClipboardList,
  Clock,
  DollarSign,
  Download,
  FileCheck,
  FileSignature,
  FileText,
  Flame,
  FolderKanban,
  GitBranch,
  Globe,
  Handshake,
  HardHat,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  Leaf,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Network,
  Package,
  PenTool,
  Scale,
  Scan,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Siren,
  Star,
  Store,
  Target,
  TrendingUp,
  Truck,
  User,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ROLE_HIERARCHY, useApp } from "../contexts/AppContext";
import { useIsMobile } from "../hooks/use-mobile";
import { useFavorites } from "../hooks/useFavorites";
import { LANGUAGES, type Lang } from "../i18n/translations";

// Maps nav module key to the module id used in permissions
const MODULE_KEY_MAP: Record<string, string> = {
  dashboard: "dashboard",
  projects: "projects",
  fieldOps: "fieldOps",
  hr: "hr",
  finance: "finance",
  documents: "documents",
  settings: "settings",
};

// Which modules are visible per role (if no specific permission set)
const ROLE_DEFAULT_MODULES: Record<string, string[]> = {
  owner: [
    "dashboard",
    "projects",
    "fieldOps",
    "hr",
    "finance",
    "documents",
    "communication",
    "purchasing",
    "inventory",
    "qualitySafety",
    "crm",
    "subcontractors",
    "resourceCalendar",
    "equipment",
    "reporting",
    "settings",
  ],
  manager_teknik: [
    "dashboard",
    "projects",
    "fieldOps",
    "purchasing",
    "inventory",
    "reporting",
    "settings",
  ],
  manager_idari: [
    "dashboard",
    "projects",
    "hr",
    "finance",
    "documents",
    "purchasing",
    "inventory",
    "reporting",
    "settings",
  ],
  personnel_teknik: ["dashboard", "projects", "fieldOps"],
  personnel_idari: ["dashboard", "hr", "documents"],
  subcontractor: ["fieldOps", "projects"],
};

const NAV_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: "ANA MENÜ",
    keys: [
      "dashboard",
      "projects",
      "fieldOps",
      "communication",
      "documents",
      "projectTemplates",
      "projectHub",
    ],
  },
  {
    label: "OPERASYONLAR",
    keys: [
      "hr",
      "finance",
      "purchasing",
      "inventory",
      "equipment",
      "subcontractors",
      "resourceCalendar",
      "isg",
      "quotes",
      "contracts",
      "insurance",
      "bankAccounts",
      "timesheet",
      "approvalWorkflows",
      "holidayCalendar",
      "employeeSurveys",
      "projectFinancing",
      "vehicleFleet",
      "workflowAutomation",
      "ocrScanning",
      "isEmriYonetimi",
      "energyTracking",
      "procurementSchedule",
    ],
  },
  {
    label: "PROJE KONTROLÜ",
    keys: [
      "siteLog",
      "drawings",
      "meetings",
      "punchList",
      "materialRequests",
      "materialSubmittals",
      "stakeholderMatrix",
      "shipments",
      "siteAccess",
      "environmentalManagement",
      "correspondence",
      "dlp",
      "boqLibrary",
      "emergencyPlan",
      "supplyChainAnalysis",
      "supplierPortal",
      "siteAlarms",
      "legalCorrespondence",
      "locationMap",
      "projectCalendar",
      "sahaDenetimFormu",
      "customFormBuilder",
      "constructionSupervision",
    ],
  },
  {
    label: "ANALİTİK",
    keys: [
      "reporting",
      "qualitySafety",
      "crm",
      "riskRegister",
      "clientReport",
      "customerPortal",
      "kpiTargets",
      "portfolioManagement",
      "qualityManual",
      "costControl",
      "biAnalytics",
      "projectPL",
      "projectStatusReport",
    ],
  },
  {
    label: "GENEL",
    keys: ["sitePhotos", "permits", "selfService"],
  },
];

interface NavItem {
  key: string;
  icon: ReactNode;
  label: string;
  href: string;
  available: boolean;
}

function NavList({
  items,
  currentPage,
  onNavigate,
  sidebarOpen,
  t,
  isFavorite,
  onToggleFavorite,
}: {
  items: NavItem[];
  currentPage: string;
  onNavigate: (page: string) => void;
  sidebarOpen: boolean;
  t: Record<string, string>;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string, name: string, icon: string) => void;
}) {
  const itemMap = Object.fromEntries(items.map((item) => [item.key, item]));
  return (
    <>
      {NAV_GROUPS.map((group) => {
        const groupItems = group.keys.map((k) => itemMap[k]).filter(Boolean);
        if (groupItems.length === 0) return null;
        return (
          <div key={group.label}>
            {sidebarOpen && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {group.label}
              </p>
            )}
            {groupItems.map((item) => (
              <div key={item.key} className="group relative flex items-center">
                <button
                  type="button"
                  data-ocid={`sidebar.${item.href}_link`}
                  onClick={() => item.available && onNavigate(item.href)}
                  className={`sidebar-item flex-1 ${
                    currentPage === item.href ? "active" : ""
                  } ${!item.available ? "opacity-50 cursor-default" : "cursor-pointer"}`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {!item.available && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground"
                        >
                          {t.comingSoon}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
                {sidebarOpen && item.available && (
                  <button
                    type="button"
                    data-ocid={`sidebar.${item.href}_favorite_toggle`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.key, item.label, item.key);
                    }}
                    className={[
                      "absolute right-2 p-0.5 rounded transition-all",
                      isFavorite(item.key)
                        ? "opacity-100 text-amber-400"
                        : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-amber-400",
                    ].join(" ")}
                    title={
                      isFavorite(item.key)
                        ? "Favorilerden çıkar"
                        : "Favorilere ekle"
                    }
                  >
                    <Star
                      className={[
                        "w-3 h-3",
                        isFavorite(item.key) ? "fill-amber-400" : "",
                      ].join(" ")}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

export default function Layout({
  children,
  currentPage,
  onNavigate,
  onLogout,
}: {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}) {
  const {
    t,
    setLang,
    lang,
    user,
    currentCompany,
    currentRole,
    companies,
    activeRoleId,
    activeSubType,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    projects,
    tasks,
    hrPersonnel,
    suppliers,
    crmContacts,
    stockItems,
    certificates,
    invoices,
    hakedisItems,
    isgKkd,
  } = useApp();

  // Smart auto-alerts derived from context data
  const smartAlerts = useMemo(() => {
    if (!currentCompany) return [];
    const companyId = currentCompany.id;
    const today = new Date();
    const in30 = new Date(today);
    in30.setDate(today.getDate() + 30);
    const alerts: Array<{
      id: string;
      icon: string;
      message: string;
      type: string;
    }> = [];

    // Certificate expiry (30 days)
    if (Array.isArray(certificates)) {
      for (const cert of certificates) {
        if (cert.companyId !== companyId) continue;
        if (!cert.expiryDate) continue;
        const exp = new Date(cert.expiryDate);
        if (exp > today && exp <= in30) {
          const daysLeft = Math.ceil(
            (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          alerts.push({
            id: `cert_${cert.id}`,
            icon: "⚠️",
            message: `${cert.personnelName || "Personel"} sertifikası ${daysLeft} gün içinde sona eriyor`,
            type: "warning",
          });
        }
      }
    }

    // Overdue tasks
    if (Array.isArray(tasks)) {
      for (const task of tasks) {
        if (task.status === "done") continue;
        if (!task.dueDate) continue;
        if (new Date(task.dueDate) < today) {
          alerts.push({
            id: `task_${task.id}`,
            icon: "🔴",
            message: `"${task.title}" görevi gecikti`,
            type: "error",
          });
        }
      }
    }

    // Pending invoices (status: "Bekliyor")
    if (Array.isArray(invoices)) {
      for (const inv of invoices) {
        if (inv.status === "Bekliyor") {
          alerts.push({
            id: `inv_${inv.id}`,
            icon: "💳",
            message: `${inv.supplier || "Fatura"} - ${inv.amount ? `₺${inv.amount.toLocaleString("tr-TR")}` : ""} onay bekliyor`,
            type: "info",
          });
        }
      }
    }

    // Pending hakediş
    if (Array.isArray(hakedisItems)) {
      for (const hak of hakedisItems) {
        if (hak.companyId !== companyId) continue;
        if (hak.status === "Onay Bekliyor") {
          alerts.push({
            id: `hak_${hak.id}`,
            icon: "📋",
            message: `"${hak.projectName || "Proje"}" hakedişi onay bekliyor`,
            type: "info",
          });
        }
      }
    }

    // KKD expiry (30 days)
    if (Array.isArray(isgKkd)) {
      for (const kkd of isgKkd) {
        if (kkd.companyId !== companyId) continue;
        if (!kkd.expiryDate) continue;
        const exp = new Date(kkd.expiryDate);
        if (exp > today && exp <= in30) {
          alerts.push({
            id: `kkd_${kkd.id}`,
            icon: "🦺",
            message: `${kkd.personnelName || "Personel"} KKD'si yenilenmeli`,
            type: "warning",
          });
        }
      }
    }

    // Critical stock
    if (Array.isArray(stockItems)) {
      for (const item of stockItems) {
        if (item.threshold != null && item.quantity <= item.threshold) {
          alerts.push({
            id: `stock_${item.id}`,
            icon: "📦",
            message: `"${item.name}" kritik stok seviyesinde (${item.quantity} ${item.unit || "adet"})`,
            type: "warning",
          });
        }
      }
    }

    return alerts;
  }, [
    currentCompany,
    certificates,
    tasks,
    invoices,
    hakedisItems,
    isgKkd,
    stockItems,
  ]);

  // Read alert IDs from localStorage
  const alertReadKey = `readNotifications_${currentCompany?.id || "default"}`;
  const [readAlertIds, setReadAlertIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(alertReadKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const unreadSmartCount = smartAlerts.filter(
    (a) => !readAlertIds.includes(a.id),
  ).length;
  const unreadCount =
    notifications.filter((n) => !n.read).length + unreadSmartCount;

  const markAllAlertsRead = () => {
    const allIds = smartAlerts.map((a) => a.id);
    setReadAlertIds(allIds);
    localStorage.setItem(alertReadKey, JSON.stringify(allIds));
    clearAllNotifications();
  };
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };
  const [searchQuery, setSearchQuery] = useState("");

  type SearchResult = {
    category: string;
    icon: string;
    title: string;
    subtitle: string;
    href: string;
  };
  const searchResults = useMemo<SearchResult[]>(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const out: SearchResult[] = [];
    for (const p of projects) {
      if (
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
        out.push({
          category: "Projeler",
          icon: "📁",
          title: p.title,
          subtitle: "Projeler",
          href: "#/projects",
        });
    }
    for (const t of tasks) {
      if (t.title?.toLowerCase().includes(q))
        out.push({
          category: "Görevler",
          icon: "✅",
          title: t.title,
          subtitle: "Görevler",
          href: "#/projects",
        });
    }
    for (const p of hrPersonnel) {
      if (
        p.name?.toLowerCase().includes(q) ||
        p.role?.toLowerCase().includes(q)
      )
        out.push({
          category: "Personel",
          icon: "👤",
          title: p.name,
          subtitle: p.role || "İnsan Kaynakları",
          href: "#/hr",
        });
    }
    for (const s of suppliers) {
      if (s.name?.toLowerCase().includes(q))
        out.push({
          category: "Tedarikçiler",
          icon: "🏭",
          title: s.name,
          subtitle: "Satın Alma",
          href: "#/purchasing",
        });
    }
    for (const c of crmContacts) {
      if (
        c.name?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
      )
        out.push({
          category: "CRM Kişileri",
          icon: "🤝",
          title: c.name,
          subtitle: c.company || "CRM",
          href: "#/crm",
        });
    }
    for (const s of stockItems) {
      if (s.name?.toLowerCase().includes(q))
        out.push({
          category: "Stok",
          icon: "📦",
          title: s.name,
          subtitle: "Envanter",
          href: "#/inventory",
        });
    }
    return out;
  }, [
    searchQuery,
    projects,
    tasks,
    hrPersonnel,
    suppliers,
    crmContacts,
    stockItems,
  ]);

  const searchGrouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of searchResults) {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    }
    return groups;
  }, [searchResults]);

  // Find current user's member entry for permission checks
  const memberEntry = currentCompany?.members?.find(
    (m) => m.userId === user?.id,
  );
  const isOwner =
    activeRoleId === "owner" ||
    memberEntry?.roleIds?.includes("owner") ||
    currentCompany?.ownerId === user?.id;

  // Determine role key for default module visibility
  const getRoleKey = (): string => {
    if (isOwner) return "owner";
    if (activeRoleId === "manager") {
      if (activeSubType?.includes("Teknik")) return "manager_teknik";
      return "manager_idari";
    }
    if (activeRoleId === "personnel") {
      if (activeSubType?.includes("Teknik")) return "personnel_teknik";
      return "personnel_idari";
    }
    if (activeRoleId === "subcontractor") return "subcontractor";
    return "owner"; // fallback
  };

  const canViewModule = (moduleKey: string): boolean => {
    if (isOwner) return true;
    if (!memberEntry) {
      const roleKey = getRoleKey();
      return ROLE_DEFAULT_MODULES[roleKey]?.includes(moduleKey) ?? false;
    }
    const modId = MODULE_KEY_MAP[moduleKey];
    if (!modId) return true;
    return !!memberEntry.permissions?.[modId]?.view;
  };

  const navItems: NavItem[] = [
    {
      key: "dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: t.dashboard,
      href: "dashboard",
      available: true,
    },
    {
      key: "projects",
      icon: <FolderKanban className="w-4 h-4" />,
      label: t.projects,
      href: "projects",
      available: true,
    },
    {
      key: "fieldOps",
      icon: <HardHat className="w-4 h-4" />,
      label: t.fieldOps,
      href: "fieldOps",
      available: true,
    },
    {
      key: "communication",
      icon: <MessageSquare className="w-4 h-4" />,
      label: t.communication,
      href: "communication",
      available: true,
    },
    {
      key: "documents",
      icon: <FileText className="w-4 h-4" />,
      label: t.documents,
      href: "documents",
      available: true,
    },
    {
      key: "quotes",
      icon: <FileSignature className="w-4 h-4" />,
      label: "Teklif & Keşif",
      href: "quotes",
      available: true,
    },
    {
      key: "hr",
      icon: <Users className="w-4 h-4" />,
      label: t.hr,
      href: "hr",
      available: true,
    },
    {
      key: "finance",
      icon: <DollarSign className="w-4 h-4" />,
      label: t.finance,
      href: "finance",
      available: true,
    },
    {
      key: "bankAccounts",
      icon: <Building2 className="w-4 h-4" />,
      label: "Banka & Kasa",
      href: "bankAccounts",
      available: true,
    },
    {
      key: "purchasing",
      icon: <ShoppingCart className="w-4 h-4" />,
      label: t.purchasing,
      href: "purchasing",
      available: true,
    },
    {
      key: "inventory",
      icon: <Package className="w-4 h-4" />,
      label: t.inventory,
      href: "inventory",
      available: true,
    },
    {
      key: "shipments",
      icon: <Truck className="w-4 h-4" />,
      label: "Sevkiyat Takibi",
      href: "shipments",
      available: true,
    },
    {
      key: "qualitySafety",
      icon: <Shield className="w-4 h-4" />,
      label: t.qualitySafety,
      href: "qualitySafety",
      available: true,
    },
    {
      key: "equipment",
      icon: <Truck className="w-4 h-4" />,
      label: "Araç & Ekipman",
      href: "equipment",
      available: true,
    },
    {
      key: "subcontractors",
      icon: <Wrench className="w-4 h-4" />,
      label: "Taşeron Yönetimi",
      href: "subcontractors",
      available: true,
    },
    {
      key: "crm",
      icon: <Handshake className="w-4 h-4" />,
      label: t.crm,
      href: "crm",
      available: true,
    },
    {
      key: "reporting",
      icon: <BarChart3 className="w-4 h-4" />,
      label: t.reports,
      href: "reporting",
      available: true,
    },
    {
      key: "siteLog",
      icon: <ClipboardList className="w-4 h-4" />,
      label: "Şantiye Logu",
      href: "siteLog",
      available: true,
    },
    {
      key: "drawings",
      icon: <PenTool className="w-4 h-4" />,
      label: "Çizim & Planlar",
      href: "drawings",
      available: true,
    },
    {
      key: "meetings",
      icon: <CalendarCheck className="w-4 h-4" />,
      label: "Toplantı Tutanakları",
      href: "meetings",
      available: true,
    },
    {
      key: "punchList",
      icon: <CheckSquare className="w-4 h-4" />,
      label: "Punch List",
      href: "punchList",
      available: true,
    },
    {
      key: "resourceCalendar",
      icon: <CalendarRange className="w-4 h-4" />,
      label: "Kaynak Takvimi",
      href: "resourceCalendar",
      available: true,
    },
    {
      key: "isg",
      icon: <ShieldCheck className="w-4 h-4" />,
      label: "İSG",
      href: "isg",
      available: true,
    },
    {
      key: "siteAccess",
      icon: <MapPin className="w-4 h-4" />,
      label: "Şantiye Girişi",
      href: "siteAccess",
      available: true,
    },
    {
      key: "riskRegister",
      icon: <AlertTriangle className="w-4 h-4" />,
      label: "Risk Kaydı",
      href: "riskRegister",
      available: true,
    },
    {
      key: "contracts",
      icon: <FileText className="w-4 h-4" />,
      label: "Sözleşme Yönetimi",
      href: "contracts",
      available: true,
    },
    {
      key: "materialRequests",
      icon: <ClipboardList className="w-4 h-4" />,
      label: "Malzeme Talep & RFI",
      href: "materialRequests",
      available: true,
    },
    {
      key: "materialSubmittals",
      icon: <CheckSquare className="w-4 h-4" />,
      label: "Malzeme Onay Talepleri",
      href: "materialSubmittals",
      available: true,
    },
    {
      key: "stakeholderMatrix",
      icon: <Users className="w-4 h-4" />,
      label: "Paydaş Matrisi",
      href: "stakeholderMatrix",
      available: true,
    },
    {
      key: "projectCalendar",
      icon: <Calendar className="w-4 h-4" />,
      label: "Proje Takvimi",
      href: "projectCalendar",
      available: true,
    },
    {
      key: "clientReport",
      icon: <BarChart3 className="w-4 h-4" />,
      label: "Müşteri Raporu",
      href: "clientReport",
      available: true,
    },
    {
      key: "customerPortal",
      icon: <Globe className="w-4 h-4" />,
      label: "Müşteri Portalı",
      href: "customerPortal",
      available: true,
    },
    {
      key: "sitePhotos",
      icon: <Camera className="w-4 h-4" />,
      label: "Şantiye Fotoğrafları",
      href: "sitePhotos",
      available: true,
    },
    {
      key: "permits",
      icon: <FileCheck className="w-4 h-4" />,
      label: "Ruhsat Takibi",
      href: "permits",
      available: true,
    },
    {
      key: "selfService",
      icon: <User className="w-4 h-4" />,
      label: "Öz Servis",
      href: "selfService",
      available: true,
    },
    {
      key: "correspondence",
      icon: <Mail className="w-4 h-4" />,
      label: "Resmi Yazışma",
      href: "correspondence",
      available: true,
    },
    {
      key: "insurance",
      icon: <Shield className="w-4 h-4" />,
      label: "Sigorta & Garanti",
      href: "insurance",
      available: true,
    },
    {
      key: "dlp",
      icon: <ShieldAlert className="w-4 h-4" />,
      label: "DLP Takibi",
      href: "dlp",
      available: true,
    },
    {
      key: "projectTemplates",
      icon: <LayoutTemplate className="w-4 h-4" />,
      label: "Proje Şablonları",
      href: "projectTemplates",
      available: true,
    },
    {
      key: "timesheet",
      icon: <Clock className="w-4 h-4" />,
      label: "Zaman Çizelgesi",
      href: "timesheet",
      available: true,
    },
    {
      key: "approvalWorkflows",
      icon: <GitBranch className="w-4 h-4" />,
      label: "Onay Akışları",
      href: "approvalWorkflows",
      available: true,
    },
    {
      key: "kpiTargets",
      icon: <Target className="w-4 h-4" />,
      label: "KPI Hedefleri",
      href: "kpiTargets",
      available: true,
    },
    {
      key: "projectHub",
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: "Proje Hub",
      href: "projectHub",
      available: true,
    },
    {
      key: "holidayCalendar",
      icon: <CalendarDays className="w-4 h-4" />,
      label: "Tatil Takvimi",
      href: "holidayCalendar",
      available: true,
    },
    {
      key: "boqLibrary",
      icon: <BookOpen className="w-4 h-4" />,
      label: "Metraj/BoQ",
      href: "boqLibrary",
      available: true,
    },
    {
      key: "environmentalManagement",
      icon: <Leaf className="w-4 h-4" />,
      label: "Çevre & Atık",
      href: "environmentalManagement",
      available: true,
    },
    {
      key: "portfolioManagement",
      icon: <Briefcase className="w-4 h-4" />,
      label: "Portföy Yönetimi",
      href: "portfolioManagement",
      available: true,
    },
    {
      key: "qualityManual",
      icon: <BookMarked className="w-4 h-4" />,
      label: "Kalite El Kitabı",
      href: "qualityManual",
      available: true,
    },
    {
      key: "emergencyPlan",
      icon: <Siren className="w-4 h-4" />,
      label: "Acil Durum Planı",
      href: "emergencyPlan",
      available: true,
    },
    {
      key: "employeeSurveys",
      icon: <ClipboardCheck className="w-4 h-4" />,
      label: "Anket & Geri Bildirim",
      href: "employeeSurveys",
      available: true,
    },
    {
      key: "supplyChainAnalysis",
      icon: <Network className="w-4 h-4" />,
      label: "Tedarik Zinciri",
      href: "supplyChainAnalysis",
      available: true,
    },
    {
      key: "supplierPortal",
      icon: <Store className="w-4 h-4" />,
      label: "Tedarikçi Portalı",
      href: "supplierPortal",
      available: true,
    },
    {
      key: "costControl",
      icon: <Calculator className="w-4 h-4" />,
      label: "Maliyet Kontrol",
      href: "costControl",
      available: true,
    },
    {
      key: "projectFinancing",
      icon: <Landmark className="w-4 h-4" />,
      label: "Finansman & Teminat",
      href: "projectFinancing",
      available: true,
    },
    {
      key: "vehicleFleet",
      icon: <Car className="w-4 h-4" />,
      label: "Araç Filosu",
      href: "vehicleFleet",
      available: true,
    },
    {
      key: "biAnalytics",
      icon: <TrendingUp className="w-4 h-4" />,
      label: "BI & Trend Analizi",
      href: "biAnalytics",
      available: true,
    },
    {
      key: "projectPL",
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Proje P&L (Kar/Zarar)",
      href: "projectPL",
      available: true,
    },
    {
      key: "siteAlarms",
      icon: <Siren className="w-4 h-4" />,
      label: "Saha Alarmları",
      href: "siteAlarms",
      available: true,
    },
    {
      key: "legalCorrespondence",
      icon: <Scale className="w-4 h-4" />,
      label: "Hukuki Yazışma",
      href: "legalCorrespondence",
      available: true,
    },
    {
      key: "locationMap",
      icon: <MapPin className="w-4 h-4" />,
      label: "Harita & Konumlar",
      href: "locationMap",
      available: true,
    },
    {
      key: "workflowAutomation",
      icon: <Zap className="w-4 h-4" />,
      label: "İş Akışı Otomasyonu",
      href: "workflowAutomation",
      available: true,
    },
    {
      key: "ocrScanning",
      icon: <Scan className="w-4 h-4" />,
      label: "Belge Tarama (OCR)",
      href: "ocrScanning",
      available: true,
    },
    {
      key: "isEmriYonetimi",
      icon: <ClipboardList className="w-4 h-4" />,
      label: "İş Emirleri",
      href: "isEmriYonetimi",
      available: true,
    },
    {
      key: "energyTracking",
      icon: <Flame className="w-4 h-4" />,
      label: "Enerji & Kaynak Tüketimi",
      href: "energyTracking",
      available: true,
    },
    {
      key: "sahaDenetimFormu",
      icon: <ClipboardCheck className="w-4 h-4" />,
      label: "Saha Denetim Formu",
      href: "sahaDenetimFormu",
      available: true,
    },
    {
      key: "customFormBuilder",
      icon: <ClipboardEdit className="w-4 h-4" />,
      label: "Özel Form Şablonları",
      href: "customFormBuilder",
      available: true,
    },
    {
      key: "constructionSupervision",
      icon: <Building2 className="w-4 h-4" />,
      label: "Yapı Denetim Takibi",
      href: "constructionSupervision",
      available: true,
    },
    {
      key: "projectStatusReport",
      icon: <FileText className="w-4 h-4" />,
      label: "Proje Durum Raporu",
      href: "projectStatusReport",
      available: true,
    },
  ];

  // Filter nav items by permission for non-owners
  const visibleNavItems = navItems.filter((item) => canViewModule(item.key));

  // Favorites
  const { isFavorite, toggleFavorite } = useFavorites(
    currentCompany?.id,
    user?.id,
  );

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  // Role display info
  const roleInfo = ROLE_HIERARCHY.find(
    (r) => r.id === (activeRoleId || currentRole?.id),
  );
  const roleBadgeColor = roleInfo?.color || "#888";
  const roleName = isOwner
    ? "Şirket Sahibi"
    : roleInfo?.name || currentRole?.name || "";

  // Multi-company check
  const userCompanies = companies.filter((c) =>
    c.members.some((m) => m.userId === user?.id),
  );
  const hasMultipleCompanies = userCompanies.length > 1;

  const sidebarContent = (
    <>
      <div
        className="sidebar-logo-area flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: "oklch(0.20 0.018 245)" }}
      >
        <div
          className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0"
          style={{ boxShadow: "0 0 12px oklch(0.74 0.18 52 / 0.35)" }}
        >
          <span
            className="font-bold text-sm"
            style={{ color: "oklch(0.12 0.01 52)" }}
          >
            PV
          </span>
        </div>
        <span className="font-bold text-lg gradient-text">ProjectVerse</span>
      </div>

      <div
        className="px-4 py-3 border-b space-y-2"
        style={{ borderColor: "oklch(0.20 0.018 245)" }}
      >
        {currentCompany && (
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              {currentCompany.name}
            </p>
          </div>
        )}
        {roleName && (
          <Badge
            data-ocid="sidebar.role_badge"
            className="text-xs"
            style={{
              backgroundColor: `${roleBadgeColor}33`,
              color: roleBadgeColor,
              border: `1px solid ${roleBadgeColor}55`,
            }}
          >
            {roleName}
          </Badge>
        )}
        {activeSubType && (
          <p className="text-xs" style={{ color: "oklch(0.52 0.012 245)" }}>
            {activeSubType}
          </p>
        )}
        <div className="flex gap-1 flex-wrap">
          {hasMultipleCompanies && (
            <Button
              data-ocid="sidebar.change_company_button"
              size="sm"
              variant="outline"
              onClick={onLogout}
              className="text-[10px] h-6 px-2 border-border text-muted-foreground hover:text-foreground"
            >
              Şirket Değiştir
            </Button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavList
          items={visibleNavItems}
          currentPage={currentPage}
          onNavigate={(page) => {
            onNavigate(page);
            setMobileSheetOpen(false);
          }}
          sidebarOpen={true}
          t={t as unknown as Record<string, string>}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      </nav>

      <div
        className="px-3 py-3 border-t space-y-1"
        style={{ borderColor: "oklch(0.20 0.018 245)" }}
      >
        {canViewModule("settings") && (
          <button
            type="button"
            data-ocid="sidebar.settings_link"
            onClick={() => {
              onNavigate("settings");
              setMobileSheetOpen(false);
            }}
            className={`sidebar-item w-full cursor-pointer ${
              currentPage === "settings" ? "active" : ""
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{t.settings}</span>
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside
          className={`flex-shrink-0 flex flex-col transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-16"
          }`}
          style={{
            background: "oklch(0.11 0.02 245)",
            borderRight: "1px solid oklch(0.20 0.018 245)",
          }}
        >
          <div
            className="sidebar-logo-area flex items-center gap-3 px-4 py-5 border-b"
            style={{ borderColor: "oklch(0.20 0.018 245)" }}
          >
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">PV</span>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg gradient-text">
                ProjectVerse
              </span>
            )}
          </div>

          {sidebarOpen && (
            <div
              className="px-4 py-3 border-b space-y-2"
              style={{ borderColor: "oklch(0.20 0.018 245)" }}
            >
              {currentCompany && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">
                    {currentCompany.name}
                  </p>
                </div>
              )}
              {roleName && (
                <Badge
                  data-ocid="sidebar.role_badge"
                  className="text-xs"
                  style={{
                    backgroundColor: `${roleBadgeColor}33`,
                    color: roleBadgeColor,
                    border: `1px solid ${roleBadgeColor}55`,
                  }}
                >
                  {roleName}
                </Badge>
              )}
              {activeSubType && (
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.52 0.012 245)" }}
                >
                  {activeSubType}
                </p>
              )}
              <div className="flex gap-1 flex-wrap">
                {hasMultipleCompanies && (
                  <Button
                    data-ocid="sidebar.change_company_button"
                    size="sm"
                    variant="outline"
                    onClick={onLogout}
                    className="text-[10px] h-6 px-2 border-border text-muted-foreground hover:text-foreground"
                  >
                    Şirket Değiştir
                  </Button>
                )}
              </div>
            </div>
          )}

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <NavList
              items={visibleNavItems}
              currentPage={currentPage}
              onNavigate={onNavigate}
              sidebarOpen={sidebarOpen}
              t={t as unknown as Record<string, string>}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          </nav>

          <div
            className="px-3 py-3 border-t space-y-1"
            style={{ borderColor: "oklch(0.20 0.018 245)" }}
          >
            {canViewModule("settings") && (
              <button
                type="button"
                data-ocid="sidebar.settings_link"
                onClick={() => onNavigate("settings")}
                className={`sidebar-item w-full cursor-pointer ${
                  currentPage === "settings" ? "active" : ""
                }`}
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="flex-1 text-left">{t.settings}</span>
                )}
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Mobile Sheet drawer */}
      {isMobile && (
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent
            side="left"
            className="p-0 w-72 flex flex-col"
            style={{
              background: "oklch(0.11 0.02 245)",
              border: "none",
            }}
          >
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header
          className="flex items-center justify-between px-4 md:px-6 py-4 border-b flex-shrink-0"
          style={{
            background: "oklch(0.11 0.02 245)",
            borderColor: "oklch(0.20 0.018 245)",
          }}
        >
          <div className="flex items-center gap-3">
            {isMobile ? (
              <Button
                data-ocid="sidebar.mobile_toggle"
                variant="ghost"
                size="icon"
                onClick={() => setMobileSheetOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Menu className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-muted-foreground hover:text-foreground"
              >
                {sidebarOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </Button>
            )}
            {isMobile && (
              <span className="font-bold text-base gradient-text">
                ProjectVerse
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {installPrompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInstall}
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                title="Uygulamayı Yükle"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline ml-1 text-xs">Yükle</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              data-ocid="layout.search_button"
              onClick={() => setSearchOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Globe className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-card border-border"
              >
                {LANGUAGES.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => setLang(l.code as Lang)}
                    className={`cursor-pointer ${lang === l.code ? "text-primary" : ""}`}
                  >
                    <span className="mr-2">{l.flag}</span>
                    {l.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-ocid="layout.notifications_button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                data-ocid="layout.notifications_dropdown"
                align="end"
                className="bg-card border-border w-80 overflow-hidden p-0"
              >
                {/* Header */}
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-border sticky top-0 bg-card z-10">
                  <span className="text-sm font-semibold text-foreground">
                    Bildirimler
                    {unreadCount > 0 && (
                      <span
                        className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{
                          background: "oklch(0.65 0.22 25 / 0.2)",
                          color: "oklch(0.65 0.22 25)",
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </span>
                  {(smartAlerts.length > 0 || notifications.length > 0) && (
                    <button
                      type="button"
                      onClick={markAllAlertsRead}
                      data-ocid="layout.notifications_mark_read.button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Tümünü okundu işaretle
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {/* Smart alerts */}
                  {smartAlerts.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                          Otomatik Uyarılar
                        </span>
                        <div className="flex-1 h-px bg-border/40" />
                      </div>
                      {smartAlerts.slice(0, 8).map((alert) => {
                        const isRead = readAlertIds.includes(alert.id);
                        return (
                          <DropdownMenuItem
                            key={alert.id}
                            className={`cursor-pointer flex items-start gap-2 py-2.5 px-3 ${!isRead ? "bg-primary/5" : ""}`}
                            onClick={() => {
                              const newIds = [...readAlertIds, alert.id];
                              setReadAlertIds(newIds);
                              localStorage.setItem(
                                alertReadKey,
                                JSON.stringify(newIds),
                              );
                            }}
                            data-ocid="layout.smart_alert.item"
                          >
                            {!isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                            <span className="text-base flex-shrink-0">
                              {alert.icon}
                            </span>
                            <span className="text-xs text-foreground leading-relaxed flex-1">
                              {alert.message}
                            </span>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  )}

                  {/* Manual notifications */}
                  {notifications.length > 0 &&
                    (() => {
                      const now = new Date();
                      const startOfToday = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                      );
                      const startOfWeek = new Date(startOfToday);
                      startOfWeek.setDate(startOfToday.getDate() - 7);
                      const groups = [
                        {
                          label: "Bugün",
                          items: notifications.filter(
                            (n) => new Date(n.timestamp) >= startOfToday,
                          ),
                        },
                        {
                          label: "Bu Hafta",
                          items: notifications.filter(
                            (n) =>
                              new Date(n.timestamp) >= startOfWeek &&
                              new Date(n.timestamp) < startOfToday,
                          ),
                        },
                        {
                          label: "Daha Önce",
                          items: notifications.filter(
                            (n) => new Date(n.timestamp) < startOfWeek,
                          ),
                        },
                      ].filter((g) => g.items.length > 0);
                      return groups.map((group) => (
                        <div key={group.label}>
                          <div className="px-3 py-1.5 flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                              {group.label}
                            </span>
                            <div className="flex-1 h-px bg-border/40" />
                          </div>
                          {group.items.slice(0, 5).map((n) => (
                            <DropdownMenuItem
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className={`cursor-pointer flex flex-col items-start gap-0.5 py-2.5 px-3 ${!n.read ? "bg-primary/5" : ""}`}
                            >
                              <div className="flex items-center gap-2 w-full">
                                {!n.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                )}
                                <span className="text-xs font-semibold text-foreground truncate flex-1">
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                  {new Date(n.timestamp).toLocaleDateString(
                                    "tr-TR",
                                    { day: "2-digit", month: "short" },
                                  )}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground line-clamp-2 pl-3.5">
                                {n.message}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      ));
                    })()}

                  {/* Empty state */}
                  {smartAlerts.length === 0 && notifications.length === 0 && (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      Bildirim yok
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs gradient-bg text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {user?.name}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-card border-border"
              >
                <DropdownMenuItem
                  onClick={() => onNavigate("profile")}
                  className="cursor-pointer"
                >
                  <User className="w-4 h-4 mr-2" />
                  {t.profile}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* ─── Global Search Dialog ─── */}
      <Dialog
        open={searchOpen}
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (!open) setSearchQuery("");
        }}
      >
        <DialogContent
          data-ocid="layout.search_dialog"
          className="p-0 gap-0 overflow-hidden max-w-xl"
          style={{
            background: "oklch(0.13 0.018 245)",
            border: "1px solid oklch(0.22 0.018 245)",
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: "oklch(0.22 0.018 245)" }}
          >
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              data-ocid="layout.search_input"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Proje, personel, tedarikçi ara..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-8 p-0"
            />
          </div>
          <ScrollArea className="max-h-[400px]">
            {searchQuery.length < 2 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Aramak için en az 2 karakter girin
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                &quot;{searchQuery}&quot; için sonuç bulunamadı
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(searchGrouped).map(([cat, items]) => (
                  <div key={cat}>
                    <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {cat}
                    </div>
                    {items.map((item) => (
                      <button
                        type="button"
                        key={`${item.category}-${item.title}`}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/20 transition-colors"
                        onClick={() => {
                          window.location.href = item.href;
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <span className="text-base">{item.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.subtitle}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
