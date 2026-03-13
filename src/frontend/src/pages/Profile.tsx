import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useApp } from "../contexts/AppContext";

export default function Profile() {
  const { user, companies, t } = useApp();

  if (!user) return null;

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  const userCompanies = companies.filter((c) =>
    c.members.some((m) => m.userId === user.id),
  );

  const maskedCode = user.loginCode
    ? `${user.loginCode.slice(0, 4)}-****-****-${user.loginCode.slice(-4)}`
    : "—";

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">{t.profile}</h1>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-xl gradient-bg text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              {user.email && (
                <p className="text-muted-foreground text-sm">{user.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Giriş Kodu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-lg tracking-widest text-primary">
            {maskedCode}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Bu kodu kimseyle paylaşmayın. Hesabınıza erişim için kullanılır.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Şirketlerim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {userCompanies.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.noCompanies}</p>
          ) : (
            userCompanies.map((company) => {
              const member = company.members.find((m) => m.userId === user.id);
              const roles = company.roles.filter((r) =>
                member?.roleIds.includes(r.id),
              );
              return (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "oklch(0.22 0.01 264)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-foreground">
                      {company.name}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {roles.map((role) => (
                      <Badge
                        key={role.id}
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: `${role.color}55`,
                          color: role.color,
                        }}
                      >
                        {role.name}
                      </Badge>
                    ))}
                    {roles.length === 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-primary/50 text-primary"
                      >
                        Şirket Sahibi
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
