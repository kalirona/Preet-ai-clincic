import React, { useState } from 'react';
import { UserCheck, Plus, X, Shield, MoreHorizontal, Mail, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member';
  status: 'Active' | 'Invited' | 'Suspended';
  joinedAt: string;
}

const roleColors: Record<string, string> = {
  Owner: 'bg-violet-100 text-violet-700 border-violet-200',
  Admin: 'bg-blue-100 text-blue-700 border-blue-200',
  Member: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Invited: 'bg-amber-50 text-amber-700 border-amber-200',
  Suspended: 'bg-red-50 text-red-700 border-red-200',
};

export function TeamSettings() {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Preet Kalirona', email: 'preetkalirona@gmail.com', role: 'Owner', status: 'Active', joinedAt: '2024-01-15' },
    { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'Admin', status: 'Active', joinedAt: '2024-03-20' },
    { id: '3', name: 'Marcus Johnson', email: 'marcus@example.com', role: 'Member', status: 'Invited', joinedAt: '2024-06-01' },
  ]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member'>('Member');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      toast.error('Name and email are required.');
      return;
    }
    const newMember: TeamMember = {
      id: String(Date.now()),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: 'Invited',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setMembers(prev => [...prev, newMember]);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('Member');
    setShowInviteForm(false);
    toast.success(`Invitation sent to ${inviteEmail}`);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    toast.success('Team member removed.');
  };

  const handleChangeRole = (id: string, newRole: 'Owner' | 'Admin' | 'Member') => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
    toast.success('Role updated.');
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-violet-600" />
              <CardTitle className="text-sm font-bold text-slate-900">Team Members</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Manage your team and control who has access to what.
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs px-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            Invite Member
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {/* Invite Form */}
          {showInviteForm && (
            <form onSubmit={handleInvite} className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Invite Teammate</h4>
                <button type="button" onClick={() => setShowInviteForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-4 space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    className="h-10 text-xs bg-white rounded-lg font-semibold"
                    required
                  />
                </div>
                <div className="sm:col-span-4 space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</Label>
                  <Input
                    type="email"
                    placeholder="john@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="h-10 text-xs bg-white rounded-lg font-semibold"
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</Label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as any)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <Button type="submit" className="w-full h-10 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase">
                    Send Invite
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Member</th>
                  <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Joined</th>
                  <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{member.name}</div>
                          <div className="text-xs text-slate-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <select
                        value={member.role}
                        onChange={e => handleChangeRole(member.id, e.target.value as any)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleColors[member.role]} cursor-pointer focus:outline-none`}
                        disabled={member.role === 'Owner'}
                      >
                        <option value="Owner">Owner</option>
                        <option value="Admin">Admin</option>
                        <option value="Member">Member</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColors[member.status]}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-slate-500 hidden sm:table-cell">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      {member.role !== 'Owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-slate-400 hover:text-red-600 h-8 px-2"
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {members.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No team members yet</p>
              <p className="text-xs text-slate-400">Invite your first teammate to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles Reference */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Role Permissions</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            What each role can do in your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: 'Owner', permissions: ['Full workspace access', 'Manage billing', 'Delete workspace', 'Manage all members'], color: 'violet' },
              { role: 'Admin', permissions: ['Manage clients & appointments', 'Invite members', 'Configure automations', 'Access analytics'], color: 'blue' },
              { role: 'Member', permissions: ['View & edit clients', 'Manage own appointments', 'Use AI tools', 'View dashboard'], color: 'slate' },
            ].map(r => (
              <div key={r.role} className={`p-4 rounded-xl border border-${r.color}-200 bg-${r.color}-50/30`}>
                <h4 className="text-sm font-bold text-slate-900 mb-2">{r.role}</h4>
                <ul className="space-y-1.5">
                  {r.permissions.map((p, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <CheckCircle2 className={`w-3 h-3 text-${r.color}-500 shrink-0`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
