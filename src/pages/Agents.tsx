import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Headphones, Plus, Trash2, Copy, Check, Globe, Palette, 
  MessageSquare, Users, Zap, ExternalLink, Loader2, X, 
  FileText, Upload, Power, PowerOff, Settings, Code, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SystemPageLayout, PageHeader, PageContent } from '@/components/layout/SystemPageLayout';

interface AIAgent {
  id: string;
  name: string;
  instructions: string;
  welcomeMessage: string;
  brandColor: string;
  avatarUrl?: string;
  model: string;
  isActive: boolean;
  humanHandoffEnabled: boolean;
  websiteUrl?: string;
  widgetConfig: any;
  createdAt: string;
}

export default function Agents() {
  const workspaceId = localStorage.getItem('activeWorkspaceId') || '1';
  const headers = { 'x-workspace-id': workspaceId };
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showWidgetCode, setShowWidgetCode] = useState<AIAgent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formWelcomeMessage, setFormWelcomeMessage] = useState('Hi! How can I help you today?');
  const [formBrandColor, setFormBrandColor] = useState('#7c3aed');
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('');
  const [formHumanHandoff, setFormHumanHandoff] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/agents', { headers });
      setAgents(res.data || []);
    } catch (err) {
      console.warn('Could not fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error('Agent name is required.');
      return;
    }
    try {
      setSaving(true);
      const res = await axios.post('/api/agents', {
        name: formName,
        instructions: formInstructions,
        welcomeMessage: formWelcomeMessage,
        brandColor: formBrandColor,
        websiteUrl: formWebsiteUrl || null,
        humanHandoffEnabled: formHumanHandoff,
      }, { headers });
      setAgents(prev => [res.data, ...prev]);
      toast.success(`Agent "${res.data.name}" created successfully!`);
      resetForm();
      setShowCreateDialog(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create agent.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAgent || !formName.trim()) return;
    try {
      setSaving(true);
      const res = await axios.put(`/api/agents/${selectedAgent.id}`, {
        name: formName,
        instructions: formInstructions,
        welcomeMessage: formWelcomeMessage,
        brandColor: formBrandColor,
        websiteUrl: formWebsiteUrl || null,
        humanHandoffEnabled: formHumanHandoff,
      }, { headers });
      setAgents(prev => prev.map(a => a.id === selectedAgent.id ? res.data : a));
      toast.success('Agent updated successfully!');
      resetForm();
      setShowEditDialog(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update agent.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (agent: AIAgent) => {
    try {
      const res = await axios.put(`/api/agents/${agent.id}`, {
        isActive: !agent.isActive,
      }, { headers });
      setAgents(prev => prev.map(a => a.id === agent.id ? res.data : a));
      toast.success(`Agent ${res.data.isActive ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      toast.error('Failed to toggle agent status.');
    }
  };

  const handleDelete = async (agent: AIAgent) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`/api/agents/${agent.id}`, { headers });
      setAgents(prev => prev.filter(a => a.id !== agent.id));
      toast.success(`Agent "${agent.name}" deleted.`);
    } catch (err) {
      toast.error('Failed to delete agent.');
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormInstructions('');
    setFormWelcomeMessage('Hi! How can I help you today?');
    setFormBrandColor('#7c3aed');
    setFormWebsiteUrl('');
    setFormHumanHandoff(false);
  };

  const openEditDialog = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setFormName(agent.name);
    setFormInstructions(agent.instructions || '');
    setFormWelcomeMessage(agent.welcomeMessage || 'Hi! How can I help you today?');
    setFormBrandColor(agent.brandColor || '#7c3aed');
    setFormWebsiteUrl(agent.websiteUrl || '');
    setFormHumanHandoff(agent.humanHandoffEnabled);
    setShowEditDialog(true);
  };

  const getWidgetCode = (agent: AIAgent) => {
    const origin = window.location.origin;
    return `<!-- Preet AI Chat Widget -->
<script src="${origin}/widget.js"></script>
<script>
  window.PreetAI.init({
    agentId: "${agent.id}"
  });
</script>`;
  };

  const copyWidgetCode = (agent: AIAgent) => {
    navigator.clipboard.writeText(getWidgetCode(agent));
    setCopied(true);
    toast.success('Widget code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <SystemPageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading agents...</span>
          </div>
        </div>
      </SystemPageLayout>
    );
  }

  return (
    <SystemPageLayout>
      <PageHeader 
        category="Customer Communication"
        title="AI Website Agents"
        description="Create intelligent chat agents for your websites. Configure personality, knowledge, and embed with a single script tag."
        version="Agents v1.0"
        actions={
          <Button 
            onClick={() => { resetForm(); setShowCreateDialog(true); }}
            className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        }
      />

      <PageContent>
        <div className="col-span-12">
          {agents.length === 0 ? (
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Headphones className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">No agents yet</h3>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Create your first AI agent to start capturing leads and answering questions on your website.
                </p>
                <Button 
                  onClick={() => { resetForm(); setShowCreateDialog(true); }}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="border-slate-200 bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                          style={{ backgroundColor: agent.brandColor }}
                        >
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-900">{agent.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge 
                              variant={agent.isActive ? "default" : "secondary"}
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-wider",
                                agent.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {agent.isActive ? 'Active' : 'Disabled'}
                            </Badge>
                            {agent.humanHandoffEnabled && (
                              <Badge className="text-[9px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                                Handoff
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-700 cursor-pointer"
                        onClick={() => handleToggleActive(agent)}
                      >
                        {agent.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {agent.instructions && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">{agent.instructions}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        "{agent.welcomeMessage?.substring(0, 30)}..."
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[11px] font-bold rounded-lg flex-1 cursor-pointer"
                        onClick={() => openEditDialog(agent)}
                      >
                        <Settings className="w-3.5 h-3.5 mr-1.5" />
                        Configure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[11px] font-bold rounded-lg cursor-pointer"
                        onClick={() => copyWidgetCode(agent)}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 cursor-pointer"
                        onClick={() => handleDelete(agent)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageContent>

      {/* Create Agent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl p-6 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Create AI Agent</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Configure a new chat agent for your website
            </DialogDescription>
          </DialogHeader>
          <AgentForm 
            name={formName} setName={setFormName}
            instructions={formInstructions} setInstructions={setFormInstructions}
            welcomeMessage={formWelcomeMessage} setWelcomeMessage={setFormWelcomeMessage}
            brandColor={formBrandColor} setBrandColor={setFormBrandColor}
            websiteUrl={formWebsiteUrl} setWebsiteUrl={setFormWebsiteUrl}
            humanHandoff={formHumanHandoff} setHumanHandoff={setFormHumanHandoff}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl p-6 border-slate-200 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Configure Agent</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Update agent settings and behavior
            </DialogDescription>
          </DialogHeader>
          <AgentForm 
            name={formName} setName={setFormName}
            instructions={formInstructions} setInstructions={setFormInstructions}
            welcomeMessage={formWelcomeMessage} setWelcomeMessage={setFormWelcomeMessage}
            brandColor={formBrandColor} setBrandColor={setFormBrandColor}
            websiteUrl={formWebsiteUrl} setWebsiteUrl={setFormWebsiteUrl}
            humanHandoff={formHumanHandoff} setHumanHandoff={setFormHumanHandoff}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditDialog(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleEdit} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Widget Code Dialog */}
      <Dialog open={!!showWidgetCode} onOpenChange={() => setShowWidgetCode(null)}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl p-6 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Embed Widget Code</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Copy this code and paste it into your website's HTML
            </DialogDescription>
          </DialogHeader>
          {showWidgetCode && (
            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                {getWidgetCode(showWidgetCode)}
              </pre>
              <Button 
                size="sm" 
                className="absolute top-2 right-2 h-7 text-[10px] cursor-pointer"
                onClick={() => copyWidgetCode(showWidgetCode)}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SystemPageLayout>
  );
}

// Agent Form Component
function AgentForm({ 
  name, setName, instructions, setInstructions, 
  welcomeMessage, setWelcomeMessage, brandColor, setBrandColor,
  websiteUrl, setWebsiteUrl, humanHandoff, setHumanHandoff
}: {
  name: string; setName: (v: string) => void;
  instructions: string; setInstructions: (v: string) => void;
  welcomeMessage: string; setWelcomeMessage: (v: string) => void;
  brandColor: string; setBrandColor: (v: string) => void;
  websiteUrl: string; setWebsiteUrl: (v: string) => void;
  humanHandoff: boolean; setHumanHandoff: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Agent Name *</Label>
        <Input 
          value={name} 
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Sales Assistant"
          className="h-10 rounded-xl border-slate-200 text-xs font-bold"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Instructions / Personality</Label>
        <Textarea 
          value={instructions} 
          onChange={e => setInstructions(e.target.value)}
          placeholder="Describe how the agent should behave, what it knows, and how it should respond..."
          className="min-h-[80px] rounded-xl border-slate-200 text-xs font-bold"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Welcome Message</Label>
        <Input 
          value={welcomeMessage} 
          onChange={e => setWelcomeMessage(e.target.value)}
          placeholder="Hi! How can I help you today?"
          className="h-10 rounded-xl border-slate-200 text-xs font-bold"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Brand Color</Label>
          <div className="flex items-center gap-2">
            <input 
              type="color" 
              value={brandColor} 
              onChange={e => setBrandColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
            />
            <Input 
              value={brandColor} 
              onChange={e => setBrandColor(e.target.value)}
              className="h-10 rounded-xl border-slate-200 text-xs font-mono flex-1"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Website URL</Label>
          <Input 
            value={websiteUrl} 
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-10 rounded-xl border-slate-200 text-xs font-bold"
          />
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <p className="text-xs font-bold text-slate-700">Human Handoff</p>
          <p className="text-[10px] text-slate-400">Transfer to a live agent when needed</p>
        </div>
        <button
          type="button"
          onClick={() => setHumanHandoff(!humanHandoff)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
            humanHandoff ? "bg-indigo-600" : "bg-slate-200"
          )}
        >
          <span className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            humanHandoff ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>
    </div>
  );
}
