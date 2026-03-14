import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Building2, Pencil, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";

const AVATAR_COLORS = [
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#be185d",
  "#2563eb",
  "#0d9488",
  "#65a30d",
  "#c2410c",
];

const NOTIFICATION_LABELS: Record<string, string> = {
  task_assigned: "Görev Ataması",
  leave_approved: "İzin Onayı",
  leave_rejected: "İzin Reddi",
  order_status: "Sipariş Durumu",
  low_stock: "Düşük Stok Uyarısı",
};

export default function Profile() {
  const {
    user,
    companies,
    t,
    updateCurrentUser,
    notificationPreferences,
    setNotificationPreferences,
  } = useApp();
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [phone, setPhone] = useState((user as any)?.phone || "");
  const [selectedColor, setSelectedColor] = useState(
    (user as any)?.avatar || "",
  );

  if (!user) return null;

  const avatarColor = selectedColor || (user as any)?.avatar || "#7c3aed";
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

  const handleSave = () => {
    updateCurrentUser({
      displayName: displayName.trim() || user.name,
      phone,
      avatar: selectedColor,
    });
    setEditMode(false);
  };

  const handleCancel = () => {
    setDisplayName(user.name || "");
    setPhone((user as any)?.phone || "");
    setSelectedColor((user as any)?.avatar || "");
    setEditMode(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t.profile}</h1>
        {!editMode ? (
          <Button
            data-ocid="profile.edit_button"
            variant="outline"
            size="sm"
            onClick={() => setEditMode(true)}
            className="gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Düzenle
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              data-ocid="profile.save_button"
              size="sm"
              onClick={handleSave}
              className="gradient-bg text-white"
            >
              Kaydet
            </Button>
            <Button
              data-ocid="profile.cancel_button"
              size="sm"
              variant="outline"
              onClick={handleCancel}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {editMode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-5">
                <Avatar className="w-16 h-16">
                  <AvatarFallback
                    className="text-xl text-white"
                    style={{ background: selectedColor || avatarColor }}
                  >
                    {(displayName || user.name)
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Avatar rengi
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        data-ocid="profile.toggle"
                        onClick={() => setSelectedColor(c)}
                        className={`w-6 h-6 rounded-full transition-all ${
                          selectedColor === c
                            ? "ring-2 ring-offset-2 ring-primary scale-110"
                            : ""
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label>Ad Soyad</Label>
                <Input
                  data-ocid="profile.input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  data-ocid="profile.input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                  placeholder="0532 000 0000"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <Avatar className="w-16 h-16">
                <AvatarFallback
                  className="text-xl text-white"
                  style={{ background: avatarColor }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {user.name}
                </h2>
                {user.email && (
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                )}
                {(user as any)?.phone && (
                  <p className="text-muted-foreground text-sm">
                    {(user as any).phone}
                  </p>
                )}
              </div>
            </div>
          )}
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

      {/* Notification Preferences */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Bildirim Tercihleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(NOTIFICATION_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center justify-between">
              <Label
                htmlFor={`notif-${type}`}
                className="text-sm text-foreground cursor-pointer"
              >
                {label}
              </Label>
              <Switch
                id={`notif-${type}`}
                data-ocid={`profile.notif_${type}.switch`}
                checked={notificationPreferences[type] !== false}
                onCheckedChange={(checked) =>
                  setNotificationPreferences({
                    ...notificationPreferences,
                    [type]: checked,
                  })
                }
              />
            </div>
          ))}
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
