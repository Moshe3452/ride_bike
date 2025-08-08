

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, 
  Plus, 
  Users, 
  Car, 
  Settings,
  Menu,
  X,
  Zap
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "דף הבית",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "השכרה חדשה",
    url: createPageUrl("NewRental"),
    icon: Plus,
  },
  {
    title: "לקוחות",
    url: createPageUrl("Customers"),
    icon: Users,
  },
  {
    title: "כלים",
    url: createPageUrl("Vehicles"),
    icon: Car,
  },
  {
    title: "ניהול",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col" dir="rtl">
      <style>{`
        :root {
          --primary: 210 40% 30%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96%;
          --secondary-foreground: 210 40% 10%;
          --accent: 180 25% 25%;
          --accent-foreground: 180 25% 98%;
          --muted: 210 40% 98%;
          --muted-foreground: 215 16% 47%;
          --border: 214 32% 91%;
          --input: 214 32% 91%;
          --ring: 210 40% 30%;
        }
      `}</style>

      <SidebarProvider defaultOpen={false}>
        <div className="flex w-full flex-1">
          <Sidebar className="border-l border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-xl">
            <SidebarHeader className="border-b border-slate-200/60 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg">השכרה בקליק</h2>
                  <p className="text-xs text-slate-500">ניהול השכרות חכם</p>
                </div>
              </div>
              <SidebarTrigger className="text-slate-500 hover:text-slate-800">
                <X className="w-5 h-5" />
              </SidebarTrigger>
            </SidebarHeader>
            
            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-slate-500 px-3 py-2">
                  ניווט
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 rounded-xl font-medium ${
                            location.pathname === item.url ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200/60 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">מ</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">מנהל</p>
                  <p className="text-xs text-slate-500">מערכת השכרות</p>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>
          
          <main className="flex-1 flex flex-col w-full">
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
              <div className="flex items-center justify-between px-4 py-3">
                <Link to={createPageUrl("Dashboard")}>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                  >
                    <Home className="w-6 h-6 mr-2" />
                    <span className="hidden sm:inline">בית</span>
                  </Button>
                </Link>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  {/* Changed: Removed 'hidden sm:block' to make app name visible on mobile */}
                  <h1 className="font-bold text-slate-800">השכרה בקליק</h1>
                </div>

                <SidebarTrigger>
                  <Button variant="ghost" size="icon" className="text-slate-600">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SidebarTrigger>
              </div>
            </header>

            <div className="flex-1 overflow-auto">
              {children}
            </div>

            {/* Footer with Copyright */}
            <footer className="mt-auto py-4 px-6 border-t border-slate-200/60 bg-white/60 backdrop-blur-sm">
              <div className="text-center text-sm text-slate-500">
                Crafted by Moshe Zanzuri © All rights reserved
              </div>
            </footer>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

