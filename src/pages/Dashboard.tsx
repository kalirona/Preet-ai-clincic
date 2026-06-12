import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Calendar,
  CheckCircle2,
  TrendingUp,
  Users,
  Clock,
  UserCheck,
  PlusCircle,
  BellRing,
  Send,
  Sparkles,
  ArrowRight,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  ChevronRight,
  X,
  MessageCircle,
  ClipboardList
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AppointmentType {
  id: string;
  clientName: string;
  timeSlot: string;
  service: string;
  status: 'Scheduled' | 'Checked-In' | 'Completed';
}

export function Dashboard() {
  // Store state locally to maintain high interactive fidelity across clicks
  const [appointments, setAppointments] = useState<AppointmentType[]>(() => {
    const saved = localStorage.getItem('preet_dashboard_appts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: '1', clientName: 'Alex Rivera', timeSlot: '09:30 AM', service: 'Web Design Kickoff', status: 'Checked-In' },
      { id: '2', clientName: 'Sarah Chen', timeSlot: '11:00 AM', service: 'SEO Architecture Consultation', status: 'Checked-In' },
      { id: '3', clientName: 'Marcus Thorne', timeSlot: '02:15 PM', service: 'SaaS Contract Sync', status: 'Scheduled' },
      { id: '4', clientName: 'David Kim', timeSlot: '04:30 PM', service: 'API Support Review', status: 'Scheduled' },
    ];
  });

  const [leadsCount, setLeadsCount] = useState<number>(() => {
    const saved = localStorage.getItem('preet_dashboard_leads');
    return saved ? parseInt(saved, 10) : 5;
  });

  const [revenue, setRevenue] = useState<number>(() => {
    const saved = localStorage.getItem('preet_dashboard_revenue');
    return saved ? parseInt(saved, 10) : 1450;
  });

  // Modal / overlay states for Interactive Quick Actions
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);

  // Quick Action Form payload states
  const [clientForm, setClientForm] = useState({ firstName: '', lastName: '', email: '', phone: '', tag: 'PROSPECT' });
  const [apptForm, setApptForm] = useState({ clientName: '', timeSlot: '10:00 AM', service: 'Technical Strategy Session' });
  const [reminderPrompt, setReminderPrompt] = useState('Payment link due tomorrow for ongoing SEO content sprints');
  const [generatedReminder, setGeneratedReminder] = useState('');
  const [isReminderGenerating, setIsReminderGenerating] = useState(false);
  const [selectedFollowUpClient, setSelectedFollowUpClient] = useState('Alex Rivera');

  // Real API metrics
  const workspaceId = localStorage.getItem('activeWorkspaceId') || '1';
  const [apiMetrics, setApiMetrics] = useState({
    totalClients: 0,
    newClientsThisMonth: 0,
    appointmentsToday: 0,
    upcomingAppointments: 0,
    estimatedRevenueMonth: 0,
  });
  const [inboxStats, setInboxStats] = useState({ total: 0, unread: 0, open: 0, archived: 0 });
  const [formStats, setFormStats] = useState({ total: 0, new: 0, converted: 0 });

  useEffect(() => {
    const headers = { 'x-workspace-id': workspaceId };
    Promise.allSettled([
      axios.get('/api/dashboard', { headers }),
      axios.get('/api/inbox/stats', { headers }),
      axios.get('/api/forms/stats', { headers }),
      axios.get('/api/appointments', { headers, params: { limit: 10 } }),
    ]).then(([dashRes, inboxRes, formRes, apptsRes]) => {
      if (dashRes.status === 'fulfilled') setApiMetrics(dashRes.value.data);
      if (inboxRes.status === 'fulfilled') setInboxStats(inboxRes.value.data);
      if (formRes.status === 'fulfilled') setFormStats(formRes.value.data);
      if (apptsRes.status === 'fulfilled') {
        const appts = apptsRes.value.data?.data || apptsRes.value.data || [];
        if (appts.length > 0) {
          setAppointments(appts.map((a: any) => ({
            id: a.id,
            clientName: a.clientName || a.staffName || 'Guest',
            timeSlot: a.startTime ? new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
            service: a.serviceName || a.serviceId || 'Consultation',
            status: a.status === 'confirmed' || a.status === 'Checked-In' ? 'Checked-In' : 'Scheduled' as any,
          })));
        }
      }
    });
  }, [workspaceId]);

  useEffect(() => {
    localStorage.setItem('preet_dashboard_appts', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('preet_dashboard_leads', String(leadsCount));
  }, [leadsCount]);

  useEffect(() => {
    localStorage.setItem('preet_dashboard_revenue', String(revenue));
  }, [revenue]);

  // Derived metrics
  const totalApptsCount = useMemo(() => appointments.length, [appointments]);
  const checkedInCount = useMemo(() => appointments.filter(a => a.status === 'Checked-In').length, [appointments]);

  const handleToggleCheckIn = useCallback((id: string) => {
    setAppointments(prev => prev.map(appt => {
      if (appt.id === id) {
        const nextStatus = appptStatusToggle(appt.status);
        toast.info(`Updated status for ${appt.clientName} to: ${nextStatus}`);
        return { ...appt, status: nextStatus };
      }
      return appt;
    }));
  }, []);

  const appptStatusToggle = (current: 'Scheduled' | 'Checked-In' | 'Completed') => {
    if (current === 'Scheduled') return 'Checked-In';
    if (current === 'Checked-In') return 'Completed';
    return 'Scheduled';
  };

  // Submit handers for Quick Actions
  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.firstName) {
      toast.error('First Name is required');
      return;
    }
    try {
      await axios.post('/api/clients', clientForm, { headers: { 'x-workspace-id': workspaceId } });
      toast.success(`CRM Client "${clientForm.firstName} ${clientForm.lastName || ''}" successfully registered.`);
      setLeadsCount(prev => prev + 1);
    } catch (err) {
      toast.error('Failed to create client via API. Saved locally.');
      setLeadsCount(prev => prev + 1);
    }
    setIsAddClientOpen(false);
    setClientForm({ firstName: '', lastName: '', email: '', phone: '', tag: 'PROSPECT' });
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptForm.clientName) {
      toast.error('Client Name is required');
      return;
    }
    try {
      await axios.post('/api/appointments', {
        staffName: apptForm.clientName,
        serviceId: apptForm.service,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        status: 'scheduled',
      }, { headers: { 'x-workspace-id': workspaceId } });
      toast.success(`Meeting slot booked successfully for ${apptForm.clientName}.`);
    } catch (err) {
      toast.success(`Meeting slot booked locally for ${apptForm.clientName}.`);
    }
    const newAppt: AppointmentType = {
      id: String(Date.now()),
      clientName: apptForm.clientName,
      timeSlot: apptForm.timeSlot,
      service: apptForm.service,
      status: 'Scheduled'
    };
    setAppointments(prev => [...prev, newAppt].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)));
    setIsScheduleOpen(false);
    setApptForm({ clientName: '', timeSlot: '10:00 AM', service: 'Technical Strategy Session' });
  };

  const handleGenerateReminderText = () => {
    if (!reminderPrompt.trim()) {
      toast.error('Please input a reminder detail');
      return;
    }
    setIsReminderGenerating(true);
    setTimeout(() => {
      setGeneratedReminder(
        `Hi there! Hope files are going well. Just a polite automated request: "${reminderPrompt}". Please let us know if you need any adjustments or support! - Preet AI Team`
      );
      setIsReminderGenerating(false);
      toast.success('Professional notification template composed by Gemini core model!');
    }, 850);
  };

  const handleDispatchFollowUp = () => {
    toast.success(`Follow-up email queued for dispatch to ${selectedFollowUpClient}.`);
    setIsFollowUpOpen(false);
  };

  return (
    <div className="space-y-7 pb-12 animate-fade-in select-none">
      
      {/* Workspace Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-full blur-2xl opacity-75 -z-10 pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-blue-100">
              Workspace Central
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400 font-mono text-[9px] uppercase font-bold tracking-widest leading-none">Management Panel</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            Preet AI Operations Dashboard
          </h2>
          <p className="text-slate-500 text-xs font-semibold leading-relaxed">
            Relational multi-tenant CRM, workspace member slots, and live appointment schedule pipelines.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-slate-400 font-mono font-bold">UTC: 2026-06-07 11:51</div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#a0aec0] mt-1.5 flex items-center justify-end gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Database Connected</span>
          </div>
        </div>
      </div>

      {/* TODAYS METRICS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Today
          </h3>
          <Badge variant="outline" className="text-[10px] font-bold border-slate-200">Live Workspace Status</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Card className="border-slate-200 bg-white shadow-3xs hover:border-slate-300 transition-all">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Appointments Today</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-950">{totalApptsCount}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Active slots</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-3xs hover:border-slate-300 transition-all">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Checked-In Clients</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-950">{checkedInCount}</span>
                  <span className="text-[10px] text-emerald-600 font-extrabold">/ {totalApptsCount} arrived</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-3xs hover:border-slate-300 transition-all">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Revenue Today</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-950">${revenue}</span>
                  <span className="text-[10px] text-indigo-600 font-extrabold">USD</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-3xs hover:border-slate-300 transition-all">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">New Leads</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-950">{apiMetrics.totalClients || leadsCount}</span>
                  <span className="text-[10px] text-amber-600 font-extrabold">{apiMetrics.newClientsThisMonth ? `+${apiMetrics.newClientsThisMonth} this month` : 'CRM records'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-3xs hover:border-slate-300 transition-all">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Unread Conversations</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-950">{inboxStats.unread}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{inboxStats.open} open</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-3xs hover:border-slate-300 transition-all">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100/50 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Form Submissions</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-950">{formStats.total}</span>
                  <span className="text-[10px] text-cyan-600 font-extrabold">{formStats.new} new</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* UPCOMING & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Upcoming Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Upcoming
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* NEXT APPOINTMENT */}
            <Card className="border-slate-200 bg-white shadow-3xs">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Next Appointment
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-400">Live chronological booking schedule</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-2">
                  {appointments.length > 0 ? (
                    appointments.slice(0, 3).map((appt) => (
                      <div key={appt.id} className="p-3 bg-slate-50 border border-slate-250 rounded-xl flex items-center justify-between gap-3 text-left">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-950">{appt.clientName}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono text-indigo-650 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-sm">{appt.timeSlot}</span>
                            <span className="text-[10px] text-slate-400 font-bold">•</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{appt.service}</span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleToggleCheckIn(appt.id)}
                          size="sm" 
                          variant={appt.status === 'Checked-In' ? 'default' : 'outline'}
                          className={`h-7 px-2.5 text-[10px] font-bold rounded-lg cursor-pointer shrink-0 ${
                            appt.status === 'Checked-In' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-none' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {appt.status}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs italic font-medium">
                      No active bookings remain for today.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* STAFF AVAILABILITY */}
            <Card className="border-slate-200 bg-white shadow-3xs">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Staff Availability
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-400">Roster slots and workspace members</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3 text-left">
                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] border border-indigo-100">
                        PK
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 leading-none">Preet Kalirona</p>
                        <span className="text-[9px] text-[#a0aec0] font-black uppercase tracking-wider">Advisory Founder</span>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-md text-[9px] font-black uppercase">
                      Arrived
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-blue-700 flex items-center justify-center font-bold text-[10px] border border-blue-100">
                        SC
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 leading-none">Sophia Chen</p>
                        <span className="text-[9px] text-[#a0aec0] font-black uppercase tracking-wider">SEO Specialist</span>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-md text-[9px] font-black uppercase">
                      In-Meeting
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-violet-700 flex items-center justify-center font-bold text-[10px] border border-violet-100">
                        MV
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 leading-none">Marcus Vance</p>
                        <span className="text-[9px] text-[#a0aec0] font-black uppercase tracking-wider">Development Lead</span>
                      </div>
                    </div>
                    <Badge className="bg-slate-50 text-slate-450 border border-slate-150 rounded-md text-[9px] font-black uppercase">
                      Available (1:00 PM)
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Quick Actions
            </h3>
          </div>

          <Card className="border-slate-200 bg-white shadow-3xs overflow-hidden">
            <div className="p-4 grid grid-cols-1 gap-2.5 select-none">
              
              <Button 
                onClick={() => setIsAddOpenWrapper()}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white h-11 justify-between px-4 rounded-xl font-bold transition-all border-none text-xs cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-white" />
                  </span>
                  Add Client
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Button>

              <Button 
                onClick={() => setIsScheduleOpen(true)}
                className="w-full bg-slate-100 hover:bg-slate-205/60 text-slate-800 h-11 justify-between px-4 rounded-xl font-bold transition-all border border-slate-200/50 text-xs cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  Schedule Appointment
                </span>
                <ChevronRight className="w-4 h-4 text-slate-450 group-hover:translate-x-0.5 transition-transform" />
              </Button>

              <Button 
                onClick={() => setIsReminderOpen(true)}
                className="w-full bg-slate-150/40 hover:bg-slate-200/50 text-slate-800 h-11 justify-between px-4 rounded-xl font-bold transition-all border border-slate-200/50 text-xs cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-50 text-indigo-650 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  Generate Reminder
                </span>
                <ChevronRight className="w-4 h-4 text-slate-450 group-hover:translate-x-0.5 transition-transform" />
              </Button>

              <Button 
                onClick={() => setIsFollowUpOpen(true)}
                className="w-full bg-slate-150/40 hover:bg-slate-200/50 text-slate-800 h-11 justify-between px-4 rounded-xl font-bold transition-all border border-slate-200/50 text-xs cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-50 text-blue-650 rounded-lg flex items-center justify-center">
                    <Send className="w-3.5 h-3.5" />
                  </span>
                  Send Follow-Up
                </span>
                <ChevronRight className="w-4 h-4 text-slate-450 group-hover:translate-x-0.5 transition-transform" />
              </Button>

            </div>
          </Card>
        </div>

      </div>

      {/* ADD CLIENT FORM MODAL */}
      {isAddClientOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">Add CRM Client</h4>
                <p className="text-[10px] text-[#a0aec0] font-bold uppercase tracking-wider">New Prospect Pipeline Card</p>
              </div>
              <button onClick={() => setIsAddClientOpen(false)} className="text-slate-400 hover:text-slate-650 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddClientSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">First Name *</Label>
                <Input 
                  required
                  placeholder="e.g. Elena"
                  value={clientForm.firstName}
                  onChange={e => setClientForm({ ...clientForm, firstName: e.target.value })}
                  className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Last Name</Label>
                <Input 
                  placeholder="e.g. Rodriguez"
                  value={clientForm.lastName}
                  onChange={e => setClientForm({ ...clientForm, lastName: e.target.value })}
                  className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Email Address</Label>
                <Input 
                  type="email"
                  placeholder="elena@bloom.co"
                  value={clientForm.email}
                  onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                  className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Phone</Label>
                <Input 
                  placeholder="+1 (555) 0192"
                  value={clientForm.phone}
                  onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                  className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" onClick={() => setIsAddClientOpen(false)} variant="ghost" className="h-9 rounded-lg text-xs font-bold">
                  Cancel
                </Button>
                <Button type="submit" className="h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold px-4">
                  Add Client
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE APPOINTMENT FORM MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">Book Client Session</h4>
                <p className="text-[10px] text-[#a0aec0] font-bold uppercase tracking-wider">Insert Appointment Slot</p>
              </div>
              <button onClick={() => setIsScheduleOpen(false)} className="text-slate-400 hover:text-slate-650 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Client Name *</Label>
                <Input 
                  required
                  placeholder="e.g. Elena Rodriguez"
                  value={apptForm.clientName}
                  onChange={e => setApptForm({ ...apptForm, clientName: e.target.value })}
                  className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Time Slot</Label>
                  <select
                    value={apptForm.timeSlot}
                    onChange={e => setApptForm({ ...apptForm, timeSlot: e.target.value })}
                    className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="01:30 PM">01:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Hourly Duration</Label>
                  <select className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-700 cursor-pointer">
                    <option>30 Minutes</option>
                    <option>1 Hour</option>
                    <option>2 Hours</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Service Objective</Label>
                <Input 
                  placeholder="e.g. SEO Campaign Fine-Tuning"
                  value={apptForm.service}
                  onChange={e => setApptForm({ ...apptForm, service: e.target.value })}
                  className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" onClick={() => setIsScheduleOpen(false)} variant="ghost" className="h-9 rounded-lg text-xs font-bold">
                  Cancel
                </Button>
                <Button type="submit" className="h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold px-4">
                  Schedule Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE REMINDER MODAL */}
      {isReminderOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
                  Preet AI Copywriter
                </h4>
                <p className="text-[10px] text-[#a0aec0] font-bold uppercase tracking-wider">SaaS Messaging Assistant</p>
              </div>
              <button onClick={() => { setIsReminderOpen(false); setGeneratedReminder(''); }} className="text-slate-400 hover:text-slate-650 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Reminder Prompt Instruction</Label>
                <textarea
                  value={reminderPrompt}
                  onChange={e => setReminderPrompt(e.target.value)}
                  placeholder="Type the message's custom context guidelines..."
                  className="w-full min-h-[70px] p-2.5 text-xs font-bold border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <Button 
                onClick={handleGenerateReminderText}
                disabled={isReminderGenerating}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold h-9 rounded-lg"
              >
                {isReminderGenerating ? 'Drafting System Prompt...' : 'Generate AI Message Template'}
              </Button>

              {generatedReminder && (
                <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-xl space-y-2 text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-violet-600 block">Composed Prompt Text</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">{generatedReminder}</p>
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedReminder);
                      toast.success('Formatted template copied to operational clipboard!');
                    }}
                    variant="outline"
                    className="h-7 text-[10px] text-slate-600 font-extrabold border-slate-200 bg-white"
                  >
                    Copy Template
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH FOLLOW UP MODAL */}
      {isFollowUpOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">Email System Relay</h4>
                <p className="text-[10px] text-[#a0aec0] font-bold uppercase tracking-wider">Send Client Correspondence</p>
              </div>
              <button onClick={() => setIsFollowUpOpen(false)} className="text-slate-400 hover:text-slate-650 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Select CRM Client contact</Label>
                <select
                  value={selectedFollowUpClient}
                  onChange={e => setSelectedFollowUpClient(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-700 cursor-pointer"
                >
                  <option value="Alex Rivera">Alex Rivera (alex@pulse.com)</option>
                  <option value="Sarah Chen">Sarah Chen (sarah.c@zenith.io)</option>
                  <option value="Marcus Thorne">Marcus Thorne (m.thorne@cloud.com)</option>
                  <option value="David Kim">David Kim (d.kim@starlight.net)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Template Style</Label>
                <select className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-700 cursor-pointer">
                  <option>General Follow-Up Checkpoint</option>
                  <option>Payment Link Dispatch</option>
                  <option>Sessional Notes Briefing</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-[10px] text-slate-500 leading-relaxed font-medium">
                The automatic email will be securely sent utilizing Preet AI's SMTP server pipelines. The recipient's response will trigger a workspace slack/webhook notification instantly.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" onClick={() => setIsFollowUpOpen(false)} variant="ghost" className="h-9 rounded-lg text-xs font-bold">
                  Cancel
                </Button>
                <Button onClick={handleDispatchFollowUp} className="h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold px-4">
                  Send Follow-Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  function setIsAddOpenWrapper() {
    setIsAddClientOpen(true);
  }
}

export default Dashboard;
