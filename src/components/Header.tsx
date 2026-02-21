import { LogOut, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export function Header({ userName = "Guest", userRole = "Patient", onLogout }: HeaderProps) {
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "G";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-header-from to-header-to shadow-lg">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/walai-logo.png" alt="University Logo" className="h-10 w-auto" />
          <div>
            <h1 className="text-lg font-bold text-white">ComfortMonitor</h1>
            <p className="text-xs text-white/80">Personal Health Portal</p>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-white">{userName}</p>
            <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs text-white/90 capitalize">
              {userRole}
            </span>
          </div>
          <Avatar className="h-9 w-9 border-2 border-white/30">
            <AvatarImage src="" />
            <AvatarFallback className="bg-white/20 text-white text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
