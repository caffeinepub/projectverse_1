import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Layout from "./components/Layout";
import {
  type AccountType,
  AppProvider,
  type Company,
  type Role,
  type User,
  useApp,
} from "./contexts/AppContext";
import AccountTypeSelect from "./pages/AccountTypeSelect";
import ApprovalWorkflows from "./pages/ApprovalWorkflows";
import BIAnalytics from "./pages/BIAnalytics";
import BankAccounts from "./pages/BankAccounts";
import BoQLibrary from "./pages/BoQLibrary";
import CRM from "./pages/CRM";
import ClientReport from "./pages/ClientReport";
import Communication from "./pages/Communication";
import CompanySelect from "./pages/CompanySelect";
import CompanySettings from "./pages/CompanySettings";
import ConstructionSupervision from "./pages/ConstructionSupervision";
import Contracts from "./pages/Contracts";
import Correspondence from "./pages/Correspondence";
import CostCenterPage from "./pages/CostCenterPage";
import CostControl from "./pages/CostControl";
import CustomFormBuilder from "./pages/CustomFormBuilder";
import CustomerPortal from "./pages/CustomerPortal";
import DLP from "./pages/DLP";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Drawings from "./pages/Drawings";
import EmergencyPlan from "./pages/EmergencyPlan";
import EmployeeSurveys from "./pages/EmployeeSurveys";
import EnergyTracking from "./pages/EnergyTracking";
import EnvironmentalManagement from "./pages/EnvironmentalManagement";
import Equipment from "./pages/Equipment";
import FieldOps from "./pages/FieldOps";
import Finance from "./pages/Finance";
import HolidayCalendar from "./pages/HolidayCalendar";
import HumanResources from "./pages/HumanResources";
import ISG from "./pages/ISG";
import Insurance from "./pages/Insurance";
import Inventory from "./pages/Inventory";
import InviteJoin from "./pages/InviteJoin";
import IsEmriYonetimi from "./pages/IsEmriYonetimi";
import KPITargets from "./pages/KPITargets";
import KickoffChecklist from "./pages/KickoffChecklist";
import LanguageSelect from "./pages/LanguageSelect";
import LegalCorrespondence from "./pages/LegalCorrespondence";
import LocationMap from "./pages/LocationMap";
import Login from "./pages/Login";
import MaterialRequests from "./pages/MaterialRequests";
import MaterialSubmittals from "./pages/MaterialSubmittals";
import Meetings from "./pages/Meetings";
import OcrScanning from "./pages/OcrScanning";
import PendingApproval from "./pages/PendingApproval";
import Permits from "./pages/Permits";
import PortfolioManagement from "./pages/PortfolioManagement";
import ProcurementSchedule from "./pages/ProcurementSchedule";
import Profile from "./pages/Profile";
import ProjectCalendar from "./pages/ProjectCalendar";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectFinancing from "./pages/ProjectFinancing";
import ProjectHub from "./pages/ProjectHub";
import ProjectPL from "./pages/ProjectPL";
import ProjectStatusReport from "./pages/ProjectStatusReport";
import ProjectTemplates from "./pages/ProjectTemplates";
import Projects from "./pages/Projects";
import PunchList from "./pages/PunchList";
import Purchasing from "./pages/Purchasing";
import QualityManual from "./pages/QualityManual";
import QualitySafety from "./pages/QualitySafety";
import Quotes from "./pages/Quotes";
import Reporting from "./pages/Reporting";
import ResourceCalendar from "./pages/ResourceCalendar";
import RiskRegister from "./pages/RiskRegister";
import RoleSelect from "./pages/RoleSelect";
import RoleSettings from "./pages/RoleSettings";
import SahaDenetimFormu from "./pages/SahaDenetimFormu";
import SelfService from "./pages/SelfService";
import Shipments from "./pages/Shipments";
import SiteAccess from "./pages/SiteAccess";
import SiteAlarms from "./pages/SiteAlarms";
import SiteLog from "./pages/SiteLog";
import SitePhotos from "./pages/SitePhotos";
import StakeholderMatrix from "./pages/StakeholderMatrix";
import SubcontractorManagement from "./pages/SubcontractorManagement";
import SupplierPortal from "./pages/SupplierPortal";
import SupplyChainAnalysis from "./pages/SupplyChainAnalysis";
import Timesheet from "./pages/Timesheet";
import VehicleFleet from "./pages/VehicleFleet";
import WorkflowAutomation from "./pages/WorkflowAutomation";

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
  | "documents"
  | "purchasing"
  | "inventory"
  | "reporting"
  | "qualitySafety"
  | "crm"
  | "subcontractors"
  | "equipment"
  | "quotes"
  | "isg"
  | "siteLog"
  | "drawings"
  | "meetings"
  | "punchList"
  | "resourceCalendar"
  | "riskRegister"
  | "contracts"
  | "materialRequests"
  | "clientReport"
  | "sitePhotos"
  | "permits"
  | "selfService"
  | "correspondence"
  | "insurance"
  | "dlp"
  | "projectTemplates"
  | "timesheet"
  | "approvalWorkflows"
  | "kpiTargets"
  | "projectHub"
  | "holidayCalendar"
  | "boqLibrary"
  | "bankAccounts"
  | "siteAccess"
  | "shipments"
  | "environmentalManagement"
  | "portfolioManagement"
  | "qualityManual"
  | "emergencyPlan"
  | "employeeSurveys"
  | "supplyChainAnalysis"
  | "costControl"
  | "costCenter"
  | "projectFinancing"
  | "vehicleFleet"
  | "biAnalytics"
  | "siteAlarms"
  | "legalCorrespondence"
  | "locationMap"
  | "workflowAutomation"
  | "customerPortal"
  | "ocrScanning"
  | "materialSubmittals"
  | "stakeholderMatrix"
  | "projectPL"
  | "projectCalendar"
  | "isEmriYonetimi"
  | "supplierPortal"
  | "sahaDenetimFormu"
  | "energyTracking"
  | "procurementSchedule"
  | "customFormBuilder"
  | "projectStatusReport"
  | "constructionSupervision"
  | "kickoffChecklist";

function Inner() {
  const {
    setCurrentCompany,
    setCurrentRole,
    setActiveCompany,
    setActiveRole,
    pendingInvites,
    inviteCodes,
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
      setScreen("inviteJoin");
    }
  };

  const handleLogin = (loggedInUser: User) => {
    void loggedInUser;
    setScreen("company");
  };

  const handleInviteLogin = () => {
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
    localStorage.removeItem("pv_user");
    localStorage.removeItem("pv_current_company");
    localStorage.removeItem("pv_current_role");
    setScreen("accountTypeSelect");
  };

  const handlePendingLogout = () => {
    setScreen("accountTypeSelect");
  };

  const handlePendingCheck = () => {
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
    else if (p === "purchasing") setPage("purchasing");
    else if (p === "inventory") setPage("inventory");
    else if (p === "reporting") setPage("reporting");
    else if (p === "qualitySafety") setPage("qualitySafety");
    else if (p === "crm") setPage("crm");
    else if (p === "subcontractors") setPage("subcontractors");
    else if (p === "equipment") setPage("equipment");
    else if (p === "quotes") setPage("quotes");
    else if (p === "isg") setPage("isg");
    else if (p === "siteLog") setPage("siteLog");
    else if (p === "drawings") setPage("drawings");
    else if (p === "meetings") setPage("meetings");
    else if (p === "punchList") setPage("punchList");
    else if (p === "resourceCalendar") setPage("resourceCalendar");
    else if (p === "riskRegister") setPage("riskRegister");
    else if (p === "contracts") setPage("contracts");
    else if (p === "materialRequests") setPage("materialRequests");
    else if (p === "clientReport") setPage("clientReport");
    else if (p === "sitePhotos") setPage("sitePhotos");
    else if (p === "permits") setPage("permits");
    else if (p === "selfService") setPage("selfService");
    else if (p === "correspondence") setPage("correspondence");
    else if (p === "insurance") setPage("insurance");
    else if (p === "dlp") setPage("dlp");
    else if (p === "projectTemplates") setPage("projectTemplates");
    else if (p === "timesheet") setPage("timesheet");
    else if (p === "approvalWorkflows") setPage("approvalWorkflows");
    else if (p === "kpiTargets") setPage("kpiTargets");
    else if (p === "projectHub") setPage("projectHub");
    else if (p === "holidayCalendar") setPage("holidayCalendar");
    else if (p === "boqLibrary") setPage("boqLibrary");
    else if (p === "bankAccounts") setPage("bankAccounts");
    else if (p === "siteAccess") setPage("siteAccess");
    else if (p === "shipments") setPage("shipments");
    else if (p === "environmentalManagement")
      setPage("environmentalManagement");
    else if (p === "portfolioManagement") setPage("portfolioManagement");
    else if (p === "qualityManual") setPage("qualityManual");
    else if (p === "emergencyPlan") setPage("emergencyPlan");
    else if (p === "employeeSurveys") setPage("employeeSurveys");
    else if (p === "supplyChainAnalysis") setPage("supplyChainAnalysis");
    else if (p === "costControl") setPage("costControl");
    else if (p === "costCenter") setPage("costCenter");
    else if (p === "projectFinancing") setPage("projectFinancing");
    else if (p === "vehicleFleet") setPage("vehicleFleet");
    else if (p === "biAnalytics") setPage("biAnalytics");
    else if (p === "siteAlarms") setPage("siteAlarms");
    else if (p === "legalCorrespondence") setPage("legalCorrespondence");
    else if (p === "locationMap") setPage("locationMap");
    else if (p === "workflowAutomation") setPage("workflowAutomation");
    else if (p === "customerPortal") setPage("customerPortal");
    else if (p === "ocrScanning") setPage("ocrScanning");
    else if (p === "materialSubmittals") setPage("materialSubmittals");
    else if (p === "stakeholderMatrix") setPage("stakeholderMatrix");
    else if (p === "supplierPortal") setPage("supplierPortal");
    else if (p === "sahaDenetimFormu") setPage("sahaDenetimFormu");
    else if (p === "energyTracking") setPage("energyTracking");
    else if (p === "procurementSchedule") setPage("procurementSchedule");
    else if (p === "customFormBuilder") setPage("customFormBuilder");
    else if (p === "projectStatusReport") setPage("projectStatusReport");
    else if (p === "constructionSupervision")
      setPage("constructionSupervision");
    else if (p === "kickoffChecklist") setPage("kickoffChecklist");
    else setPage(p as AppPage);
  };

  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id);
    setPage("project-detail");
  };

  void inviteCodes;

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
  if (screen === "login") return <Login onLogin={handleLogin} />;
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
      {page === "purchasing" && <Purchasing />}
      {page === "inventory" && <Inventory />}
      {page === "reporting" && <Reporting />}
      {page === "qualitySafety" && <QualitySafety />}
      {page === "crm" && <CRM />}
      {page === "subcontractors" && <SubcontractorManagement />}
      {page === "equipment" && <Equipment />}
      {page === "quotes" && <Quotes />}
      {page === "isg" && <ISG />}
      {page === "siteLog" && <SiteLog />}
      {page === "drawings" && <Drawings />}
      {page === "meetings" && <Meetings />}
      {page === "punchList" && <PunchList />}
      {page === "resourceCalendar" && <ResourceCalendar />}
      {page === "riskRegister" && <RiskRegister />}
      {page === "contracts" && <Contracts />}
      {page === "materialRequests" && <MaterialRequests />}
      {page === "clientReport" && <ClientReport />}
      {page === "sitePhotos" && <SitePhotos />}
      {page === "permits" && <Permits />}
      {page === "selfService" && <SelfService />}
      {page === "correspondence" && <Correspondence />}
      {page === "insurance" && <Insurance />}
      {page === "dlp" && <DLP />}
      {page === "projectTemplates" && <ProjectTemplates />}
      {page === "timesheet" && <Timesheet />}
      {page === "approvalWorkflows" && <ApprovalWorkflows />}
      {page === "kpiTargets" && <KPITargets />}
      {page === "projectHub" && selectedProjectId && (
        <ProjectHub
          projectId={selectedProjectId}
          onBack={() => setPage("projects")}
        />
      )}
      {page === "holidayCalendar" && <HolidayCalendar />}
      {page === "boqLibrary" && <BoQLibrary />}
      {page === "bankAccounts" && <BankAccounts />}
      {page === "siteAccess" && <SiteAccess />}
      {page === "shipments" && <Shipments />}
      {page === "environmentalManagement" && <EnvironmentalManagement />}
      {page === "portfolioManagement" && <PortfolioManagement />}
      {page === "qualityManual" && <QualityManual />}
      {page === "emergencyPlan" && <EmergencyPlan />}
      {page === "employeeSurveys" && <EmployeeSurveys />}
      {page === "supplyChainAnalysis" && <SupplyChainAnalysis />}
      {page === "costControl" && <CostControl />}
      {page === "costCenter" && <CostCenterPage />}
      {page === "projectFinancing" && <ProjectFinancing />}
      {page === "vehicleFleet" && <VehicleFleet />}
      {page === "biAnalytics" && <BIAnalytics />}
      {page === "siteAlarms" && <SiteAlarms />}
      {page === "legalCorrespondence" && <LegalCorrespondence />}
      {page === "locationMap" && <LocationMap />}
      {page === "workflowAutomation" && <WorkflowAutomation />}
      {page === "customerPortal" && <CustomerPortal />}
      {page === "ocrScanning" && <OcrScanning />}
      {page === "materialSubmittals" && <MaterialSubmittals />}
      {page === "stakeholderMatrix" && <StakeholderMatrix />}
      {page === "projectCalendar" && <ProjectCalendar />}
      {page === "isEmriYonetimi" && <IsEmriYonetimi />}
      {page === "projectPL" && <ProjectPL />}
      {page === "supplierPortal" && <SupplierPortal />}
      {page === "sahaDenetimFormu" && <SahaDenetimFormu />}
      {page === "energyTracking" && <EnergyTracking />}
      {page === "procurementSchedule" && <ProcurementSchedule />}
      {page === "customFormBuilder" && <CustomFormBuilder />}
      {page === "projectStatusReport" && <ProjectStatusReport />}
      {page === "constructionSupervision" && <ConstructionSupervision />}
      {page === "kickoffChecklist" && <KickoffChecklist />}
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
