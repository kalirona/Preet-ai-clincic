import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  MessageCircle, Search, Archive, Send, User, Bot, 
  Clock, Mail, Phone, Globe, Loader2, X, Filter,
  Inbox as InboxIcon, AlertCircle, CheckCircle, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SystemPageLayout, PageHeader, PageContent } from '@/components/layout/SystemPageLayout';

import { getAuthToken } from '@/lib/getAuthToken';

interface Conversation {
  id: string;
  agentId?: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  source: string;
  status: string;
  assignedTo?: string;
  unreadCount: number;
  lastMessageAt?: string;
  tags: string[];
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderType: 'visitor' | 'agent' | 'system' | 'ai';
  content: string;
  messageType: string;
  createdAt: string;
}

type FilterTab = 'all' | 'unread' | 'open' | 'archived';

export default function Inbox() {
  const workspaceId = localStorage.getItem('activeWorkspaceId') || '1';
  const headers = { 'x-workspace-id': workspaceId };
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [activeFilter]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = async () => {
      const token = await getAuthToken();
      if (!token) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}&workspaceId=${encodeURIComponent(workspaceId)}`;

      try {
        ws = new WebSocket(url);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_message' && data.message) {
              setMessages(prev => {
                if (prev.some(m => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
              // Update conversation last message time
              setConversations(prev => prev.map(c =>
                c.id === data.conversationId
                  ? { ...c, lastMessageAt: data.message.createdAt, status: 'unread', unreadCount: (c.unreadCount || 0) + 1 }
                  : c
              ));
            }
            if (data.type === 'conversation_updated' && data.conversation) {
              setConversations(prev => prev.map(c =>
                c.id === data.conversation.id ? data.conversation : c
              ));
            }
          } catch {}
        };

        ws.onclose = () => {
          // Reconnect after 3s
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch {}
    };

    connect();
    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, [workspaceId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (activeFilter !== 'all') params.status = activeFilter;
      if (searchQuery) params.search = searchQuery;
      
      const res = await axios.get('/api/inbox', { headers, params });
      setConversations(res.data || []);
    } catch (err) {
      console.warn('Could not fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const res = await axios.get(`/api/inbox/${conversationId}/messages`, { headers });
      setMessages(res.data || []);
      
      // Mark as read
      await axios.post(`/api/inbox/${conversationId}/read`, {}, { headers });
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0, status: 'open' } : c
      ));
    } catch (err) {
      console.warn('Could not fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    try {
      setSending(true);
      const res = await axios.post(`/api/inbox/${selectedConversation.id}/messages`, {
        content: newMessage.trim(),
        senderType: 'agent',
        messageType: 'text',
      }, { headers });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleArchive = async (conversation: Conversation) => {
    try {
      await axios.post(`/api/inbox/${conversation.id}/archive`, {}, { headers });
      setConversations(prev => prev.map(c => 
        c.id === conversation.id ? { ...c, status: 'archived' } : c
      ));
      if (selectedConversation?.id === conversation.id) {
        setSelectedConversation(null);
      }
      toast.success('Conversation archived.');
    } catch (err) {
      toast.error('Failed to archive conversation.');
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'widget': return <MessageCircle className="w-3 h-3" />;
      case 'form': return <Mail className="w-3 h-3" />;
      case 'lead': return <User className="w-3 h-3" />;
      default: return <Globe className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'open': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'archived': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
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
    total: conversations.length,
    unread: conversations.filter(c => c.status === 'unread').length,
    open: conversations.filter(c => c.status === 'open').length,
    archived: conversations.filter(c => c.status === 'archived').length,
  };

  return (
    <SystemPageLayout>
      <PageHeader 
        category="Customer Communication"
        title="Inbox"
        description="Manage all customer conversations from website chats, forms, and leads in one unified inbox."
        version="Inbox v1.0"
      />

      <PageContent>
        {/* Stats Row */}
        <div className="col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: InboxIcon, color: 'text-slate-600' },
            { label: 'Unread', value: stats.unread, icon: AlertCircle, color: 'text-blue-600' },
            { label: 'Open', value: stats.open, icon: CheckCircle, color: 'text-emerald-600' },
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

        {/* Main Content: Sidebar + Chat */}
        <div className="col-span-12">
          <div className="flex h-[calc(100vh-320px)] min-h-[500px] bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {/* Conversation List Sidebar */}
            <div className={cn(
              "w-full sm:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0",
              selectedConversation ? "hidden sm:flex" : "flex"
            )}>
              {/* Search & Filters */}
              <div className="p-3 border-b border-slate-100 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); fetchConversations(); }}
                    className="pl-10 h-9 rounded-xl border-slate-200 text-xs"
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {(['all', 'unread', 'open', 'archived'] as FilterTab[]).map(tab => (
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

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <InboxIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400">No conversations found</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full p-3 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors cursor-pointer",
                        selectedConversation?.id === conv.id && "bg-indigo-50/50 border-l-2 border-l-indigo-600"
                      )}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            {getSourceIcon(conv.source)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {conv.visitorName || conv.visitorEmail || 'Anonymous Visitor'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {conv.visitorEmail || conv.source}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <span className="text-[9px] text-slate-400">{formatTime(conv.lastMessageAt)}</span>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-[8px] font-bold uppercase tracking-wider border-0", getStatusColor(conv.status))}>
                          {conv.status}
                        </Badge>
                        <span className="text-[9px] text-slate-400 capitalize">{conv.source}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
              "flex-1 flex flex-col min-w-0",
              !selectedConversation && "hidden sm:flex"
            )}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="sm:hidden h-8 w-8 cursor-pointer"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {selectedConversation.visitorName || 'Anonymous Visitor'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {selectedConversation.visitorEmail || selectedConversation.source}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[11px] font-bold cursor-pointer"
                        onClick={() => handleArchive(selectedConversation)}
                      >
                        <Archive className="w-3.5 h-3.5 mr-1.5" />
                        Archive
                      </Button>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-400">No messages yet</p>
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div 
                          key={msg.id} 
                          className={cn(
                            "flex gap-2 max-w-[80%]",
                            msg.senderType === 'agent' ? "ml-auto flex-row-reverse" : 
                            msg.senderType === 'system' ? "mx-auto max-w-full" : ""
                          )}
                        >
                          {msg.senderType !== 'system' && (
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                              msg.senderType === 'agent' ? "bg-indigo-100" : "bg-slate-100"
                            )}>
                              {msg.senderType === 'agent' ? (
                                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                              ) : msg.senderType === 'ai' ? (
                                <Bot className="w-3.5 h-3.5 text-violet-600" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </div>
                          )}
                          <div className={cn(
                            "px-3 py-2 rounded-xl text-xs leading-relaxed",
                            msg.senderType === 'agent' 
                              ? "bg-indigo-600 text-white rounded-tr-sm" 
                              : msg.senderType === 'system'
                              ? "bg-slate-100 text-slate-500 text-[10px] italic"
                              : "bg-slate-100 text-slate-700 rounded-tl-sm"
                          )}>
                            <p>{msg.content}</p>
                            <p className={cn(
                              "text-[9px] mt-1",
                              msg.senderType === 'agent' ? "text-indigo-200" : "text-slate-400"
                            )}>
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="Type a reply..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="flex-1 h-10 rounded-xl border-slate-200 text-xs"
                        disabled={sending}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <InboxIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Select a conversation</h3>
                    <p className="text-xs text-slate-400">Choose a conversation from the list to start replying</p>
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
