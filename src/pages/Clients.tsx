import React from 'react';
import { getActivePlanLimits } from '@/utils/limits';
import { SystemPageLayout, PageHeader, PageContent } from '@/components/layout/SystemPageLayout';
import { 
  Users, 
  Trash2, 
  Plus, 
  Mail, 
  Phone, 
  MoreVertical,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  FileText,
  CalendarCheck2,
  Tag,
  Stethoscope,
  Kanban,
  LayoutGrid,
  ArrowLeft,
  ArrowRight,
  Coins,
  DollarSign,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ClientDetailDialog } from '@/components/ClientDetailDialog';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export type LeadStage = 'New Lead' | 'Qualified' | 'Contacted' | 'Proposal' | 'Won' | 'Lost';

export interface CRMRecord {
  id: number;
  name: string;
  type: 'Client' | 'Patient' | 'Customer';
  serviceTag: string;
  notes: string;
  lastAppointment: string;
  email: string;
  stage: LeadStage;
  value: number;
  profilePhotoUrl?: string;
}

const initialLeads: CRMRecord[] = [
  { id: 1, name: 'Alex Rivera', type: 'Client', serviceTag: 'Web Design Kickoff', notes: 'Design signoff complete. Ready for frontend scaffolding.', lastAppointment: '2026-06-05 09:30 AM', email: 'alex@pulse.com', stage: 'Proposal', value: 3500 },
  { id: 2, name: 'Sarah Chen', type: 'Patient', serviceTag: 'SEO Cognitive Consulting', notes: 'Addressed primary landing conversion obstacles and schema data.', lastAppointment: '2026-06-06 11:00 AM', email: 'sarah.c@zenith.io', stage: 'Qualified', value: 2400 },
  { id: 3, name: 'Marcus Thorne', type: 'Customer', serviceTag: 'SaaS Agreement Review', notes: 'Contracting custom service level agreements for enterprise sync.', lastAppointment: 'Pending Booking', email: 'm.thorne@cloud.com', stage: 'New Lead', value: 5000 },
  { id: 4, name: 'Elena Rodriguez', type: 'Client', serviceTag: 'UI/UX Redesign Audit', notes: 'Conducted high-fidelity prototyping session with branding agency.', lastAppointment: '2026-06-03 02:00 PM', email: 'elena@bloom.co', stage: 'Contacted', value: 4200 },
  { id: 5, name: 'David Kim', type: 'Customer', serviceTag: 'API Gateway Integration', notes: 'Optimizing webhooks latency parameters and microservice routing.', lastAppointment: '2026-06-01 04:30 PM', email: 'd.kim@starlight.net', stage: 'Won', value: 6500 },
];

export const STAGES: { id: LeadStage; name: string; themeColor: string; bgClass: string; textClass: string; borderClass: string; dotClass: string }[] = [
  { id: 'New Lead', name: 'New Lead', themeColor: 'indigo', bgClass: 'bg-indigo-50/60', textClass: 'text-indigo-800', borderClass: 'border-indigo-100', dotClass: 'bg-indigo-600' },
  { id: 'Qualified', name: 'Qualified', themeColor: 'amber', bgClass: 'bg-amber-50/60', textClass: 'text-amber-805', borderClass: 'border-amber-100', dotClass: 'bg-amber-600' },
  { id: 'Contacted', name: 'Contacted', themeColor: 'blue', bgClass: 'bg-blue-50/60', textClass: 'text-blue-800', borderClass: 'border-blue-105', dotClass: 'bg-blue-600' },
  { id: 'Proposal', name: 'Proposal', themeColor: 'violet', bgClass: 'bg-violet-50/60', textClass: 'text-violet-800', borderClass: 'border-violet-100', dotClass: 'bg-violet-600' },
  { id: 'Won', name: 'Won', themeColor: 'emerald', bgClass: 'bg-emerald-50/60', textClass: 'text-emerald-800', borderClass: 'border-emerald-100', dotClass: 'bg-emerald-600' },
  { id: 'Lost', name: 'Lost', themeColor: 'rose', bgClass: 'bg-rose-50/60', textClass: 'text-rose-800', borderClass: 'border-rose-100', dotClass: 'bg-rose-600' },
];

export function Clients() {
  const [leadsList, setLeadsList] = React.useState<CRMRecord[]>(() => {
    const saved = localStorage.getItem('preet_crm_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Robust backwards-compatible schema migration
          return parsed.map(record => ({
            ...record,
            stage: record.stage || 'New Lead',
            value: typeof record.value === 'number' ? record.value : 1500
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialLeads;
  });
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeView, setActiveView] = React.useState<'kanban' | 'list'>('kanban');
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState<'All' | 'Client' | 'Patient' | 'Customer'>('All');

  // Media Detail Drawer states
  const [selectedClient, setSelectedClient] = React.useState<CRMRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState<boolean>(false);

  const handleUpdateClient = (updated: CRMRecord) => {
    setLeadsList(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedClient && selectedClient.id === updated.id) {
      setSelectedClient(updated);
    }
  };

  // Form states
  const [newName, setNewName] = React.useState('');
  const [newType, setNewType] = React.useState<'Client' | 'Patient' | 'Customer'>('Client');
  const [newServiceTag, setNewServiceTag] = React.useState('');
  const [newNotes, setNewNotes] = React.useState('');
  const [newLastAppointment, setNewLastAppointment] = React.useState('2026-06-07 10:00 AM');
  const [newEmail, setNewEmail] = React.useState('');
  const [newStage, setNewStage] = React.useState<LeadStage>('New Lead');
  const [newValue, setNewValue] = React.useState('2500');

  React.useEffect(() => {
    localStorage.setItem('preet_crm_records', JSON.stringify(leadsList));
  }, [leadsList]);

  const filteredLeads = React.useMemo(() => {
    return leadsList.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        l.serviceTag.toLowerCase().includes(searchQuery.toLowerCase()) || 
        l.notes.toLowerCase().includes(searchQuery.toLowerCase()) || 
        l.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'All' ? true : l.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [leadsList, searchQuery, typeFilter]);

  const stats = React.useMemo(() => {
    const clientsCount = leadsList.filter(l => l.type === 'Client').length;
    const patientsCount = leadsList.filter(l => l.type === 'Patient').length;
    const customersCount = leadsList.filter(l => l.type === 'Customer').length;
    const activeAppointmentsCount = leadsList.filter(l => l.lastAppointment !== 'Pending Booking').length;
    
    // Total pipeline financial valuation (exclude 'Lost' to show active funnel size, or sum everything)
    const totalPipelineValue = leadsList
      .filter(l => l.stage !== 'Lost')
      .reduce((sum, current) => sum + (current.value || 0), 0);

    return {
      total: leadsList.length,
      clients: clientsCount,
      patients: patientsCount,
      customers: customersCount,
      activeAppts: activeAppointmentsCount,
      pipelineValue: totalPipelineValue
    };
  }, [leadsList]);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newServiceTag.trim()) {
      toast.error('Please enter a name and a service tag');
      return;
    }

    // Plan limits quota check
    const planLimits = getActivePlanLimits();
    if (leadsList.length >= planLimits.clients) {
      toast.error('Subscription Quota Limit Exhausted', {
        description: `Your active ${planLimits.name} tier limits you to ${planLimits.clients} CRM contacts. Please upgrade your subscription settings in the active Billing Tab to proceed.`
      });
      return;
    }

    const calculatedValue = Number(newValue) || 0;

    const newRecord: CRMRecord = {
      id: Date.now(),
      name: newName,
      type: newType,
      serviceTag: newServiceTag,
      notes: newNotes || 'No notes aggregated yet.',
      lastAppointment: newLastAppointment || 'Pending Booking',
      email: newEmail || 'no-email@workspace.com',
      stage: newStage,
      value: calculatedValue
    };

    setLeadsList(prev => [newRecord, ...prev]);
    toast.success(`Registered new CRM ${newType} into stage: ${newStage} successfully.`);

    // Reset fields
    setNewName('');
    setNewType('Client');
    setNewServiceTag('');
    setNewNotes('');
    setNewLastAppointment('2026-06-07 10:00 AM');
    setNewEmail('');
    setNewStage('New Lead');
    setNewValue('2500');
    setIsAddOpen(false);
  };

  const handleDeleteLead = (id: number) => {
    setLeadsList(prev => prev.filter(l => l.id !== id));
    toast.success('CRM profile removed.');
  };

  const handleMoveLead = (leadId: number, targetStage: LeadStage) => {
    setLeadsList(prev => prev.map(lead => {
      if (lead.id === leadId) {
        if (lead.stage !== targetStage) {
          toast.success(`Moved ${lead.name} to "${targetStage}" stage`);
          return { ...lead, stage: targetStage };
        }
      }
      return lead;
    }));
  };

  return (
    <SystemPageLayout>
      <PageHeader 
        category="Workspace Pipeline"
        title="Pipelines & Leads Hub"
        description="Configure client acquisition stages, manage financial estimates, and track customer journey maps in real-time."
        version="CRM Kanban v2.0"
        actions={
          <div className="flex items-center gap-2.5">
            {/* View Segmented Toggle Controls */}
            <div className="flex items-center gap-1 bg-slate-150 p-1 rounded-xl border border-slate-200 shadow-3xs mr-2">
              <Button 
                variant={activeView === 'kanban' ? 'secondary' : 'ghost'} 
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-lg font-bold text-[11px] uppercase tracking-wider gap-1.5 transition-all text-slate-700 bg-transparent shrink-0", 
                  activeView === 'kanban' && "bg-white shadow-xs border border-slate-100 hover:bg-white"
                )}
                onClick={() => setActiveView('kanban')}
              >
                <Kanban className="w-3.5 h-3.5 text-violet-600" />
                <span className="hidden sm:inline">Pipelines Kanban</span>
                <span className="sm:hidden">Kanban</span>
              </Button>
              <Button 
                variant={activeView === 'list' ? 'secondary' : 'ghost'} 
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-lg font-bold text-[11px] uppercase tracking-wider gap-1.5 transition-all text-slate-600 bg-transparent shrink-0", 
                  activeView === 'list' && "bg-white shadow-xs border border-slate-100 hover:bg-white"
                )}
                onClick={() => setActiveView('list')}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Table Directory</span>
                <span className="sm:hidden">Table</span>
              </Button>
            </div>

            <Button onClick={() => setIsAddOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-5 rounded-xl font-bold transition-all shrink-0 cursor-pointer border-none shadow-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-white" />
              <span>Add Record</span>
            </Button>
          </div>
        }
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 border-slate-200">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">Create Pipeline Record</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Add Client, Patient, or Customer metadata
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLead} className="space-y-4 py-2">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Profile Category *</Label>
                <select 
                  value={newType} 
                  onChange={e => setNewType(e.target.value as 'Client' | 'Patient' | 'Customer')}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-bold text-slate-700"
                >
                  <option value="Client">Client</option>
                  <option value="Patient">Patient</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Service Tag *</Label>
                <Input 
                  required 
                  placeholder="e.g. Website Design Hub" 
                  value={newServiceTag} 
                  onChange={e => setNewServiceTag(e.target.value)}
                  className="h-10 rounded-xl border-slate-200 text-xs font-bold" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Initial Pipeline Stage *</Label>
                <select 
                  value={newStage} 
                  onChange={e => setNewStage(e.target.value as LeadStage)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-bold text-slate-700"
                >
                  {STAGES.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pipeline Valuation ($) *</Label>
                <Input 
                  required 
                  type="number"
                  min="0"
                  placeholder="e.g. 2500" 
                  value={newValue} 
                  onChange={e => setNewValue(e.target.value)}
                  className="h-10 rounded-xl border-slate-200 text-xs font-bold" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Full Name *</Label>
              <Input 
                required 
                placeholder="e.g. Alex Rivera" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="h-10 rounded-xl border-slate-200 text-xs font-bold" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-bold">Email Address</Label>
              <Input 
                type="email" 
                placeholder="name@workspace.com" 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)}
                className="h-10 rounded-xl border-slate-200 text-xs font-bold" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Last Appointment Date</Label>
              <Input 
                placeholder="2026-06-07 10:00 AM or 'Pending Booking'" 
                value={newLastAppointment} 
                onChange={e => setNewLastAppointment(e.target.value)}
                className="h-10 rounded-xl border-slate-200 text-xs font-bold" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Notes & Diagnosis Details</Label>
              <textarea 
                placeholder="Enter status briefings, ongoing treatments, or contract specifications..." 
                value={newNotes} 
                onChange={e => setNewNotes(e.target.value)}
                className="w-full min-h-[70px] p-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
              />
            </div>

            <DialogFooter className="pt-4 flex sm:justify-end gap-2">
              <Button type="button" onClick={() => setIsAddOpen(false)} variant="ghost" className="rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider px-6 text-white cursor-pointer border-none h-10">
                Create Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PageContent>
        {/* Funnel Metrics & Stats board */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="clients-stats-board">
          
          <Card className="border-slate-200 shadow-3xs bg-white">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="bg-violet-50/60 p-3 rounded-xl border border-violet-100 shrink-0">
                <TrendingUp className="text-violet-600 w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Pipeline Value</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-xl font-black text-slate-900 leading-none">${stats.pipelineValue.toLocaleString()}</h3>
                  <span className="text-[10px] font-bold text-slate-400">USD</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-3xs bg-white">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 shrink-0">
                <Users className="text-blue-600 w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Funnel Leads</p>
                <h3 className="text-xl font-black text-slate-900 leading-none">{stats.total} accounts</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-3xs bg-white">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 shrink-0">
                <Stethoscope className="text-emerald-600 w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Patient List</p>
                <h3 className="text-xl font-black text-slate-900 leading-none">{stats.patients} records</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-3xs bg-white">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 shrink-0">
                <Briefcase className="text-indigo-600 w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Corporate Clients</p>
                <h3 className="text-xl font-black text-slate-900 leading-none">{stats.clients + stats.customers} records</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Pipeline Filters and controls */}
        <div className="col-span-12" id="pipelines-leads-workspace-main">
          <Card className="border-slate-200 shadow-3xs border overflow-visible p-4 mb-6 bg-white rounded-2xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 overflow-x-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search lead maps, tags, diagnosis profiles..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-slate-200 rounded-xl bg-slate-50/40 text-xs font-bold" 
                />
              </div>

              {/* Category Segmented Quick Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-sans mr-1">Client Category:</span>
                {[
                  { id: 'All', name: 'All' },
                  { id: 'Client', name: 'Clients' },
                  { id: 'Patient', name: 'Patients' },
                  { id: 'Customer', name: 'Customers' }
                ].map((categ) => (
                  <button
                    key={categ.id}
                    onClick={() => setTypeFilter(categ.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                      typeFilter === categ.id 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {categ.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* RENDERING SECTIONS ACCORDING TO VIEW SECTOR */}
          {activeView === 'kanban' ? (
            /* --- KANBAN VIEW WORKSPACE (PHASE 20) --- */
            <div className="space-y-6" id="pipelines-kanban-stages-view">
              
              {/* Kanban Column Lanes */}
              <div className="flex gap-4 overflow-x-auto pb-4 select-none [scrollbar-width:thin] xl:grid xl:grid-cols-6 xl:overflow-x-visible min-h-[550px]">
                {STAGES.map((stg) => {
                  const stageLeads = filteredLeads.filter(l => l.stage === stg.id);
                  const stageValueSum = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0);
                  
                  return (
                    <div 
                      key={stg.id} 
                      className="min-w-[285px] flex-1 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200/80 p-3.5 transition-all shadow-3xs"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const idStr = e.dataTransfer.getData('text/plain');
                        if (idStr) {
                          handleMoveLead(Number(idStr), stg.id);
                        }
                      }}
                    >
                      {/* Stage Column Header Info */}
                      <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 shrink-0 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", stg.dotClass)} />
                          <span className="text-xs font-bold text-slate-800 tracking-tight">{stg.name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 font-bold border-slate-200 text-slate-500 bg-white leading-none">
                            {stageLeads.length}
                          </Badge>
                        </div>
                        
                        <span className="text-[11px] font-bold font-mono text-indigo-600">
                          ${stageValueSum.toLocaleString()}
                        </span>
                      </div>

                      {/* Stack Content of this Stage Column */}
                      <div className="flex-1 overflow-y-auto space-y-3 min-h-[420px]">
                        {stageLeads.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-300/30 rounded-xl bg-slate-50/30 text-slate-400 italic text-[11px] font-medium min-h-[160px] leading-tight">
                            <span>Drop pipelines here...</span>
                          </div>
                        ) : (
                          stageLeads.map((record) => (
                            <div
                              key={record.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', record.id.toString());
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:shadow-md hover:border-slate-350 transition-all cursor-grab active:cursor-grabbing group relative"
                            >
                              {/* Top metadata badges */}
                              <div className="flex items-center justify-between gap-1.5 mb-2.5">
                                <span className={cn(
                                  "rounded px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider border leading-none",
                                  record.type === 'Patient' ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                  record.type === 'Client' ? "bg-blue-50 text-blue-800 border-blue-100" :
                                  "bg-indigo-50 text-indigo-805 border-indigo-100"
                                )}>
                                  {record.type}
                                </span>
                                
                                <span className="text-[11px] font-bold text-indigo-600 font-mono bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100">
                                  ${(record.value || 0).toLocaleString()}
                                </span>
                              </div>

                              {/* Target name heading */}
                              <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1">
                                {record.name}
                              </h4>

                              {/* Mail tracker link pointer */}
                              <p className="text-[10px] text-slate-400 font-bold font-mono lowercase tracking-tight truncate mb-2.5">
                                {record.email}
                              </p>

                              {/* Service tag banner badge */}
                              <div className="bg-slate-50 border border-slate-150 px-2 py-1 rounded-md mb-2.5 flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="text-[10px] font-black text-slate-700 truncate leading-none">
                                  {record.serviceTag}
                                </span>
                              </div>

                              {/* Notes */}
                              {record.notes && (
                                <p className="text-[10px] text-slate-500 font-semibold leading-normal line-clamp-2 bg-slate-50/40 p-1.5 rounded border border-slate-100 mb-3 select-none">
                                  {record.notes}
                                </p>
                              )}

                              {/* Footer control buttons */}
                              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 select-none gap-1">
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={stg.id === 'New Lead'}
                                    onClick={() => {
                                      const currIndex = STAGES.findIndex(s => s.id === stg.id);
                                      if (currIndex > 0) {
                                        handleMoveLead(record.id, STAGES[currIndex - 1].id);
                                      }
                                    }}
                                    className="h-6 w-6 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                    title="Move Stage Left"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={stg.id === 'Lost'}
                                    onClick={() => {
                                      const currIndex = STAGES.findIndex(s => s.id === stg.id);
                                      if (currIndex < STAGES.length - 1) {
                                        handleMoveLead(record.id, STAGES[currIndex + 1].id);
                                      }
                                    }}
                                    className="h-6 w-6 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                    title="Move Stage Right"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Button>
                                </div>

                                <div className="flex items-center gap-1">
                                  {/* Quick Email Launcher shortcut */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toast.success(`Client dispatch channel connected for: ${record.email}`)}
                                    className="h-6 w-6 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                    title="Email Contact Link"
                                  >
                                    <Mail className="w-3 h-3" />
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer rounded">
                                           <MoreVertical className="w-3.5 h-3.5" />
                                        </Button>
                                      }
                                    />
                                    <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                                      <DropdownMenuItem className="text-slate-400 text-[10px] uppercase font-black px-2.5 py-1 tracking-wider disabled" disabled>Stage Transfer</DropdownMenuItem>
                                      {STAGES.map(stageItem => (
                                        <DropdownMenuItem 
                                          key={stageItem.id} 
                                          onClick={() => handleMoveLead(record.id, stageItem.id)} 
                                          className={cn("text-xs font-bold cursor-pointer", record.stage === stageItem.id && "text-indigo-600 bg-slate-50")}
                                        >
                                          {stageItem.name}
                                        </DropdownMenuItem>
                                      ))}
                                      <DropdownMenuSeparator className="bg-slate-100" />
                                      <DropdownMenuItem onClick={() => { setSelectedClient(record); setIsDetailOpen(true); }} className="font-extrabold text-xs text-indigo-600 focus:text-indigo-750 cursor-pointer">View Profile & Files</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toast.info(`Appointment Schedule info: ${record.lastAppointment}`)} className="font-bold text-xs cursor-pointer">Last Appointment</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteLead(record.id)} className="text-rose-600 font-bold text-xs cursor-pointer">
                                        Delete Profile
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* --- CLASSIC LIST TABLE DIRECTORY VIEW --- */
            <Card className="border-slate-200 shadow-3xs overflow-hidden border">
              <CardContent className="p-0 border-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4">Client / Patient / Customer</th>
                        <th className="px-8 py-4">Stage / Pipeline</th>
                        <th className="px-8 py-4">Service Tag</th>
                        <th className="px-8 py-4">Est Value</th>
                        <th className="px-5 py-4">Notes & Diagnostics</th>
                        <th className="px-8 py-4">Last Appointment</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {filteredLeads.map((record) => {
                        const currentStage = STAGES.find(s => s.id === record.stage) || STAGES[0];
                        return (
                          <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                            
                            {/* Client Name & Profile Tag */}
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden">
                                  {record.profilePhotoUrl && (
                                    <AvatarImage src={record.profilePhotoUrl} className="object-cover w-full h-full" />
                                  )}
                                  <AvatarFallback className="rounded-lg bg-transparent font-black text-xs text-slate-700">
                                    {record.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs font-black text-slate-900 leading-snug">{record.name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={cn(
                                      "rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider border",
                                      record.type === 'Patient' ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                      record.type === 'Client' ? "bg-blue-50 text-blue-800 border-blue-100" :
                                      "bg-indigo-50 text-indigo-805 border-indigo-100"
                                    )}>
                                      {record.type}
                                    </span>
                                    <span className="text-[10px] text-slate-300 font-bold">•</span>
                                    <span className="text-[10px] text-slate-400 font-bold font-mono lowercase">{record.email}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Stage Badge indicator columns */}
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className={cn("w-2 h-2 rounded-full", currentStage.dotClass)} />
                                <span className={cn("text-xs font-black px-2.5 py-1 rounded-full border tracking-wide", currentStage.bgClass, currentStage.textClass, currentStage.borderClass)}>
                                  {record.stage}
                                </span>
                              </div>
                            </td>

                            {/* Service Tag */}
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-slate-400" />
                                <span className="text-xs font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                                  {record.serviceTag}
                                </span>
                              </div>
                            </td>

                            {/* Estimated Contract Value */}
                            <td className="px-8 py-4">
                              <span className="text-xs font-black font-mono text-indigo-650 bg-indigo-50/40 px-2 py-1 rounded border border-indigo-100">
                                ${(record.value || 0).toLocaleString()}
                              </span>
                            </td>

                            {/* Notes */}
                            <td className="px-5 py-4 max-w-[320px]">
                              <div className="flex items-start gap-1 p-2 bg-slate-50/20 rounded-lg border border-slate-100">
                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-600 font-semibold leading-relaxed line-clamp-2">
                                  {record.notes}
                                </p>
                              </div>
                            </td>

                            {/* Last Appointment */}
                            <td className="px-8 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className={cn(
                                  "text-xs font-bold text-slate-900 flex items-center gap-1",
                                  record.lastAppointment === 'Pending Booking' ? 'text-slate-400 italic' : 'text-slate-800'
                                )}>
                                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                  {record.lastAppointment}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-8 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  onClick={() => {
                                    toast.success(`Active email client opened for: ${record.email}`);
                                  }}
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
                                         <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    }
                                  />
                                  <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                                    <DropdownMenuItem className="text-slate-400 text-[10px] uppercase font-black px-2.5 py-1 tracking-wider disabled" disabled>Move Stage</DropdownMenuItem>
                                    {STAGES.map(stageItem => (
                                      <DropdownMenuItem 
                                        key={stageItem.id} 
                                        onClick={() => handleMoveLead(record.id, stageItem.id)} 
                                        className={cn("text-xs font-bold cursor-pointer", record.stage === stageItem.id && "text-indigo-600 bg-slate-50")}
                                      >
                                        Stage: {stageItem.name}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator className="bg-slate-100" />
                                    <DropdownMenuItem onClick={() => { setSelectedClient(record); setIsDetailOpen(true); }} className="font-extrabold text-xs text-indigo-600 focus:text-indigo-750 cursor-pointer">View Profile & Files</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteLead(record.id)} className="text-rose-600 font-bold text-xs cursor-pointer">
                                      Delete Profile
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                      {filteredLeads.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-8 py-16 text-center text-slate-400 italic font-medium">
                            No operational profiles found matching standard search filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>

      <ClientDetailDialog 
        client={selectedClient}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedClient(null);
        }}
        onUpdateClient={handleUpdateClient}
        workspaceId="1" // Multi-tenant primary sandbox workspace
      />
    </SystemPageLayout>
  );
}

export default Clients;
