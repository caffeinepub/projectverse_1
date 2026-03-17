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
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  DollarSign,
  FileText,
  FolderKanban,
  Globe,
  Handshake,
  HardHat,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { ROLE_HIERARCHY, useApp } from "../contexts/AppContext";
import { useIsMobile } from "../hooks/use-mobile";
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
    keys: ["dashboard", "projects", "fieldOps", "communication", "documents"],
  },
  {
    label: "OPERASYONLAR",
    keys: ["hr", "finance", "purchasing", "inventory", "subcontractors"],
  },
  { label: "ANALİTİK", keys: ["reporting", "qualitySafety", "crm"] },
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
}: {
  items: NavItem[];
  currentPage: string;
  onNavigate: (page: string) => void;
  sidebarOpen: boolean;
  t: Record<string, string>;
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
              <button
                key={item.key}
                type="button"
                data-ocid={`sidebar.${item.href}_link`}
                onClick={() => item.available && onNavigate(item.href)}
                className={`sidebar-item w-full ${
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
  } = useApp();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
      key: "qualitySafety",
      icon: <Shield className="w-4 h-4" />,
      label: t.qualitySafety,
      href: "qualitySafety",
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
  ];

  // Filter nav items by permission for non-owners
  const visibleNavItems = navItems.filter((item) => canViewModule(item.key));

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
                className="bg-card border-border w-80 max-h-96 overflow-y-auto"
              >
                <div className="px-3 py-2 flex items-center justify-between border-b border-border">
                  <span className="text-sm font-semibold text-foreground">
                    Bildirimler
                  </span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Tümünü temizle
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Bildirim yok
                  </div>
                ) : (
                  (() => {
                    const now = new Date();
                    const startOfToday = new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      now.getDate(),
                    );
                    const startOfWeek = new Date(startOfToday);
                    startOfWeek.setDate(startOfToday.getDate() - 7);
                    const groups: {
                      label: string;
                      items: typeof notifications;
                    }[] = [
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
                                  {
                                    day: "2-digit",
                                    month: "short",
                                  },
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
                  })()
                )}
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
