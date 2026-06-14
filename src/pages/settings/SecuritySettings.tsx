import React, { useState } from 'react';
import { Lock, Shield, Key, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function SecuritySettings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [passwordMinLength, setPasswordMinLength] = useState('8');
  const [requireSpecialChars, setRequireSpecialChars] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState('');

  const handleSaveSecurity = () => {
    toast.success('Security settings updated.');
  };

  return (
    <div className="space-y-6">
      {/* Authentication */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Authentication</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Manage login security and session policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Two-Factor Auth */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${twoFactorEnabled ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                <Shield className={`w-5 h-5 ${twoFactorEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Two-Factor Authentication</h4>
                <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
              </div>
            </div>
            <button
              onClick={() => { setTwoFactorEnabled(!twoFactorEnabled); toast.success(twoFactorEnabled ? '2FA disabled.' : '2FA enabled.'); }}
              className={`relative w-12 h-6 rounded-full transition-colors ${twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Password Policy */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password Policy</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Minimum Length</Label>
                <Input
                  type="number"
                  value={passwordMinLength}
                  onChange={e => setPasswordMinLength(e.target.value)}
                  className="h-10 rounded-lg text-sm font-semibold"
                  min="6"
                  max="32"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Special Characters</Label>
                <div className="flex items-center gap-2 h-10">
                  <button
                    onClick={() => setRequireSpecialChars(!requireSpecialChars)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${requireSpecialChars ? 'bg-violet-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${requireSpecialChars ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-xs text-slate-600 font-medium">Required</span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Timeout */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Session Timeout (minutes)</Label>
            <Input
              type="number"
              value={sessionTimeout}
              onChange={e => setSessionTimeout(e.target.value)}
              className="h-10 w-32 rounded-lg text-sm font-semibold"
              min="5"
              max="480"
            />
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-sm font-bold text-slate-900">API Keys</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Manage API keys for external integrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <Key className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">Production Key</div>
              <div className="text-xs text-slate-500 font-mono">
                {showApiKey ? '••••••••••••••••••••••••••••••••' : '••••••••••••••••••••••••••••••••'}
              </div>
            </div>
            <button onClick={() => setShowApiKey(!showApiKey)} className="text-slate-400 hover:text-slate-600">
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-200 bg-emerald-50">Active</Badge>
          </div>
          <Button variant="outline" className="rounded-xl text-xs font-bold">
            <Key className="w-4 h-4 mr-1.5" />
            Generate New Key
          </Button>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Access Control</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Restrict access by IP address and configure network policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">IP Whitelist (comma-separated)</Label>
            <Input
              value={ipWhitelist}
              onChange={e => setIpWhitelist(e.target.value)}
              className="h-10 rounded-lg text-sm font-mono"
              placeholder="192.168.1.1, 10.0.0.0/8"
            />
            <p className="text-[11px] text-slate-400">Leave empty to allow all IPs.</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSecurity} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs px-6">
          Save Security Settings
        </Button>
      </div>
    </div>
  );
}
