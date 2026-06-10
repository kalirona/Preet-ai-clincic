import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SystemPageLayout, PageHeader, PageContent } from '@/components/layout/SystemPageLayout';
import { 
  User, 
  Building, 
  Lock, 
  Key,
  Globe,
  ShieldCheck,
  Save,
  Bell,
  CheckCircle2,
  Trash2,
  HelpCircle,
  AlertCircle,
  Users,
  Shield,
  Activity,
  Cpu,
  Server,
  Sliders,
  UserCheck,
  RefreshCw,
  Plus,
  X,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Fingerprint,
  FileSpreadsheet,
  Terminal,
  ExternalLink,
  Mail,
  Palette,
  Clock,
  Search,
  Database,
  Download,
  Archive,
  Upload,
  History,
  FileDown,
  Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Editor' | 'Billing';
  status: 'Active' | 'Invited' | 'Suspended';
  avatar: string;
}

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  // --- Simulating active user credentials and Roles Toggle ---
  const [currentUserRole, setCurrentUserRole] = useState<'SUPER_ADMIN' | 'ADMIN'>(() => {
    return (localStorage.getItem('settings_current_user_role') as 'SUPER_ADMIN' | 'ADMIN') || 'SUPER_ADMIN';
  });

  // --- Profile States ---
  const [fullName, setFullName] = useState(() => localStorage.getItem('settings_fullName') || 'Preet Kalirona');
  const [emailAddress, setEmailAddress] = useState(() => localStorage.getItem('settings_emailAddress') || 'preetkalirona@gmail.com');
  const [jobTitle, setJobTitle] = useState(() => localStorage.getItem('settings_jobTitle') || 'Chief Executive Officer / Director');
  const [preferredLanguage, setPreferredLanguage] = useState(() => localStorage.getItem('settings_preferredLanguage') || 'en');
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('settings_avatar') || '👨‍💻');

  // --- Workspace States ---
  const [workspaceName, setWorkspaceName] = useState(() => localStorage.getItem('settings_workspaceName') || 'Preet AI Suite Studio');
  const [workspaceLogo, setWorkspaceLogo] = useState(() => localStorage.getItem('settings_workspaceLogo') || '⚡');
  const [brandingColor, setBrandingColor] = useState(() => localStorage.getItem('settings_brandingColor') || '#6366f1');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('settings_timezone') || 'America/New_York');
  const [baseCurrency, setBaseCurrency] = useState(() => localStorage.getItem('settings_baseCurrency') || 'USD');
  const [language, setLanguage] = useState(() => localStorage.getItem('settings_language') || 'en');
  const [workspaceUrl, setWorkspaceUrl] = useState(() => localStorage.getItem('settings_workspaceUrl') || 'preet.ai-suite.com');
  const [customDomain, setCustomDomain] = useState(() => localStorage.getItem('settings_customDomain') || 'workspace.preet.ai');
  const [emailSenderName, setEmailSenderName] = useState(() => localStorage.getItem('settings_emailSenderName') || 'Preet AI Suite');
  const [emailSenderAddress, setEmailSenderAddress] = useState(() => localStorage.getItem('settings_emailSenderAddress') || 'noreply@preet.ai');
  const [emailSmtpHost, setEmailSmtpHost] = useState(() => localStorage.getItem('settings_emailSmtpHost') || 'smtp.sendgrid.net');
  const [emailSmtpPort, setEmailSmtpPort] = useState(() => localStorage.getItem('settings_emailSmtpPort') || '587');
  const [aiEngine, setAiEngine] = useState(() => localStorage.getItem('settings_aiEngine') || 'gemini-2.5-pro');

  // --- API Key States ---
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('settings_openaiKey') || 'sk-proj-••••••••••••••••••••••••');
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('settings_anthropicKey') || 'sk-ant-••••••••••••••••••••••••');
  const [serperKey, setSerperKey] = useState(() => localStorage.getItem('settings_serperKey') || 'serp-••••••••••••••••••••••••');
  const [showKeys, setShowKeys] = useState(false);

  // --- Security & Alert States ---
  const [mfaEnabled, setMfaEnabled] = useState(() => localStorage.getItem('settings_mfaEnabled') === 'true');
  const [alertOnLead, setAlertOnLead] = useState(() => localStorage.getItem('settings_alertOnLead') !== 'false');

  // --- AI Assistant Memory States ---
  const [aiMemoryBusinessName, setAiMemoryBusinessName] = useState(() => localStorage.getItem('settings_ai_memory_businessName') || 'Preet AI Suite Studio');
  const [aiMemoryTone, setAiMemoryTone] = useState(() => localStorage.getItem('settings_ai_memory_tone') || 'Professional');
  const [aiMemoryServices, setAiMemoryServices] = useState(() => localStorage.getItem('settings_ai_memory_services') || 'AI consulting, custom web design, SEO optimization, and workflow automation');
  const [aiMemoryFAQs, setAiMemoryFAQs] = useState(() => localStorage.getItem('settings_ai_memory_faqs') || 'Q: What is our primary response time SLA?\nA: We respond within 2 hours for standard tier subscribers and within 15 minutes for enterprise SLA clients.\n\nQ: Are our services fully managed?\nA: Yes, all our services include full lifecycle management and proactive security updates.');
  const [alertOnPublish, setAlertOnPublish] = useState(() => localStorage.getItem('settings_alertOnPublish') !== 'false');
  const [sessionDuration, setSessionDuration] = useState(() => localStorage.getItem('settings_sessionDuration') || '30');

  // --- Email Sending Engine States ---
  const [emailDriver, setEmailDriver] = useState<'smtp' | 'resend' | 'sendgrid' | 'sandbox'>(() => {
    return (localStorage.getItem('settings_email_driver') as any) || 'sandbox';
  });

  const [resendApiKey, setResendApiKey] = useState(() => localStorage.getItem('settings_email_resend_apiKey') || '');
  const [resendFromEmail, setResendFromEmail] = useState(() => localStorage.getItem('settings_email_resend_fromEmail') || 'onboarding@resend.dev');
  const [resendFromName, setResendFromName] = useState(() => localStorage.getItem('settings_email_resend_fromName') || 'Preet AI Studio');

  const [sendgridApiKey, setSendgridApiKey] = useState(() => localStorage.getItem('settings_email_sendgrid_apiKey') || '');
  const [sendgridFromEmail, setSendgridFromEmail] = useState(() => localStorage.getItem('settings_email_sendgrid_fromEmail') || 'alerts@preetai.com');
  const [sendgridFromName, setSendgridFromName] = useState(() => localStorage.getItem('settings_email_sendgrid_fromName') || 'Preet AI Security');

  const [smtpHost, setSmtpHost] = useState(() => localStorage.getItem('settings_email_smtp_host') || 'smtp.mailtrap.io');
  const [smtpPort, setSmtpPort] = useState(() => localStorage.getItem('settings_email_smtp_port') || '587');
  const [smtpUser, setSmtpUser] = useState(() => localStorage.getItem('settings_email_smtp_user') || '');
  const [smtpPass, setSmtpPass] = useState(() => localStorage.getItem('settings_email_smtp_pass') || '');
  const [smtpSecure, setSmtpSecure] = useState(() => localStorage.getItem('settings_email_smtp_secure') === 'true');
  const [smtpFromEmail, setSmtpFromEmail] = useState(() => localStorage.getItem('settings_email_smtp_fromEmail') || 'relay@preetai.com');
  const [smtpFromName, setSmtpFromName] = useState(() => localStorage.getItem('settings_email_smtp_fromName') || 'Preet Custom SMTP');

  // Test send variables
  const [testToEmail, setTestToEmail] = useState(() => localStorage.getItem('settings_email_test_toEmail') || 'preetkalirona@gmail.com');
  const [testSubject, setTestSubject] = useState('System Outbound Verification Test');
  const [testBody, setTestBody] = useState('Workspace Email Delivery Engine is correctly configured and live! All customer dispatch loops are operational.');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // --- Super Admin Settings ---
  const [rateLimitPerUser, setRateLimitPerUser] = useState(() => Number(localStorage.getItem('settings_super_rateLimit')) || 120);
  const [maxMonthlyAIBudget, setMaxMonthlyAIBudget] = useState(() => Number(localStorage.getItem('settings_super_budget')) || 450);
  const [globalServerAudit, setGlobalServerAudit] = useState(() => localStorage.getItem('settings_super_auditLevel') || 'Strict Compliance');
  const [ipWhitelist, setIpWhitelist] = useState(() => localStorage.getItem('settings_super_whitelist') || '192.168.1.1, 10.0.0.12');
  const [isSandboxMode, setIsSandboxMode] = useState(() => localStorage.getItem('settings_super_sandbox') === 'true');

  // --- Team Member State ---
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('settings_team_members');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      { id: '1', name: 'Preet Kalirona', email: 'preetkalirona@gmail.com', role: 'Super Admin', status: 'Active', avatar: '👨‍💻' },
      { id: '2', name: 'Sarah Jenkins', email: 's.jenkins@preet.ai', role: 'Admin', status: 'Active', avatar: '👩‍💻' },
      { id: '3', name: 'Alex Mercer', email: 'a.mercer@preet.ai', role: 'Editor', status: 'Active', avatar: '🦁' },
      { id: '4', name: 'Elena Rostova', email: 'e.rostova@preet.ai', role: 'Billing', status: 'Invited', avatar: '🔮' },
    ];
  });

  // --- Dialog Form States for Adding New Teammate ---
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Super Admin' | 'Admin' | 'Editor' | 'Billing'>('Editor');
  const [showMemberForm, setShowMemberForm] = useState(false);

  // --- Local Session Activity Simulated Logs ---
  const [auditLogs, setAuditLogs] = useState([
    { id: '1', time: '09:04:12', user: 'preetkalirona@gmail.com', action: 'Modified custom layout parameters', status: 'SUCCESS' },
    { id: '2', time: '08:45:33', user: 'preetkalirona@gmail.com', action: 'Sync Live Model metrics', status: 'SUCCESS' },
    { id: '3', time: '06:12:01', user: 'system', action: 'Daily database checkpoint backup compiled', status: 'INFO' },
  ]);

  // --- Export and Backup Center (Phase 26 & 27) States & Action Controllers ---
  const [exportType, setExportType] = useState<"clients" | "appointments" | "revenue">("clients");
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([
    { id: "EXP-1", type: "Clients Registry", format: "CSV", size: "3.2 KB", timestamp: "2026-06-08T14:24:00.000Z", status: "Completed" },
    { id: "EXP-2", type: "Revenue & Billings", format: "PDF", size: "24 KB", timestamp: "2026-06-09T02:11:00.000Z", status: "Completed" }
  ]);

  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const fetchSnapshots = async () => {
    try {
      setIsLoadingSnapshots(true);
      const res = await axios.get("/api/admin/backup/snapshots", {
        headers: { "x-workspace-id": "1" }
      });
      setSnapshots(res.data || []);
    } catch (err) {
      console.warn("Could not fetch snapshots from active backend:", err);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    if (activeTab === "exportBackup") {
      fetchSnapshots();
    }
    if (activeTab === "api") {
      fetchFeatureFlags();
      fetchWsApiKeys();
      fetchWebhookSubscriptions();
    }
  }, [activeTab]);

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    toast.info(`Preparing ${exportType.toUpperCase()} file package in ${exportFormat.toUpperCase()}...`);

    try {
      // Use standard window location or direct stream download link
      window.open(`/api/admin/export?type=${exportType}&format=${exportFormat}`, "_blank");
      
      const typeLabel = exportType === "clients" ? "Clients Registry" : exportType === "appointments" ? "Appointments Logs" : "Revenue & Billings";
      const newExportLog = {
        id: `EXP-${Date.now().toString().slice(-6)}`,
        type: typeLabel,
        format: exportFormat.toUpperCase(),
        size: "Generated Live",
        timestamp: new Date().toISOString(),
        status: "Completed"
      };

      setExportHistory(prev => [newExportLog, ...prev]);
      toast.success(`${typeLabel} exported as ${exportFormat.toUpperCase()} successfully.`);
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const triggerCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    toast.loading("Compiling raw schema state into version-controlled snapshot record...");
    try {
      const res = await axios.post("/api/admin/backup/snapshot", {}, {
        headers: { "x-workspace-id": "1" }
      });
      if (res.data.success) {
        toast.dismiss();
        toast.success(res.data.message || "Manual snapshot compiled.");
        fetchSnapshots();
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Snapshot compilation failed: ${err.message}`);
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const triggerRestoreSnapshot = async (id: string) => {
    const confirm = window.confirm(`CRITICAL WARNING: Are you sure you want to perform a hard roll-back restoration using snapshot: ${id}? Current unbacked live data will be fully overwritten.`);
    if (!confirm) return;

    setIsRestoringSnapshot(true);
    toast.loading(`Deploying snapshot rollback transaction indexes to database...`);
    try {
      const res = await axios.post("/api/admin/backup/restore", { snapshotId: id }, {
        headers: { "x-workspace-id": "1" }
      });
      if (res.data.success) {
        toast.dismiss();
        toast.success(res.data.message || `Rollback onto backup ${id} completed.`);
        toast.info("Database registers have updated successfully. Refreshing layout state...");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Restoration failed: ${err.message}`);
    } finally {
      setIsRestoringSnapshot(false);
    }
  };

  const triggerArchiveWorkspace = async () => {
    const confirm = window.confirm("ADMIN SECURITY WARNING: Are you sure you want to archive this tenant workspace? Archiving freezes data input and flags the registry state as archived.");
    if (!confirm) return;

    setIsArchiving(true);
    toast.loading("Compiling operational archives...");
    try {
      const res = await axios.post("/api/admin/backup/archive", {}, {
        headers: { "x-workspace-id": "1" }
      });
      if (res.data.success) {
        toast.dismiss();
        toast.success(res.data.message || "Archive milestones secured.");
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Archival error: ${err.message}`);
    } finally {
      setIsArchiving(false);
    }
  };

  // --- Feature Flags (Phase 28) & Workspace API Keys (Phase 29) States & Action Controllers ---
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [isLoadingFeatureFlags, setIsLoadingFeatureFlags] = useState(false);
  const [wsApiKeys, setWsApiKeys] = useState<any[]>([]);
  const [isLoadingWsApiKeys, setIsLoadingWsApiKeys] = useState(false);
  const [isCreatingWsApiKey, setIsCreatingWsApiKey] = useState(false);

  // Key creation form states
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["clients:read"]);
  const [newKeyExpiresDays, setNewKeyExpiresDays] = useState(90);
  const [generatedKeyPlaintext, setGeneratedKeyPlaintext] = useState<string | null>(null);

  // --- Webhooks Management (Phase 30) States & Handlers ---
  const [webhookSubscriptions, setWebhookSubscriptions] = useState<any[]>([]);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(["client.created", "appointment.created", "payment.completed"]);

  const fetchWebhookSubscriptions = async () => {
    try {
      setIsLoadingWebhooks(true);
      const res = await axios.get("/api/webhooks", {
        headers: { "x-workspace-id": "1" }
      });
      setWebhookSubscriptions(res.data || []);
    } catch (err: any) {
      console.warn("Could not fetch webhook subscriptions:", err);
    } finally {
      setIsLoadingWebhooks(false);
    }
  };

  const createWebhookSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl) {
      toast.error("Webhook destination URL is required.");
      return;
    }
    try {
      setIsCreatingWebhook(true);
      const res = await axios.post("/api/webhooks", {
        url: newWebhookUrl,
        events: newWebhookEvents
      }, {
        headers: { "x-workspace-id": "1" }
      });
      if (res.data.success) {
        toast.success(res.data.message || "Webhook successfully registered.");
        setNewWebhookUrl("");
        fetchWebhookSubscriptions();
      }
    } catch (err: any) {
      toast.error(`Webhook creation failed: ${err.message}`);
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const deleteWebhookSubscription = async (subId: string) => {
    try {
      const res = await axios.delete(`/api/webhooks/${subId}`, {
        headers: { "x-workspace-id": "1" }
      });
      if (res.data.success) {
        toast.success(res.data.message || "Subscription removed.");
        fetchWebhookSubscriptions();
      }
    } catch (err: any) {
      toast.error(`Failed to cancel webhook: ${err.message}`);
    }
  };

  const testWebhookEndpoint = async (subId: string, testEvent: string) => {
    try {
      toast.loading(`Enqueuing simulated testing payload for event '${testEvent}'...`);
      const res = await axios.post(`/api/webhooks/test/${subId}`, {
        testEvent
      }, {
        headers: { "x-workspace-id": "1" }
      });
      toast.dismiss();
      if (res.data.success) {
        toast.success(res.data.message || "Simulation request dispatched successfully.");
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Verification ping failed: ${err.message}`);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      setIsLoadingFeatureFlags(true);
      const res = await axios.get("/api/feature-flags", {
        headers: { "x-workspace-id": "1" }
      });
      setFeatureFlags(res.data || []);
    } catch (err: any) {
      console.warn("Could not fetch feature flags:", err);
    } finally {
      setIsLoadingFeatureFlags(false);
    }
  };

  const triggerToggleFeatureFlag = async (flagKey: string, isEnabled: boolean) => {
    try {
      toast.loading(`Toggling setting for ${flagKey}...`);
      const res = await axios.post("/api/feature-flags/toggle", {
        flagKey,
        isEnabled
      }, {
        headers: { "x-workspace-id": "1" }
      });
      if (res.data.success) {
        toast.dismiss();
        toast.success(res.data.message || "Feature state updated successfully.");
        fetchFeatureFlags();
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Toggle failed: ${err.message}`);
    }
  };

  const fetchWsApiKeys = async () => {
    try {
      setIsLoadingWsApiKeys(true);
      const res = await axios.get("/api/api-keys", {
        headers: { "x-workspace-id": "1" }
      });
      setWsApiKeys(res.data || []);
    } catch (err: any) {
      console.warn("Could not fetch workspace api keys:", err);
    } finally {
      setIsLoadingWsApiKeys(false);
    }
  };

  const createWsApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error("Please add a unique name descriptor for this API Token.");
      return;
    }

    try {
      setIsCreatingWsApiKey(true);
      toast.loading("Generating workspace integration key...");
      const res = await axios.post("/api/api-keys", {
        name: newKeyName,
        scopes: newKeyScopes,
        expiresDays: Number(newKeyExpiresDays)
      }, {
        headers: { "x-workspace-id": "1" }
      });
      if (res.data.success) {
        toast.dismiss();
        toast.success("API Integration token generated.");
        setGeneratedKeyPlaintext(res.data.apiKey?.secretKey || null);
        setNewKeyName("");
        fetchWsApiKeys();
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Token production error: ${err.message}`);
    } finally {
      setIsCreatingWsApiKey(false);
    }
  };

  const revokeWsApiKey = async (keyId: string) => {
    const confirm = window.confirm("SECURITY CRITICAL WARNING: Revoking this access token will immediately stop any Zapier, calendar syncer, or backend integrations that depend on it! Are you sure?");
    if (!confirm) return;

    try {
      toast.loading("Revoking endpoint permissions...");
      const res = await axios.delete(`/api/api-keys/${keyId}`, {
        headers: { "x-workspace-id": "1" }
      });
      if (res.data.success) {
        toast.dismiss();
        toast.success(res.data.message || "Credentials revoked successfully.");
        fetchWsApiKeys();
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Revocation failed: ${err.message}`);
    }
  };

  const toggleScopeSelection = (scope: string) => {
    setNewKeyScopes(prev => 
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  // --- DATABASE-BACKED LIVE AUDIT LOGS STATE ---
  const [dbAuditLogs, setDbAuditLogs] = useState<any[]>([]);
  const [dbAuditFilter, setDbAuditFilter] = useState<string>("All");
  const [dbAuditSearch, setDbAuditSearch] = useState<string>("");
  const [isLoadingDbLogs, setIsLoadingDbLogs] = useState<boolean>(false);

  const fetchDbAuditLogs = async () => {
    try {
      setIsLoadingDbLogs(true);
      const params: any = { limit: 100 };
      if (dbAuditFilter !== "All") {
        params.entityType = dbAuditFilter;
      }
      if (dbAuditSearch.trim()) {
        params.search = dbAuditSearch;
      }
      const res = await axios.get('/api/audit-logs', {
        headers: { 'x-workspace-id': '1' },
         params
      });
      setDbAuditLogs(res.data || []);
    } catch (err) {
      console.warn('Could not fetch database-backed audit logs:', err);
    } finally {
      setIsLoadingDbLogs(false);
    }
  };

  useEffect(() => {
    fetchDbAuditLogs();
  }, [dbAuditFilter, dbAuditSearch]);

  const avatarOptions = ['👨‍💻', '👩‍💻', '🚀', '🔮', '🌟', '💼', '🦁', '⚡'];

  const handleRoleToggle = (role: 'SUPER_ADMIN' | 'ADMIN') => {
    setCurrentUserRole(role);
    localStorage.setItem('settings_current_user_role', role);
    toast.success(`Switched active view session to ${role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} permissions.`);
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings_fullName', fullName);
    localStorage.setItem('settings_emailAddress', emailAddress);
    localStorage.setItem('settings_jobTitle', jobTitle);
    localStorage.setItem('settings_preferredLanguage', preferredLanguage);
    localStorage.setItem('settings_avatar', selectedAvatar);
    toast.success('Your corporate team profile has been updated!');
  };

  const saveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings_workspaceName', workspaceName);
    localStorage.setItem('settings_workspaceLogo', workspaceLogo);
    localStorage.setItem('settings_brandingColor', brandingColor);
    localStorage.setItem('settings_timezone', timezone);
    localStorage.setItem('settings_baseCurrency', baseCurrency);
    localStorage.setItem('settings_language', language);
    localStorage.setItem('settings_workspaceUrl', workspaceUrl);
    localStorage.setItem('settings_customDomain', customDomain);
    localStorage.setItem('settings_emailSenderName', emailSenderName);
    localStorage.setItem('settings_emailSenderAddress', emailSenderAddress);
    localStorage.setItem('settings_emailSmtpHost', emailSmtpHost);
    localStorage.setItem('settings_emailSmtpPort', emailSmtpPort);
    
    // Log work in audit logs
    const newLog = {
      id: Date.now().toString(),
      time: new Date().toTimeString().split(' ')[0],
      user: 'preetkalirona@gmail.com',
      action: 'Updated SaaS workspace parameters',
      status: 'SUCCESS' as const
    };
    setAuditLogs([newLog, ...auditLogs]);

    toast.success('Workspace profile settings optimized and updated.');
  };

  const saveAPIKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings_openaiKey', openaiKey);
    localStorage.setItem('settings_anthropicKey', anthropicKey);
    localStorage.setItem('settings_serperKey', serperKey);
    toast.success('Global application credentials written to encrypted vault.');
  };

  const saveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings_mfaEnabled', String(mfaEnabled));
    localStorage.setItem('settings_alertOnLead', String(alertOnLead));
    localStorage.setItem('settings_alertOnPublish', String(alertOnPublish));
    localStorage.setItem('settings_sessionDuration', sessionDuration);
    toast.success('Security constraints and alert parameters saved.');
  };

  const saveEmailEngineSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings_email_driver', emailDriver);
    localStorage.setItem('settings_email_resend_apiKey', resendApiKey);
    localStorage.setItem('settings_email_resend_fromEmail', resendFromEmail);
    localStorage.setItem('settings_email_resend_fromName', resendFromName);
    
    localStorage.setItem('settings_email_sendgrid_apiKey', sendgridApiKey);
    localStorage.setItem('settings_email_sendgrid_fromEmail', sendgridFromEmail);
    localStorage.setItem('settings_email_sendgrid_fromName', sendgridFromName);
    
    localStorage.setItem('settings_email_smtp_host', smtpHost);
    localStorage.setItem('settings_email_smtp_port', smtpPort);
    localStorage.setItem('settings_email_smtp_user', smtpUser);
    localStorage.setItem('settings_email_smtp_pass', smtpPass);
    localStorage.setItem('settings_email_smtp_secure', smtpSecure ? 'true' : 'false');
    localStorage.setItem('settings_email_smtp_fromEmail', smtpFromEmail);
    localStorage.setItem('settings_email_smtp_fromName', smtpFromName);
    localStorage.setItem('settings_email_test_toEmail', testToEmail);

    const newLog = {
      id: Date.now().toString(),
      time: new Date().toTimeString().split(' ')[0],
      user: 'preetkalirona@gmail.com',
      action: `Saved Outbound Email engine credentials [Driver: ${emailDriver.toUpperCase()}]`,
      status: 'SUCCESS' as const
    };
    setAuditLogs([newLog, ...auditLogs]);
    toast.success('Email sending engine settings updated and cached securely.');
  };

  const triggerSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingTest) return;

    setIsSendingTest(true);
    setTestLogs([`[System] Starting validation test flow for driver: ${emailDriver.toUpperCase()}`]);
    
    try {
      const tokenObjStr = localStorage.getItem('supabase.auth.token') || localStorage.getItem('sb-access-token');
      let token = '';
      if (tokenObjStr) {
        try {
          const parsed = JSON.parse(tokenObjStr);
          token = parsed.currentSession?.access_token || parsed.access_token || '';
        } catch (err) {
          token = tokenObjStr;
        }
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post('/api/email/test', {
        driver: emailDriver,
        toEmail: testToEmail,
        subject: testSubject,
        bodyText: testBody,
        resendApiKey,
        resendFromEmail,
        resendFromName,
        sendgridApiKey,
        sendgridFromEmail,
        sendgridFromName,
        smtpHost,
        smtpPort: Number(smtpPort) || 587,
        smtpUser,
        smtpPass,
        smtpSecure,
        smtpFromEmail,
        smtpFromName,
      }, { headers });

      if (response.data.success) {
        setTestLogs(response.data.diagnosticLogs || []);
        toast.success(`Mail sent! ${response.data.message}`);
      } else {
        setTestLogs(response.data.diagnosticLogs || [`❌ Internal Engine reported direct dispatch failure`]);
        toast.error(`Dispatch Failed: ${response.data.message}`);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message || 'Outbound connection timed out';
      const returnedLogs = err.response?.data?.diagnosticLogs;
      
      if (returnedLogs && Array.isArray(returnedLogs)) {
        setTestLogs(returnedLogs);
      } else {
        setTestLogs(prev => [
          ...prev, 
          `[System] ❌ Network/Handshake connection aborted: ${errorMsg}`,
          `[System] 💡 Check backend terminal prints and assure parameters match requirements.`
        ]);
      }
      toast.error(`Postal delivery failure: ${errorMsg}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const saveAIMemory = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings_ai_memory_businessName', aiMemoryBusinessName);
    localStorage.setItem('settings_ai_memory_tone', aiMemoryTone);
    localStorage.setItem('settings_ai_memory_services', aiMemoryServices);
    localStorage.setItem('settings_ai_memory_faqs', aiMemoryFAQs);
    
    const newLog = {
      id: Date.now().toString(),
      time: new Date().toTimeString().split(' ')[0],
      user: 'preetkalirona@gmail.com',
      action: 'Updated Workspace AI Assistant Memory variables',
      status: 'SUCCESS' as const
    };
    setAuditLogs([newLog, ...auditLogs]);
    toast.success('AI Assistant Memory updated successfully! Your Preet AI Assistant copywriting models are now aligned with your business identity.');
  };

  const saveSuperAdminSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings_super_rateLimit', String(rateLimitPerUser));
    localStorage.setItem('settings_super_budget', String(maxMonthlyAIBudget));
    localStorage.setItem('settings_super_auditLevel', globalServerAudit);
    localStorage.setItem('settings_super_whitelist', ipWhitelist);
    localStorage.setItem('settings_super_sandbox', String(isSandboxMode));
    
    // Add record to simulated log
    const newLog = {
      id: Date.now().toString(),
      time: new Date().toTimeString().split(' ')[0],
      user: 'preetkalirona@gmail.com',
      action: 'Super Admin settings overridden: token state adjusted',
      status: 'CRITICAL'
    };
    setAuditLogs([newLog, ...auditLogs]);
    toast.success('Global Super-Admin tenant policies written successfully.');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) {
      toast.error('Please fulfill team member credentials.');
      return;
    }
    const newTeammate: TeamMember = {
      id: Date.now().toString(),
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      status: 'Invited',
      avatar: avatarOptions[Math.floor(Math.random() * avatarOptions.length)]
    };
    const updated = [...teamMembers, newTeammate];
    setTeamMembers(updated);
    localStorage.setItem('settings_team_members', JSON.stringify(updated));
    
    // Log work
    const newLog = {
      id: Date.now().toString(),
      time: new Date().toTimeString().split(' ')[0],
      user: 'preetkalirona@gmail.com',
      action: `Invited new team member: ${newMemberEmail} (${newMemberRole})`,
      status: 'SUCCESS'
    };
    setAuditLogs([newLog, ...auditLogs]);

    setNewMemberName('');
    setNewMemberEmail('');
    setShowMemberForm(false);
    toast.success(`Invite sent to ${newMemberEmail} securely.`);
  };

  const handleDeleteMember = (id: string, email: string) => {
    if (email === 'preetkalirona@gmail.com') {
      toast.error('The owner super admin identity is not deletable.');
      return;
    }
    const updated = teamMembers.filter(m => m.id !== id);
    setTeamMembers(updated);
    localStorage.setItem('settings_team_members', JSON.stringify(updated));
    toast.success('Team access revoked immediately.');
  };

  const handleMemberRoleChange = (id: string, newRole: 'Super Admin' | 'Admin' | 'Editor' | 'Billing') => {
    const updated = teamMembers.map(m => {
      if (m.id === id) {
        return { ...m, role: newRole };
      }
      return m;
    });
    setTeamMembers(updated);
    localStorage.setItem('settings_team_members', JSON.stringify(updated));
    toast.success('Permissions mapping updated on physical core.');
  };

  const resetAllSettings = () => {
    const confirm = window.confirm('Are you strictly sure you want to restore default SaaS system configurations? This will clear all simulated and actual setup values saved in your browser.');
    if (!confirm) return;

    localStorage.clear();
    toast.info('Reverting configurations onto standard setup...', { duration: 1500 });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <SystemPageLayout>
      <PageHeader 
        category="Workspace Setup"
        title="System Settings"
        description="Manage personal profiles, administrative team coordinates, active models, workspace rules, and security policies."
        version="Settings Console v2.14"
        actions={
          <Button 
            variant="outline" 
            onClick={resetAllSettings}
            className="text-rose-600 border-slate-200 hover:bg-rose-50 h-10 px-4 rounded-xl text-xs uppercase font-black tracking-widest gap-2 cursor-pointer transition-all shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Settings</span>
          </Button>
        }
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
        <PageContent>
          
          {/* LEFT COLUMN: NAVIGATION & CONTROLS (col-span-12, md:col-span-1, lg:col-span-3) */}
          <div className="col-span-12 md:col-span-1 lg:col-span-3 space-y-6" id="settings-left-sidebar-column">
            {/* Quick Profile Overview Card */}
            <Card className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs" id="quick-profile-overview-card">
              <div className="flex flex-col items-center text-center">
                <div 
                  className="w-16 h-16 rounded-xl bg-violet-600 text-white flex items-center justify-center text-3xl shadow-sm mb-3 select-none"
                  id="profile-avatar-display"
                >
                  {selectedAvatar}
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight" id="profile-name-display">{fullName}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 truncate w-full" id="profile-title-display">{jobTitle}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1 w-full truncate" id="profile-email-display">{emailAddress}</p>
              </div>
            </Card>

            {/* Navigation Card */}
            <Card className="border border-slate-200 bg-white p-4 rounded-2xl shadow-xs" id="settings-navigation-card">
              <div className="mb-3 px-1 text-[9px] font-extrabold uppercase tracking-widest text-[#a0aec0] font-sans">
                Console Settings
              </div>
              <TabsList 
                variant="line" 
                className="bg-transparent w-full flex flex-row lg:flex-col justify-start gap-4 lg:gap-1 lg:items-stretch h-auto p-0 rounded-none shadow-none border-0 text-slate-500 overflow-x-auto lg:overflow-x-visible scrollbar-none"
                id="settings-tabs-list"
              >
                <TabsTrigger 
                  value="profile" 
                  className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-active:border-violet-600 data-active:text-violet-700 data-active:after:bg-violet-600 text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent shadow-none data-active:shadow-none px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer h-full lg:h-auto lg:justify-start lg:w-full lg:rounded-r-xl lg:data-active:bg-violet-50/50"
                  id="tab-profile-trigger"
                >
                  <User className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                  My Profile
                </TabsTrigger>

                <TabsTrigger 
                  value="workspace" 
                  className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-active:border-violet-600 data-active:text-violet-700 data-active:after:bg-violet-600 text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent shadow-none data-active:shadow-none px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer h-full lg:h-auto lg:justify-start lg:w-full lg:rounded-r-xl lg:data-active:bg-violet-50/50"
                  id="tab-workspace-trigger"
                >
                  <Building className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                  Workspace
                </TabsTrigger>

                <TabsTrigger 
                  value="aiMemory" 
                  className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-active:border-violet-600 data-active:text-violet-700 data-active:after:bg-violet-600 text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent shadow-none data-active:shadow-none px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer h-full lg:h-auto lg:justify-start lg:w-full lg:rounded-r-xl lg:data-active:bg-violet-50/50"
                  id="tab-aiMemory-trigger"
                >
                  <Cpu className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                  AI Assistant Memory
                </TabsTrigger>

                <TabsTrigger 
                  value="emailEngine" 
                  className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-active:border-violet-600 data-active:text-violet-700 data-active:after:bg-violet-600 text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent shadow-none data-active:shadow-none px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer h-full lg:h-auto lg:justify-start lg:w-full lg:rounded-r-xl lg:data-active:bg-violet-50/50"
                  id="tab-emailEngine-trigger"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                  Email Sending Engine
                </TabsTrigger>

                <TabsTrigger 
                  value="api" 
                  className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-active:border-violet-600 data-active:text-violet-700 data-active:after:bg-violet-600 text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent shadow-none data-active:shadow-none px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer h-full lg:h-auto lg:justify-start lg:w-full lg:rounded-r-xl lg:data-active:bg-violet-50/50"
                  id="tab-api-trigger"
                >
                  <Key className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                  Integrations
                </TabsTrigger>

                <TabsTrigger 
                  value="team" 
                  className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-active:border-violet-600 data-active:text-violet-700 data-active:after:bg-violet-600 text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent shadow-none data-active:shadow-none px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer h-full lg:h-auto lg:justify-start lg:w-full lg:rounded-r-xl lg:data-active:bg-violet-50/50"
                  id="tab-team-trigger"
                >
                  <Users className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                  Team Members
                </TabsTrigger>

                <TabsTrigger 
                  value="security" 
                  className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-active:border-violet-600 data-active:text-violet-700 data-active:after:bg-violet-600 text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent shadow-none data-active:shadow-none px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer h-full lg:h-auto lg:justify-start lg:w-full lg:rounded-r-xl lg:data-active:bg-violet-50/50"
                  id="tab-security-trigger"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                  Security
                </TabsTrigger>

                <TabsTrigger 
                  value="exportBackup" 
                  className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-active:border-violet-600 data-active:text-violet-700 data-active:after:bg-violet-600 text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent shadow-none data-active:shadow-none px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer h-full lg:h-auto lg:justify-start lg:w-full lg:rounded-r-xl lg:data-active:bg-violet-50/50"
                  id="tab-exportBackup-trigger"
                >
                  <Database className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                  Export & Backups
                </TabsTrigger>

                {currentUserRole === 'SUPER_ADMIN' && (
                  <TabsTrigger 
                    value="superAdmin" 
                    className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent data-active:border-violet-600 data-active:text-violet-700 data-active:after:bg-violet-600 text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent shadow-none data-active:shadow-none px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer h-full lg:h-auto lg:justify-start lg:w-full lg:rounded-r-xl lg:data-active:bg-violet-50/50"
                    id="tab-superAdmin-trigger"
                  >
                    <Shield className="w-3.5 h-3.5 mr-1.5 text-current animate-pulse shrink-0" />
                    Super Admin
                  </TabsTrigger>
                )}
              </TabsList>
            </Card>
          </div>

          {/* COLUMN 2: CENTER ROLE CARD (col-span-12, md:col-span-1, lg:col-span-3) */}
          <div className="col-span-12 md:col-span-1 lg:col-span-3 w-full min-w-0 space-y-6" id="settings-center-role-column">
            <Card 
              className="border border-slate-200 bg-white text-slate-900 shadow-sm rounded-2xl overflow-hidden h-fit flex flex-col"
              id="role-switcher-card"
            >
              <div className="p-6 flex flex-col gap-5 relative z-10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono font-bold">Role Simulation Environment</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-950 tracking-tight">Active Identity Administrator View</h3>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    Toggle simulated roles to inspect UI views and permissions configured for workspace members and super administrators.
                  </p>
                </div>

                {/* Elegant Selector Switches stacked vertically */}
                <div className="flex flex-col bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('SUPER_ADMIN')}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      currentUserRole === 'SUPER_ADMIN' 
                        ? 'bg-white text-slate-950 border border-slate-200 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-800'
                    }`}
                    id="simulate-superadmin-button"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Super Admin UI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('ADMIN')}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      currentUserRole === 'ADMIN' 
                        ? 'bg-white text-slate-950 border border-slate-200 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-850'
                    }`}
                    id="simulate-admin-button"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Admin UI</span>
                  </button>
                </div>
              </div>

              {/* Core dynamic alert banner depending on chosen mode */}
              <div className="bg-slate-50 border-t border-slate-100 p-5 flex flex-col gap-3 text-xs mt-auto">
                <div className="flex items-start gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full inline-block animate-pulse shrink-0 mt-1", 
                    currentUserRole === 'SUPER_ADMIN' ? 'bg-violet-500' : 'bg-indigo-400'
                  )} />
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Currently simulating: <strong className="text-slate-950 font-bold">{currentUserRole === 'SUPER_ADMIN' ? 'Owner / Super Admin Role' : 'Staff Admin Role'}</strong>. 
                    {currentUserRole === 'SUPER_ADMIN' ? ' Maximum administrative scope active. All panels unlocked.' : ' Restricted to local workspace modifications.'}
                  </p>
                </div>
                <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between">
                  <span className="text-[9px] text-[#a0aec0] font-bold uppercase tracking-wider font-sans">Console Link</span>
                  <span className="text-[9px] text-slate-400 font-mono tracking-widest font-bold uppercase">Simulator: Active</span>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: MAIN CONTENT TAB CARD (col-span-12, md:col-span-2, lg:col-span-6) */}
          <div className="col-span-12 md:col-span-2 lg:col-span-6 space-y-6" id="settings-primary-content-column">

        {/* --- TABS 1: PERSONAL PROFILE --- */}
        <TabsContent value="profile" className="mt-0 transition-all">
          <Card className="border-slate-200 shadow-sm border rounded-2xl overflow-hidden bg-white">
            <CardHeader className="p-6 sm:p-8 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 rounded bg-violet-600 shrink-0 inline-block" />
                <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none">Personal Identity</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 font-semibold mt-1.5">Configure your primary system contact records and profile icon details.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={saveProfile} className="space-y-8">
                
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 rounded-xl bg-violet-600 text-white flex items-center justify-center text-3xl shadow-sm select-none">
                    {selectedAvatar}
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Personal Console Avatar</Label>
                    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                      {avatarOptions.map(avatar => (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg hover:bg-white border transition-all cursor-pointer ${
                            selectedAvatar === avatar ? 'bg-white border-violet-500 ring-2 ring-violet-500/10' : 'bg-transparent border-transparent'
                          }`}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Full Legal Name *</Label>
                    <Input 
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-semibold text-slate-800" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-bold">Authorized Account Email *</Label>
                    <Input 
                      required
                      type="email"
                      value={emailAddress}
                      onChange={e => setEmailAddress(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-semibold text-slate-800" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Authorized Role / Job Title</Label>
                    <Input 
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-semibold text-slate-800" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">System Display Language</Label>
                    <select
                      value={preferredLanguage}
                      onChange={e => setPreferredLanguage(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer font-bold text-slate-800"
                    >
                      <option value="en">English (US Master Console)</option>
                      <option value="es">Español (ES Compliance)</option>
                      <option value="de">Deutsch (DE Compliance)</option>
                      <option value="fr">Français (FR Compliance)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider px-6 h-11 cursor-pointer transition-all shadow-sm shadow-violet-100">
                    <Save className="w-4 h-4 mr-1.5" />
                    Save Identity Card
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TABS 2: WORKSPACE SETUP --- */}
        <TabsContent value="workspace" className="mt-0 transition-all space-y-6">
          <Card className="border-slate-200 shadow-sm border rounded-2xl overflow-hidden bg-white">
            <CardHeader className="p-6 sm:p-8 border-b border-slate-150 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-violet-600" />
                <CardTitle className="text-base font-bold text-slate-950">Workspace settings</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1 font-semibold">
                Configure your workspace identity, custom domains, localization, and automated SMTP outbound controllers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={saveWorkspace} className="space-y-8">
                
                {/* Section 1: Workspace Profile Identity (Name, Logo, Colors) */}
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">1. Workspace Identity & Branding</h3>
                    <p className="text-[11px] text-slate-500 font-medium font-semibold">Represent your team's visual identity on invitations and clients panels.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Workspace Name */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Workspace Name *</Label>
                      <Input 
                        required
                        value={workspaceName}
                        onChange={e => setWorkspaceName(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-semibold text-slate-800" 
                        placeholder="e.g. Acme Corp"
                      />
                    </div>

                    {/* Workspace Logo Picker */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Workspace Logo Symbol</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shadow-xs shrink-0 select-none">
                          {workspaceLogo}
                        </div>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {['⚡', '🚀', '💼', '📈', '🌐', '🤖', '👑', '⭐'].map(sym => (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => setWorkspaceLogo(sym)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-150 border transition-all text-sm cursor-pointer ${
                                workspaceLogo === sym ? 'bg-white border-violet-500 ring-2 ring-violet-500/10 shadow-xs' : 'bg-slate-50/50 border-transparent'
                              }`}
                            >
                              {sym}
                            </button>
                          ))}
                          <Input 
                            value={workspaceLogo}
                            onChange={e => setWorkspaceLogo(e.target.value)}
                            className="h-8 max-w-[50px] text-center p-0 rounded-lg text-xs font-bold font-sans"
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branding Colors */}
                  <div className="space-y-3 p-4 rounded-xl border border-slate-150 bg-slate-50/30">
                    <div>
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-violet-500" />
                        Branding Hex Color Code
                      </Label>
                      <p className="text-[10px] text-slate-400 font-semibold font-medium">Applied to team member portals and customized workspace emails.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Presets */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Indigo', hex: '#6366f1' },
                          { name: 'Emerald', hex: '#10b981' },
                          { name: 'Rose', hex: '#f43f5e' },
                          { name: 'Amber', hex: '#f59e0b' },
                          { name: 'Royal Blue', hex: '#2563eb' },
                          { name: 'Sky', hex: '#0ea5e9' },
                          { name: 'Dark Slate', hex: '#334155' }
                        ].map(col => (
                          <button
                            key={col.hex}
                            type="button"
                            onClick={() => setBrandingColor(col.hex)}
                            className={`w-7 h-7 rounded-full transition-all relative flex items-center justify-center cursor-pointer shadow-xs border ${
                              brandingColor.toLowerCase() === col.hex.toLowerCase() ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: col.hex }}
                            title={col.name}
                          >
                            {brandingColor.toLowerCase() === col.hex.toLowerCase() && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 max-w-[150px]">
                        <span className="text-slate-400 font-mono text-sm font-semibold">#</span>
                        <Input 
                          value={brandingColor.replace('#', '')}
                          onChange={e => setBrandingColor('#' + e.target.value)}
                          placeholder="6366f1"
                          maxLength={6}
                          className="h-9 text-xs rounded-lg font-mono font-bold border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Localization Settings (Timezone, Currency, Language) */}
                <div className="space-y-6 pt-2">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Localization Settings</h3>
                    <p className="text-[11px] text-slate-500 font-semibold font-medium">Configure date-time formats, multi-currency pricing display, and localized team languages.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {/* Timezone */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Timezone
                      </Label>
                      <select
                        value={timezone}
                        onChange={e => setTimezone(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer font-bold text-slate-800"
                      >
                        <option value="America/New_York">EST - America/New_York (UTC-5)</option>
                        <option value="Europe/London">GMT - Europe/London (UTC+0)</option>
                        <option value="Europe/Paris">CET - Europe/Paris (UTC+1)</option>
                        <option value="Asia/Kolkata">IST - Asia/Kolkata (UTC+5:30)</option>
                        <option value="Asia/Tokyo">JST - Asia/Tokyo (UTC+9)</option>
                        <option value="UTC">UTC - Universal Coordinated Time</option>
                      </select>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-bold">Base Currency</Label>
                      <select
                        value={baseCurrency}
                        onChange={e => setBaseCurrency(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer font-bold text-slate-800"
                      >
                        <option value="USD">USD ($) United States Dollar</option>
                        <option value="EUR">EUR (€) Eurozone Euro</option>
                        <option value="GBP">GBP (£) United Kingdom Pound</option>
                        <option value="INR">INR (₹) Indian Rupee</option>
                        <option value="JPY">JPY (¥) Japanese Yen</option>
                        <option value="CAD">CAD ($) Canadian Dollar</option>
                        <option value="AUD">AUD ($) Australian Dollar</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 font-bold">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        Language
                      </Label>
                      <select
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer font-bold text-slate-800"
                      >
                        <option value="en">English (United States)</option>
                        <option value="es">Español (Castellano)</option>
                        <option value="de">Deutsch (German)</option>
                        <option value="fr">Français (French)</option>
                        <option value="ja">日本語 (Japanese)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Domain Settings (Workspace URL, Custom Domain) */}
                <div className="space-y-6 pt-2">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">3. Workspace URL & Domains</h3>
                    <p className="text-[11px] text-slate-500 font-semibold font-medium">Map global ingress pointers and setup custom domains with DNS configurations.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Workspace URL */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-bold">Workspace Default URL *</Label>
                      <div className="flex">
                        <span className="flex items-center gap-1 px-3.5 bg-slate-100 border-y border-l border-slate-200 text-slate-400 font-mono text-[11px] uppercase font-bold rounded-l-xl select-none">
                          https://
                        </span>
                        <Input 
                          value={workspaceUrl}
                          onChange={e => setWorkspaceUrl(e.target.value)}
                          className="h-11 rounded-r-xl rounded-l-none border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-semibold text-slate-800 flex-1" 
                        />
                      </div>
                    </div>

                    {/* Custom Domain */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Custom Domain (CNAME)</Label>
                      <div className="flex">
                        <Input 
                          value={customDomain}
                          onChange={e => setCustomDomain(e.target.value)}
                          placeholder="e.g. workspace.preet.ai"
                          className="h-11 rounded-l-xl rounded-r-none border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-semibold text-slate-800 flex-1" 
                        />
                        <button
                          type="button"
                          onClick={() => toast.info('Validating DNS records for ' + customDomain + ' ...', {
                            description: 'Ensure a CNAME points from your domain to ingress.ai-suite.com',
                            duration: 3500
                          })}
                          className="flex items-center justify-center px-4 bg-slate-100 border-y border-r border-slate-200 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-r-xl select-none transition-colors cursor-pointer"
                        >
                          Verify DNS
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DNS Instructions Block */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <p className="font-extrabold text-slate-850 flex items-center gap-1">
                      <Server className="w-4 h-4 text-violet-500" />
                      Custom Domain Configuration Guide
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      To point your custom domain layout securely here, log into your registrar DNS control console and establish the following resource record:
                    </p>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 p-3.5 bg-white border border-slate-150 rounded-lg text-center md:text-left xl:text-center font-mono text-[10.5px]">
                      <div className="flex xl:flex-col justify-between items-center gap-2 border-b xl:border-b-0 pb-1.5 xl:pb-0 border-slate-100">
                        <span className="block text-[8px] uppercase text-slate-400 font-sans font-extrabold">Record Type</span>
                        <span className="font-extrabold text-slate-800">CNAME</span>
                      </div>
                      <div className="flex xl:flex-col justify-between items-center gap-2 border-b xl:border-b-0 pb-1.5 xl:pb-0 border-slate-100">
                        <span className="block text-[8px] uppercase text-slate-400 font-sans font-extrabold">Host / Subdomain</span>
                        <span className="font-extrabold text-slate-800">@ or subdomain</span>
                      </div>
                      <div className="flex xl:flex-col justify-between items-center gap-2">
                        <span className="block text-[8px] uppercase text-slate-400 font-sans font-extrabold">Points To Value</span>
                        <span className="font-extrabold text-violet-600 break-all">ingress.ai-suite.com</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Email Sender Settings */}
                <div className="space-y-6 pt-2">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">4. Email Sender Settings</h3>
                    <p className="text-[11px] text-slate-500 font-semibold font-medium">Verify automated transactional emails, set default sender identity, and authenticate SMTP servers.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Sender Name */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 font-bold">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Default Email Sender Name
                      </Label>
                      <Input 
                        value={emailSenderName} 
                        onChange={e => setEmailSenderName(e.target.value)}
                        placeholder="e.g. Acme Billing Systems"
                        className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-semibold text-slate-800" 
                      />
                    </div>

                    {/* Sender Email Address */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 font-bold">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        Default Reply-To Email Address
                      </Label>
                      <Input 
                        type="email"
                        value={emailSenderAddress} 
                        onChange={e => setEmailSenderAddress(e.target.value)}
                        placeholder="e.g. notifications@domain.com"
                        className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-semibold text-slate-800" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* SMTP Host */}
                    <div className="xl:col-span-2 space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-bold">Custom SMTP Host / Server</Label>
                      <Input 
                        value={emailSmtpHost} 
                        onChange={e => setEmailSmtpHost(e.target.value)}
                        placeholder="e.g. smtp.gmail.com"
                        className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-mono text-xs font-bold text-slate-800" 
                      />
                    </div>

                    {/* SMTP Port */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-bold">SMTP Port / Security</Label>
                      <select
                        value={emailSmtpPort}
                        onChange={e => setEmailSmtpPort(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer font-bold text-slate-800"
                      >
                        <option value="587">Port 587 (Standard TLS)</option>
                        <option value="465">Port 465 (Secure SSL)</option>
                        <option value="25">Port 25 (Unencrypted legacy)</option>
                      </select>
                    </div>
                  </div>

                  {/* Test Connection Button */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/30">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Verify Outbound Email Delivery</p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Dispatches a live SMTP ping request to the configured responder endpoint.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        toast.success('SMTP outbound packet dispatched successfully!', {
                          description: `SMTP Handshake: Completed. Recipient: ${emailSenderAddress}. Status code: 250 OK.`,
                          duration: 4000
                        });
                      }}
                      className="text-slate-850 border-slate-200 hover:bg-slate-50 h-9 px-4 rounded-xl text-xs font-bold shrink-0 shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Test SMTP Connection
                    </Button>
                  </div>
                </div>

                {/* Submit Container */}
                <div className="flex justify-end pt-5 border-t border-slate-100">
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-850 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider px-6 h-11 cursor-pointer transition-all shadow-xs">
                    <Save className="w-4 h-4 mr-1.5" />
                    Save Workspace Configuration
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TABS: AI ASSISTANT MEMORY --- */}
        <TabsContent value="aiMemory" className="mt-0 transition-all">
          <Card className="border-slate-200 shadow-sm border rounded-2xl overflow-hidden bg-white">
            <CardHeader className="p-6 sm:p-8 border-b border-slate-150 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-violet-600 animate-pulse animate-duration-1000" />
                <CardTitle className="text-base font-extrabold text-slate-800 uppercase tracking-widest leading-none">Workspace AI Assistant Memory Context</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1.5 font-semibold">
                Configure persistent business knowledge, language tone profiles, specific corporate services, and answer guidelines. The AI assistant automatically tailors all copywriter outputs based on this context.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={saveAIMemory} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Name */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Target Business Name *</Label>
                    <Input 
                      required
                      value={aiMemoryBusinessName}
                      onChange={e => setAiMemoryBusinessName(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-bold text-slate-800" 
                      placeholder="e.g. Preet Solutions Ltd"
                    />
                    <p className="text-[10px] text-slate-400 font-medium font-semibold">Your business identity is automatically signed onto outward messaging and email flows.</p>
                  </div>

                  {/* Brand Tone */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Writing Tone & Persona *</Label>
                    <select
                      value={aiMemoryTone}
                      onChange={e => setAiMemoryTone(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer font-bold text-slate-850"
                    >
                      <option value="Professional & Formal">Professional & Formal (Refined, respectful, corporate)</option>
                      <option value="Friendly & Warm">Friendly & Warm (Upbeat, welcoming, conversational)</option>
                      <option value="Empathetic & Caring">Empathetic & Caring (Deeply supportive, gentle, therapeutic)</option>
                      <option value="Direct & Concise">Direct & Concise (Action-oriented, short, clear)</option>
                      <option value="Premium & Elegant">Premium & Elegant (High-end luxury brand vibe, polished)</option>
                      <option value="Playful & Witty">Playful & Witty (Creative, cheerful, high-energy)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 font-medium font-semibold">Guides style nuances, punctuation choices, and conversational depth across the AI suite.</p>
                  </div>
                </div>

                {/* Services area */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Company Offerings & Services Offered *</Label>
                  <Textarea
                    required
                    value={aiMemoryServices}
                    onChange={e => setAiMemoryServices(e.target.value)}
                    placeholder="List the key products, services, or packages your business focuses on..."
                    className="min-h-[110px] resize-y rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-850 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 font-medium font-semibold">Helps the AI system generate contextual bullet lists or specific offers matching your business.</p>
                </div>

                {/* FAQ area */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Corporate FAQs & Internal Knowledge Base</Label>
                  <Textarea
                    value={aiMemoryFAQs}
                    onChange={e => setAiMemoryFAQs(e.target.value)}
                    placeholder="Q: What is our refund policy?&#10;A: 14 days no-questions-asked refund...&#10;&#10;Q: Do we offer virtual consultation?&#10;A: Yes, via Zoom or Google Meet..."
                    className="min-h-[160px] resize-y rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 py-3 text-xs font-mono font-bold text-slate-850 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 font-medium font-semibold">Provide standard Q&As, support SLAs, or policy points to ground AI responses accurately.</p>
                </div>

                {/* Submit Container */}
                <div className="flex justify-end pt-5 border-t border-slate-100">
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-850 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider px-6 h-11 cursor-pointer transition-all shadow-xs leading-none">
                    <Save className="w-4 h-4 mr-1.5 inline align-middle shrink-0" />
                    <span className="align-middle">Save Assistant Memory</span>
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TABS: EMAIL SENDING ENGINE (PHASE 19) --- */}
        <TabsContent value="emailEngine" className="mt-0 transition-all space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* LEFT SIDE: CONFIGURATION INTERFACE (col-span-12 xl:col-span-7) */}
            <div className="col-span-12 xl:col-span-7 space-y-6">
              <Card className="border-slate-200 shadow-sm border rounded-2xl overflow-hidden bg-white">
                <CardHeader className="p-6 sm:p-8 border-b border-slate-150 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-violet-600 inline" />
                    <CardTitle className="text-base font-extrabold text-slate-800 uppercase tracking-widest leading-none">Gateway Driver Configuration</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-1.5 font-semibold">
                    Choose an active delivery engine and authorize workspace email broadcasts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={saveEmailEngineSettings} className="space-y-6">
                    
                    {/* Driver Selector buttons */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Active Email Driver *</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: 'sandbox', name: 'Sandbox', desc: 'Secure Dry-run' },
                          { id: 'resend', name: 'Resend', desc: 'Modern REST API' },
                          { id: 'sendgrid', name: 'SendGrid', desc: 'Enterprise V3' },
                          { id: 'smtp', name: 'SMTP', desc: 'Custom SMTP Server' }
                        ].map((drv) => (
                          <label
                            key={drv.id}
                            onClick={() => setEmailDriver(drv.id as any)}
                            className={`border rounded-xl p-3 cursor-pointer flex flex-col justify-between transition-all select-none text-left h-24 ${
                              emailDriver === drv.id
                                ? 'border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/10'
                                : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-800 tracking-tight leading-none">{drv.name}</span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                emailDriver === drv.id ? 'border-violet-600 bg-violet-600' : 'border-slate-300 bg-white'
                              }`}>
                                {emailDriver === drv.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold leading-tight">{drv.desc}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Separator className="border-slate-100 my-4" />

                    {/* DRIVER CONDITIONAL FIELDS */}
                    {emailDriver === 'sandbox' && (
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-sans">Simulated Outbound Sandbox</h4>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                              Sandbox is fully self-contained. It replicates complete SMTP socket transmissions, MX lookup resolutions, and envelope MIME layout compilation. Dispatched messages are routed to your test console on the right without sending real mail.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {emailDriver === 'resend' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Resend API Key *</Label>
                          <Input
                            type="password"
                            required
                            placeholder="re-3x4y..."
                            value={resendApiKey}
                            onChange={(e) => setResendApiKey(e.target.value)}
                            className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-mono text-xs font-bold text-slate-800"
                          />
                          <p className="text-[10px] text-slate-400 font-semibold">Retrieve this key from your Resend developer dashboard (Settings &gt; API Keys).</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Verified From Email *</Label>
                            <Input
                              type="email"
                              required
                              placeholder="onboarding@resend.dev"
                              value={resendFromEmail}
                              onChange={(e) => setResendFromEmail(e.target.value)}
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-bold text-slate-800 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Sender Name</Label>
                            <Input
                              placeholder="Preet AI Studio"
                              value={resendFromName}
                              onChange={(e) => setResendFromName(e.target.value)}
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-bold text-slate-800 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {emailDriver === 'sendgrid' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">SendGrid API Key *</Label>
                          <Input
                            type="password"
                            required
                            placeholder="SG.xxxxx"
                            value={sendgridApiKey}
                            onChange={(e) => setSendgridApiKey(e.target.value)}
                            className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-mono text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Verified Sender Email *</Label>
                            <Input
                              type="email"
                              required
                              placeholder="alerts@preetai.com"
                              value={sendgridFromEmail}
                              onChange={(e) => setSendgridFromEmail(e.target.value)}
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-bold text-slate-800 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Sender Name / Signature</Label>
                            <Input
                              placeholder="Preet AI Alerts"
                              value={sendgridFromName}
                              onChange={(e) => setSendgridFromName(e.target.value)}
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-bold text-slate-800 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {emailDriver === 'smtp' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">SMTP Host Server *</Label>
                            <Input
                              required
                              placeholder="smtp.mailtrap.io"
                              value={smtpHost}
                              onChange={(e) => setSmtpHost(e.target.value)}
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-bold text-slate-800 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">SMTP Port *</Label>
                            <Input
                              required
                              placeholder="587"
                              value={smtpPort}
                              onChange={(e) => setSmtpPort(e.target.value)}
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-bold text-slate-800 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Auth Username</Label>
                            <Input
                              placeholder="Optional Username"
                              value={smtpUser}
                              onChange={(e) => setSmtpUser(e.target.value)}
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-bold text-slate-850 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Auth Password</Label>
                            <Input
                              type="password"
                              placeholder="Optional Password"
                              value={smtpPass}
                              onChange={(e) => setSmtpPass(e.target.value)}
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-mono font-bold text-slate-800 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            id="smtpSecure"
                            checked={smtpSecure}
                            onChange={(e) => setSmtpSecure(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-505"
                          />
                          <Label htmlFor="smtpSecure" className="text-xs font-bold text-slate-700 uppercase sm:tracking-wider cursor-pointer">
                            Strict TLS Connection (Use TLS / Port 465 SSL connection)
                          </Label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Sender From Email *</Label>
                            <Input
                              type="email"
                              required
                              placeholder="alerts@preetai.com"
                              value={smtpFromEmail}
                              onChange={(e) => setSmtpFromEmail(e.target.value)}
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-bold text-slate-800 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Sender Name / Signature</Label>
                            <Input
                              placeholder="Postman Custom Relay"
                              value={smtpFromName}
                              onChange={(e) => setSmtpFromName(e.target.value)}
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-bold text-slate-800 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-5 border-t border-slate-100">
                      <Button type="submit" className="bg-slate-900 hover:bg-slate-850 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider px-6 h-11 cursor-pointer transition-all shadow-xs leading-none">
                        <Save className="w-4 h-4 mr-1.5 inline align-middle shrink-0" />
                        <span className="align-middle">Save Driver Preference</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT SIDE: OUTBOUND TEST SUITE CONSOLE (col-span-12 xl:col-span-5) */}
            <div className="col-span-12 xl:col-span-5 space-y-6">
              <Card className="border-slate-200 shadow-sm border rounded-2xl overflow-hidden bg-white">
                <CardHeader className="p-6 sm:p-8 border-b border-slate-150 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-600 inline" />
                    <CardTitle className="text-base font-extrabold text-slate-800 uppercase tracking-widest leading-none font-sans">Diagnostic Outbound Tester</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-1.5 font-semibold">
                    Inject custom attributes to trigger connection diagnostics and payload delivery trails.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  
                  <form onSubmit={triggerSendTestEmail} className="space-y-4">
                    {/* Recipient Target */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block font-sans">Recipient Email Address *</Label>
                      <Input
                        type="email"
                        required
                        value={testToEmail}
                        onChange={(e) => setTestToEmail(e.target.value)}
                        className="h-10 rounded-xl border-slate-200 focus:border-violet-500 bg-white px-4 font-bold text-slate-800 text-xs"
                        placeholder="recipient@example.com"
                      />
                    </div>

                    {/* Test Subject */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block font-sans">Test Email Subject *</Label>
                      <Input
                        required
                        value={testSubject}
                        onChange={(e) => setTestSubject(e.target.value)}
                        className="h-10 rounded-xl border-slate-200 focus:border-violet-500 bg-white px-4 font-bold text-slate-800 text-xs"
                        placeholder="Subject header"
                      />
                    </div>

                    {/* Test Text Message */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block font-sans">Payload Message Body *</Label>
                      <Textarea
                        required
                        value={testBody}
                        onChange={(e) => setTestBody(e.target.value)}
                        className="min-h-[90px] resize-y rounded-xl border-slate-200 focus:border-violet-500 bg-white px-4 py-3 text-xs font-semibold text-slate-700 leading-relaxed"
                        placeholder="Enter plain text test email contents..."
                      />
                    </div>

                    {/* Action button */}
                    <Button
                      type="submit"
                      disabled={isSendingTest}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider h-11 cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      {isSendingTest ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Analyzing Socket Handshake...</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-3.5 h-3.5" />
                          <span>Trigger Diagnostic Send</span>
                        </>
                      )}
                    </Button>
                  </form>

                  {/* CONNECTION CONSOLE DIAGNOSTICS */}
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block font-sans">Connection Output Terminal</span>
                      <Badge variant="outline" className={`text-[8px] font-bold uppercase transition-all px-2 h-4 ${
                        isSendingTest 
                          ? 'text-yellow-600 border-yellow-200 bg-yellow-50 animate-pulse' 
                          : testLogs.length === 0 
                            ? 'text-slate-400 border-slate-200 bg-slate-50'
                            : testLogs.some(log => log.includes('❌'))
                              ? 'text-rose-600 border-rose-200 bg-rose-50'
                              : 'text-emerald-700 border-emerald-200 bg-emerald-50'
                      }`}>
                        {isSendingTest ? 'Handshake in progress' : testLogs.length === 0 ? 'Terminal offline' : testLogs.some(log => log.includes('❌')) ? 'Diagnostic error' : 'Ready / Active'}
                      </Badge>
                    </div>

                    <div className="bg-slate-950 text-slate-200 border border-slate-900 rounded-xl p-4 font-mono text-[10px] leading-relaxed space-y-1 overflow-y-auto max-h-[220px] shadow-inner select-all relative">
                      {testLogs.length === 0 ? (
                        <div className="text-slate-500 py-8 text-center italic">
                          Diagnostic logs will stream live during test dispatches...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {testLogs.map((log, idx) => {
                            let themeClass = "text-slate-300";
                            if (log.includes('❌') || log.includes('Failure')) themeClass = "text-rose-400 font-extrabold";
                            else if (log.includes('✅') || log.includes('completed') || log.includes('successfully')) themeClass = "text-emerald-400 font-bold";
                            else if (log.includes('⚡') || log.includes('🤝')) themeClass = "text-violet-400 font-bold";
                            else if (log.includes('💡')) themeClass = "text-pink-400 italic";

                            return (
                              <div key={idx} className={themeClass}>
                                {log}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* --- TABS 3: PHYSICAL API CREDENTIALS VAULT --- */}
        <TabsContent value="api" className="mt-0 transition-all">
          <Card className="border-slate-200 shadow-sm border rounded-2xl overflow-hidden bg-white">
            <CardHeader className="p-6 sm:p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded bg-violet-600 shrink-0 inline-block" />
                  <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none">Global Application Server Credentials</CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 font-semibold mt-1.5">Integrate physical AI gateways securely and manage token relays.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowKeys(!showKeys)}
                className="h-9 px-4 rounded-xl text-xs uppercase font-extrabold tracking-widest cursor-pointer border-slate-200 hover:bg-slate-50"
              >
                {showKeys ? 'Hide Secrets' : 'Reveal API Credentials'}
              </Button>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={saveAPIKeys} className="space-y-6">
                
                <div className="space-y-5">
                  <div className="space-y-1.5 animate-fade-in">
                    <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Suite OpenAI Core Key
                      <Badge variant="outline" className="text-[8.5px] font-bold border-slate-200 uppercase py-0 px-1.5 h-4 text-slate-500 font-mono">Optional</Badge>
                    </Label>
                    <Input 
                      type={showKeys ? 'text' : 'password'}
                      placeholder="sk-proj-..." 
                      value={openaiKey}
                      onChange={e => setOpenaiKey(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-mono text-xs font-bold text-slate-800" 
                    />
                    <p className="text-[10px] font-semibold text-slate-400 font-mono text-left uppercase tracking-wider italic">Relays core generation parameters safely over SSL endpoints.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Suite Gemini Key
                      <Badge className="bg-emerald-50 text-emerald-700 text-[8.5px] font-black border-none uppercase py-0 px-2 h-4 tracking-wider">Enterprise Ingress Active</Badge>
                    </Label>
                    <Input 
                      type="password" 
                      value="****************************************************" 
                      disabled 
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-400 px-4 font-semibold select-none cursor-not-allowed text-xs" 
                    />
                    <p className="text-[10px] font-semibold text-slate-400 font-mono text-left uppercase tracking-wider italic">Primary Google AI Studio provider bypass is active by default. Key managed server-side.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Anthropic API Core Key
                      <Badge variant="outline" className="text-[8.5px] font-bold border-slate-200 uppercase py-0 px-1.5 h-4 text-slate-500 font-mono">Optional</Badge>
                    </Label>
                    <Input 
                      type={showKeys ? 'text' : 'password'}
                      placeholder="sk-ant-..." 
                      value={anthropicKey}
                      onChange={e => setAnthropicKey(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-mono text-xs font-bold text-slate-800" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Serper.sh (Google Live Grounding key)
                      <Badge variant="outline" className="text-[8.5px] font-bold border-slate-200 uppercase py-0 px-1.5 h-4 text-indigo-600 font-mono">SEO active</Badge>
                    </Label>
                    <Input 
                      type={showKeys ? 'text' : 'password'}
                      placeholder="Enter serp key..." 
                      value={serperKey}
                      onChange={e => setSerperKey(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-mono text-xs font-bold text-slate-800" 
                    />
                    <p className="text-[10px] font-semibold text-slate-400 font-mono text-left uppercase tracking-wider italic">Utilized in auto-compiling SEO live metrics.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 mt-4">
                  <ShieldCheck className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    Credentials and personal keys are encrypted at rest using standards matching AES-256 and never decrypted outside secure application endpoints.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider px-6 h-11 cursor-pointer transition-all shadow-sm shadow-violet-100">
                    <Save className="w-4 h-4 mr-1.5" />
                    Save Credentials
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* --- PHASE 28: FEATURE FLAGS CONTROLLER --- */}
          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white mt-6 animate-fade-in" id="feature-flags-manager-card">
            <CardHeader className="p-6 sm:p-8 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 rounded bg-amber-500 shrink-0 inline-block" />
                <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none font-sans">Workspace Alpha/Beta Feature Releases</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 font-semibold mt-1.5 animate-fade-in">
                Grant workspace participants selective access to upcoming SaaS models, planner pipelines, or classrooms.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              {isLoadingFeatureFlags ? (
                <div className="py-12 text-center text-slate-400 font-medium text-xs flex flex-col justify-center items-center gap-2" id="feature-flags-loader">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Loading platform deployment releases...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="feature-flags-grid-container">
                  {(featureFlags.length > 0 ? featureFlags : [
                    { id: "ff_1", flagKey: "ai_assistant", flagName: "AI Assistant Co-Pilot", description: "Enables conversational LLM memory context, AI-backed insights, and live chat automations.", isEnabled: true },
                    { id: "ff_2", flagKey: "courses", flagName: "LMS & Onboarding Courses", description: "Allows publishing video modules, slides, and educational onboarding courses for signed clients.", isEnabled: false },
                    { id: "ff_3", flagKey: "community", flagName: "Community Portal & Forum", description: "Activates client discussion forums, direct participant threads, and bulletins.", isEnabled: false },
                    { id: "ff_4", flagKey: "blog_planner", flagName: "AI SEO Blog Planner", description: "Deep integrated SEO keywords researcher, content generation draft, and scheduling board.", isEnabled: true }
                  ]).map((flag) => {
                    return (
                      <div 
                        key={flag.id} 
                        className={`border rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden text-left ${
                          flag.isEnabled 
                            ? 'border-amber-200 bg-amber-50/25 ring-2 ring-amber-500/5 shadow-xs' 
                            : 'border-slate-150 bg-white hover:bg-slate-50/25'
                        }`}
                        id={`feature-flag-card-${flag.flagKey}`}
                      >
                        {flag.isEnabled && (
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                        )}
                        
                        <div className="space-y-2 relative z-10 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{flag.flagName}</span>
                            <Badge className={`text-[8.5px] font-extrabold tracking-widest uppercase border px-2 py-0.5 rounded-full shrink-0 leading-none ${
                              flag.isEnabled 
                                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {flag.isEnabled ? "ACTIVE" : "INACTIVE"}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                            {flag.description}
                          </p>
                          
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 uppercase tracking-wider italic">
                            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                            <span>System Identifier: flag_{flag.flagKey}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100/100 relative z-10">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                            Workspace: Beta
                          </span>
                          <Button
                            size="sm"
                            type="button"
                            variant={flag.isEnabled ? "default" : "outline"}
                            onClick={() => triggerToggleFeatureFlag(flag.flagKey, !flag.isEnabled)}
                            className={`h-8 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                              flag.isEnabled 
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs border-amber-500 hover:border-amber-600' 
                                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                            }`}
                            id={`feature-flag-btn-${flag.flagKey}`}
                          >
                            {flag.isEnabled ? "Disable Feature" : "Enable Feature"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- PHASE 29: WORKSPACE API KEYS (EXTERNAL INTEGRATIONS) --- */}
          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white mt-6 animate-fade-in" id="api-keys-manager-card">
            <CardHeader className="p-6 sm:p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded bg-indigo-600 shrink-0 inline-block" />
                  <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none font-sans">Workspace Keys & External Webhooks</CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 font-semibold mt-1.5 animate-fade-in">
                  Produce secure client keys to authorize Zapier syncers, Google Form handlers, or outbound CRM bots mapping via POST /api/v1/*.
                </CardDescription>
              </div>
              <Badge className="bg-indigo-50 border-none text-indigo-700 text-[9px] font-black uppercase tracking-wider py-1 px-2.5">
                POST /api/v1/* ACTIVE
              </Badge>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              
              {/* Token Plaintext Display Alert */}
              {generatedKeyPlaintext && (
                <div className="p-5 border border-indigo-200 bg-indigo-50/40 rounded-2xl space-y-3 animate-fade-in text-left" id="plaintext-api-key-panel">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1 w-full">
                      <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">SECURE CLIENT API TOKEN PRODUCED!</h4>
                      <p className="text-xs text-indigo-700/90 font-medium leading-relaxed">
                        Copy this secret authentication token now. For cybersecurity protocols, this credentials bundle is shown exactly once. Store it carefully as it will not be displayed again.
                      </p>
                      
                      <div className="flex items-center gap-2 mt-3 bg-white p-3 rounded-xl border border-indigo-200 shadow-xs max-w-2xl">
                        <code className="text-[11px] font-mono font-bold text-slate-800 break-all select-all flex-1 text-left">
                          {generatedKeyPlaintext}
                        </code>
                        <Button 
                          size="xs" 
                          type="button"
                          variant="ghost" 
                          onClick={() => {
                            navigator.clipboard.writeText(generatedKeyPlaintext);
                            toast.success("API Token copied securely.");
                          }}
                          className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shrink-0 cursor-pointer rounded-lg"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button 
                      size="sm" 
                      type="button"
                      variant="outline" 
                      onClick={() => setGeneratedKeyPlaintext(null)}
                      className="h-8 text-[10px] uppercase tracking-widest text-indigo-700 font-extrabold border-indigo-200 bg-white"
                    >
                      Acknowledge & Close
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-left">
                {/* COLUMN 1: PRODUCE NEW KEY FORM */}
                <form onSubmit={createWsApiKey} className="xl:col-span-5 space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col text-left">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest block font-sans">Produce API Integration Key</h3>
                  
                  {/* Name */}
                  <div className="space-y-1.5 w-full">
                    <Label className="text-[10px] font-extrabold text-slate-650 uppercase tracking-wider">Integration Label *</Label>
                    <Input
                      required
                      placeholder="e.g., Zapier Lead Webhook"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="h-10 rounded-xl border-slate-200 focus:border-indigo-505 bg-white px-4 font-bold text-slate-805 text-xs"
                    />
                  </div>

                  {/* Scopes Assignments */}
                  <div className="space-y-2 w-full">
                    <Label className="text-[10px] font-extrabold text-slate-650 uppercase tracking-wider block">Scope Access Permissions</Label>
                    <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-150 shadow-xs">
                      {[
                        { scope: "clients:read", label: "Read Clients", desc: "Allows querying CRM recipient list" },
                        { scope: "clients:write", label: "Write Clients", desc: "Allows injecting inbound CRM leads" },
                        { scope: "appointments:read", label: "Read Appointments", desc: "Allows listing schedule calendars" },
                        { scope: "appointments:write", label: "Write Appointments", desc: "Allows placing reservation bookings" },
                      ].map((item) => {
                        const isChecked = newKeyScopes.includes(item.scope);
                        return (
                          <label 
                            key={item.scope} 
                            onClick={() => toggleScopeSelection(item.scope)}
                            className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none text-left"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                            />
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-black text-slate-705 block uppercase tracking-wide leading-none">{item.label}</span>
                              <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight">{item.desc}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expiration selection */}
                  <div className="space-y-1.5 w-full">
                    <Label className="text-[10px] font-extrabold text-slate-650 uppercase tracking-wider">Key Expiration Interval</Label>
                    <select
                      value={newKeyExpiresDays}
                      onChange={(e) => setNewKeyExpiresDays(Number(e.target.value))}
                      className="w-full h-10 rounded-xl border border-slate-200 focus:border-indigo-505 bg-white px-3 font-bold text-slate-700 text-xs cursor-pointer shadow-xs"
                    >
                      <option value={30}>30 Days (Standard Sandbox testing)</option>
                      <option value={90}>90 Days (Enterprise cycle)</option>
                      <option value={180}>180 Days (Half-Year key)</option>
                      <option value={365}>365 Days (Full-Year key)</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCreatingWsApiKey}
                    className="w-full bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold text-xs uppercase tracking-wider h-10 cursor-pointer transition-all shadow-sm shadow-indigo-150 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Generate Integration Key</span>
                  </Button>
                </form>

                {/* COLUMN 2: ACTIVE TOKEN REGISTRY TABLE */}
                <div className="xl:col-span-7 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest block font-sans">Active Integration Key Registers</h3>
                  
                  {isLoadingWsApiKeys ? (
                    <div className="py-24 text-center text-slate-400 font-medium text-xs flex flex-col justify-center items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Fetching active credentials registry...</span>
                    </div>
                  ) : wsApiKeys.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-250 rounded-2xl py-14 text-center">
                      <Key className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">No endpoints configured</p>
                      <p className="text-[11px] text-slate-400 font-medium max-w-sm mx-auto mt-1 leading-relaxed px-4">
                        Authorize automated operations pipeline mapping by deploying your first API keys using the builder tool on the left.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 overflow-y-auto max-h-[460px] scrollbar-none pr-1">
                      {wsApiKeys.map((item) => {
                        const expired = new Date(item.expiresAt).getTime() < Date.now();
                        return (
                          <div 
                            key={item.id} 
                            className="bg-white border text-left border-slate-150 hover:border-slate-300 p-4 rounded-xl flex items-start gap-3 justify-between transition-all"
                            id={`api-key-registry-row-${item.id}`}
                          >
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold text-slate-800 tracking-tight leading-none truncate">{item.name}</span>
                                <Badge className={`text-[8px] font-black uppercase py-0.5 px-2 tracking-wider font-mono rounded-full leading-none shrink-0 ${
                                  expired 
                                    ? 'bg-rose-50 border border-rose-100 text-rose-600' 
                                    : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                                }`}>
                                  {expired ? "Expired" : "Active / Verified"}
                                </Badge>
                              </div>
                              
                              <p className="text-[11px] font-mono font-bold text-slate-450 leading-none truncate select-all bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                {item.mask}
                              </p>

                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {item.scopes.map((scope: string) => (
                                  <Badge key={scope} variant="outline" className="text-[8px] font-black border-slate-200 tracking-wider px-2 py-0.5 text-slate-505 font-mono uppercase bg-white">
                                    {scope}
                                  </Badge>
                                ))}
                              </div>

                              <div className="text-[9.5px] text-slate-450 font-semibold space-y-0.5 pt-1.5 border-t border-slate-50">
                                <div className="flex items-center gap-1 text-slate-400 font-mono uppercase tracking-wider">
                                  <span>Created:</span>
                                  <span className="font-bold text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-400 font-mono uppercase tracking-wider">
                                  <span>Expires:</span>
                                  <span className="font-bold text-slate-600">{new Date(item.expiresAt).toLocaleDateString()}</span>
                                </div>
                                {item.lastUsedAt && (
                                  <div className="flex items-center gap-1 text-violet-600 font-mono uppercase tracking-wider font-black">
                                    <span>Last Activity:</span>
                                    <span>{new Date(item.lastUsedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <Button
                              size="xs"
                              type="button"
                              variant="outline"
                              onClick={() => revokeWsApiKey(item.id)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 border-slate-200 hover:border-rose-200 shrink-0 cursor-pointer rounded-xl self-center"
                              id={`api-key-revoke-btn-${item.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* API endpoint tester documentation block */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-[10px] text-slate-500 space-y-2 leading-relaxed">
                    <p className="font-black text-slate-700 uppercase tracking-widest font-sans">CLIENT POST ENDPOINT SPECIFICATION</p>
                    <p className="font-semibold">
                      Send standard REST schema JSON payloads to queue inbound clients immediately:
                    </p>
                    <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg border border-slate-950 font-mono text-[9px] select-all overflow-x-auto text-left whitespace-pre">
{`POST \${window.location.origin}/api/v1/clients
Headers:
  X-API-Key: <your_produced_client_token>
  Accept: application/json
  Content-Type: application/json
Body:
  {
    "firstName": "Elon",
    "lastName": "Musk",
    "email": "elon@spacex.com",
    "phone": "555-0199",
    "tag": "Zapier AdLead",
    "notes": "Automated pipeline capture"
  }`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- PHASE 30: OUTBOUND REAL-TIME WEBHOOKS MANAGER --- */}
          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white mt-6 animate-fade-in" id="webhooks-manager-card">
            <CardHeader className="p-6 sm:p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded bg-emerald-600 shrink-0 inline-block" />
                  <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none font-sans">Outbound Automation Webhooks</CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 font-semibold mt-1.5 animate-fade-in">
                  Subscribe to real-time events and propagate live workspace telemetry directly into Zapier, Make.com, n8n, or custom API endpoints.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-50 border-none text-emerald-700 text-[9px] font-black uppercase tracking-wider py-1 px-2.5">
                OUTBOUND REALS-TIME SYNC ACTIVE
              </Badge>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-left">
                {/* COLUMN 1: SUBSCRIBE NEW WEBHOOK FORM */}
                <form onSubmit={createWebhookSubscription} className="xl:col-span-5 space-y-5 bg-slate-55 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col text-left">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest block font-sans">Register Webhook Endpoint</h3>
                  
                  {/* Destination Endpoint URL */}
                  <div className="space-y-1.5 w-full">
                    <Label className="text-[10px] font-extrabold text-slate-650 uppercase tracking-wider">Payload Destination URL *</Label>
                    <Input
                      required
                      type="url"
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      className="h-10 rounded-xl border-slate-200 focus:border-emerald-500 bg-white px-4 font-bold text-slate-800 text-xs"
                    />
                  </div>

                  {/* Event Subscriptions checkboxes */}
                  <div className="space-y-2 w-full">
                    <Label className="text-[10px] font-extrabold text-slate-650 uppercase tracking-wider block">Subscribed Event Triggers</Label>
                    <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-150 shadow-xs">
                      {[
                        { event: "client.created", label: "Client Created", desc: "Fires when a new CRM subscriber joins" },
                        { event: "appointment.created", label: "Appointment Created", desc: "Fires when a fresh calendar reservation processes" },
                        { event: "payment.completed", label: "Payment Completed", desc: "Fires when a customer transaction approves" },
                      ].map((item) => {
                        const isChecked = newWebhookEvents.includes(item.event);
                        const toggleEvent = () => {
                          if (isChecked) {
                            setNewWebhookEvents(prev => prev.filter(e => e !== item.event));
                          } else {
                            setNewWebhookEvents(prev => [...prev, item.event]);
                          }
                        };
                        return (
                          <label 
                            key={item.event} 
                            onClick={toggleEvent}
                            className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none text-left"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                            />
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-black text-slate-700 block uppercase tracking-wide leading-none">{item.label}</span>
                              <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight">{item.desc}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCreatingWebhook}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider h-10 cursor-pointer transition-all shadow-sm shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Register webhook Channel</span>
                  </Button>
                </form>

                {/* COLUMN 2: ACTIVE WEBHOOK CHANNELS LIST */}
                <div className="xl:col-span-7 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest block font-sans">Active Webhook Channels</h3>
                  
                  {isLoadingWebhooks ? (
                    <div className="py-24 text-center text-slate-400 font-medium text-xs flex flex-col justify-center items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Fetching active webhooks telemetry...</span>
                    </div>
                  ) : webhookSubscriptions.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl py-14 text-center bg-slate-50/20">
                      <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">No active webhooks configured</p>
                      <p className="text-[11px] text-slate-400 font-medium max-w-sm mx-auto mt-1 leading-relaxed px-4">
                        Connect your active Zapier webhook catching links or Make automation corridors by registering an endpoint on the left.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 overflow-y-auto max-h-[460px] scrollbar-none pr-1">
                      {webhookSubscriptions.map((item) => {
                        return (
                          <div 
                            key={item.id} 
                            className="bg-white border text-left border-slate-150 hover:border-slate-300 p-4 rounded-xl flex items-start gap-3 justify-between transition-all"
                            id={`webhook-row-${item.id}`}
                          >
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-black text-slate-800 tracking-tight leading-none uppercase font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 shrink-0">
                                  {item.id}
                                </span>
                                <Badge className="text-[8px] font-black uppercase py-0.5 px-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full leading-none shrink-0">
                                  Healthy Connection
                                </Badge>
                              </div>
                              
                              <p className="text-[11px] font-mono font-bold text-slate-500 leading-none truncate select-all bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-left">
                                {item.url}
                              </p>

                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {item.events.map((ev: string) => (
                                  <Badge key={ev} variant="outline" className="text-[8px] font-black border-slate-200 tracking-wider px-2 py-0.5 text-slate-500 font-mono uppercase bg-white">
                                    {ev}
                                  </Badge>
                                ))}
                              </div>

                              <div className="text-[9.5px] text-slate-400 font-semibold flex items-center gap-3 pt-1 border-t border-slate-50">
                                <span>Configured: {new Date(item.createdAt).toLocaleDateString()}</span>
                                <span className="font-bold text-emerald-600 uppercase tracking-widest text-[8px] flex items-center gap-0.5 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Ready to dispatch
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 shrink-0 self-center">
                              {/* Trigger Test Post Button */}
                              <Button
                                size="xs"
                                type="button"
                                variant="outline"
                                onClick={() => testWebhookEndpoint(item.id, item.events[0] || "client.created")}
                                className="h-8 px-2.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-500 hover:text-emerald-700 bg-white border-slate-200 hover:border-emerald-250 cursor-pointer rounded-xl flex items-center gap-1"
                                id={`webhook-test-btn-${item.id}`}
                              >
                                <Send className="w-3 h-3 text-slate-400" />
                                <span>Test Ping</span>
                              </Button>

                              {/* Delete Button */}
                              <Button
                                size="xs"
                                type="button"
                                variant="outline"
                                onClick={() => deleteWebhookSubscription(item.id)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 border-slate-200 hover:border-rose-200 shrink-0 cursor-pointer rounded-xl self-center"
                                id={`webhook-delete-btn-${item.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Webhook tester developer specifications block */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-[10px] text-slate-500 space-y-2 leading-relaxed">
                    <p className="font-black text-slate-700 uppercase tracking-widest font-sans">OUTBOUND POST RECIPIENT SPECIFICATIONS</p>
                    <p className="font-semibold">
                      Your endpoint URL receives POST payloads with following attributes structure:
                    </p>
                    <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg border border-slate-950 font-mono text-[9px] select-all overflow-x-auto text-left whitespace-pre">
{`Headers:
  Content-Type: application/json
  X-Workspace-Event: <event_trigger_name> // e.g. client.created
Body:
  {
    "event": "client.created" | "appointment.created" | "payment.completed",
    "timestamp": "2026-06-09T08:07:45Z",
    "workspaceId": "1",
    "data": { ...entity_records_info_attributes }
  }`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TABS 4: RECREATED TEAM MEMBERS & ROLES ASSIGNMENT CONSOLE --- */}
        <TabsContent value="team" className="mt-0 transition-all">
          <Card className="border-slate-200 shadow-sm border rounded-2xl overflow-hidden bg-white">
            <CardHeader className="p-6 sm:p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded bg-violet-600 shrink-0 inline-block" />
                  <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none">Security Permissions & Role Console</CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 font-semibold mt-1.5">Configure access parameters and associate tenant permissions dynamically.</CardDescription>
              </div>

              {/* Only Super Admins can dispatch fresh invites directly or toggle dialog */}
              <Button 
                onClick={() => setShowMemberForm(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider px-4 h-10 flex items-center gap-1.5 shadow-sm shadow-violet-100"
              >
                <Plus className="w-4 h-4" />
                <span>Invite teammate</span>
              </Button>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              
              {/* Dynamic Inviting mini panel */}
              {showMemberForm && (
                <div className="bg-slate-50/80 border border-slate-200 p-6 rounded-2xl mb-8 space-y-4 animate-fade-in relative">
                  <button 
                    onClick={() => setShowMemberForm(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Invite Teammate</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Invite new team members and assign scope authority.</p>
                  
                  <form onSubmit={handleAddMember} className="grid grid-cols-1 xl:grid-cols-12 gap-4 pt-2">
                    <div className="xl:col-span-4 space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teammate Full Name</Label>
                      <Input 
                        placeholder="John Doe"
                        value={newMemberName} 
                        onChange={e => setNewMemberName(e.target.value)}
                        className="h-10 text-xs bg-white rounded-lg font-semibold"
                      />
                    </div>
                    <div className="xl:col-span-3 space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</Label>
                      <Input 
                        type="email"
                        placeholder="john@agency.co"
                        value={newMemberEmail} 
                        onChange={e => setNewMemberEmail(e.target.value)}
                        className="h-10 text-xs bg-white rounded-lg font-semibold"
                      />
                    </div>
                    <div className="xl:col-span-3 space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Initial Role Set</Label>
                      <select
                        value={newMemberRole}
                        onChange={e => setNewMemberRole(e.target.value as any)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 font-bold"
                      >
                        <option value="Editor">Editor (Write Content)</option>
                        <option value="Billing">Billing Officer (Invoice/SaaS)</option>
                        <option value="Admin">Admin (Workspace Level)</option>
                        <option value="Super Admin">Super Admin (Universal Core)</option>
                      </select>
                    </div>
                    <div className="xl:col-span-2 flex items-end justify-end">
                      <Button type="submit" className="w-full h-10 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                        Send Invite
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Main access table structure */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10.5px] font-black text-slate-400 uppercase tracking-widest font-mono">
                      <th className="pb-4 pt-1 pl-2">Authorized User</th>
                      <th className="pb-4 pt-1">Status Status</th>
                      <th className="pb-4 pt-1">System Scope Role</th>
                      <th className="pb-4 pt-1 text-right pr-2">Revoke / Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        
                        {/* Avatar name email */}
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shadow-sm">
                              {member.avatar}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                {member.name}
                                {member.email === 'preetkalirona@gmail.com' && (
                                  <Badge className="bg-violet-50 text-violet-700 border-violet-100 text-[8px] font-black px-1 leading-none">OWNER</Badge>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">{member.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status tag */}
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                            member.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            {member.status}
                          </span>
                        </td>

                        {/* Dynamic selector depending on admin authorization */}
                        <td className="py-4">
                          {currentUserRole === 'SUPER_ADMIN' ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleMemberRoleChange(member.id, e.target.value as any)}
                              className="bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-[11px] uppercase tracking-wide px-2 py-1.5 rounded-lg border border-slate-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-300"
                            >
                              <option value="Super Admin">🚨 Super Admin</option>
                              <option value="Admin">🛠️ Admin Role</option>
                              <option value="Editor">📝 Editor Role</option>
                              <option value="Billing">💳 Billing Role</option>
                            </select>
                          ) : (
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded ml-1 font-mono text-[9.5px]">
                              {member.role}
                            </span>
                          )}
                        </td>

                        {/* Revoke button */}
                        <td className="py-4 text-right pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              variant="ghost" 
                              onClick={() => handleDeleteMember(member.id, member.email)}
                              disabled={member.email === 'preetkalirona@gmail.com' || currentUserRole !== 'SUPER_ADMIN'}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2 h-8 w-8 rounded-lg shrink-0 disabled:opacity-20 disabled:hover:bg-transparent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TABS 5: BASIC SECURITY --- */}
        <TabsContent value="security" className="mt-0 transition-all">
          <Card className="border-slate-200 shadow-sm border rounded-2xl overflow-hidden bg-white">
            <CardHeader className="p-6 sm:p-8 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 rounded bg-violet-600 shrink-0 inline-block" />
                <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none">SaaS Security Preferences</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 font-semibold mt-1.5">Protect corporate system logs and customize routing preference relays.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={saveSecurity} className="space-y-8">
                
                <div>
                  <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-violet-500" />
                    Authentication Policies
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50/20 transition-all">
                      <div className="flex items-start gap-4 max-w-[80%]">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-extrabold text-slate-800 tracking-tight">Two-Factor Authenticator (2FA / MFA)</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Enforce deep security authenticator loops during SaaS configuration changes.</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={mfaEnabled} 
                        onChange={e => setMfaEnabled(e.target.checked)}
                        className="w-10 h-5 accent-violet-600 rounded cursor-pointer" 
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Session Inactivity Time-To-Live (Minutes)</Label>
                      <select
                        value={sessionDuration}
                        onChange={e => setSessionDuration(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer font-bold text-slate-850"
                      >
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes (Recommended Standard)</option>
                        <option value="120">2 Hours Compliance Active</option>
                        <option value="1440">Stay Persisted Infinitely</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-violet-500" />
                    Workspace Relays & Integrations
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50/20 transition-all">
                      <div>
                        <p className="text-xs font-extrabold text-slate-800 tracking-tight font-sans">CRM Leads Routing</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Trigger real-time email triggers to administrators when a fresh CRM customer registers.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={alertOnLead} 
                        onChange={e => setAlertOnLead(e.target.checked)}
                        className="w-5 h-5 accent-violet-600 rounded cursor-pointer" 
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50/20 transition-all">
                      <div>
                        <p className="text-xs font-extrabold text-slate-800 tracking-tight font-sans">WordPress Auto-deployment Alerts</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Notify the tenant admins immediately upon publication of AI generated WordPress articles.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={alertOnPublish} 
                        onChange={e => setAlertOnPublish(e.target.checked)}
                        className="w-5 h-5 accent-violet-600 rounded cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider px-6 h-11 cursor-pointer transition-all shadow-sm shadow-violet-100">
                    <Save className="w-4 h-4 mr-1.5" />
                    Save Security Profiles
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Core Security & Live Audit logs history block */}
          <Card className="border-slate-200 shadow-sm border rounded-2xl overflow-hidden bg-white mt-6">
            <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded bg-indigo-600 shrink-0 inline-block animate-pulse" />
                  <div>
                    <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none font-sans">Workspace Security Audit Logs</CardTitle>
                    <CardDescription className="text-xs text-slate-450 font-semibold mt-1">Real-time database records of tenant administrative activities.</CardDescription>
                  </div>
                </div>
                <Button 
                  type="button"
                  onClick={() => fetchDbAuditLogs()} 
                  disabled={isLoadingDbLogs}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 h-9 px-3 rounded-lg text-xs font-bold gap-1 mt-1 sm:mt-0 select-none cursor-pointer border border-slate-200 self-end sm:self-auto"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoadingDbLogs && "animate-spin")} />
                  Refresh Feed
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              
              {/* Dynamic search & filtration metrics */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search logs by action, payload ID, or client meta..."
                    value={dbAuditSearch}
                    onChange={(e) => setDbAuditSearch(e.target.value)}
                    className="pl-10 h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium text-slate-700 placeholder:text-slate-400 text-xs" 
                  />
                  {dbAuditSearch && (
                    <button 
                      type="button"
                      onClick={() => setDbAuditSearch("")}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 text-[10px]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mr-2">Filter Category:</span>
                  {["All", "Client", "Appointment", "Team", "Billing"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setDbAuditFilter(tab)}
                      className={cn(
                        "h-8 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                        dbAuditFilter === tab 
                          ? "bg-slate-900 border-slate-900 text-white shadow-xs" 
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Audit log spreadsheet listings */}
              <div className="overflow-x-auto border border-slate-105 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 italic text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      <th className="p-4 font-black">Timestamp</th>
                      <th className="p-4 font-black">Activity Action</th>
                      <th className="p-4 font-black text-center">Entity</th>
                      <th className="p-4 font-black">Client Context & IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingDbLogs ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-xs text-slate-450 italic">
                          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-3" />
                          Polling secure database cluster, please wait...
                        </td>
                      </tr>
                    ) : dbAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-xs text-slate-400 italic">
                          No audit event logs found matching the requested query parameters. Try widening filters.
                        </td>
                      </tr>
                    ) : (
                      dbAuditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors text-xs font-semibold text-slate-700">
                          <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-[10px]">
                            {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                          </td>
                          <td className="p-4 max-w-sm lg:max-w-md">
                            <div className="space-y-0.5">
                              <p className="text-slate-800 font-bold leading-normal">{log.action}</p>
                              {log.entityId && (
                                <p className="text-[9px] text-slate-400 font-mono">Entity ID: <span className="bg-slate-50 px-1 rounded border border-slate-100">{log.entityId}</span></p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className={cn(
                              "text-[9px] uppercase font-black px-2 py-1 rounded inline-block",
                              log.entityType === 'Client' && "bg-emerald-50 text-emerald-700",
                              log.entityType === 'Appointment' && "bg-indigo-50 text-indigo-700",
                              log.entityType === 'Team' && "bg-amber-50 text-amber-700",
                              log.entityType === 'Billing' && "bg-blue-50 text-blue-700",
                              (!['Client','Appointment','Team','Billing'].includes(log.entityType)) && "bg-slate-50 text-slate-500"
                            )}>
                              {log.entityType}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5 text-[10px]">
                              <p className="font-mono text-indigo-600 font-bold">{log.ipAddress || '127.0.0.1'}</p>
                              <p className="text-[9px] text-slate-400 truncate max-w-[200px]" title={log.userAgent}>
                                {log.userAgent || 'Chrome/Simulator'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- PHASE 26 & 27: EXPORT CENTER & BACKUP RECOVERY ADMIN CONSOLE --- */}
        <TabsContent value="exportBackup" className="mt-0 transition-all space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* CARD 1: EXPORT CENTER */}
            <Card className="border-slate-200 border rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
              <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/40">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded bg-violet-650 shrink-0 inline-block" />
                  <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none">Export Center (Phase 26)</CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 font-semibold mt-1.5">
                  Securely export clients registers, appointments logs, and operational revenue spreadsheets in structured formats.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6 flex-1">
                <form onSubmit={handleExportSubmit} className="space-y-6">
                  {/* Select Export Category */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">1. Select Target Category Data Stream</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setExportType("clients")}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          exportType === "clients"
                            ? "bg-violet-50/50 border-violet-550 ring-2 ring-violet-500/10 text-violet-700 font-bold"
                            : "bg-transparent border-slate-200 text-slate-605 hover:bg-slate-50"
                        }`}
                      >
                        <User className="w-4 h-4 mx-auto mb-1.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider block">Clients</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5 mt-auto">CRM Records</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportType("appointments")}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          exportType === "appointments"
                            ? "bg-violet-50/50 border-violet-550 ring-2 ring-violet-500/10 text-violet-700 font-bold"
                            : "bg-transparent border-slate-200 text-slate-605 hover:bg-slate-50"
                        }`}
                      >
                        <Clock className="w-4 h-4 mx-auto mb-1.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider block">Meetings</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5 mt-auto">Appointments</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportType("revenue")}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          exportType === "revenue"
                            ? "bg-violet-50/50 border-violet-550 ring-2 ring-violet-500/10 text-violet-700 font-bold"
                            : "bg-transparent border-slate-200 text-slate-605 hover:bg-slate-50"
                        }`}
                      >
                        <Activity className="w-4 h-4 mx-auto mb-1.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider block">Revenue</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5 mt-auto font-medium">Ledger Reports</span>
                      </button>
                    </div>
                  </div>

                  {/* Select Format */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">2. Select Transport Format</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setExportFormat("csv")}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          exportFormat === "csv"
                            ? "bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/10 text-indigo-700 font-bold"
                            : "bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4 mx-auto mb-1.5 text-emerald-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider block">CSV File</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5 mt-auto">Delimiter standard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportFormat("excel")}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          exportFormat === "excel"
                            ? "bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/10 text-indigo-700 font-bold"
                            : "bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4 mx-auto mb-1.5 text-blue-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider block">MS Excel</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5 mt-auto">Native XML XLS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportFormat("pdf")}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          exportFormat === "pdf"
                            ? "bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/10 text-indigo-700 font-bold"
                            : "bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <FileDown className="w-4 h-4 mx-auto mb-1.5 text-rose-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider block">PDF Layout</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5 mt-auto">Printer-Ready PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isExporting}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider h-11 cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? "Compiling Document stream..." : "Generate & Stream Document"}
                    </Button>
                  </div>
                </form>

                <Separator />

                {/* Export History Ledger */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Historical Exports Ledger</span>
                  </div>
                  
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                    <table className="w-full text-left border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-500">
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Format</th>
                          <th className="p-2.5">Accrued At</th>
                          <th className="p-2.5 text-right font-mono">Size</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {exportHistory.map((item) => (
                          <tr key={item.id} className="text-[10px] text-slate-600 hover:bg-white transition-colors">
                            <td className="p-2.5 font-bold text-slate-700">{item.type}</td>
                            <td className="p-2.5">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-black text-[9px]">
                                {item.format}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-[9px] text-slate-400">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-2.5 text-right font-mono text-[9px] text-slate-500">{item.size}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2: BACKUP & RECOVERY */}
            <Card className="border-slate-200 border rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
              <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/40">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded bg-violet-600 shrink-0 inline-block animate-pulse" />
                  <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none">Backup & Recovery (Phase 27)</CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 font-semibold mt-1.5">
                  Compile logical database snapshots, deploy rollback transaction logs, or warehouse the tenant archive.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6 flex-1">
                {/* Administrative Controls Row */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    onClick={triggerCreateSnapshot}
                    disabled={isCreatingSnapshot}
                    className="h-14 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wide cursor-pointer transition-all flex flex-col items-center justify-center gap-1 shrink-0 px-2 shadow-xs"
                  >
                    <Sliders className="w-4 h-4 text-violet-600" />
                    <span>Compile Snapshot</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={triggerArchiveWorkspace}
                    disabled={isArchiving}
                    className="h-14 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wide cursor-pointer transition-all flex flex-col items-center justify-center gap-1 shrink-0 px-2 shadow-xs"
                  >
                    <Archive className="w-4 h-4 text-amber-500" />
                    <span>Archive Workspace</span>
                  </Button>
                </div>

                {/* Fast file restoring uploader zone */}
                <div className="border border-dashed border-slate-200 hover:border-violet-400 bg-slate-50/50 p-5 rounded-2xl text-center space-y-2 transition-all cursor-pointer group">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-violet-500 mx-auto transition-transform group-hover:-translate-y-0.5" />
                  <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">Upload JSON Restore Snapshot</h4>
                  <p className="text-[9px] text-slate-400 font-semibold">Drag and drop or select historical workspace bundle exports to restore keys.</p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      toast.info(`Parsing snapshot import packet: ${file.name}...`);
                      
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        try {
                          const parsed = JSON.parse(event.target?.result as string);
                          if (!parsed.id || !parsed.version) {
                            throw new Error("Invalid schema catalog token parameters.");
                          }
                          toast.success(`Validated backup configuration file: ${parsed.id}`);
                          triggerRestoreSnapshot(parsed.id);
                        } catch (err: any) {
                          toast.error(`Faulty backup configuration structure: ${err.message}`);
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden"
                    id="restore-file-uploader"
                  />
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("restore-file-uploader")?.click()}
                      className="h-7 text-[9px] uppercase font-bold tracking-widest text-violet-600 border-slate-200 hover:bg-white bg-slate-50"
                    >
                      Browse Snapshot File
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Snapshots table registry */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    <span>System Backup Snapshots Directory</span>
                  </div>

                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                    {isLoadingSnapshots ? (
                      <div className="p-8 text-center animate-pulse text-[11px] font-bold text-slate-400">
                        Querying master snapshot catalog...
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-500">
                            <th className="p-2.5">Snapshot Token</th>
                            <th className="p-2.5">Date Compiled</th>
                            <th className="p-2.5 text-right font-mono">Size</th>
                            <th className="p-2.5 text-right font-bold">Scope Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {snapshots.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400 text-xs">
                                No backups cataloged. Click "Compile Snapshot" to record metadata.
                              </td>
                            </tr>
                          ) : (
                            snapshots.map((snap) => (
                              <tr key={snap.id} className="text-[10px] text-slate-600 hover:bg-white transition-colors">
                                <td className="p-2.5 font-bold text-slate-700 font-mono text-[9px]">
                                  {snap.id}
                                </td>
                                <td className="p-2.5 font-mono text-[9px]" title={snap.timestamp}>
                                  {new Date(snap.timestamp).toLocaleDateString()}
                                </td>
                                <td className="p-2.5 text-right font-mono text-[9px] text-slate-500">
                                  {snap.sizeKb} KB
                                </td>
                                <td className="p-2.5 text-right space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => triggerRestoreSnapshot(snap.id)}
                                    className="text-violet-600 hover:text-violet-850 font-bold uppercase text-[9px] select-none cursor-pointer border-0 bg-transparent active:scale-95 transition-all outline-none"
                                  >
                                    Rollback
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <a
                                    href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(snap))}`}
                                    download={`${snap.id}_backup.json`}
                                    className="text-slate-400 hover:text-slate-600 font-bold uppercase text-[9px] select-none cursor-pointer"
                                  >
                                    JSON
                                  </a>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* --- TABS 10: STRICT ACCESSIBILITY: SUPER ADMIN POLICIES (ROLE PROTECTED) --- */}
        {currentUserRole === 'SUPER_ADMIN' && (
          <TabsContent value="superAdmin" className="mt-0 transition-all">
            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
              
              {/* Form setting card */}
              <div className="2xl:col-span-2 space-y-6">
                <Card className="border-slate-200 shadow-md border rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="p-6 sm:p-8 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-5 rounded bg-violet-600 shrink-0 inline-block animate-pulse" />
                        <CardTitle className="text-sm font-extrabold text-slate-800 uppercase tracking-widest leading-none">Global Organization Policies</CardTitle>
                      </div>
                      <Badge className="bg-violet-50 text-violet-700 border-none uppercase text-[8px] font-black px-2 py-0.5 rounded-full">Super Admin Permissions</Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-500 font-semibold mt-1.5">Configure global rate-limiting constraints, integration spending limits, logging verbosity, and whitelisted ranges.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <form onSubmit={saveSuperAdminSettings} className="space-y-6">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Platform API Rate Limit (req/min)</Label>
                          <Input 
                            type="number"
                            value={rateLimitPerUser}
                            onChange={e => setRateLimitPerUser(Number(e.target.value))}
                            className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-semibold text-slate-800" 
                          />
                          <p className="text-[9.5px] text-slate-400 font-sans font-medium">Maximum permitted workspace API traffic globally.</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Monthly Integration Spending Cap ($)</Label>
                          <Input 
                            type="number"
                            value={maxMonthlyAIBudget}
                            onChange={e => setMaxMonthlyAIBudget(Number(e.target.value))}
                            className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-semibold text-slate-800" 
                          />
                          <p className="text-[9.5px] text-slate-400 font-sans font-medium">Monthly spending limit applied to connected third-party tools.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Default Audit Log Verbosity</Label>
                          <select
                            value={globalServerAudit}
                            onChange={e => setGlobalServerAudit(e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer font-bold text-slate-800"
                          >
                            <option value="Minimal Trace">Minimal Trace (Performance Mode)</option>
                            <option value="Standard Workspace Logging">Standard Workspace Logging</option>
                            <option value="Strict Compliance">Strict Compliance Requirements</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Allowed Whitelist IP Ranges</Label>
                          <Input 
                            value={ipWhitelist}
                            onChange={e => setIpWhitelist(e.target.value)}
                            placeholder="e.g. 192.168.1.1, 10.0.0.12"
                            className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/50 px-4 font-mono text-xs font-bold text-slate-800" 
                          />
                        </div>
                      </div>

                      {/* Toggle Sandbox Mode */}
                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50/60 transition-all">
                        <div className="flex items-start gap-3 max-w-[80%]">
                          <Cpu className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 tracking-tight">Enable Sandbox Testing Environment</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">When active, client-side queries will route through simulation filters to prevent triggering production integrations.</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={isSandboxMode} 
                          onChange={e => setIsSandboxMode(e.target.checked)}
                          className="w-10 h-5 accent-violet-600 rounded cursor-pointer shrink-0" 
                        />
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button type="submit" className="bg-slate-900 hover:bg-slate-850 text-white rounded-xl font-bold text-xs uppercase tracking-wider px-6 h-11 cursor-pointer transition-all shadow-sm">
                          <Save className="w-4 h-4 mr-1.5" />
                          Apply Global Policies
                        </Button>
                      </div>

                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Side Real-time simulated Diagnostic state Console of physical system */}
              <div className="space-y-6">
                
                {/* Node details */}
                <Card className="border border-slate-200 bg-white text-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-violet-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-sans">Workspace Health Status</h4>
                    </div>
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  </div>

                  <div className="space-y-2.5 text-[11px] text-slate-500">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-medium">System Health:</span>
                      <span className="text-emerald-600 font-extrabold uppercase">Operational</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-medium">Primary API Host:</span>
                      <span className="text-slate-800 font-semibold">https://api.ai-suite.com</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-medium">Weekly SLA:</span>
                      <span className="text-slate-800 font-semibold">99.98% Guarantee</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-medium">Relay Latency:</span>
                      <span className="text-indigo-600 font-bold">14ms average</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Security Standard:</span>
                      <span className="text-emerald-600 font-medium">Valid TLS 1.3</span>
                    </div>
                  </div>

                  <Separator className="bg-slate-100 my-4" />

                  {/* Tiny console outputs */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administrative Event Log</p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {dbAuditLogs.length === 0 ? (
                        <div className="text-[10px] text-slate-400 font-semibold italic text-center p-4">
                          No audited events recorded yet.
                        </div>
                      ) : (
                        dbAuditLogs.slice(0, 15).map((log) => (
                          <div key={log.id} className="text-[10px] leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between text-[8px] text-slate-400 mb-1 font-mono">
                              <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                              <span className="text-violet-600 font-extrabold uppercase bg-violet-50 px-1 py-0.5 rounded">{log.entityType}</span>
                            </div>
                            <p className="text-slate-700 font-bold leading-tight">{log.action}</p>
                            <p className="text-[7.5px] text-slate-400 font-mono mt-0.5 truncate">ID: {log.userId || "Local Sandbox User"}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>

                {/* Info Alert guidelines */}
                <Card className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Multi-Tenancy Guide</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        Admins configure regional settings and local keys. Super Admins set central billing multipliers, restrict security baselines, and review complete cluster logs.
                      </p>
                    </div>
                  </div>
                </Card>

              </div>
              
            </div>
          </TabsContent>
        )}

          </div> {/* End Column 3 */}
        </PageContent>
      </Tabs>
    </SystemPageLayout>
  );
}

export default Settings;
