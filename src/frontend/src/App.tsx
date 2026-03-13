import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Layout from "./components/Layout";
import {
  type AccountType,
  AppProvider,
  type Company,
  type Role,
  useApp,
} from "./contexts/AppContext";
import AccountTypeSelect from "./pages/AccountTypeSelect";
import Communication from "./pages/Communication";
import CompanySelect from "./pages/CompanySelect";
import CompanySettings from "./pages/CompanySettings";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import FieldOps from "./pages/FieldOps";
import Finance from "./pages/Finance";
import HumanResources from "./pages/HumanResources";
import InviteJoin from "./pages/InviteJoin";
import LanguageSelect from "./pages/LanguageSelect";
import Login from "./pages/Login";
import PendingApproval from "./pages/PendingApproval";
import Profile from "./pages/Profile";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import RoleSelect from "./pages/RoleSelect";
import RoleSettings from "./pages/RoleSettings";

type Screen =
  | "lang"
  | "accountTypeSelect"
  | "login"
  | "inviteJoin"
  | "pendingApproval"
  | "company"
  | "role"
  | "app";
type AppPage =
  | "dashboard"
  | "projects"
  | "project-detail"
  | "settings"
  | "roles"
  | "profile"
  | "fieldOps"
  | "hr"
  | "communication"
  | "finance"
  | "documents";

function Inner() {
  const {
    setCurrentCompany,
    setCurrentRole,
    setActiveCompany,
    setActiveRole,
    pendingInvites,
    inviteCodes,
    user,
  } = useApp();
  const [screen, setScreen] = useState<Screen>(() => {
    if (!localStorage.getItem("pv_lang")) return "lang";
    const userStr = localStorage.getItem("pv_user");
    const u = userStr ? JSON.parse(userStr) : null;
    if (!u) return "accountTypeSelect";
    if (!JSON.parse(localStorage.getItem("pv_current_company") || "null"))
      return "company";
    if (!JSON.parse(localStorage.getItem("pv_current_role") || "null"))
      return "role";
    return "app";
  });
  const [selectedAccountType, setSelectedAccountType] =
    useState<AccountType>("owner");
  const [page, setPage] = useState<AppPage>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [pendingCompany, setPendingCompany] = useState<Company | null>(null);
  const [pendingInviteInfo, setPendingInviteInfo] = useState<{
    companyId?: string;
    roleId?: string;
    subType?: string;
  }>({});

  const handleLangSelect = () => setScreen("accountTypeSelect");

  const handleAccountTypeSelect = (type: AccountType) => {
    setSelectedAccountType(type);
    if (type === "owner") {
      setScreen("login");
    } else {
      // Show invite join page for non-owners
      setScreen("inviteJoin");
    }
  };

  const handleLogin = () => {
    // After login set active company/role if user has companies
    const companiesStr = localStorage.getItem("pv_companies");
    const companiesList = companiesStr ? JSON.parse(companiesStr) : [];
    const userStr = localStorage.getItem("pv_user");
    const u = userStr ? JSON.parse(userStr) : null;
    if (u && companiesList.length > 0) {
      const userCompanies = companiesList.filter((c: Company) =>
        c.members.some((m: { userId: string }) => m.userId === u.id),
      );
      if (userCompanies.length > 0) {
        setActiveCompany(userCompanies[0].id);
        const member = userCompanies[0].members.find(
          (m: { userId: string; roleIds: string[] }) => m.userId === u.id,
        );
        if (member?.roleIds?.includes("owner")) {
          setActiveRole("owner");
        }
      }
    }
    setScreen("company");
  };

  const handleInviteLogin = () => {
    // Existing account login for non-owner
    setScreen("login");
  };

  const handleInviteJoin = (
    companyId: string,
    roleId: string,
    subType?: string,
  ) => {
    setPendingInviteInfo({ companyId, roleId, subType });
    setScreen("pendingApproval");
  };

  const handleCompanySelect = (company: Company) => {
    setCurrentCompany(company);
    setPendingCompany(company);
    setActiveCompany(company.id);
    // Check if owner
    const userStr = localStorage.getItem("pv_user");
    const u = userStr ? JSON.parse(userStr) : null;
    if (u) {
      const member = company.members.find((m) => m.userId === u.id);
      if (member?.roleIds?.includes("owner") || company.ownerId === u.id) {
        setActiveRole("owner");
      }
    }
    setScreen("role");
  };

  const handleRoleSelect = (role: Role) => {
    setCurrentRole(role);
    // Map role id to activeRole
    const roleId =
      role.id === "owner"
        ? "owner"
        : role.id === "manager"
          ? "manager"
          : role.id === "staff" || role.id === "pm" || role.id === "supervisor"
            ? "personnel"
            : role.id === "subcontractor"
              ? "subcontractor"
              : role.id;
    setActiveRole(roleId);
    setScreen("app");
  };

  const handleLogout = () => {
    setCurrentCompany(null);
    setCurrentRole(null);
    setScreen("company");
  };

  const handlePendingLogout = () => {
    setScreen("accountTypeSelect");
  };

  const handlePendingCheck = () => {
    // Check if invite has been approved
    const invitesStr = localStorage.getItem("pv_pending_invites");
    const invites = invitesStr ? JSON.parse(invitesStr) : pendingInvites;
    const lastInvite = invites
      .filter(
        (i: { companyId?: string; status: string }) =>
          i.companyId === pendingInviteInfo.companyId,
      )
      .pop();
    if (lastInvite?.status === "approved") {
      setScreen("login");
    }
    // else stay on pending
  };

  const handleNavigate = (p: string) => {
    if (p === "settings") setPage("settings");
    else if (p === "roles") setPage("roles");
    else if (p === "profile") setPage("profile");
    else if (p === "fieldOps") setPage("fieldOps");
    else if (p === "hr") setPage("hr");
    else if (p === "communication") setPage("communication");
    else if (p === "finance") setPage("finance");
    else if (p === "documents") setPage("documents");
    else setPage(p as AppPage);
  };

  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id);
    setPage("project-detail");
  };

  // Silence unused var warning
  void inviteCodes;
  void user;

  if (screen === "lang") return <LanguageSelect onSelect={handleLangSelect} />;
  if (screen === "accountTypeSelect")
    return <AccountTypeSelect onSelect={handleAccountTypeSelect} />;
  if (screen === "inviteJoin")
    return (
      <InviteJoin
        accountType={selectedAccountType}
        onLogin={handleInviteLogin}
        onJoined={handleInviteJoin}
      />
    );
  if (screen === "login")
    return <Login onLogin={handleLogin} accountType={selectedAccountType} />;
  if (screen === "pendingApproval")
    return (
      <PendingApproval
        inviteCompanyId={pendingInviteInfo.companyId}
        inviteRole={pendingInviteInfo.roleId}
        inviteSubType={pendingInviteInfo.subType}
        onLogout={handlePendingLogout}
        onCheck={handlePendingCheck}
      />
    );
  if (screen === "company")
    return <CompanySelect onSelect={handleCompanySelect} />;
  if (screen === "role" && pendingCompany)
    return <RoleSelect company={pendingCompany} onSelect={handleRoleSelect} />;

  return (
    <Layout
      currentPage={page === "project-detail" ? "projects" : page}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {page === "dashboard" && <Dashboard />}
      {page === "projects" && <Projects onOpenProject={handleOpenProject} />}
      {page === "project-detail" && selectedProjectId && (
        <ProjectDetail
          projectId={selectedProjectId}
          onBack={() => setPage("projects")}
        />
      )}
      {page === "settings" && <CompanySettings />}
      {page === "roles" && <RoleSettings />}
      {page === "profile" && <Profile />}
      {page === "fieldOps" && <FieldOps onNavigate={handleNavigate} />}
      {page === "hr" && <HumanResources />}
      {page === "communication" && <Communication />}
      {page === "finance" && <Finance />}
      {page === "documents" && <Documents />}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Inner />
      <Toaster />
    </AppProvider>
  );
}
