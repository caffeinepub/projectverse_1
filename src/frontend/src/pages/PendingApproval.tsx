import { Button } from "@/components/ui/button";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../contexts/AppContext";

export default function PendingApproval({
  inviteCompanyId,
  inviteRole,
  inviteSubType,
  onLogout,
  onCheck,
}: {
  inviteCompanyId?: string;
  inviteRole?: string;
  inviteSubType?: string;
  onLogout: () => void;
  onCheck: () => void;
}) {
  const { companies } = useApp();
  const company = companies.find((c) => c.id === inviteCompanyId);

  const roleLabel =
    inviteRole === "manager"
      ? "Şirket Yöneticisi"
      : inviteRole === "personnel"
        ? "Şirket Personeli"
        : inviteRole === "subcontractor"
          ? "Taşeron Personel"
          : inviteRole || "";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.14 0.02 264), oklch(0.18 0.02 280))",
      }}
    >
      <div className="w-full max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 1,
            }}
            className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.30 0.08 264), oklch(0.25 0.08 280))",
              border: "1px solid oklch(0.40 0.08 264)",
            }}
          >
            <Clock
              className="w-12 h-12"
              style={{ color: "oklch(0.72 0.18 200)" }}
            />
          </motion.div>

          <h1 className="text-3xl font-bold gradient-text mb-3">
            Onay Bekleniyor
          </h1>
          <p className="text-muted-foreground mb-6">
            Davet kodunuz iletildi. Şirket yöneticinizin onayını bekliyorsunuz.
          </p>

          {(company || roleLabel) && (
            <div className="glass-card rounded-xl p-4 mb-8 w-full text-left space-y-2">
              {company && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Şirket</span>
                  <span className="text-foreground text-sm font-medium">
                    {company.name}
                  </span>
                </div>
              )}
              {roleLabel && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Rol</span>
                  <span className="text-foreground text-sm font-medium">
                    {roleLabel}
                  </span>
                </div>
              )}
              {inviteSubType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Alt Tür</span>
                  <span className="text-foreground text-sm font-medium">
                    {inviteSubType}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 w-full">
            <Button
              data-ocid="pending_approval.logout_button"
              variant="outline"
              className="flex-1 border-border text-muted-foreground hover:text-foreground"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
            <Button
              data-ocid="pending_approval.check_button"
              className="flex-1 gradient-bg text-white"
              onClick={onCheck}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Durumu Kontrol Et
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
