import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    "data-ocid"?: string;
  };
  className?: string;
  "data-ocid"?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
  "data-ocid": dataOcid,
}: EmptyStateProps) {
  return (
    <motion.div
      data-ocid={dataOcid}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}
    >
      {/* Icon ring with ambient glow */}
      <div className="relative mb-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.74 0.18 52 / 0.12), oklch(0.58 0.16 195 / 0.08))",
            border: "1px solid oklch(0.74 0.18 52 / 0.25)",
            boxShadow: "0 0 24px oklch(0.74 0.18 52 / 0.08)",
          }}
        >
          <Icon className="w-7 h-7" style={{ color: "oklch(0.78 0.16 52)" }} />
        </div>
        {/* Subtle ring */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            boxShadow: "0 0 0 8px oklch(0.74 0.18 52 / 0.04)",
          }}
        />
      </div>

      <h3
        className="text-base font-semibold mb-2"
        style={{ color: "oklch(0.82 0.008 245)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-xs leading-relaxed"
        style={{ color: "oklch(0.52 0.012 245)" }}
      >
        {description}
      </p>

      {action && (
        <button
          type="button"
          data-ocid={action["data-ocid"]}
          onClick={action.onClick}
          className="mt-5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-95"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.19 52), oklch(0.65 0.16 38))",
            color: "oklch(0.12 0.01 52)",
          }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
