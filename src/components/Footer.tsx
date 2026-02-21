import { Phone, Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-6">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left md:px-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm">© 2025 ComfortMonitor - Walailak University</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4 text-primary" />
          <span className="text-sm">075-479999</span>
        </div>
      </div>
    </footer>
  );
}
