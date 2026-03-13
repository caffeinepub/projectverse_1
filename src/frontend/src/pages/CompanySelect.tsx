import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Building2, Plus } from "lucide-react";
import { useState } from "react";
import { type Company, useApp } from "../contexts/AppContext";

export default function CompanySelect({
  onSelect,
}: { onSelect: (company: Company) => void }) {
  const { t, user, companies, createCompany } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const userCompanies = companies.filter((c) =>
    c.members.some((m) => m.userId === user?.id),
  );

  const handleCreate = () => {
    if (!name.trim()) return;
    const company = createCompany(name.trim(), desc.trim());
    setOpen(false);
    onSelect(company);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.14 0.02 264), oklch(0.18 0.02 280))",
      }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            ProjectVerse
          </h1>
          <p className="text-xl font-semibold text-foreground">
            {t.selectCompany}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {t.selectCompanySubtitle}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-3">
          {userCompanies.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              {t.noCompanies}
            </p>
          ) : (
            userCompanies.map((company, i) => (
              <button
                type="button"
                key={company.id}
                data-ocid={`company_select.item.${i + 1}`}
                onClick={() => onSelect(company)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">
                      {company.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {company.members.length} üye
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-ocid="company_select.primary_button"
                variant="outline"
                className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.createCompany}
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="new_company.dialog" className="bg-card">
              <DialogHeader>
                <DialogTitle>{t.createCompany}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t.companyName}</Label>
                  <Input
                    data-ocid="new_company.name_input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Şirket adı..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{t.companyDesc}</Label>
                  <Textarea
                    data-ocid="new_company.desc_textarea"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Kısa açıklama..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <Button
                  data-ocid="new_company.submit_button"
                  onClick={handleCreate}
                  className="w-full gradient-bg text-white"
                >
                  {t.create}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
