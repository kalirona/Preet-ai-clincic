import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import {
  Search, User, Globe, Loader2, X, FileText, Inbox,
  CheckCircle, Archive, Trash2, ExternalLink, ChevronDown,
  Clock, Mail, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SystemPageLayout, PageHeader, PageContent } from '@/components/layout/SystemPageLayout';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

interface FormBuilder {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  brandColor: string;
}

interface FormResponse {
  id: string;
  formId: string;
  conversationId: string | null;
  clientId: string | null;
  answers: Record<string, any>;
  visitorIp: string;
  status: string;
  createdAt: string;
}

type FilterTab = 'all' | 'new' | 'read' | 'converted' | 'archived';

export default function FormResponses() {
  const workspaceId = localStorage.getItem('activeWorkspaceId') || '1';
  const headers = { 'x-workspace-id': workspaceId };
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormBuilder | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchForm();
      fetchResponses();
    }
  }, [id, activeFilter]);

  const fetchForm = async () => {
    try {
      const res = await axios.get(`/api/forms/${id}`, { headers });
      setForm(res.data);
    } catch (err) {
      console.warn('Could not fetch form:', err);
    }
  };

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { formId: id || '' };
      if (activeFilter !== 'all') params.status = activeFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get('/api/forms/responses', { headers, params });
      setResponses(res.data || []);
    } catch (err) {
      console.warn('Could not fetch responses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (responseId: string, status: string) => {
    try {
      setSaving(true);
      await axios.put(`/api/forms/responses/${responseId}`, { status }, { headers });
      setResponses(prev => prev.map(r => r.id === responseId ? { ...r, status } : r));
      if (selectedResponse?.id === responseId) {
        setSelectedResponse(prev => prev ? { ...prev, status } : null);
      }
      toast.success('Status updated.');
    } catch (err) {
      toast.error('Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (responseId: string) => {
    try {
      await axios.delete(`/api/forms/responses/${responseId}`, { headers });
      setResponses(prev => prev.filter(r => r.id !== responseId));
      if (selectedResponse?.id === responseId) {
        setSelectedResponse(null);
      }
      toast.success('Response deleted.');
    } catch (err) {
      toast.error('Failed to delete response.');
    }
  };

  const getVisitorInfo = (answers: Record<string, any>) => {
    let name = '';
    let email = '';
    for (const [key, value] of Object.entries(answers)) {
      const k = key.toLowerCase();
      if (!name && (k === 'name' || k === 'full_name' || k === 'fullname')) {
        name = String(value);
      }
      if (!email && (k === 'email' || k === 'e-mail' || k === 'mail')) {
        email = String(value);
      }
    }
    return { name: name || 'Anonymous', email: email || '' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'read': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'converted': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'archived': return 'bg-slate-100 text-slate-400 border-slate-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const stats = {
    total: responses.length,
    new: responses.filter(r => r.status === 'new').length,
    read: responses.filter(r => r.status === 'read').length,
    converted: responses.filter(r => r.status === 'converted').length,
    archived: responses.filter(r => r.status === 'archived').length,
  };

  return (
    <SystemPageLayout>
      <PageHeader
        category="Form Management"
        title="Form Responses"
        description={`View and manage responses for "${form?.name || 'Loading...'}". Track submissions and convert leads.`}
        version="Forms v1.0"
      />

      <PageContent>
        {/* Stats Row */}
        <div className="col-span-12 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: FileText, color: 'text-slate-600' },
            { label: 'New', value: stats.new, icon: FileText, color: 'text-blue-600' },
            { label: 'Read', value: stats.read, icon: CheckCircle, color: 'text-slate-600' },
            { label: 'Converted', value: stats.converted, icon: CheckCircle, color: 'text-emerald-600' },
            { label: 'Archived', value: stats.archived, icon: Archive, color: 'text-slate-400' },
          ].map((stat) => (
            <Card key={stat.label} className="border-slate-200 bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-lg font-black text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content: Sidebar + Detail */}
        <div className="col-span-12">
          <div className="flex h-[calc(100vh-320px)] min-h-[500px] bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {/* Response List Sidebar */}
            <div className={cn(
              "w-full sm:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0",
              selectedResponse ? "hidden sm:flex" : "flex"
            )}>
              {/* Search & Filters */}
              <div className="p-3 border-b border-slate-100 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search responses..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchResponses()}
                    className="pl-10 h-9 rounded-xl border-slate-200 text-xs"
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {(['all', 'new', 'read', 'converted', 'archived'] as FilterTab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                        activeFilter === tab
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  </div>
                ) : responses.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400">No responses found</p>
                  </div>
                ) : (
                  responses.map(res => {
                    const info = getVisitorInfo(res.answers);
                    return (
                      <button
                        key={res.id}
                        onClick={() => setSelectedResponse(res)}
                        className={cn(
                          "w-full p-3 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors cursor-pointer",
                          selectedResponse?.id === res.id && "bg-indigo-50/50 border-l-2 border-l-indigo-600"
                        )}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {info.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {info.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-400 shrink-0 ml-2">{formatTime(res.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn("text-[8px] font-bold uppercase tracking-wider border-0", getStatusColor(res.status))}>
                            {res.status}
                          </Badge>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Detail Panel */}
            <div className={cn(
              "flex-1 flex flex-col min-w-0",
              !selectedResponse && "hidden sm:flex"
            )}>
              {selectedResponse ? (
                <>
                  {/* Detail Header */}
                  <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden h-8 w-8 cursor-pointer"
                        onClick={() => setSelectedResponse(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {getVisitorInfo(selectedResponse.answers).name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {getVisitorInfo(selectedResponse.answers).email || 'No email provided'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedResponse.status}
                        onChange={e => handleUpdateStatus(selectedResponse.id, e.target.value)}
                        disabled={saving}
                        className="h-8 px-3 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="converted">Converted</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Detail Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Answers */}
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Submission Answers</h3>
                      <div className="space-y-3">
                        {form?.fields.map(field => (
                          <div key={field.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{field.label || field.name}</p>
                            <p className="text-xs font-bold text-slate-900">
                              {selectedResponse.answers[field.name] !== undefined && selectedResponse.answers[field.name] !== ''
                                ? String(selectedResponse.answers[field.name])
                                : <span className="text-slate-300 italic">No answer</span>
                              }
                            </p>
                          </div>
                        ))}
                        {!form?.fields && Object.entries(selectedResponse.answers).map(([key, value]) => (
                          <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{key}</p>
                            <p className="text-xs font-bold text-slate-900">
                              {value !== undefined && value !== '' ? String(value) : <span className="text-slate-300 italic">No answer</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Metadata</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">IP Address</p>
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <p className="text-xs font-bold text-slate-900">{selectedResponse.visitorIp || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Submitted</p>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <p className="text-xs font-bold text-slate-900">
                              {new Date(selectedResponse.createdAt).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Actions</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedResponse.status !== 'read' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] font-bold rounded-xl cursor-pointer"
                            onClick={() => handleUpdateStatus(selectedResponse.id, 'read')}
                            disabled={saving}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Mark as Read
                          </Button>
                        )}
                        {selectedResponse.status !== 'converted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] font-bold rounded-xl cursor-pointer border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleUpdateStatus(selectedResponse.id, 'converted')}
                            disabled={saving}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Convert
                          </Button>
                        )}
                        {selectedResponse.status !== 'archived' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] font-bold rounded-xl cursor-pointer"
                            onClick={() => handleUpdateStatus(selectedResponse.id, 'archived')}
                            disabled={saving}
                          >
                            <Archive className="w-3.5 h-3.5 mr-1.5" />
                            Archive
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] font-bold rounded-xl cursor-pointer border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(selectedResponse.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </Button>
                        {selectedResponse.conversationId && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] font-bold rounded-xl cursor-pointer"
                            onClick={() => window.location.href = '/inbox'}
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            View Conversation
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Select a response</h3>
                    <p className="text-xs text-slate-400">Choose a response from the list to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContent>
    </SystemPageLayout>
  );
}
