import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, Calendar, Edit2, TrendingDown, Users } from "lucide-react";
import { useState } from "react";
import type { LeaveRequest, Personnel } from "../../contexts/AppContext";

interface LeaveBalanceTabProps {
  personnel: Personnel[];
  leaves: LeaveRequest[];
}

const DEFAULT_BALANCE = 14;

export default function LeaveBalanceTab({
  personnel,
  leaves,
}: LeaveBalanceTabProps) {
  const [balanceOverrides, setBalanceOverrides] = useState<Map<string, number>>(
    new Map(),
  );
  const [carryoverDays, setCarryoverDays] = useState<Map<string, number>>(
    new Map(),
  );
  const [editingEmployee, setEditingEmployee] = useState<Personnel | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const getBalance = (emp: Personnel) =>
    balanceOverrides.get(emp.id) ?? emp.annualLeaveBalance ?? DEFAULT_BALANCE;

  const getUsedYearly = (empId: string) =>
    leaves
      .filter(
        (l) =>
          l.personnelId === empId &&
          l.status === "Onaylandı" &&
          l.type === "Yıllık",
      )
      .reduce((sum, l) => {
        const d = Math.max(
          1,
          Math.round(
            (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) /
              86400000,
          ) + 1,
        );
        return sum + d;
      }, 0);

  const getUsedSick = (empId: string) =>
    leaves
      .filter(
        (l) =>
          l.personnelId === empId &&
          l.status === "Onaylandı" &&
          l.type === "Hastalık",
      )
      .reduce((sum, l) => {
        const d = Math.max(
          1,
          Math.round(
            (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) /
              86400000,
          ) + 1,
        );
        return sum + d;
      }, 0);

  const getUsedExcuse = (empId: string) =>
    leaves
      .filter(
        (l) =>
          l.personnelId === empId &&
          l.status === "Onaylandı" &&
          l.type === "Mazeret",
      )
      .reduce((sum, l) => {
        const d = Math.max(
          1,
          Math.round(
            (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) /
              86400000,
          ) + 1,
        );
        return sum + d;
      }, 0);

  const totalGranted = personnel.reduce((s, e) => s + getBalance(e), 0);
  const totalUsed = personnel.reduce((s, e) => s + getUsedYearly(e.id), 0);
  const totalRemaining = totalGranted - totalUsed;

  const openEdit = (emp: Personnel) => {
    setEditingEmployee(emp);
    setEditValue(String(getBalance(emp)));
    setDialogOpen(true);
  };

  const saveEdit = () => {
    if (editingEmployee) {
      const val = Number.parseInt(editValue);
      if (!Number.isNaN(val) && val >= 0) {
        setBalanceOverrides((prev) =>
          new Map(prev).set(editingEmployee.id, val),
        );
      }
    }
    setDialogOpen(false);
    setEditingEmployee(null);
  };

  const getProgressColor = (remaining: number, total: number) => {
    if (total === 0) return "bg-gray-600";
    const pct = remaining / total;
    if (pct > 0.5) return "bg-emerald-500";
    if (pct >= 0.2) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getStatusBadge = (remaining: number, total: number) => {
    if (total === 0)
      return (
        <Badge variant="outline" className="text-gray-400 border-gray-600">
          -
        </Badge>
      );
    const pct = remaining / total;
    if (pct > 0.5)
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          Yeterli
        </Badge>
      );
    if (pct >= 0.2)
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          Azalıyor
        </Badge>
      );
    return (
      <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
        Kritik
      </Badge>
    );
  };

  if (personnel.length === 0) {
    return (
      <div
        data-ocid="hr.leave_balance.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <Calendar className="w-14 h-14 text-amber-500/40 mb-4" />
        <p className="text-lg font-semibold text-gray-300">
          Henüz personel yok
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Personel ekledikten sonra izin bakiyeleri burada görünecektir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gray-800/60 border-gray-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-xs text-gray-400">Toplam Personel</p>
                <p className="text-2xl font-bold text-white">
                  {personnel.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/60 border-gray-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Toplam Hak</p>
                <p className="text-2xl font-bold text-white">
                  {totalGranted}{" "}
                  <span className="text-sm font-normal text-gray-400">gün</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/60 border-gray-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-rose-400" />
              <div>
                <p className="text-xs text-gray-400">Kullanılan</p>
                <p className="text-2xl font-bold text-white">
                  {totalUsed}{" "}
                  <span className="text-sm font-normal text-gray-400">gün</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/60 border-gray-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-xs text-gray-400">Kalan</p>
                <p className="text-2xl font-bold text-white">
                  {totalRemaining}{" "}
                  <span className="text-sm font-normal text-gray-400">gün</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Table */}
      <Card
        className="bg-gray-800/40 border-gray-700"
        data-ocid="hr.leave_balance.table"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Personel İzin Bakiyeleri
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-transparent">
                  <TableHead className="text-gray-400">Personel</TableHead>
                  <TableHead className="text-gray-400">Departman</TableHead>
                  <TableHead className="text-gray-400 text-center">
                    Yıllık Hak
                  </TableHead>
                  <TableHead className="text-gray-400 text-center">
                    Kullanılan
                  </TableHead>
                  <TableHead className="text-gray-400 text-center">
                    Kalan
                  </TableHead>
                  <TableHead className="text-gray-400 text-center">
                    Hastalık
                  </TableHead>
                  <TableHead className="text-gray-400 text-center">
                    Mazeret
                  </TableHead>
                  <TableHead className="text-gray-400 text-center">
                    Durum
                  </TableHead>
                  <TableHead className="text-gray-400 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {personnel.map((emp, idx) => {
                  const balance = getBalance(emp);
                  const used = getUsedYearly(emp.id);
                  const remaining = Math.max(0, balance - used);
                  const pct = balance > 0 ? (remaining / balance) * 100 : 0;
                  const sick = getUsedSick(emp.id);
                  const excuse = getUsedExcuse(emp.id);
                  return (
                    <TableRow
                      key={emp.id}
                      data-ocid={`hr.leave_balance.row.${idx + 1}`}
                      className="border-gray-700/50 hover:bg-gray-700/20"
                    >
                      <TableCell className="font-medium text-white">
                        {emp.name}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {emp.department}
                      </TableCell>
                      <TableCell className="text-center text-amber-400 font-semibold">
                        {balance}
                      </TableCell>
                      <TableCell className="text-center text-rose-400">
                        {used}
                      </TableCell>
                      <TableCell className="text-center text-emerald-400 font-semibold">
                        {remaining}
                      </TableCell>
                      <TableCell className="text-center text-gray-300">
                        {sick}
                      </TableCell>
                      <TableCell className="text-center text-gray-300">
                        {excuse}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            {getStatusBadge(remaining, balance)}
                            <span className="text-xs text-gray-500">
                              {Math.round(pct)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${getProgressColor(remaining, balance)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`hr.leave_balance.edit_button.${idx + 1}`}
                          onClick={() => openEdit(emp)}
                          className="h-7 w-7 text-gray-400 hover:text-amber-400"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Carryover Section */}
      <Card className="bg-gray-800/40 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Devir Bakiyesi (Önceki Yıldan)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-transparent">
                  <TableHead className="text-gray-400">Personel</TableHead>
                  <TableHead className="text-gray-400">Departman</TableHead>
                  <TableHead className="text-gray-400">Devir Günü</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personnel.map((emp, idx) => (
                  <TableRow
                    key={emp.id}
                    className="border-gray-700/50 hover:bg-gray-700/20"
                  >
                    <TableCell className="font-medium text-white">
                      {emp.name}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {emp.department}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        data-ocid={`hr.leave_balance.carryover.input.${idx + 1}`}
                        value={carryoverDays.get(emp.id) ?? 0}
                        onChange={(e) => {
                          const val = Number.parseInt(e.target.value);
                          setCarryoverDays((prev) =>
                            new Map(prev).set(
                              emp.id,
                              Number.isNaN(val) ? 0 : val,
                            ),
                          );
                        }}
                        className="w-24 bg-gray-700/50 border-gray-600 text-white text-sm h-8"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Leave Policy */}
      <Card className="bg-gray-800/40 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            İzin Politikası
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400 mb-3">
            Kıdeme göre yıllık ücretli izin hakkı referans tablosu (yasal
            minimum).
          </p>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead className="text-gray-400">Kıdem Süresi</TableHead>
                <TableHead className="text-gray-400">
                  Yıllık İzin (gün)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { range: "0–1 yıl", days: 14 },
                { range: "1–5 yıl", days: 20 },
                { range: "5+ yıl", days: 26 },
              ].map((row) => (
                <TableRow key={row.range} className="border-gray-700/50">
                  <TableCell className="text-gray-300">{row.range}</TableCell>
                  <TableCell className="text-amber-400 font-semibold">
                    {row.days} gün
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Balance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="hr.leave_balance.dialog"
          className="bg-gray-900 border-gray-700 text-white max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Bakiye Düzelt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-400">
              <span className="text-white font-medium">
                {editingEmployee?.name}
              </span>{" "}
              için yıllık izin hakkını güncelleyin.
            </p>
            <div className="space-y-1">
              <Label className="text-gray-300">Yıllık İzin Hakkı (gün)</Label>
              <Input
                type="number"
                min={0}
                data-ocid="hr.leave_balance.edit.input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="hr.leave_balance.edit.cancel_button"
              onClick={() => setDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              İptal
            </Button>
            <Button
              data-ocid="hr.leave_balance.edit.save_button"
              onClick={saveEdit}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
