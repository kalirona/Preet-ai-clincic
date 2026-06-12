import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, Building, UserCheck, Lock, User, Key, Download, Cpu, Mail, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { WorkspaceSettings } from './settings/WorkspaceSettings';
import { TeamSettings } from './settings/TeamSettings';
import { SecuritySettings } from './settings/SecuritySettings';

const tabs = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'workspace', label: 'Workspace', icon: Building },
  { value: 'team', label: 'Team', icon: UserCheck },
  { value: 'security', label: 'Security', icon: Lock },
  { value: 'api', label: 'Integrations', icon: Key },
  { value: 'notifications', label: 'Notifications', icon: Mail },
  { value: 'export', label: 'Export & Backup', icon: Download },
];

function ProfileSettings() {
  const [fullName, setFullName] = useState(() => localStorage.getItem('settings_fullName') || 'Preet Kalirona');
  const [emailAddress, setEmailAddress] = useState(() => localStorage.getItem('settings_emailAddress') || 'preetkalirona@gmail.com');
  const [jobTitle, setJobTitle] = useState(() => localStorage.getItem('settings_jobTitle') || 'CEO');
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('settings_avatar') || '👨‍💻');

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings_fullName', fullName);
    localStorage.setItem('settings_emailAddress', emailAddress);
    localStorage.setItem('settings_jobTitle', jobTitle);
    localStorage.setItem('settings_avatar', selectedAvatar);
    toast.success('Profile saved successfully.');
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-violet-600" />
          <CardTitle className="text-sm font-bold text-slate-900">Personal Profile</CardTitle>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Your personal account settings and avatar.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={saveProfile} className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="w-14 h-14 rounded-xl bg-violet-600 text-white flex items-center justify-center text-2xl shrink-0">
              {selectedAvatar}
            </div>
            <div className="flex-1">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Avatar</Label>
              <div className="flex flex-wrap gap-1">
                {['👨‍💻', '👩‍💼', '🧑‍🎨', '👨‍🔬', '👩‍🚀', '🧑‍⚕️', '👨‍🏫', '⚡'].map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setSelectedAvatar(a)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm cursor-pointer transition-all ${
                      selectedAvatar === a ? 'bg-white border-violet-500 ring-2 ring-violet-500/10' : 'bg-transparent border-transparent hover:bg-white'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</Label>
              <Input required value={fullName} onChange={e => setFullName(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-violet-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email</Label>
              <Input required type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-violet-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Job Title</Label>
              <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="h-11 rounded-xl border-slate-200 focus:border-violet-500" placeholder="e.g. CEO" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs px-6">
              Save Profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function IntegrationsSettings() {
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('settings_gemini_key') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('settings_openai_key') || '');

  const saveApiKeys = () => {
    if (geminiKey) localStorage.setItem('settings_gemini_key', geminiKey);
    if (openaiKey) localStorage.setItem('settings_openai_key', openaiKey);
    toast.success('API keys saved securely.');
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-sm font-bold text-slate-900">API Integrations</CardTitle>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Configure API keys for AI providers and external services.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Google Gemini API Key</Label>
          <Input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} className="h-11 rounded-xl border-slate-200 font-mono text-sm" placeholder="AIza..." />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">OpenAI API Key</Label>
          <Input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} className="h-11 rounded-xl border-slate-200 font-mono text-sm" placeholder="sk-..." />
        </div>
        <div className="flex justify-end">
          <Button onClick={saveApiKeys} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs px-6">
            Save API Keys
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsSettings() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [bookingNotifs, setBookingNotifs] = useState(true);
  const [leadNotifs, setLeadNotifs] = useState(false);

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-violet-500' : 'bg-slate-300'}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-emerald-600" />
          <CardTitle className="text-sm font-bold text-slate-900">Notification Preferences</CardTitle>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Choose which notifications you want to receive.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {[
          { label: 'Email Notifications', desc: 'Receive email for important updates', enabled: emailNotifs, toggle: () => setEmailNotifs(!emailNotifs) },
          { label: 'New Booking Alerts', desc: 'Get notified when a new appointment is booked', enabled: bookingNotifs, toggle: () => setBookingNotifs(!bookingNotifs) },
          { label: 'New Lead Alerts', desc: 'Get notified when a new lead is captured', enabled: leadNotifs, toggle: () => setLeadNotifs(!leadNotifs) },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{item.label}</h4>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <ToggleSwitch enabled={item.enabled} onToggle={item.toggle} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ExportBackupSettings() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-amber-600" />
          <CardTitle className="text-sm font-bold text-slate-900">Export & Backup</CardTitle>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Export your data or create a backup snapshot.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Export Clients (CSV)', desc: 'Download all client records' },
            { label: 'Export Appointments', desc: 'Download appointment history' },
            { label: 'Export Revenue', desc: 'Download revenue report' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => toast.success(`${item.label} download started.`)}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-left hover:border-violet-300 hover:bg-violet-50/30 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5 text-slate-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-900">{item.label}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const handleTabChange = (val: string) => setSearchParams({ tab: val });

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Settings & Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your workspace, team, security, and integrations.</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-white border border-slate-200 rounded-xl p-1 h-auto flex flex-wrap gap-1 mb-6">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white"
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile"><ProfileSettings /></TabsContent>
          <TabsContent value="workspace"><WorkspaceSettings /></TabsContent>
          <TabsContent value="team"><TeamSettings /></TabsContent>
          <TabsContent value="security"><SecuritySettings /></TabsContent>
          <TabsContent value="api"><IntegrationsSettings /></TabsContent>
          <TabsContent value="notifications"><NotificationsSettings /></TabsContent>
          <TabsContent value="export"><ExportBackupSettings /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
