import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Settings,
  Shield,
  ShoppingCart,
  User,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { ROLE_HIERARCHY, useApp } from "../contexts/AppContext";
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
    "reports",
    "settings",
  ],
  manager_teknik: ["dashboard", "projects", "fieldOps", "settings"],
  manager_idari: [
    "dashboard",
    "projects",
    "hr",
    "finance",
    "documents",
    "settings",
  ],
  personnel_teknik: ["dashboard", "projects", "fieldOps"],
  personnel_idari: ["dashboard", "hr", "documents"],
  subcontractor: ["fieldOps", "projects"],
};

interface NavItem {
  key: string;
  icon: ReactNode;
  label: string;
  href: string;
  available: boolean;
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
  } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      // Use role-based defaults if no member entry
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
      available: false,
    },
    {
      key: "inventory",
      icon: <Package className="w-4 h-4" />,
      label: t.inventory,
      href: "inventory",
      available: false,
    },
    {
      key: "qualitySafety",
      icon: <Shield className="w-4 h-4" />,
      label: t.qualitySafety,
      href: "qualitySafety",
      available: false,
    },
    {
      key: "crm",
      icon: <Handshake className="w-4 h-4" />,
      label: t.crm,
      href: "crm",
      available: false,
    },
    {
      key: "reports",
      icon: <BarChart3 className="w-4 h-4" />,
      label: t.reports,
      href: "reports",
      available: false,
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={`flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"}`}
        style={{
          background: "oklch(0.16 0.01 264)",
          borderRight: "1px solid oklch(0.26 0.01 264)",
        }}
      >
        <div
          className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: "oklch(0.26 0.01 264)" }}
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
            style={{ borderColor: "oklch(0.26 0.01 264)" }}
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
              <p className="text-xs" style={{ color: "oklch(0.55 0.04 264)" }}>
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
          {visibleNavItems.map((item) => (
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
        </nav>

        <div
          className="px-3 py-3 border-t space-y-1"
          style={{ borderColor: "oklch(0.26 0.01 264)" }}
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{
            background: "oklch(0.16 0.01 264)",
            borderColor: "oklch(0.26 0.01 264)",
          }}
        >
          <div className="flex items-center gap-3">
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
          </div>

          <div className="flex items-center gap-3">
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

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </Button>

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

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
