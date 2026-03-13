import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Key,
  RefreshCw,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type MemberEntry,
  type ModulePermissions,
  ROLE_HIERARCHY,
  useApp,
} from "../contexts/AppContext";

const MODULES_LIST = [
  { id: "dashboard", label: "Dashboard" },
  { id: "projects", label: "Projeler" },
  { id: "fieldOps", label: "Saha Operasyonları" },
  { id: "settings", label: "Ayarlar" },
];

const ALL_MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "projects", label: "Projeler" },
  { id: "communication", label: "İletişim" },
  { id: "documents", label: "Dokümanlar" },
  { id: "hr", label: "İnsan Kaynakları" },
  { id: "finance", label: "Finans" },
  { id: "purchasing", label: "Satın Alma" },
  { id: "inventory", label: "Stok" },
  { id: "fieldOps", label: "Saha Operasyonları" },
  { id: "qualitySafety", label: "Kalite & Güvenlik" },
  { id: "crm", label: "CRM" },
  { id: "reports", label: "Raporlama" },
];

function emptyPermissions(): Record<string, ModulePermissions> {
  const result: Record<string, ModulePermissions> = {};
  for (const m of MODULES_LIST) {
    result[m.id] = { view: false, edit: false, delete: false };
  }
  return result;
}

function PermissionSection({
  permissions,
  onChange,
  prefix,
}: {
  permissions: Record<string, ModulePermissions>;
  onChange: (p: Record<string, ModulePermissions>) => void;
  prefix: string;
}) {
  const toggle = (modId: string, key: keyof ModulePermissions) => {
    const updated = {
      ...permissions,
      [modId]: { ...permissions[modId], [key]: !permissions[modId]?.[key] },
    };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {MODULES_LIST.map((mod) => (
        <div
          key={mod.id}
          className="rounded-lg p-3"
          style={{ background: "oklch(0.20 0.01 264)" }}
        >
          <p className="text-sm font-medium text-foreground mb-2">
            {mod.label}
          </p>
          <div className="flex gap-4">
            {(["view", "edit", "delete"] as (keyof ModulePermissions)[]).map(
              (perm) => {
                const checkId = `${prefix}-${mod.id}-${perm}`;
                return (
                  <div key={perm} className="flex items-center gap-1.5">
                    <Checkbox
                      id={checkId}
                      data-ocid={`${prefix}.${mod.id}_${perm}_checkbox`}
                      checked={!!permissions[mod.id]?.[perm]}
                      onCheckedChange={() => toggle(mod.id, perm)}
                    />
                    <Label
                      htmlFor={checkId}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      {perm === "view"
                        ? "Görüntüle"
                        : perm === "edit"
                          ? "Düzenle"
                          : "Sil"}
                    </Label>
                  </div>
                );
              },
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AddMemberDialog({
  companyId,
  onAdd,
}: {
  companyId: string;
  onAdd: (member: Omit<MemberEntry, "userId">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSubType, setSelectedSubType] = useState("");
  const [permissions, setPermissions] = useState<
    Record<string, ModulePermissions>
  >(emptyPermissions());

  void companyId;

  const assignableRoles = ROLE_HIERARCHY.filter((r) => r.level > 0);
  const selectedRoleObj = assignableRoles.find((r) => r.id === selectedRole);

  const handleAdd = () => {
    if (!memberName.trim() || !loginCode.trim() || !selectedRole) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    onAdd({
      name: memberName.trim(),
      loginCode: loginCode.trim().toUpperCase(),
      roleIds: [selectedRole],
      subType: selectedSubType || undefined,
      permissions,
    });
    setOpen(false);
    setMemberName("");
    setLoginCode("");
    setSelectedRole("");
    setSelectedSubType("");
    setPermissions(emptyPermissions());
    toast.success("Personel başarıyla eklendi.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid="personnel.add_button"
          className="gradient-bg text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Personel Ekle
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: "oklch(0.18 0.015 264)",
          border: "1px solid oklch(0.28 0.02 264)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Yeni Personel Ekle
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label
              htmlFor="add-member-name"
              className="text-foreground text-sm"
            >
              Ad Soyad *
            </Label>
            <Input
              id="add-member-name"
              data-ocid="add_member.name_input"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Personel adı"
              className="mt-1 bg-background/50"
            />
          </div>
          <div>
            <Label
              htmlFor="add-member-code"
              className="text-foreground text-sm"
            >
              Giriş Kodu *
            </Label>
            <Input
              id="add-member-code"
              data-ocid="add_member.login_code_input"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              placeholder="16 karakterli giriş kodu"
              className="mt-1 bg-background/50 font-mono"
              maxLength={16}
            />
          </div>
          <div>
            <Label className="text-foreground text-sm">Rol *</Label>
            <RadioGroup
              data-ocid="add_member.role_select"
              value={selectedRole}
              onValueChange={(v) => {
                setSelectedRole(v);
                setSelectedSubType("");
              }}
              className="mt-2 space-y-2"
            >
              {assignableRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{
                    background:
                      selectedRole === role.id
                        ? `${role.color}22`
                        : "oklch(0.20 0.01 264)",
                    border: `1px solid ${
                      selectedRole === role.id
                        ? `${role.color}66`
                        : "transparent"
                    }`,
                  }}
                >
                  <RadioGroupItem value={role.id} id={`role-${role.id}`} />
                  <Label
                    htmlFor={`role-${role.id}`}
                    className="text-sm font-medium cursor-pointer"
                    style={{
                      color: selectedRole === role.id ? role.color : undefined,
                    }}
                  >
                    {role.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedRoleObj && selectedRoleObj.subTypes.length > 0 && (
            <div>
              <Label className="text-foreground text-sm">Alt Tip</Label>
              <Select
                value={selectedSubType}
                onValueChange={setSelectedSubType}
              >
                <SelectTrigger
                  data-ocid="add_member.subtype_select"
                  className="mt-1 bg-background/50"
                >
                  <SelectValue placeholder="Alt tip seçin" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRoleObj.subTypes.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-foreground text-sm mb-3 block">
              Modül İzinleri
            </Label>
            <PermissionSection
              permissions={permissions}
              onChange={setPermissions}
              prefix="add_member"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            data-ocid="add_member.cancel_button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            İptal
          </Button>
          <Button
            data-ocid="add_member.submit_button"
            onClick={handleAdd}
            className="gradient-bg text-white"
          >
            Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPermissionsDialog({
  member,
  companyId,
  index,
}: {
  member: MemberEntry;
  companyId: string;
  index: number;
}) {
  const { updateMemberPermissions } = useApp();
  const [open, setOpen] = useState(false);
  const [permissions, setPermissions] = useState<
    Record<string, ModulePermissions>
  >(member.permissions || emptyPermissions());

  const handleSave = () => {
    updateMemberPermissions(companyId, member.userId, permissions);
    setOpen(false);
    toast.success("İzinler güncellendi.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid={`personnel.member.edit_button.${index}`}
          size="sm"
          variant="outline"
          className="text-xs"
        >
          <Edit2 className="w-3 h-3 mr-1" />
          İzinler
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: "oklch(0.18 0.015 264)",
          border: "1px solid oklch(0.28 0.02 264)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {member.name} — İzinler
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <PermissionSection
            permissions={permissions}
            onChange={setPermissions}
            prefix="edit_member"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} className="gradient-bg text-white">
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GenerateInviteDialog({ companyId }: { companyId: string }) {
  const { generateInviteCode } = useApp();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSubType, setSelectedSubType] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const assignableRoles = ROLE_HIERARCHY.filter((r) => r.level > 0);
  const selectedRoleObj = assignableRoles.find((r) => r.id === selectedRole);

  const handleGenerate = () => {
    if (!selectedRole) {
      toast.error("Lütfen bir rol seçin.");
      return;
    }
    const code = generateInviteCode(
      companyId,
      selectedRole,
      selectedSubType || undefined,
    );
    setGeneratedCode(code);
    toast.success("Davet kodu oluşturuldu!");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Kod kopyalandı!");
  };

  const handleClose = () => {
    setOpen(false);
    setGeneratedCode("");
    setSelectedRole("");
    setSelectedSubType("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button
          data-ocid="personnel.generate_invite_button"
          variant="outline"
          className="border-primary/50 text-primary hover:bg-primary/10"
        >
          <Key className="w-4 h-4 mr-2" />
          Davet Kodu Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent
        data-ocid="invite_code.dialog"
        className="max-w-md"
        style={{
          background: "oklch(0.18 0.015 264)",
          border: "1px solid oklch(0.28 0.02 264)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Davet Kodu Oluştur
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-foreground text-sm">Rol *</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => {
                setSelectedRole(v);
                setSelectedSubType("");
                setGeneratedCode("");
              }}
            >
              <SelectTrigger
                data-ocid="invite_code.role_select"
                className="mt-1 bg-background/50"
              >
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoleObj && selectedRoleObj.subTypes.length > 0 && (
            <div>
              <Label className="text-foreground text-sm">Alt Tür</Label>
              <Select
                value={selectedSubType}
                onValueChange={(v) => {
                  setSelectedSubType(v);
                  setGeneratedCode("");
                }}
              >
                <SelectTrigger
                  data-ocid="invite_code.subtype_select"
                  className="mt-1 bg-background/50"
                >
                  <SelectValue placeholder="Alt tür seçin (isteğe bağlı)" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRoleObj.subTypes.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {generatedCode && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: "oklch(0.22 0.03 280 / 0.3)",
                border: "1px solid oklch(0.50 0.12 280 / 0.4)",
              }}
            >
              <p className="text-xs text-muted-foreground mb-2">
                Oluşturulan Kod
              </p>
              <div className="flex items-center gap-3">
                <Input
                  data-ocid="invite_code.code_input"
                  value={generatedCode}
                  readOnly
                  className="font-mono text-xl font-bold tracking-widest text-primary bg-transparent border-0 p-0 h-auto"
                />
                <Button
                  data-ocid="invite_code.copy_button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Kopyala
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Kapat
          </Button>
          {!generatedCode && (
            <Button
              data-ocid="invite_code.generate_button"
              onClick={handleGenerate}
              className="gradient-bg text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Oluştur
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PersonnelTab({ companyId }: { companyId: string }) {
  const {
    currentCompany,
    addMember,
    removeMember,
    pendingInvites,
    inviteCodes,
    approveInvite,
    rejectInvite,
  } = useApp();
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const members = (currentCompany?.members || []).filter(
    (m) => !m.roleIds.includes("owner"),
  );

  const companyPendingInvites = pendingInvites.filter(
    (i) => i.companyId === companyId && i.status === "pending",
  );

  const companyInviteCodes = inviteCodes.filter(
    (ic) => ic.companyId === companyId,
  );

  const getRoleInfo = (roleId: string) =>
    ROLE_HIERARCHY.find((r) => r.id === roleId);

  return (
    <div className="space-y-8">
      {/* Header with actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Personel Yönetimi
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} personel kayıtlı
          </p>
        </div>
        <div className="flex gap-2">
          <GenerateInviteDialog companyId={companyId} />
          <AddMemberDialog
            companyId={companyId}
            onAdd={(member) => addMember(companyId, member)}
          />
        </div>
      </div>

      {/* Pending invites section */}
      {companyPendingInvites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock
              className="w-4 h-4"
              style={{ color: "oklch(0.72 0.18 50)" }}
            />
            <h3 className="font-semibold text-foreground">Bekleyen Davetler</h3>
            <Badge
              className="text-xs"
              style={{
                background: "oklch(0.72 0.18 50 / 0.2)",
                color: "oklch(0.72 0.18 50)",
                border: "1px solid oklch(0.72 0.18 50 / 0.4)",
              }}
            >
              {companyPendingInvites.length}
            </Badge>
          </div>
          {companyPendingInvites.map((invite, idx) => {
            const roleInfo = getRoleInfo(invite.roleId);
            const itemIdx = idx + 1;
            return (
              <div
                key={invite.id}
                className="flex items-center gap-4 p-4 rounded-xl flex-wrap"
                style={{
                  background: "oklch(0.20 0.015 264)",
                  border: "1px solid oklch(0.72 0.18 50 / 0.3)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: roleInfo
                      ? `${roleInfo.color}33`
                      : "oklch(0.25 0.01 264)",
                    color: roleInfo?.color || "#888",
                  }}
                >
                  {invite.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {invite.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invite.email}
                  </p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {roleInfo && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${roleInfo.color}22`,
                          color: roleInfo.color,
                        }}
                      >
                        {roleInfo.name}
                      </span>
                    )}
                    {invite.subType && (
                      <span className="text-xs text-muted-foreground">
                        {invite.subType}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {invite.createdAt}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    data-ocid={`pending_invite.approve_button.${itemIdx}`}
                    size="sm"
                    className="text-xs"
                    style={{
                      background: "oklch(0.45 0.14 160)",
                      color: "white",
                    }}
                    onClick={() => {
                      approveInvite(invite.id);
                      toast.success(
                        `${invite.name} onaylandı ve personele eklendi.`,
                      );
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Onayla
                  </Button>
                  <Button
                    data-ocid={`pending_invite.reject_button.${itemIdx}`}
                    size="sm"
                    variant="outline"
                    className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      rejectInvite(invite.id);
                      toast.success(`${invite.name} reddedildi.`);
                    }}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reddet
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active invite codes */}
      {companyInviteCodes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            İzleme: Oluşturulan Kodlar
          </h3>
          <div className="space-y-2">
            {companyInviteCodes.map((ic) => {
              const roleInfo = getRoleInfo(ic.roleId);
              return (
                <div
                  key={ic.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg flex-wrap"
                  style={{
                    background: "oklch(0.19 0.01 264)",
                    border: "1px solid oklch(0.26 0.01 264)",
                  }}
                >
                  <code
                    className="font-mono text-sm font-bold tracking-widest"
                    style={{ color: "oklch(0.72 0.18 280)" }}
                  >
                    {ic.code}
                  </code>
                  <div className="flex-1 flex gap-2 flex-wrap items-center">
                    {roleInfo && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${roleInfo.color}22`,
                          color: roleInfo.color,
                        }}
                      >
                        {roleInfo.name}
                      </span>
                    )}
                    {ic.subType && (
                      <span className="text-xs text-muted-foreground">
                        {ic.subType}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      color: ic.isUsed
                        ? "oklch(0.60 0.05 264)"
                        : "oklch(0.72 0.18 160)",
                      borderColor: ic.isUsed
                        ? "oklch(0.30 0.02 264)"
                        : "oklch(0.45 0.14 160 / 0.5)",
                    }}
                  >
                    {ic.isUsed ? "Kullanıldı" : "Aktif"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {ic.createdAt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Kayıtlı Personel</h3>
        {members.length === 0 ? (
          <div
            data-ocid="personnel.empty_state"
            className="text-center py-16 rounded-xl"
            style={{
              background: "oklch(0.18 0.01 264)",
              border: "1px dashed oklch(0.30 0.01 264)",
            }}
          >
            <p className="text-muted-foreground">Henüz personel eklenmemiş.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Yukarıdaki butonu kullanarak personel ekleyin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, idx) => {
              const roleId = member.roleIds[0];
              const roleInfo = getRoleInfo(roleId);
              const itemIdx = idx + 1;
              return (
                <div
                  key={member.userId}
                  data-ocid={`personnel.member.item.${itemIdx}`}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{
                    background: "oklch(0.19 0.012 264)",
                    border: "1px solid oklch(0.27 0.01 264)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{
                      background: roleInfo
                        ? `${roleInfo.color}33`
                        : "oklch(0.25 0.01 264)",
                      color: roleInfo?.color || "#888",
                      border: `2px solid ${roleInfo?.color || "#888"}44`,
                    }}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {roleInfo && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: `${roleInfo.color}22`,
                            color: roleInfo.color,
                            border: `1px solid ${roleInfo.color}44`,
                          }}
                        >
                          {roleInfo.name}
                        </span>
                      )}
                      {member.subType && (
                        <span className="text-xs text-muted-foreground">
                          {member.subType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex gap-1 flex-wrap">
                    {Object.entries(member.permissions || {})
                      .filter(([, p]) => p.view)
                      .map(([modId]) => {
                        const mod = MODULES_LIST.find((m) => m.id === modId);
                        return mod ? (
                          <span
                            key={modId}
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              background: "oklch(0.24 0.01 264)",
                              color: "oklch(0.65 0.05 264)",
                            }}
                          >
                            {mod.label}
                          </span>
                        ) : null;
                      })}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <EditPermissionsDialog
                      member={member}
                      companyId={companyId}
                      index={itemIdx}
                    />
                    <Dialog
                      open={confirmRemove === member.userId}
                      onOpenChange={(o) =>
                        setConfirmRemove(o ? member.userId : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          data-ocid={`personnel.member.remove_button.${itemIdx}`}
                          size="sm"
                          variant="outline"
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        style={{
                          background: "oklch(0.18 0.015 264)",
                          border: "1px solid oklch(0.28 0.02 264)",
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle className="text-foreground">
                            Personeli Çıkar
                          </DialogTitle>
                        </DialogHeader>
                        <p className="text-muted-foreground text-sm">
                          <strong className="text-foreground">
                            {member.name}
                          </strong>{" "}
                          adlı personeli şirketten çıkarmak istediğinizden emin
                          misiniz?
                        </p>
                        <DialogFooter className="gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setConfirmRemove(null)}
                          >
                            İptal
                          </Button>
                          <Button
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => {
                              removeMember(companyId, member.userId);
                              setConfirmRemove(null);
                              toast.success(
                                `${member.name} şirketten çıkarıldı.`,
                              );
                            }}
                          >
                            Çıkar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompanySettings() {
  const { t, currentCompany, companies, setCompanies } = useApp();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!currentCompany)
    return (
      <div className="text-muted-foreground">Lütfen önce bir şirket seçin.</div>
    );

  const activeModules = currentCompany.activeModules || [];

  const toggleModule = (modId: string) => {
    const updated = activeModules.includes(modId)
      ? activeModules.filter((m) => m !== modId)
      : [...activeModules, modId];
    const newCompanies = companies.map((c) =>
      c.id === currentCompany.id ? { ...c, activeModules: updated } : c,
    );
    setCompanies(newCompanies);
  };

  const handleGenerateInvite = async () => {
    setLoading(true);
    try {
      const code = Array.from(
        { length: 8 },
        () =>
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[
            Math.floor(Math.random() * 36)
          ],
      ).join("");
      setInviteCode(code);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success(t.codeCopied);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t.companySettings}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {currentCompany.name}
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger data-ocid="settings.general_tab" value="general">
            Genel
          </TabsTrigger>
          <TabsTrigger data-ocid="settings.modules_tab" value="modules">
            Modüller
          </TabsTrigger>
          <TabsTrigger data-ocid="settings.personnel_tab" value="personnel">
            Personel Yönetimi
          </TabsTrigger>
          <TabsTrigger data-ocid="settings.invite_tab" value="invite">
            Davet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Şirket Bilgileri</h2>
            <div>
              <Label>{t.companyName}</Label>
              <Input value={currentCompany.name} className="mt-1" readOnly />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input
                value={currentCompany.description}
                className="mt-1"
                readOnly
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">{t.activeModules}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "oklch(0.22 0.01 264)" }}
                >
                  <span className="text-sm text-foreground">{mod.label}</span>
                  <Switch
                    data-ocid={`settings.${mod.id}.switch`}
                    checked={activeModules.includes(mod.id)}
                    onCheckedChange={() => toggleModule(mod.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="personnel">
          <div className="glass-card rounded-xl p-6">
            <PersonnelTab companyId={currentCompany.id} />
          </div>
        </TabsContent>

        <TabsContent value="invite">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">{t.inviteCode}</h2>
            <p className="text-sm text-muted-foreground">
              Yeni kullanıcıları şirketinize davet etmek için 8 karakterli davet
              kodu oluşturun.
            </p>
            {inviteCode && (
              <div
                className="flex items-center gap-3 p-4 rounded-lg"
                style={{
                  background: "oklch(0.22 0.01 264)",
                  border: "1px solid oklch(0.62 0.22 280 / 0.3)",
                }}
              >
                <span className="font-mono text-xl font-bold text-primary tracking-widest flex-1">
                  {inviteCode}
                </span>
                <Button
                  data-ocid="settings.copy_button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  {t.copyCode}
                </Button>
              </div>
            )}
            <Button
              data-ocid="settings.generate_invite_button"
              onClick={handleGenerateInvite}
              disabled={loading}
              className="gradient-bg text-white"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {t.generateInvite}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
