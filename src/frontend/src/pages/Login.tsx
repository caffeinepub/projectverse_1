import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Building2, HardHat, User } from "lucide-react";
import { useState } from "react";
import { type AccountType, useApp } from "../contexts/AppContext";

const ACCOUNT_TYPE_LABELS: Record<
  AccountType,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  owner: {
    label: "Şirket Sahibi Kaydı",
    badge: "#a855f7",
    icon: <Building2 className="w-4 h-4" />,
  },
  manager: {
    label: "Şirket Yöneticisi Kaydı",
    badge: "#3b82f6",
    icon: <Briefcase className="w-4 h-4" />,
  },
  personnel: {
    label: "Şirket Personeli Kaydı",
    badge: "#06b6d4",
    icon: <User className="w-4 h-4" />,
  },
  subcontractor: {
    label: "Taşeron Kaydı",
    badge: "#f59e0b",
    icon: <HardHat className="w-4 h-4" />,
  },
};

const SECTORS = ["İnşaat", "Saha Operasyonları", "Gayrimenkul", "Diğer"];

export default function Login({
  onLogin,
  accountType = "owner",
}: {
  onLogin: () => void;
  accountType?: AccountType;
}) {
  const { t, setUser, generateLoginCode, createCompany } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySector, setCompanySector] = useState("");
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [showSuccessInfo, setShowSuccessInfo] = useState(false);

  const typeInfo = ACCOUNT_TYPE_LABELS[accountType];

  const handleLogin = () => {
    const clean = code.replace(/-/g, "").toUpperCase();
    if (clean.length !== 16) {
      setError("Giriş kodu 16 karakter olmalıdır.");
      return;
    }
    setUser({
      id: `u_${clean}`,
      name: "Kullanıcı",
      loginCode: clean,
      email: "",
      companyIds: [],
      accountType,
    });
    onLogin();
  };

  const handleRegister = () => {
    if (!name.trim()) {
      setError("Lütfen adınızı girin.");
      return;
    }
    if (accountType === "owner" && !companyName.trim()) {
      setError("Lütfen şirket adını girin.");
      return;
    }
    const newCode = generatedCode || generateLoginCode();
    setUser({
      id: `u_${newCode}`,
      name: name.trim(),
      loginCode: newCode,
      email: "",
      companyIds: [],
      accountType,
    });
    if (accountType === "owner" && companyName) {
      createCompany(companyName, companySector || "İnşaat");
    } else if (accountType !== "owner") {
      setShowSuccessInfo(true);
      return;
    }
    onLogin();
  };

  const newCode = () => {
    const c = generateLoginCode();
    setGeneratedCode(c);
  };

  if (showSuccessInfo) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.14 0.02 264), oklch(0.18 0.02 280))",
        }}
      >
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl p-8 text-center space-y-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: `${typeInfo.badge}33`,
                border: `2px solid ${typeInfo.badge}66`,
              }}
            >
              <span style={{ color: typeInfo.badge }}>{typeInfo.icon}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Hesabınız Oluşturuldu!
              </h2>
              <p className="text-muted-foreground text-sm">
                Şirket yetkilinizden şirkete eklenmesini isteyin.
              </p>
            </div>
            <div
              className="rounded-lg p-4"
              style={{
                background: "oklch(0.22 0.01 264)",
                border: "1px solid oklch(0.62 0.22 280 / 0.3)",
              }}
            >
              <p className="text-xs text-muted-foreground mb-2">
                Giriş Kodunuz (kaydedin!):
              </p>
              <p className="font-mono text-xl font-bold text-primary tracking-widest">
                {generatedCode}
              </p>
            </div>
            <Button
              onClick={onLogin}
              className="w-full gradient-bg text-white font-semibold"
            >
              Devam Et
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.14 0.02 264), oklch(0.18 0.02 280))",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            ProjectVerse
          </h1>
          <p className="font-semibold text-lg text-foreground">
            {mode === "login" ? t.loginTitle : t.newUserTitle}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {t.loginSubtitle}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {/* Account type badge */}
          <div
            data-ocid="login.account_type_badge"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-6"
            style={{
              background: `${typeInfo.badge}22`,
              border: `1px solid ${typeInfo.badge}55`,
              color: typeInfo.badge,
            }}
          >
            {typeInfo.icon}
            {typeInfo.label}
          </div>

          {mode === "login" ? (
            <div className="space-y-5">
              <div>
                <Label
                  htmlFor="loginCode"
                  className="text-foreground font-medium"
                >
                  {t.loginCodeLabel}
                </Label>
                <Input
                  id="loginCode"
                  data-ocid="login.input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t.loginCodePlaceholder}
                  className="mt-2 font-mono text-lg tracking-widest bg-background/50 border-border"
                  maxLength={20}
                />
              </div>
              {error && (
                <p
                  className="text-destructive text-sm"
                  data-ocid="login.error_state"
                >
                  {error}
                </p>
              )}
              <Button
                data-ocid="login.submit_button"
                onClick={handleLogin}
                className="w-full gradient-bg text-white font-semibold"
              >
                {t.loginBtn}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                {t.newUserBtn}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-foreground font-medium">
                  {t.nameLabel}
                </Label>
                <Input
                  id="name"
                  data-ocid="login.name_input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="mt-2 bg-background/50"
                />
              </div>

              {accountType === "owner" && (
                <>
                  <div>
                    <Label
                      htmlFor="companyName"
                      className="text-foreground font-medium"
                    >
                      Şirket Adı *
                    </Label>
                    <Input
                      id="companyName"
                      data-ocid="login.company_name_input"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Şirket adını girin"
                      className="mt-2 bg-background/50"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground font-medium">
                      Sektör
                    </Label>
                    <Select
                      value={companySector}
                      onValueChange={setCompanySector}
                    >
                      <SelectTrigger
                        data-ocid="login.sector_select"
                        className="mt-2 bg-background/50"
                      >
                        <SelectValue placeholder="Sektör seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTORS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {generatedCode && (
                <div className="rounded-lg bg-primary/10 border border-primary/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Giriş Kodunuz (kaydedin):
                  </p>
                  <p className="font-mono text-lg font-bold text-primary tracking-widest">
                    {generatedCode}
                  </p>
                </div>
              )}
              {!generatedCode && (
                <Button variant="outline" onClick={newCode} className="w-full">
                  Giriş Kodu Oluştur
                </Button>
              )}
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button
                data-ocid="login.submit_button"
                onClick={handleRegister}
                className="w-full gradient-bg text-white font-semibold"
              >
                {t.registerBtn}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="w-full text-muted-foreground"
              >
                {t.back}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
