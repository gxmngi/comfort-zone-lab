import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  colorVariant: "blue" | "teal" | "green" | "orange" | "pink" | "purple";
  onClick?: () => void;
}

const colorClasses = {
  blue: "bg-menu-blue-light hover:bg-menu-blue/10 border-menu-blue/20 [&_.icon-wrapper]:bg-menu-blue [&_.icon-wrapper]:text-white",
  teal: "bg-menu-teal-light hover:bg-menu-teal/10 border-menu-teal/20 [&_.icon-wrapper]:bg-menu-teal [&_.icon-wrapper]:text-white",
  green: "bg-menu-green-light hover:bg-menu-green/10 border-menu-green/20 [&_.icon-wrapper]:bg-menu-green [&_.icon-wrapper]:text-white",
  orange: "bg-menu-orange-light hover:bg-menu-orange/10 border-menu-orange/20 [&_.icon-wrapper]:bg-menu-orange [&_.icon-wrapper]:text-white",
  pink: "bg-menu-pink-light hover:bg-menu-pink/10 border-menu-pink/20 [&_.icon-wrapper]:bg-menu-pink [&_.icon-wrapper]:text-white",
  purple: "bg-menu-purple-light hover:bg-menu-purple/10 border-menu-purple/20 [&_.icon-wrapper]:bg-menu-purple [&_.icon-wrapper]:text-white",
};

export function MenuCard({ icon: Icon, title, subtitle, colorVariant, onClick }: MenuCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300",
        "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        colorClasses[colorVariant]
      )}
    >
      <div className="icon-wrapper flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-foreground truncate">{title}</h3>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">{subtitle}</p>
      </div>
    </button>
  );
}
