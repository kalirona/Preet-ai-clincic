import React, { useState, useEffect } from 'react';
import { Building, Palette, Globe, Save, CheckCircle2, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function WorkspaceSettings() {
  const [workspaceName, setWorkspaceName] = useState(() => localStorage.getItem('settings_workspaceName') || 'Preet AI Suite Studio');
  const [workspaceLogo, setWorkspaceLogo] = useState(() => localStorage.getItem('settings_workspaceLogo') || '⚡');
  const [brandingColor, setBrandingColor] = useState(() => localStorage.getItem('settings_brandingColor') || '#6366f1');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('settings_timezone') || 'America/New_York');
  const [baseCurrency, setBaseCurrency] = useState(() => localStorage.getItem('settings_baseCurrency') || 'USD');
  const [customDomain, setCustomDomain] = useState(() => localStorage.getItem('settings_customDomain') || '');
  const [emailSenderName, setEmailSenderName] = useState(() => localStorage.getItem('settings_emailSenderName') || '');
  const [emailSmtpHost, setEmailSmtpHost] = useState(() => localStorage.getItem('settings_emailSmtpHost') || '');
  const [emailSmtpPort, setEmailSmtpPort] = useState(() => localStorage.getItem('settings_emailSmtpPort') || '587');
  const [hasChanges, setHasChanges] = useState(false);

  const markChanged = () => setHasChanges(true);

  const saveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings_workspaceName', workspaceName);
    localStorage.setItem('settings_workspaceLogo', workspaceLogo);
    localStorage.setItem('settings_brandingColor', brandingColor);
    localStorage.setItem('settings_timezone', timezone);
    localStorage.setItem('settings_baseCurrency', baseCurrency);
    localStorage.setItem('settings_customDomain', customDomain);
    localStorage.setItem('settings_emailSenderName', emailSenderName);
    localStorage.setItem('settings_emailSmtpHost', emailSmtpHost);
    localStorage.setItem('settings_emailSmtpPort', emailSmtpPort);
    setHasChanges(false);
    toast.success('Workspace settings saved successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Workspace Identity */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-violet-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Workspace Identity</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Configure your workspace name, logo, and branding.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={saveWorkspace} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Workspace Name</Label>
                <Input
                  required
                  value={workspaceName}
                  onChange={e => { setWorkspaceName(e.target.value); markChanged(); }}
                  className="h-11 rounded-xl border-slate-200 focus:border-violet-500"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Logo Symbol</Label>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                    {workspaceLogo}
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {['⚡', '🚀', '💼', '📈', '🌐', '🤖', '👑', '⭐'].map(sym => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => { setWorkspaceLogo(sym); markChanged(); }}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all text-sm cursor-pointer ${
                          workspaceLogo === sym ? 'bg-white border-violet-500 ring-2 ring-violet-500/10' : 'bg-slate-50 border-transparent hover:bg-slate-100'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Colors */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-violet-500" />
                Brand Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Indigo', hex: '#6366f1' },
                  { name: 'Emerald', hex: '#10b981' },
                  { name: 'Rose', hex: '#f43f5e' },
                  { name: 'Amber', hex: '#f59e0b' },
                  { name: 'Blue', hex: '#2563eb' },
                  { name: 'Sky', hex: '#0ea5e9' },
                  { name: 'Slate', hex: '#334155' }
                ].map(col => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => { setBrandingColor(col.hex); markChanged(); }}
                    className={`w-8 h-8 rounded-full transition-all flex items-center justify-center cursor-pointer border-2 ${
                      brandingColor.toLowerCase() === col.hex.toLowerCase() ? 'ring-2 ring-offset-2 ring-slate-400 scale-110 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {brandingColor.toLowerCase() === col.hex.toLowerCase() && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3]" />
                    )}
                  </button>
                ))}
                <input
                  type="color"
                  value={brandingColor}
                  onChange={e => { setBrandingColor(e.target.value); markChanged(); }}
                  className="w-8 h-8 rounded-full cursor-pointer border-2 border-slate-200"
                />
              </div>
            </div>

            {hasChanges && (
              <div className="flex justify-end">
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs px-6">
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Localization & Region */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Localization & Region</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Set timezone, currency, and regional preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Timezone</Label>
              <select
                value={timezone}
                onChange={e => { setTimezone(e.target.value); markChanged(); }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-violet-500 focus:outline-none"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="UTC">UTC</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Base Currency</Label>
              <select
                value={baseCurrency}
                onChange={e => { setBaseCurrency(e.target.value); markChanged(); }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-violet-500 focus:outline-none"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Custom Domain</Label>
              <Input
                value={customDomain}
                onChange={e => { setCustomDomain(e.target.value); markChanged(); }}
                className="h-11 rounded-xl border-slate-200 focus:border-violet-500"
                placeholder="booking.yourdomain.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMTP / Email */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Email & SMTP</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Configure outbound email settings for notifications and booking confirmations.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sender Name</Label>
              <Input
                value={emailSenderName}
                onChange={e => { setEmailSenderName(e.target.value); markChanged(); }}
                className="h-11 rounded-xl border-slate-200 focus:border-violet-500"
                placeholder="Your Business Name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">SMTP Host</Label>
              <Input
                value={emailSmtpHost}
                onChange={e => { setEmailSmtpHost(e.target.value); markChanged(); }}
                className="h-11 rounded-xl border-slate-200 focus:border-violet-500"
                placeholder="smtp.sendgrid.net"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">SMTP Port</Label>
              <Input
                value={emailSmtpPort}
                onChange={e => { setEmailSmtpPort(e.target.value); markChanged(); }}
                className="h-11 rounded-xl border-slate-200 focus:border-violet-500"
                placeholder="587"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={saveWorkspace} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs px-6">
              <Save className="w-4 h-4 mr-1.5" />
              Save Email Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
