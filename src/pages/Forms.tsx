import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Copy, Check, Loader2, X, FileText, Settings, 
  Code, Eye, GripVertical, ToggleLeft, ToggleRight, ExternalLink
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

interface FormField {
  type: string;
  label: string;
  name: string;
  required: boolean;
  placeholder: string;
  options?: string[];
}

interface Form {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  brandColor: string;
  settings: {
    submitButtonText: string;
    successMessage: string;
    createConversation: boolean;
  };
  isActive: boolean;
  responseCount: number;
  createdAt: string;
}

const FIELD_TYPES = ['text', 'email', 'phone', 'number', 'textarea', 'select', 'checkbox', 'date'];

export default function Forms() {
  const workspaceId = localStorage.getItem('activeWorkspaceId') || '1';
  const headers = { 'x-workspace-id': workspaceId };
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState<Form | null>(null);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formBrandColor, setFormBrandColor] = useState('#4f46e5');
  const [formSuccessMessage, setFormSuccessMessage] = useState('Thank you for your submission!');
  const [formCreateConversation, setFormCreateConversation] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/forms', { headers });
      setForms(res.data || []);
    } catch (err) {
      console.warn('Could not fetch forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error('Form name is required.');
      return;
    }
    try {
      setSaving(true);
      const res = await axios.post('/api/forms', {
        name: formName,
        description: formDescription,
        fields: formFields,
        brandColor: formBrandColor,
        settings: {
          submitButtonText: 'Submit',
          successMessage: formSuccessMessage,
          createConversation: formCreateConversation,
        },
      }, { headers });
      setForms(prev => [res.data, ...prev]);
      toast.success(`Form "${res.data.name}" created successfully!`);
      resetForm();
      setShowCreateDialog(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create form.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedForm || !formName.trim()) return;
    try {
      setSaving(true);
      const res = await axios.put(`/api/forms/${selectedForm.id}`, {
        name: formName,
        description: formDescription,
        fields: formFields,
        brandColor: formBrandColor,
        settings: {
          submitButtonText: 'Submit',
          successMessage: formSuccessMessage,
          createConversation: formCreateConversation,
        },
      }, { headers });
      setForms(prev => prev.map(f => f.id === selectedForm.id ? res.data : f));
      toast.success('Form updated successfully!');
      resetForm();
      setShowEditDialog(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update form.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (form: Form) => {
    if (!confirm(`Are you sure you want to delete "${form.name}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`/api/forms/${form.id}`, { headers });
      setForms(prev => prev.filter(f => f.id !== form.id));
      toast.success(`Form "${form.name}" deleted.`);
    } catch (err) {
      toast.error('Failed to delete form.');
    }
  };

  const handleGetEmbed = async (form: Form) => {
    try {
      const res = await axios.get(`/api/forms/${form.id}/embed`, { headers });
      setShowEmbedCode({ ...form, ...res.data });
    } catch (err) {
      setShowEmbedCode(form);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Embed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const addField = () => {
    setFormFields(prev => [
      ...prev,
      { type: 'text', label: '', name: '', required: false, placeholder: '' },
    ]);
  };

  const removeField = (index: number) => {
    setFormFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof FormField, value: any) => {
    setFormFields(prev => prev.map((field, i) => 
      i === index ? { ...field, [key]: value } : field
    ));
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormFields([]);
    setFormBrandColor('#4f46e5');
    setFormSuccessMessage('Thank you for your submission!');
    setFormCreateConversation(true);
  };

  const openEditDialog = (form: Form) => {
    setSelectedForm(form);
    setFormName(form.name);
    setFormDescription(form.description || '');
    setFormFields(form.fields || []);
    setFormBrandColor(form.brandColor || '#4f46e5');
    setFormSuccessMessage(form.settings?.successMessage || 'Thank you for your submission!');
    setFormCreateConversation(form.settings?.createConversation ?? true);
    setShowEditDialog(true);
  };

  const getInlineEmbedCode = (form: Form) => {
    const origin = window.location.origin;
    return `<!-- Preet Form - Inline -->
<div id="preet-form-${form.id}"></div>
<script src="${origin}/widget.js"></script>
<script>
  window.PreetForm.init({
    formId: "${form.id}",
    container: "#preet-form-${form.id}",
    type: "inline"
  });
</script>`;
  };

  const getPopupEmbedCode = (form: Form) => {
    const origin = window.location.origin;
    return `<!-- Preet Form - Popup Trigger -->
<button onclick="window.PreetForm.open('${form.id}')" 
  style="background-color: ${form.brandColor}; color: white; padding: 12px 24px; border-radius: 12px; border: none; font-weight: bold; cursor: pointer;">
  Open Form
</button>
<script src="${origin}/widget.js"></script>`;
  };

  if (loading) {
    return (
      <SystemPageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading forms...</span>
          </div>
        </div>
      </SystemPageLayout>
    );
  }

  return (
    <SystemPageLayout>
      <PageHeader 
        category="Customer Communication"
        title="Lead Capture Forms"
        description="Build custom forms to capture leads, schedule appointments, and collect customer information."
        version="Forms v1.0"
        actions={
          <Button 
            onClick={() => { resetForm(); setShowCreateDialog(true); }}
            className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Form
          </Button>
        }
      />

      <PageContent>
        <div className="col-span-12">
          {forms.length === 0 ? (
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">No forms yet</h3>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Create your first form to start capturing leads and collecting customer information.
                </p>
                <Button 
                  onClick={() => { resetForm(); setShowCreateDialog(true); }}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Form
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {forms.map((form) => (
                <Card key={form.id} className="border-slate-200 bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                          style={{ backgroundColor: form.brandColor }}
                        >
                          {form.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-900">{form.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge 
                              variant={form.isActive ? "default" : "secondary"}
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-wider",
                                form.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {form.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                              {form.fields?.length || 0} fields
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Badge className="text-[10px] font-bold bg-slate-100 text-slate-600">
                        {form.responseCount || 0} responses
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {form.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">{form.description}</p>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[11px] font-bold rounded-lg flex-1 cursor-pointer"
                        onClick={() => openEditDialog(form)}
                      >
                        <Settings className="w-3.5 h-3.5 mr-1.5" />
                        Configure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[11px] font-bold rounded-lg cursor-pointer"
                        onClick={() => handleGetEmbed(form)}
                      >
                        <Code className="w-3.5 h-3.5 mr-1.5" />
                        Embed
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 cursor-pointer"
                        onClick={() => handleDelete(form)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="pt-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer w-full justify-start px-2"
                        onClick={() => navigate(`/forms/${form.id}/responses`)}
                      >
                        <Eye className="w-3 h-3 mr-1.5" />
                        View Responses
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageContent>

      {/* Create Form Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 border-slate-200 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Create Form</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Build a new form to capture leads and collect information
            </DialogDescription>
          </DialogHeader>
          <FormEditor
            name={formName} setName={setFormName}
            description={formDescription} setDescription={setFormDescription}
            fields={formFields} setFields={setFormFields}
            brandColor={formBrandColor} setBrandColor={setFormBrandColor}
            successMessage={formSuccessMessage} setSuccessMessage={setFormSuccessMessage}
            createConversation={formCreateConversation} setCreateConversation={setFormCreateConversation}
            addField={addField} removeField={removeField} updateField={updateField}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 border-slate-200 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Configure Form</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Update form settings and fields
            </DialogDescription>
          </DialogHeader>
          <FormEditor
            name={formName} setName={setFormName}
            description={formDescription} setDescription={setFormDescription}
            fields={formFields} setFields={setFormFields}
            brandColor={formBrandColor} setBrandColor={setFormBrandColor}
            successMessage={formSuccessMessage} setSuccessMessage={setFormSuccessMessage}
            createConversation={formCreateConversation} setCreateConversation={setFormCreateConversation}
            addField={addField} removeField={removeField} updateField={updateField}
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

      {/* Embed Code Dialog */}
      <Dialog open={!!showEmbedCode} onOpenChange={() => setShowEmbedCode(null)}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Embed Form Code</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Copy this code and paste it into your website's HTML
            </DialogDescription>
          </DialogHeader>
          {showEmbedCode && (
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">Inline Embed</Label>
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                    {getInlineEmbedCode(showEmbedCode)}
                  </pre>
                  <Button 
                    size="sm" 
                    className="absolute top-2 right-2 h-7 text-[10px] cursor-pointer"
                    onClick={() => copyCode(getInlineEmbedCode(showEmbedCode))}
                  >
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">Popup Trigger</Label>
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                    {getPopupEmbedCode(showEmbedCode)}
                  </pre>
                  <Button 
                    size="sm" 
                    className="absolute top-2 right-2 h-7 text-[10px] cursor-pointer"
                    onClick={() => copyCode(getPopupEmbedCode(showEmbedCode))}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SystemPageLayout>
  );
}

function FormEditor({
  name, setName, description, setDescription,
  fields, setFields, brandColor, setBrandColor,
  successMessage, setSuccessMessage, createConversation, setCreateConversation,
  addField, removeField, updateField,
}: {
  name: string; setName: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  fields: FormField[]; setFields: (v: FormField[]) => void;
  brandColor: string; setBrandColor: (v: string) => void;
  successMessage: string; setSuccessMessage: (v: string) => void;
  createConversation: boolean; setCreateConversation: (v: boolean) => void;
  addField: () => void; removeField: (i: number) => void;
  updateField: (i: number, k: keyof FormField, v: any) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Form Name *</Label>
        <Input 
          value={name} 
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Contact Form, Lead Capture"
          className="h-10 rounded-xl border-slate-200 text-xs font-bold"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Description</Label>
        <Textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe what this form is for..."
          className="min-h-[60px] rounded-xl border-slate-200 text-xs font-bold"
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
          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Success Message</Label>
          <Input 
            value={successMessage} 
            onChange={e => setSuccessMessage(e.target.value)}
            placeholder="Thank you for your submission!"
            className="h-10 rounded-xl border-slate-200 text-xs font-bold"
          />
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <p className="text-xs font-bold text-slate-700">Create Conversation</p>
          <p className="text-[10px] text-slate-400">Automatically create a conversation for each submission</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateConversation(!createConversation)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
            createConversation ? "bg-indigo-600" : "bg-slate-200"
          )}
        >
          <span className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            createConversation ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Form Fields</Label>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            onClick={addField}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Field
          </Button>
        </div>
        <div className="space-y-3">
          {fields.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-xl">
              No fields yet. Click "Add Field" to start building your form.
            </p>
          )}
          {fields.map((field, index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-grab" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Field {index + 1}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-slate-400 hover:text-rose-600 cursor-pointer"
                  onClick={() => removeField(index)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-slate-500 uppercase">Type</Label>
                  <select
                    value={field.type}
                    onChange={e => updateField(index, 'type', e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 text-xs font-bold px-2 bg-white cursor-pointer"
                  >
                    {FIELD_TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-[9px] font-bold text-slate-500 uppercase">Label</Label>
                  <Input 
                    value={field.label} 
                    onChange={e => updateField(index, 'label', e.target.value)}
                    placeholder="e.g. Full Name"
                    className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-slate-500 uppercase">Name</Label>
                  <Input 
                    value={field.name} 
                    onChange={e => updateField(index, 'name', e.target.value)}
                    placeholder="e.g. full_name"
                    className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-slate-500 uppercase">Placeholder</Label>
                  <Input 
                    value={field.placeholder} 
                    onChange={e => updateField(index, 'placeholder', e.target.value)}
                    placeholder="Optional placeholder"
                    className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>
              {field.type === 'select' && (
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-slate-500 uppercase">Options (comma-separated)</Label>
                  <Input 
                    value={field.options?.join(', ') || ''} 
                    onChange={e => updateField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Option 1, Option 2, Option 3"
                    className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateField(index, 'required', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                  />
                  <Label className="text-[9px] font-bold text-slate-500 uppercase cursor-pointer">Required</Label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
