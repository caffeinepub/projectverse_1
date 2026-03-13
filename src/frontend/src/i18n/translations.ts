export type Lang =
  | "tr"
  | "en"
  | "de"
  | "fr"
  | "es"
  | "pt"
  | "ru"
  | "ar"
  | "zh"
  | "ja";

export const LANGUAGES: {
  code: Lang;
  name: string;
  flag: string;
  dir?: "rtl";
}[] = [
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
];

type TranslationKeys = {
  appName: string;
  save: string;
  cancel: string;
  create: string;
  edit: string;
  delete: string;
  close: string;
  back: string;
  next: string;
  confirm: string;
  loading: string;
  logout: string;
  profile: string;
  settings: string;
  search: string;
  add: string;
  view: string;
  langSelectTitle: string;
  langSelectSubtitle: string;
  langSelectBtn: string;
  loginTitle: string;
  loginSubtitle: string;
  loginCodeLabel: string;
  loginCodePlaceholder: string;
  loginBtn: string;
  newUserBtn: string;
  newUserTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  inviteCodeLabel: string;
  inviteCodePlaceholder: string;
  inviteCodeOptional: string;
  registerBtn: string;
  selectCompany: string;
  selectCompanySubtitle: string;
  createCompany: string;
  companyName: string;
  companyDesc: string;
  enterCompany: string;
  noCompanies: string;
  selectRole: string;
  selectRoleSubtitle: string;
  continueBtn: string;
  dashboard: string;
  projects: string;
  communication: string;
  documents: string;
  hr: string;
  finance: string;
  purchasing: string;
  inventory: string;
  fieldOps: string;
  qualitySafety: string;
  crm: string;
  reports: string;
  comingSoon: string;
  activeProjects: string;
  completedTasks: string;
  overdueTasks: string;
  teamMembers: string;
  projectStatus: string;
  recentActivity: string;
  upcomingDeadlines: string;
  taskCompletion: string;
  newProject: string;
  allProjects: string;
  active: string;
  completed: string;
  onHold: string;
  planning: string;
  noProjects: string;
  projectDetail: string;
  overview: string;
  tasks: string;
  kanban: string;
  addMember: string;
  newTask: string;
  todo: string;
  inProgress: string;
  done: string;
  priority: string;
  low: string;
  medium: string;
  high: string;
  critical: string;
  assignee: string;
  dueDate: string;
  noTasks: string;
  roles: string;
  newRole: string;
  permissions: string;
  module: string;
  companySettings: string;
  activeModules: string;
  inviteCode: string;
  generateInvite: string;
  copyCode: string;
  codeCopied: string;
  statusPlanning: string;
  statusActive: string;
  statusOnHold: string;
  statusCompleted: string;
  days: string;
  // Field Ops
  workOrders: string;
  inspections: string;
  newWorkOrder: string;
  newInspection: string;
  workOrderOpen: string;
  workOrderInProgress: string;
  workOrderCompleted: string;
  workOrderCancelled: string;
  inspectionScheduled: string;
  inspectionInProgress: string;
  inspectionCompleted: string;
  inspectionFailed: string;
  location: string;
  assignedTo: string;
  attachments: string;
  uploadFile: string;
  checklist: string;
  completeInspection: string;
  fieldSummary: string;
  activeWorkOrders: string;
  openInspections: string;
  allWorkOrders: string;
  description: string;
  inspectionType: string;
  scheduledDate: string;
  noWorkOrders: string;
  noInspections: string;
};

const tr: TranslationKeys = {
  appName: "ProjectVerse",
  save: "Kaydet",
  cancel: "İptal",
  create: "Oluştur",
  edit: "Düzenle",
  delete: "Sil",
  close: "Kapat",
  back: "Geri",
  next: "İleri",
  confirm: "Onayla",
  loading: "Yükleniyor...",
  logout: "Çıkış Yap",
  profile: "Profil",
  settings: "Ayarlar",
  search: "Ara...",
  add: "Ekle",
  view: "Görüntüle",
  langSelectTitle: "Dil Seçin",
  langSelectSubtitle: "Devam etmek için tercih ettiğiniz dili seçin",
  langSelectBtn: "Devam Et",
  loginTitle: "ProjectVerse'e Giriş",
  loginSubtitle: "Sisteme erişmek için 16 karakterlik giriş kodunuzu girin",
  loginCodeLabel: "Giriş Kodunuz",
  loginCodePlaceholder: "XXXX-XXXX-XXXX-XXXX",
  loginBtn: "Giriş Yap",
  newUserBtn: "Yeni Hesap Oluştur",
  newUserTitle: "Yeni Hesap",
  nameLabel: "Adınız",
  namePlaceholder: "Adınızı girin",
  inviteCodeLabel: "Davet Kodu",
  inviteCodePlaceholder: "8 karakterli davet kodu",
  inviteCodeOptional: "Opsiyonel",
  registerBtn: "Hesap Oluştur",
  selectCompany: "Şirket Seçin",
  selectCompanySubtitle: "Hangi şirket hesabıyla çalışmak istiyorsunuz?",
  createCompany: "Yeni Şirket Oluştur",
  companyName: "Şirket Adı",
  companyDesc: "Açıklama",
  enterCompany: "Giriş Yap",
  noCompanies: "Henüz bir şirkete bağlı değilsiniz.",
  selectRole: "Rol Seçin",
  selectRoleSubtitle: "Bu oturum için hangi rolle devam etmek istersiniz?",
  continueBtn: "Devam Et",
  dashboard: "Dashboard",
  projects: "Projeler",
  communication: "İletişim",
  documents: "Dokümanlar",
  hr: "İnsan Kaynakları",
  finance: "Finans",
  purchasing: "Satın Alma",
  inventory: "Stok",
  fieldOps: "Saha Operasyonları",
  qualitySafety: "Kalite & Güvenlik",
  crm: "CRM",
  reports: "Raporlama",
  comingSoon: "Yakında",
  activeProjects: "Aktif Projeler",
  completedTasks: "Tamamlanan Görevler",
  overdueTasks: "Gecikmiş Görevler",
  teamMembers: "Ekip Üyeleri",
  projectStatus: "Proje Durumu",
  recentActivity: "Son Aktiviteler",
  upcomingDeadlines: "Yaklaşan Tarihler",
  taskCompletion: "Görev Tamamlama",
  newProject: "Yeni Proje",
  allProjects: "Tümü",
  active: "Aktif",
  completed: "Tamamlandı",
  onHold: "Beklemede",
  planning: "Planlama",
  noProjects: "Henüz proje yok.",
  projectDetail: "Proje Detayı",
  overview: "Genel Bakış",
  tasks: "Görevler",
  kanban: "Kanban",
  addMember: "Üye Ekle",
  newTask: "Yeni Görev",
  todo: "Yapılacak",
  inProgress: "Devam Ediyor",
  done: "Tamamlandı",
  priority: "Öncelik",
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
  assignee: "Atanan Kişi",
  dueDate: "Bitiş Tarihi",
  noTasks: "Henüz görev yok.",
  roles: "Roller",
  newRole: "Yeni Rol",
  permissions: "İzinler",
  module: "Modül",
  companySettings: "Şirket Ayarları",
  activeModules: "Aktif Modüller",
  inviteCode: "Davet Kodu",
  generateInvite: "Davet Kodu Oluştur",
  copyCode: "Kopyala",
  codeCopied: "Kopyalandı!",
  statusPlanning: "Planlama",
  statusActive: "Aktif",
  statusOnHold: "Beklemede",
  statusCompleted: "Tamamlandı",
  days: "gün",
  workOrders: "İş Emirleri",
  inspections: "Saha Denetimleri",
  newWorkOrder: "Yeni İş Emri",
  newInspection: "Yeni Denetim",
  workOrderOpen: "Açık",
  workOrderInProgress: "Devam Ediyor",
  workOrderCompleted: "Tamamlandı",
  workOrderCancelled: "İptal",
  inspectionScheduled: "Planlandı",
  inspectionInProgress: "Devam Ediyor",
  inspectionCompleted: "Tamamlandı",
  inspectionFailed: "Başarısız",
  location: "Konum",
  assignedTo: "Atanan",
  attachments: "Ekler",
  uploadFile: "Dosya Yükle",
  checklist: "Kontrol Listesi",
  completeInspection: "Denetimi Tamamla",
  fieldSummary: "Saha Özeti",
  activeWorkOrders: "Aktif İş Emirleri",
  openInspections: "Açık Denetimler",
  allWorkOrders: "Tüm İş Emirleri",
  description: "Açıklama",
  inspectionType: "Denetim Türü",
  scheduledDate: "Planlanan Tarih",
  noWorkOrders: "Henüz iş emri yok.",
  noInspections: "Henüz denetim yok.",
};

const en: TranslationKeys = {
  appName: "ProjectVerse",
  save: "Save",
  cancel: "Cancel",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  close: "Close",
  back: "Back",
  next: "Next",
  confirm: "Confirm",
  loading: "Loading...",
  logout: "Logout",
  profile: "Profile",
  settings: "Settings",
  search: "Search...",
  add: "Add",
  view: "View",
  langSelectTitle: "Choose Language",
  langSelectSubtitle: "Select your preferred language to continue",
  langSelectBtn: "Continue",
  loginTitle: "Sign in to ProjectVerse",
  loginSubtitle: "Enter your 16-character login code to access the system",
  loginCodeLabel: "Your Login Code",
  loginCodePlaceholder: "XXXX-XXXX-XXXX-XXXX",
  loginBtn: "Sign In",
  newUserBtn: "Create New Account",
  newUserTitle: "New Account",
  nameLabel: "Your Name",
  namePlaceholder: "Enter your name",
  inviteCodeLabel: "Invite Code",
  inviteCodePlaceholder: "8-character invite code",
  inviteCodeOptional: "Optional",
  registerBtn: "Create Account",
  selectCompany: "Select Company",
  selectCompanySubtitle: "Which company account do you want to work with?",
  createCompany: "Create New Company",
  companyName: "Company Name",
  companyDesc: "Description",
  enterCompany: "Enter",
  noCompanies: "You are not linked to any company yet.",
  selectRole: "Select Role",
  selectRoleSubtitle: "Which role do you want to continue with?",
  continueBtn: "Continue",
  dashboard: "Dashboard",
  projects: "Projects",
  communication: "Communication",
  documents: "Documents",
  hr: "Human Resources",
  finance: "Finance",
  purchasing: "Purchasing",
  inventory: "Inventory",
  fieldOps: "Field Operations",
  qualitySafety: "Quality & Safety",
  crm: "CRM",
  reports: "Reports",
  comingSoon: "Soon",
  activeProjects: "Active Projects",
  completedTasks: "Completed Tasks",
  overdueTasks: "Overdue Tasks",
  teamMembers: "Team Members",
  projectStatus: "Project Status",
  recentActivity: "Recent Activity",
  upcomingDeadlines: "Upcoming Deadlines",
  taskCompletion: "Task Completion",
  newProject: "New Project",
  allProjects: "All",
  active: "Active",
  completed: "Completed",
  onHold: "On Hold",
  planning: "Planning",
  noProjects: "No projects yet.",
  projectDetail: "Project Detail",
  overview: "Overview",
  tasks: "Tasks",
  kanban: "Kanban",
  addMember: "Add Member",
  newTask: "New Task",
  todo: "To Do",
  inProgress: "In Progress",
  done: "Done",
  priority: "Priority",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  assignee: "Assignee",
  dueDate: "Due Date",
  noTasks: "No tasks yet.",
  roles: "Roles",
  newRole: "New Role",
  permissions: "Permissions",
  module: "Module",
  companySettings: "Company Settings",
  activeModules: "Active Modules",
  inviteCode: "Invite Code",
  generateInvite: "Generate Invite Code",
  copyCode: "Copy",
  codeCopied: "Copied!",
  statusPlanning: "Planning",
  statusActive: "Active",
  statusOnHold: "On Hold",
  statusCompleted: "Completed",
  days: "days",
  workOrders: "Work Orders",
  inspections: "Field Inspections",
  newWorkOrder: "New Work Order",
  newInspection: "New Inspection",
  workOrderOpen: "Open",
  workOrderInProgress: "In Progress",
  workOrderCompleted: "Completed",
  workOrderCancelled: "Cancelled",
  inspectionScheduled: "Scheduled",
  inspectionInProgress: "In Progress",
  inspectionCompleted: "Completed",
  inspectionFailed: "Failed",
  location: "Location",
  assignedTo: "Assigned To",
  attachments: "Attachments",
  uploadFile: "Upload File",
  checklist: "Checklist",
  completeInspection: "Complete Inspection",
  fieldSummary: "Field Summary",
  activeWorkOrders: "Active Work Orders",
  openInspections: "Open Inspections",
  allWorkOrders: "All Work Orders",
  description: "Description",
  inspectionType: "Inspection Type",
  scheduledDate: "Scheduled Date",
  noWorkOrders: "No work orders yet.",
  noInspections: "No inspections yet.",
};

const fallback = (key: keyof TranslationKeys): string => en[key];
const makeProxy = (base: Partial<TranslationKeys>): TranslationKeys =>
  new Proxy(base as TranslationKeys, {
    get: (t, k: string) =>
      (t as Record<string, string>)[k] ?? fallback(k as keyof TranslationKeys),
  });

const de: TranslationKeys = makeProxy({
  appName: "ProjectVerse",
  dashboard: "Dashboard",
  projects: "Projekte",
  settings: "Einstellungen",
  logout: "Abmelden",
  comingSoon: "Bald",
  newProject: "Neues Projekt",
  langSelectTitle: "Sprache wählen",
  langSelectSubtitle: "Wählen Sie Ihre bevorzugte Sprache",
  langSelectBtn: "Weiter",
  loginTitle: "Bei ProjectVerse anmelden",
  loginSubtitle: "Geben Sie Ihren 16-stelligen Anmeldecode ein",
  loginCodeLabel: "Ihr Anmeldecode",
  loginBtn: "Anmelden",
  newUserBtn: "Neues Konto erstellen",
  registerBtn: "Konto erstellen",
  selectCompany: "Unternehmen wählen",
  createCompany: "Neues Unternehmen",
  continueBtn: "Weiter",
  selectRole: "Rolle wählen",
});
const fr: TranslationKeys = makeProxy({
  appName: "ProjectVerse",
  dashboard: "Tableau de bord",
  projects: "Projets",
  settings: "Paramètres",
  logout: "Déconnexion",
  comingSoon: "Bientôt",
  newProject: "Nouveau projet",
  langSelectTitle: "Choisir la langue",
  langSelectSubtitle: "Sélectionnez votre langue",
  langSelectBtn: "Continuer",
  loginTitle: "Connexion à ProjectVerse",
  loginSubtitle: "Entrez votre code de connexion à 16 caractères",
  loginCodeLabel: "Votre code de connexion",
  loginBtn: "Se connecter",
  newUserBtn: "Créer un compte",
  registerBtn: "Créer",
  selectCompany: "Choisir la société",
  createCompany: "Nouvelle société",
  continueBtn: "Continuer",
  selectRole: "Choisir le rôle",
});
const es: TranslationKeys = makeProxy({
  appName: "ProjectVerse",
  dashboard: "Panel",
  projects: "Proyectos",
  settings: "Configuración",
  logout: "Cerrar sesión",
  comingSoon: "Próximamente",
  newProject: "Nuevo proyecto",
  langSelectTitle: "Seleccionar idioma",
  langSelectSubtitle: "Seleccione su idioma preferido",
  langSelectBtn: "Continuar",
  loginTitle: "Iniciar sesión en ProjectVerse",
  loginCodeLabel: "Su código de acceso",
  loginBtn: "Iniciar sesión",
  newUserBtn: "Crear cuenta",
  registerBtn: "Crear",
  selectCompany: "Seleccionar empresa",
  createCompany: "Nueva empresa",
  continueBtn: "Continuar",
  selectRole: "Seleccionar rol",
  loginSubtitle: "Ingrese su código de 16 caracteres",
});
const pt: TranslationKeys = makeProxy({
  appName: "ProjectVerse",
  dashboard: "Painel",
  projects: "Projetos",
  settings: "Configurações",
  logout: "Sair",
  comingSoon: "Em breve",
  newProject: "Novo projeto",
  langSelectTitle: "Selecionar idioma",
  langSelectSubtitle: "Selecione seu idioma preferido",
  langSelectBtn: "Continuar",
  loginTitle: "Entrar no ProjectVerse",
  loginCodeLabel: "Seu código de login",
  loginBtn: "Entrar",
  newUserBtn: "Criar conta",
  registerBtn: "Criar",
  selectCompany: "Selecionar empresa",
  createCompany: "Nova empresa",
  continueBtn: "Continuar",
  selectRole: "Selecionar função",
  loginSubtitle: "Digite seu código de 16 caracteres",
});
const ru: TranslationKeys = makeProxy({
  appName: "ProjectVerse",
  dashboard: "Дашборд",
  projects: "Проекты",
  settings: "Настройки",
  logout: "Выйти",
  comingSoon: "Скоро",
  newProject: "Новый проект",
  langSelectTitle: "Выберите язык",
  langSelectSubtitle: "Выберите предпочитаемый язык",
  langSelectBtn: "Продолжить",
  loginTitle: "Войти в ProjectVerse",
  loginCodeLabel: "Ваш код входа",
  loginBtn: "Войти",
  newUserBtn: "Создать аккаунт",
  registerBtn: "Создать",
  selectCompany: "Выбрать компанию",
  createCompany: "Новая компания",
  continueBtn: "Продолжить",
  selectRole: "Выбрать роль",
  loginSubtitle: "Введите 16-значный код",
});
const ar: TranslationKeys = makeProxy({
  appName: "ProjectVerse",
  dashboard: "لوحة التحكم",
  projects: "المشاريع",
  settings: "الإعدادات",
  logout: "تسجيل الخروج",
  comingSoon: "قريباً",
  newProject: "مشروع جديد",
  langSelectTitle: "اختر اللغة",
  langSelectSubtitle: "اختر لغتك المفضلة للمتابعة",
  langSelectBtn: "متابعة",
  loginTitle: "تسجيل الدخول إلى ProjectVerse",
  loginCodeLabel: "رمز الدخول",
  loginBtn: "دخول",
  newUserBtn: "إنشاء حساب",
  registerBtn: "إنشاء",
  selectCompany: "اختر الشركة",
  createCompany: "شركة جديدة",
  continueBtn: "متابعة",
  selectRole: "اختر الدور",
  loginSubtitle: "أدخل رمز الدخول المكون من 16 حرفاً",
});
const zh: TranslationKeys = makeProxy({
  appName: "ProjectVerse",
  dashboard: "仪表板",
  projects: "项目",
  settings: "设置",
  logout: "退出",
  comingSoon: "即将推出",
  newProject: "新项目",
  langSelectTitle: "选择语言",
  langSelectSubtitle: "请选择您的首选语言",
  langSelectBtn: "继续",
  loginTitle: "登录 ProjectVerse",
  loginCodeLabel: "您的登录码",
  loginBtn: "登录",
  newUserBtn: "创建账户",
  registerBtn: "创建",
  selectCompany: "选择公司",
  createCompany: "新建公司",
  continueBtn: "继续",
  selectRole: "选择角色",
  loginSubtitle: "输入您的16字符登录码",
});
const ja: TranslationKeys = makeProxy({
  appName: "ProjectVerse",
  dashboard: "ダッシュボード",
  projects: "プロジェクト",
  settings: "設定",
  logout: "ログアウト",
  comingSoon: "近日公開",
  newProject: "新しいプロジェクト",
  langSelectTitle: "言語を選択",
  langSelectSubtitle: "ご希望の言語を選択してください",
  langSelectBtn: "続行",
  loginTitle: "ProjectVerseにログイン",
  loginCodeLabel: "ログインコード",
  loginBtn: "ログイン",
  newUserBtn: "アカウント作成",
  registerBtn: "作成",
  selectCompany: "会社を選択",
  createCompany: "新しい会社",
  continueBtn: "続行",
  selectRole: "ロールを選択",
  loginSubtitle: "16文字のログインコードを入力してください",
});

export const translations: Record<Lang, TranslationKeys> = {
  tr,
  en,
  de,
  fr,
  es,
  pt,
  ru,
  ar,
  zh,
  ja,
};
