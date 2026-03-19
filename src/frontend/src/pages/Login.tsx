import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import type { User } from "../contexts/AppContext";
import { backendService } from "../services/backendService";

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (trimmed.length !== 16) {
      setError("Giriş kodu 16 karakter olmalıdır.");
      return;
    }
    setLoading(true);
    const usersStr = localStorage.getItem("pv_users");
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    const found = users.find((u) => u.loginCode === trimmed);
    if (!found) {
      setError("Geçersiz giriş kodu. Lütfen tekrar deneyin.");
      setLoading(false);
      return;
    }
    localStorage.setItem("pv_user", JSON.stringify(found));
    setLoading(false);
    onLogin(found);
    // Non-blocking backend sync
    (async () => {
      try {
        const backendUser = await backendService.getUser(trimmed);
        if (backendUser) {
          const mergedUser = {
            ...found,
            ...(backendUser as object),
            loginCode: trimmed,
          };
          localStorage.setItem("pv_user", JSON.stringify(mergedUser));
        } else {
          await backendService.saveUser(trimmed, found);
        }
        const backendCompanies = await backendService.syncUserCompanies(
          found.id,
        );
        if (backendCompanies.length > 0) {
          const localStr = localStorage.getItem("pv_companies");
          const localCompanies: any[] = localStr ? JSON.parse(localStr) : [];
          const merged = [...localCompanies];
          for (const bc of backendCompanies) {
            const idx = merged.findIndex((lc: any) => lc.id === bc.id);
            if (idx >= 0) merged[idx] = bc;
            else merged.push(bc);
          }
          localStorage.setItem("pv_companies", JSON.stringify(merged));
        }
      } catch {}
    })();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.14 0.02 50), oklch(0.18 0.03 55))",
      }}
    >
      {/* Decorative ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 30%, oklch(0.55 0.16 65 / 0.12), transparent)",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.18 65), oklch(0.62 0.20 55))",
              boxShadow: "0 8px 32px oklch(0.62 0.20 55 / 0.35)",
            }}
          >
            <span className="text-2xl font-bold text-white">PV</span>
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "oklch(0.90 0.08 65)" }}
          >
            ProjectVerse
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.65 0.04 65)" }}>
            İnşaat & Saha Yönetim Platformu
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 space-y-6"
          style={{
            background: "oklch(0.19 0.025 55 / 0.85)",
            border: "1px solid oklch(0.62 0.18 65 / 0.25)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 24px 64px oklch(0.10 0.02 50 / 0.6)",
          }}
        >
          <div className="text-center space-y-1">
            <h2
              className="text-lg font-semibold"
              style={{ color: "oklch(0.88 0.06 65)" }}
            >
              Hoş Geldiniz
            </h2>
            <p className="text-sm" style={{ color: "oklch(0.60 0.04 65)" }}>
              Giriş yapmak için 16 karakterlik kodunuzu girin
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loginCode" style={{ color: "oklch(0.80 0.05 65)" }}>
              Giriş Kodu
            </Label>
            <Input
              id="loginCode"
              data-ocid="login.input"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="16 karakterlik kodunuzu girin"
              maxLength={16}
              autoFocus
              style={{
                background: "oklch(0.22 0.02 55 / 0.8)",
                border: error
                  ? "1px solid oklch(0.55 0.18 25)"
                  : "1px solid oklch(0.35 0.04 55)",
                color: "oklch(0.90 0.06 65)",
                letterSpacing: "0.15em",
              }}
              className="h-12 text-center font-mono text-sm tracking-widest"
            />
            {error && (
              <p
                className="text-sm"
                data-ocid="login.error_state"
                style={{ color: "oklch(0.65 0.18 25)" }}
              >
                {error}
              </p>
            )}
          </div>

          <Button
            data-ocid="login.primary_button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 font-semibold text-base rounded-xl"
            style={{
              background: loading
                ? "oklch(0.55 0.12 65)"
                : "linear-gradient(135deg, oklch(0.72 0.18 65), oklch(0.62 0.20 55))",
              color: "white",
              boxShadow: loading
                ? "none"
                : "0 4px 20px oklch(0.62 0.20 55 / 0.4)",
              border: "none",
            }}
          >
            Giriş Yap
          </Button>
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: "oklch(0.45 0.03 65)" }}
        >
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "oklch(0.62 0.12 65)" }}
          >
            caffeine.ai
          </a>{" "}
          ile oluşturuldu.
        </p>
      </div>
    </div>
  );
}
