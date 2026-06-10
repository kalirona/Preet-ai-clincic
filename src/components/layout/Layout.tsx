import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Search, 
  Bell, 
  Sparkles, 
  Users, 
  SearchCode, 
  LayoutDashboard, 
  Workflow, 
  Bot,
  Globe,
  Plus,
  Check,
  Command,
  ArrowRight,
  Settings,
  HelpCircle,
  Clock,
  LogOut,
  AppWindow,
  Briefcase,
  BookOpen,
  MessageSquare,
  Building,
  UserCheck,
  Lock,
  FileSpreadsheet,
  Key,
  Cpu,
  Calendar,
  User,
  FileText,
  Download,
  MessageCircle,
  Headphones,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Workspace {
  id: string;
  name: string;
  code: string;
  plan: 'Growth' | 'Enterprise' | 'Free';
}

interface NotificationItem {
  id: string;
  title: string;
  text: string;
  time: string;
  unread: boolean;
}

const workspaces: Workspace[] = [
  { id: '1', name: 'Preet AI Workspace', code: 'PW', plan: 'Growth' },
  { id: '2', name: 'Kalirona Agency Inc', code: 'KA', plan: 'Enterprise' },
  { id: '3', name: 'Solo Sandbox', code: 'SS', plan: 'Free' },
];

const primaryMenu = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, desc: 'Overview of operations and metrics' },
  { name: 'Clients', href: '/clients', icon: Users, desc: 'Sync pipelines and leads records with timeline' },
  { name: 'Appointments', href: '/appointments', icon: Calendar, desc: 'SaaS booking and meeting schedule engine' },
  { name: 'Automations', href: '/automations', icon: Workflow, desc: 'Configure trigger campaigns & email templates' },
  { name: 'AI Assistant', href: '/ai-tools', icon: Sparkles, desc: 'Generative smart helper tools' },
  { name: 'Agents', href: '/agents', icon: Headphones, desc: 'Create AI chat agents for your websites' },
  { name: 'Inbox', href: '/inbox', icon: MessageCircle, desc: 'Manage all customer conversations' },
  { name: 'Forms', href: '/forms', icon: ClipboardList, desc: 'Build forms and capture leads' },
];

const coreMenu = [
  { name: 'Workspace Settings', href: '/settings?tab=workspace', icon: Building, desc: 'Configure identity, logos, and SMTP outbound' },
  { name: 'Team & Roles', href: '/settings?tab=team', icon: UserCheck, desc: 'Manage simulated permissions and staff invites' },
  { name: 'Security Center', href: '/settings?tab=security', icon: Lock, desc: 'Configure safety guidelines and session logs' },
  { name: 'Billing', href: '/billing', icon: FileSpreadsheet, desc: 'Observe subscription pricing tier plans' },
  { name: 'Integrations', href: '/settings?tab=api', icon: Key, desc: 'Vault secrets for Gemini, OpenAI, Serper' },
];

const topTabsMenu = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Automations', href: '/automations', icon: Workflow },
  { name: 'AI Assistant', href: '/ai-tools', icon: Sparkles },
  { name: 'Agents', href: '/agents', icon: Headphones },
  { name: 'Inbox', href: '/inbox', icon: MessageCircle },
  { name: 'Forms', href: '/forms', icon: ClipboardList },
];

const searchables = [...primaryMenu, ...coreMenu];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sidebar_state');
      return saved === 'collapsed';
    } catch {
      return false;
    }
  });

  // Agency White-label loads & live storage polling
  const [whiteLabelName, setWhiteLabelName] = useState(() => localStorage.getItem('settings_workspaceName') || 'Preet AI Suite Studio');
  const [whiteLabelLogo, setWhiteLabelLogo] = useState(() => localStorage.getItem('settings_workspaceLogo') || '⚡');
  const [whiteLabelColor, setWhiteLabelColor] = useState(() => localStorage.getItem('settings_brandingColor') || '#6366f1');

  useEffect(() => {
    const interval = setInterval(() => {
      const name = localStorage.getItem('settings_workspaceName') || 'Preet AI Suite Studio';
      const logo = localStorage.getItem('settings_workspaceLogo') || '⚡';
      const color = localStorage.getItem('settings_brandingColor') || '#6366f1';
      if (name !== whiteLabelName) setWhiteLabelName(name);
      if (logo !== whiteLabelLogo) setWhiteLabelLogo(logo);
      if (color !== whiteLabelColor) setWhiteLabelColor(color);
    }, 1000);
    return () => clearInterval(interval);
  }, [whiteLabelName, whiteLabelLogo, whiteLabelColor]);

  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(() => {
    const active = workspaces[0];
    return {
      ...active,
      name: localStorage.getItem('settings_workspaceName') || active.name
    };
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time server-side search states
  const [searchLoading, setSearchLoading] = useState(false);
  const [apiSearchResults, setApiSearchResults] = useState<{
    clients: any[];
    appointments: any[];
    activities: any[];
    documents: any[];
  }>({
    clients: [],
    appointments: [],
    activities: [],
    documents: []
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'n1', title: 'Content Published', text: 'Blog "Advanced SEO principles" has been successfully synced with main-corporate-blog.com WordPress hub.', time: '10m ago', unread: true },
    { id: 'n2', title: 'CRM Ingestion Complete', text: '12 new leads captured via client portal and tagged inside active Growth pipeline.', time: '1h ago', unread: true },
    { id: 'n3', title: 'AI Credit Threshold Alert', text: 'Workspace has utilized 80% of active monthly credit tokens. Consider upgrading to Enterprise.', time: '1d ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) {
      setApiSearchResults({ clients: [], appointments: [], activities: [], documents: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'x-workspace-id': activeWorkspace.id || '1',
          }
        });
        if (response.ok) {
          const data = await response.json();
          setApiSearchResults({
            clients: data.clients || [],
            appointments: data.appointments || [],
            activities: data.activities || [],
            documents: data.documents || []
          });
        }
      } catch (error) {
        console.error('Unified search fetch error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen, activeWorkspace.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // auto collapse modal on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_state', next ? 'collapsed' : 'expanded');
      return next;
    });
  };

  const handleWorkspaceChange = (ws: Workspace) => {
    setActiveWorkspace(ws);
    toast.success(`Switched workspace to ${ws.name}`);
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    toast.success('Cleared all unread notifications');
  };

  const isLinkActive = (href: string) => {
    if (href.includes('?')) {
      const [path, search] = href.split('?');
      return location.pathname === path && location.search.includes(search);
    }
    return location.pathname === href && location.search === '';
  };

  const filteredTabs = searchables.filter(tab => 
    tab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const collapsed = !isMobile && isSidebarCollapsed;
    
    return (
      <div className="flex flex-col h-full bg-white text-slate-700 border-r border-[#e8ecf5] relative z-30 select-none shadow-[2px_0_12px_rgba(0,0,0,0.01)]">
        {/* Workspace Brand Title Accent */}
        <div className={cn(
          "h-[64px] px-6 border-b border-slate-100 flex items-center justify-between shrink-0",
          collapsed && "justify-center px-2"
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-2 min-w-0">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                style={{ backgroundColor: whiteLabelColor }}
              >
                {whiteLabelLogo}
              </div>
              <div className="flex flex-col leading-none truncate pr-2">
                <span className="font-extrabold text-[#111827] text-xs tracking-tight truncate" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  {whiteLabelName}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest font-mono mt-0.5" style={{ color: whiteLabelColor }}>
                  agency portal
                </span>
              </div>
            </div>
          ) : (
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm"
              style={{ backgroundColor: whiteLabelColor }}
            >
              {whiteLabelLogo}
            </div>
          )}

          {!isMobile && !collapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleToggleSidebar}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 p-0 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Workspace Quick-Selector */}
        <div className={cn("p-4 border-b border-slate-50 shrink-0", collapsed && "flex justify-center px-1")}>
          {collapsed ? (
            <TooltipProvider delay={100}>
              <Tooltip>
                <TooltipTrigger render={
                  <button className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-700 hover:border-slate-300 transition-colors cursor-pointer">
                    {activeWorkspace.code}
                  </button>
                } />
                <TooltipContent side="right">
                  <p className="text-xs font-semibold">{activeWorkspace.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-left cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                      {activeWorkspace.code}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-850 truncate leading-none mb-1">{activeWorkspace.name}</p>
                      <span className="text-[9px] text-slate-400 font-bold leading-none flex items-center uppercase tracking-wide">
                        {activeWorkspace.plan} plan
                      </span>
                    </div>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              } />
              <DropdownMenuContent align="start" className="w-[200px] bg-white border-slate-200 text-slate-800 shadow-2xl rounded-xl">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3">Switch Workspace</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                {workspaces.map((ws) => (
                  <DropdownMenuItem 
                    key={ws.id} 
                    onClick={() => handleWorkspaceChange(ws)}
                    className="flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-lg hover:bg-slate-50 focus:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                        {ws.code}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{ws.name}</span>
                    </div>
                    {activeWorkspace.id === ws.id && (
                      <Check className="w-3.5 h-3.5 text-violet-600" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => toast.info('New workspace form coming soon')} className="flex items-center gap-2 px-3 py-2 cursor-pointer text-xs text-violet-600 font-bold hover:bg-slate-50 focus:bg-slate-50">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Navigation Core */}
        <ScrollArea className="flex-1 py-4 px-3">
          <nav className="space-y-4">
            
            {/* Primary Section */}
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[9px] font-extrabold uppercase tracking-widest text-[#a0aec0] font-sans">
                  APPLICATIONS
                </div>
              )}
              {primaryMenu.map((item) => {
                const isActive = isLinkActive(item.href);
                
                if (collapsed) {
                  return (
                    <TooltipProvider key={item.name} delay={50}>
                      <Tooltip>
                        <TooltipTrigger render={
                          <NavLink
                            to={item.href}
                            className={() => cn(
                              "flex items-center justify-center w-9 h-9 mx-auto rounded-xl transition-all duration-150 relative group",
                              isActive 
                                ? "bg-slate-100 pl-[1px] md:pl-0 font-bold" 
                                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/85"
                            )}
                            style={isActive ? { 
                              color: whiteLabelColor, 
                              borderLeft: `3px solid ${whiteLabelColor}`
                            } : {}}
                          >
                            <item.icon className={cn("w-4 h-4")} style={isActive ? { color: whiteLabelColor } : {}} />
                          </NavLink>
                        } />
                        <TooltipContent side="right">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{item.name}</span>
                            {item.desc && <span className="text-[10px] text-slate-450 leading-tight">{item.desc}</span>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={() => cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium select-none group border-l-2",
                      isActive 
                        ? "pl-2 rounded-l-none font-bold" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 border-transparent"
                    )}
                    style={isActive ? {
                      color: whiteLabelColor,
                      borderColor: whiteLabelColor,
                      backgroundColor: `${whiteLabelColor}12`
                    } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-4 h-4 transition-colors shrink-0", isActive ? "" : "text-slate-400 group-hover:text-slate-900")} style={isActive ? { color: whiteLabelColor } : {}} />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>

            {/* Visual Divider in Collapsed State */}
            {collapsed && <div className="h-[1px] bg-slate-100 w-8 mx-auto my-3" />}

            {/* Core Section */}
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[9px] font-extrabold uppercase tracking-widest text-[#a0aec0] font-sans">
                  SYSTEM
                </div>
              )}
              {coreMenu.map((item) => {
                const isActive = isLinkActive(item.href);
                
                if (collapsed) {
                  return (
                    <TooltipProvider key={item.name} delay={50}>
                      <Tooltip>
                        <TooltipTrigger render={
                          <NavLink
                            to={item.href}
                            className={() => cn(
                              "flex items-center justify-center w-9 h-9 mx-auto rounded-xl transition-all duration-150 relative group",
                              isActive 
                                ? "bg-slate-100 pl-[1px] md:pl-0 font-bold" 
                                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/85"
                            )}
                            style={isActive ? { 
                              color: whiteLabelColor, 
                              borderLeft: `3px solid ${whiteLabelColor}`
                            } : {}}
                          >
                            <item.icon className={cn("w-4 h-4")} style={isActive ? { color: whiteLabelColor } : {}} />
                          </NavLink>
                        } />
                        <TooltipContent side="right">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{item.name}</span>
                            {item.desc && <span className="text-[10px] text-slate-450 leading-tight">{item.desc}</span>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={() => cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium select-none group border-l-2",
                      isActive 
                        ? "pl-2 rounded-l-none font-bold" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 border-transparent"
                    )}
                    style={isActive ? {
                      color: whiteLabelColor,
                      borderColor: whiteLabelColor,
                      backgroundColor: `${whiteLabelColor}12`
                    } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-4 h-4 transition-colors shrink-0", isActive ? "" : "text-slate-400 group-hover:text-slate-900")} style={isActive ? { color: whiteLabelColor } : {}} />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>

          </nav>
        </ScrollArea>

        {/* Footer info and switch toggle */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
          {!collapsed ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Agency Admin</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 truncate leading-none">preetkalirona@gmail.com</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Avatar className="w-7 h-7 cursor-pointer hover:opacity-85 select-none transition-opacity">
                      <AvatarFallback className="bg-gradient-to-tr from-violet-500 to-indigo-600 text-white font-bold text-[10px]">PA</AvatarFallback>
                    </Avatar>
                  } />
                  <DropdownMenuContent align="end" className="bg-white border-slate-100 text-slate-800 w-[180px] rounded-xl shadow-xl">
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="text-xs font-bold cursor-pointer p-2 hover:bg-slate-50">
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/billing')} className="text-xs font-bold cursor-pointer p-2 hover:bg-slate-50">
                      Billing Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-50" />
                    <DropdownMenuItem onClick={() => toast.success('Signed out successfully')} className="text-xs font-black text-rose-600 cursor-pointer p-2 hover:bg-rose-50">
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleToggleSidebar}
                className="w-full text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-100 text-[10px] h-7 flex items-center justify-center gap-1.5 mt-2 transition-all rounded-lg cursor-pointer"
              >
                <Command className="w-3 h-3 text-slate-400" />
                <span>Collapse Sidebar</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <TooltipProvider delay={100}>
                <Tooltip>
                  <TooltipTrigger render={
                    <Avatar className="w-8 h-8 cursor-pointer hover:scale-105 transition-transform" onClick={() => handleToggleSidebar()}>
                      <AvatarFallback className="bg-gradient-to-tr from-violet-500 to-indigo-600 text-white font-bold text-xs">PA</AvatarFallback>
                    </Avatar>
                  } />
                  <TooltipContent side="right">
                    <p className="text-xs font-bold text-slate-800 font-sans">Agency Admin</p>
                    <p className="text-[10px] text-slate-400 font-sans">preetkalirona@gmail.com</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased text-[13.5px]">
      {/* Desktop Left navigation bar */}
      <aside className={cn(
        "hidden lg:block h-full shrink-0 select-none transition-all duration-300 z-30",
        isSidebarCollapsed ? "w-[72px]" : "w-60"
      )}>
        <SidebarContent />
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f6fc] relative">
        {/* Top Header Commanded Bar */}
        <header className="h-[64px] bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 relative z-20 shadow-[-1px_0_0_0_#ebebeb] select-none">
          {/* Left panel switcher */}
          <div className="flex items-center gap-3.5">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger render={
                <Button variant="ghost" size="icon" className="lg:hidden border border-slate-100 rounded-lg hover:bg-slate-50">
                  <Menu className="w-4 h-4 text-slate-600" />
                </Button>
              } />
              <SheetContent side="left" className="p-0 border-r-0 w-64 h-full bg-white">
                <SidebarContent isMobile />
              </SheetContent>
            </Sheet>

            {/* Quick Breadcrumb info */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="hover:text-slate-600 transition-colors cursor-pointer" onClick={() => navigate('/')}>
                {activeWorkspace.name}
              </span>
              <ChevronRight className="w-3 h-3 stroke-[2.5]" />
              <span className="text-slate-800 font-semibold capitalize">
                {location.pathname === '/' ? 'overview' : location.pathname.replace('/', '').replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Search trigger & actions */}
          <div className="flex items-center gap-3">
            {/* Global Spot Light command trigger */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 mx-auto sm:w-[220px] px-3 py-1.5 rounded-lg border border-slate-100 bg-[#fafafb]/80 hover:bg-slate-100/60 hover:border-slate-200 transition-all text-slate-400 hover:text-slate-500 text-left cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 opacity-70 shrink-0" />
              <span className="text-[12px] flex-1 truncate">Search tools (⌘K)</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 pointer-events-none select-none px-1.5 py-0.5 rounded text-[9px] font-sans font-medium text-slate-400 bg-white border border-slate-200/50 leading-none">
                <span>⌘</span>K
              </kbd>
            </button>

            {/* Notification drop menu */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="h-8 w-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 relative transition-all">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 border border-white" />
                  )}
                </button>
              } />
              <DropdownMenuContent align="end" className="w-[320px] bg-white border border-slate-100 p-0 shadow-xl rounded-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllNotificationsAsRead}
                      className="text-[10px] text-indigo-600 font-bold hover:text-indigo-700 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-[250px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div key={n.id} className={cn("p-4 flex gap-2 transition-colors", n.unread ? "bg-indigo-50/10" : "bg-transparent")}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[9px] text-slate-400 font-medium shrink-0 ml-2">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">{n.text}</p>
                      </div>
                      {n.unread && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-100 text-center bg-[#fafafb]/50">
                  <span className="text-[10px] font-semibold text-slate-400">End of recent developments</span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger render={
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm hover:opacity-90 cursor-pointer select-none transition-all">
                  PA
                </div>
              } />
              <DropdownMenuContent align="end" className="w-[190px] bg-white border border-slate-100 shadow-xl rounded-xl">
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-xs font-bold text-slate-900 leading-none">preetkalirona</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">preetkalirona@gmail.com</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => navigate('/settings')} className="text-xs font-semibold text-slate-700 cursor-pointer p-2.5">Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/billing')} className="text-xs font-semibold text-slate-700 cursor-pointer p-2.5">Billing Plans</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => toast.success('Signed out successfully')} className="text-xs font-black text-rose-600 cursor-pointer p-2.5">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Flat list of sub-menus (Linear style horizontal nav overlay) */}
        <div className="bg-[#fafafb] border-b border-slate-100 px-6 py-2.5 flex items-center shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none z-10 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-1.5">
            {topTabsMenu.map((tab) => {
              const isActive = location.pathname === tab.href;
              return (
                <NavLink
                  key={tab.name}
                  to={tab.href}
                  className={() => cn(
                    "relative flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-all select-none shrink-0",
                    isActive 
                      ? "text-slate-950 bg-white shadow-2xs border border-slate-100/50" 
                      : "hover:bg-slate-200/30"
                  )}
                >
                  <tab.icon className={cn("w-3.5 h-3.5 transition-transform duration-200", isActive ? "text-slate-800 scale-105" : "text-slate-400")} />
                  <span>{tab.name}</span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Global Viewport Frame */}
        <main className="flex-1 overflow-y-auto min-w-0" id="saas-main-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.14 }}
              className="p-6 md:p-8 lg:p-10 max-w-[1450px] mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Command Palette (Spotlight Search) Modal Dialog */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            {/* Modal backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            {/* Modal dialog core */}
            <motion.div 
              initial={{ scale: 0.97, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="bg-white rounded-xl border border-slate-100 w-full max-w-[550px] shadow-2xl relative overflow-hidden flex flex-col max-h-[460px]"
            >
              {/* Search input header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 select-none">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Type a command or choose a module..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="bg-transparent border-0 outline-none text-xs text-slate-900 flex-1 placeholder:text-slate-400"
                />
                <button 
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded bg-slate-50 border border-slate-200 text-[9px] font-mono text-slate-500 flex items-center justify-center w-5 h-5 hover:bg-slate-100 transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Suggestions core */}
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                  
                  {/* General Navigation Group */}
                  {filteredTabs.length > 0 && (
                    <>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 select-none">Navigation Shortcuts</div>
                      {filteredTabs.map((tab) => (
                        <button 
                          key={tab.name}
                          onClick={() => {
                            navigate(tab.href);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-slate-50 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-indigo-600 border border-transparent group-hover:border-slate-100 transition-all">
                              <tab.icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-700 leading-none group-hover:text-slate-900">{tab.name}</p>
                              <p className="text-[10px] text-slate-400 mt-1 leading-none">{tab.desc}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </>
                  )}

                  {/* Query spinner indicator */}
                  {searchLoading && (
                    <div className="px-3 py-2 text-slate-400 text-[11px] font-bold tracking-wider uppercase animate-pulse flex items-center gap-2 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-ping" />
                      <span>Searching workspace registers...</span>
                    </div>
                  )}

                  {/* API Database Results - Clients */}
                  {!searchLoading && apiSearchResults.clients && apiSearchResults.clients.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-violet-500 uppercase tracking-wider px-3 py-1 select-none">Clients & CRM Records</div>
                      {apiSearchResults.clients.map((client) => (
                        <button 
                          key={`ws-client-${client.id}`}
                          onClick={() => {
                            navigate('/clients');
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-violet-50/50 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-violet-50 flex items-center justify-center text-violet-600 border border-violet-100 transition-all">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-700 leading-none group-hover:text-slate-900">{client.name}</p>
                              <p className="text-[10px] text-slate-400 mt-1 leading-none">{client.type || 'Client'} • {client.email}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* API Database Results - Appointments */}
                  {!searchLoading && apiSearchResults.appointments && apiSearchResults.appointments.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider px-3 py-1 select-none">Appointments Logs</div>
                      {apiSearchResults.appointments.map((appt) => (
                        <button 
                          key={`ws-appt-${appt.id}`}
                          onClick={() => {
                            navigate('/appointments');
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-amber-50/50 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 transition-all">
                              <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-700 leading-none group-hover:text-slate-900">{appt.title || 'Client Meeting'}</p>
                              <p className="text-[10px] text-slate-400 mt-1 leading-none">{appt.date} • {appt.time || 'Schedule Scheduled'}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* API Database Results - Activities */}
                  {!searchLoading && apiSearchResults.activities && apiSearchResults.activities.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider px-3 py-1 select-none">Logged Activities & Notes</div>
                      {apiSearchResults.activities.map((act) => (
                        <button 
                          key={`ws-act-${act.id}`}
                          onClick={() => {
                            navigate('/clients');
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-indigo-50/50 transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-200 transition-all shrink-0">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-700 leading-none truncate group-hover:text-slate-900">{act.activity_type || 'Activity log'}</p>
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal truncate">{act.description}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* API Database Results - Files & Invoices */}
                  {!searchLoading && apiSearchResults.documents && apiSearchResults.documents.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider px-3 py-1 select-none">Documents & Invoices</div>
                      {apiSearchResults.documents.map((doc) => (
                        <a 
                          key={`ws-doc-${doc.id}`}
                          href={doc.file_url || doc.fileUrl}
                          target="_blank" 
                          rel="noreferrer"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-emerald-50/50 transition-all group cursor-pointer block no-underline"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 transition-all">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-700 leading-none group-hover:text-slate-900">{doc.name}</p>
                              <p className="text-[10px] text-slate-400 mt-1 leading-none">Category: {doc.category || 'Attachment'} • Stored Document</p>
                            </div>
                          </div>
                          <Download className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* No Results at All State */}
                  {!searchLoading && filteredTabs.length === 0 && 
                    (!apiSearchResults.clients?.length) && 
                    (!apiSearchResults.appointments?.length) && 
                    (!apiSearchResults.activities?.length) && 
                    (!apiSearchResults.documents?.length) && (
                      <div className="p-8 text-center select-none">
                        <p className="text-xs text-slate-400 font-semibold">No operational matches found in this workspace for "{searchQuery}"</p>
                      </div>
                  )}

                </div>
              </ScrollArea>

              {/* Footer instruction info */}
              <div className="px-4 py-2 border-t border-slate-50 bg-[#fafafb]/50 flex items-center justify-between text-[10px] font-semibold text-slate-400 select-none">
                <span>Select using cursor or tap to action</span>
                <span className="flex items-center gap-1.5 leading-none">
                  <Command className="w-2.5 h-2.5" />
                  <span>Interactive Search Palette</span>
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
