import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Key, LogIn, UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { type AccountType, useApp } from "../contexts/AppContext";

export default function InviteJoin({
  accountType,
  onLogin,
  onJoined,
}: {
  accountType: AccountType;
  onLogin: () => void;
  onJoined: (companyId: string, roleId: string, subType?: string) => void;
}) {
  const { applyInviteCode, inviteCodes } = useApp();
  const [mode, setMode] = useState<"select" | "invite">("select");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const accountTypeLabel =
    accountType === "manager"
      ? "Şirket Yöneticisi"
      : accountType === "personnel"
        ? "Şirket Personeli"
        : "Taşeron Personel";

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || code.length < 8) {
      setError("Lütfen tüm alanları eksiksiz doldurun.");
      return;
    }
    setLoading(true);
    setError("");

    const success = applyInviteCode(
      code.toUpperCase(),
      name.trim(),
      email.trim(),
    );
    setLoading(false);

    if (!success) {
      setError(
        "Geçersiz veya kullanılmış davet kodu. Lütfen tekrar kontrol edin.",
      );
      return;
    }

    // Find the invite code details
    const foundCode = inviteCodes.find((ic) => ic.code === code.toUpperCase());
    onJoined(
      foundCode?.companyId || "",
      foundCode?.roleId || accountType,
      foundCode?.subType,
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.14 0.02 264), oklch(0.18 0.02 280))",
      }}
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-1">
              {accountTypeLabel}
            </h1>
            <p className="text-muted-foreground text-sm">
              Mevcut hesabınızla giriş yapın veya davet koduyla katılın
            </p>
          </div>

          <AnimatePresence mode="wait">
            {mode === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-2xl p-6 space-y-3"
              >
                <button
                  type="button"
                  data-ocid="invite_join.login_button"
                  onClick={onLogin}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "oklch(0.25 0.04 264)",
                      border: "1px solid oklch(0.35 0.04 264)",
                    }}
                  >
                    <LogIn className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Giriş Yap</p>
                    <p className="text-xs text-muted-foreground">
                      Mevcut hesabınız varsa giriş yapın
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  data-ocid="invite_join.invite_button"
                  onClick={() => setMode("invite")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "oklch(0.22 0.06 280)",
                      border: "1px solid oklch(0.35 0.08 280)",
                    }}
                  >
                    <UserPlus
                      className="w-5 h-5"
                      style={{ color: "oklch(0.72 0.18 280)" }}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">
                      Davet Kodu ile Katıl
                    </p>
                    <p className="text-xs text-muted-foreground">
                      8 karakterlik davet kodunuzla kayıt olun
                    </p>
                  </div>
                </button>
              </motion.div>
            )}

            {mode === "invite" && (
              <motion.div
                key="invite"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card rounded-2xl p-6 space-y-4"
              >
                <div>
                  <Label
                    htmlFor="invite-name"
                    className="text-foreground text-sm"
                  >
                    Ad Soyad *
                  </Label>
                  <Input
                    id="invite-name"
                    data-ocid="invite_join.name_input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız ve soyadınız"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="invite-email"
                    className="text-foreground text-sm"
                  >
                    E-posta *
                  </Label>
                  <Input
                    id="invite-email"
                    data-ocid="invite_join.email_input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@sirket.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="invite-code"
                    className="text-foreground text-sm"
                  >
                    Davet Kodu *
                  </Label>
                  <Input
                    id="invite-code"
                    data-ocid="invite_join.code_input"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="8 karakterli kod (ör: TK2025AB)"
                    maxLength={8}
                    className="mt-1 font-mono tracking-widest"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      data-ocid="invite_join.error_state"
                      className="flex items-start gap-2 p-3 rounded-lg"
                      style={{
                        background: "oklch(0.25 0.08 30 / 0.3)",
                        border: "1px solid oklch(0.45 0.15 30 / 0.5)",
                      }}
                    >
                      <AlertCircle
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: "oklch(0.70 0.18 30)" }}
                      />
                      <p
                        className="text-sm"
                        style={{ color: "oklch(0.75 0.12 30)" }}
                      >
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("select");
                      setError("");
                    }}
                    className="flex-1"
                    data-ocid="invite_join.back_button"
                  >
                    Geri
                  </Button>
                  <Button
                    data-ocid="invite_join.submit_button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 gradient-bg text-white"
                  >
                    {loading ? "Kontrol ediliyor..." : "Katıl"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
