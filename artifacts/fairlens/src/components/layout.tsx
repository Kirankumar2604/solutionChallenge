import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Activity, BarChart3, FileText, LayoutDashboard, PlusCircle, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { useGetSettings } from "@workspace/api-client-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";

function AppSidebar() {
  const [location] = useLocation();

  const navItems = [
    { label: "Dashboard", href: "/app", icon: LayoutDashboard },
    { label: "New Prediction", href: "/app/new-prediction", icon: PlusCircle },
    { label: "Batch Prediction", href: "/app/batch-prediction", icon: BarChart3 },
    { label: "Bias Monitor", href: "/app/bias-monitor", icon: Activity },
    { label: "Explainability", href: "/app/explainability", icon: FileText },
    { label: "Logs", href: "/app/logs", icon: FileText },
    { label: "Settings", href: "/app/settings", icon: SettingsIcon },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 font-bold text-lg text-sidebar-primary-foreground tracking-tight">
          <ShieldCheck className="w-6 h-6 text-primary" />
          FairLens
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={location === item.href} tooltip={item.label}>
                    <Link href={item.href} className="flex items-center gap-3 w-full">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function Header() {
  const { data: settings } = useGetSettings();
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="font-semibold text-sm">AI Ethics Cockpit</h1>
      </div>
      <div className="flex items-center gap-4">
        {settings && (
          <div className="flex items-center gap-2 text-xs font-medium bg-muted px-3 py-1.5 rounded-full">
            <span className={`w-2 h-2 rounded-full ${settings.fairnessMode ? 'bg-primary' : 'bg-muted-foreground'}`} />
            Fairness Mode: {settings.fairnessMode ? 'ON' : 'OFF'}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          Toggle Theme
        </Button>
      </div>
    </header>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
