import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { type Company, type Role, useApp } from "../contexts/AppContext";

export default function RoleSelect({
  company,
  onSelect,
}: { company: Company; onSelect: (role: Role) => void }) {
  const { t, user } = useApp();

  const member = company.members.find((m) => m.userId === user?.id);
  const userRoles = company.roles.filter((r) => member?.roleIds.includes(r.id));

  if (userRoles.length === 1) {
    setTimeout(() => onSelect(userRoles[0]), 0);
    return null;
  }

  const roles = userRoles.length > 0 ? userRoles : company.roles.slice(0, 1);

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
          <h1 className="text-2xl font-bold gradient-text mb-2">
            {company.name}
          </h1>
          <p className="text-xl font-semibold text-foreground">
            {t.selectRole}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {t.selectRoleSubtitle}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-3">
          {roles.map((role, i) => (
            <button
              type="button"
              key={role.id}
              data-ocid={`role_select.item.${i + 1}`}
              onClick={() => onSelect(role)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${role.color}33`,
                  border: `1px solid ${role.color}55`,
                }}
              >
                <Shield className="w-4 h-4" style={{ color: role.color }} />
              </div>
              <span className="font-semibold text-foreground">{role.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
