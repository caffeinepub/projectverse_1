import { ShieldOff } from "lucide-react";

export default function AccessDenied() {
  return (
    <div
      data-ocid="access_denied.panel"
      className="flex flex-col items-center justify-center min-h-[400px] text-center px-4"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.35 0.12 30 / 0.3), oklch(0.40 0.15 15 / 0.2))",
          border: "1px solid oklch(0.50 0.18 30 / 0.4)",
        }}
      >
        <ShieldOff
          className="w-9 h-9"
          style={{ color: "oklch(0.70 0.18 30)" }}
        />
      </div>
      <h2
        className="text-xl font-bold mb-3"
        style={{ color: "oklch(0.90 0.02 264)" }}
      >
        Bu modüle erişim yetkiniz yok
      </h2>
      <p className="text-sm max-w-sm" style={{ color: "oklch(0.60 0.02 264)" }}>
        Bu sayfayı görüntülemek için gerekli yetkiye sahip değilsiniz. Şirket
        yöneticinizle iletişime geçin.
      </p>
    </div>
  );
}
