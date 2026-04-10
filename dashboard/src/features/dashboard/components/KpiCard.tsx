import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
  icon: React.ElementType;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
    >
      <Card className="group hover:border-primary/30 transition-colors duration-200">
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-none">
              {label}
            </p>
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <div className="text-[1.65rem] font-display font-bold tracking-tight tabular-nums leading-none text-foreground">
            {value}
          </div>
          {delta && <div className="mt-2.5">{delta}</div>}
        </div>
      </Card>
    </motion.div>
  );
}
