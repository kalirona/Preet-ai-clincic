import React from 'react';
import { getActivePlanLimits, getCurrentUsage } from '@/utils/limits';
import { SystemPageLayout, PageHeader, PageContent } from '@/components/layout/SystemPageLayout';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Wand2, 
  Copy, 
  CheckSquare,
  Loader2,
  MessageSquare,
  Mail,
  ClipboardList,
  GraduationCap,
  Home
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { aiService } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function AITools() {
  const [prompt, setPrompt] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [selectedTool, setSelectedTool] = React.useState('sms');

  // Load Workspace AI Assistant Memory context
  const [memoryBusiness, setMemoryBusiness] = React.useState(() => localStorage.getItem('settings_ai_memory_businessName') || 'Preet AI Suite Studio');
  const [memoryTone, setMemoryTone] = React.useState(() => localStorage.getItem('settings_ai_memory_tone') || 'Professional');
  const [memoryServices, setMemoryServices] = React.useState(() => localStorage.getItem('settings_ai_memory_services') || 'AI consulting, custom web design, SEO optimization, and workflow automation');
  const [memoryFAQs, setMemoryFAQs] = React.useState(() => localStorage.getItem('settings_ai_memory_faqs') || '');

  // Keep state active if updated in background:
  React.useEffect(() => {
    const bName = localStorage.getItem('settings_ai_memory_businessName') || 'Preet AI Suite Studio';
    const bTone = localStorage.getItem('settings_ai_memory_tone') || 'Professional';
    const bServices = localStorage.getItem('settings_ai_memory_services') || 'AI consulting, custom web design, SEO optimization, and workflow automation';
    const bFaqs = localStorage.getItem('settings_ai_memory_faqs') || '';
    
    setMemoryBusiness(bName);
    setMemoryTone(bTone);
    setMemoryServices(bServices);
    setMemoryFAQs(bFaqs);
  }, []);

  const tools = [
    { 
      id: 'sms', 
      name: 'SMS Reminders', 
      icon: MessageSquare, 
      desc: 'Short, elegant text reminder copy.',
      placeholder: 'e.g. Client: Sophia Chen, Appointment: June 15 at 11:00 AM for SEO consultation, outstanding fee: $150',
      instruction: 'Write a concise, high-converting professional SMS reminder based on these details. Include clear placeholders, call-to-actions, and keep it under 160 characters if possible. Keep it polite.'
    },
    { 
      id: 'followup', 
      name: 'Follow-Up Emails', 
      icon: Mail, 
      desc: 'Engaging email template targeting inactive leads.',
      placeholder: 'e.g. Client: Alex Rivera, Service: Web Design integration, last contact: 2 weeks ago',
      instruction: 'Write a warm, non-pushy follow-up email sequence targeting inactive leads or prospect CRM files. Include an elegant subject line option.'
    },
    { 
      id: 'confirmation', 
      name: 'Appointment Confirmations', 
      icon: CheckSquare, 
      desc: 'Verify slot bookings and virtual meetings.',
      placeholder: 'e.g. Client: David Kim, Service: API Support consultation, June 10 at 4:30 PM, Host link: zoom.us/j/123',
      instruction: 'Write a friendly, structured confirmation email template including time slots, virtual location access links, and preparation instructions.'
    },
    { 
      id: 'treatment', 
      name: 'Treatment Instructions', 
      icon: ClipboardList, 
      desc: 'Aftercare advise, checklists and routines.',
      placeholder: 'e.g. Patient: Sarah Chen, Focus: SEO Cognitive structure, action notes: fix canonical tags, audit organic crawling errors',
      instruction: 'Write professional, structured aftercare advice, treatment guidelines, or step-by-step professional instructions. Frame it clearly with bulleted items.'
    },
    { 
      id: 'coaching', 
      name: 'Coaching Recap Emails', 
      icon: GraduationCap, 
      desc: 'Goal summaries and milestone checklists.',
      placeholder: 'e.g. Client: Marcus Thorne, Session: Contract negotiation strategy, next milestones: secure partner signatures, finalize pricing metrics',
      instruction: 'Write an inspiring and structured Coaching Recap Email. Outline main highlights, clear action items for next week, and supportive motivating feedback.'
    },
    { 
      id: 'realestate', 
      name: 'Real Estate Buyer Follow-Ups', 
      icon: Home, 
      desc: 'Nurture home-buyers and tour bookings.',
      placeholder: 'e.g. Buyer: Elena Rodriguez, Interest: 3-bedroom flat on Bloom St, budget: $800k, criteria: garden/balcony',
      instruction: 'Write a personalized, compelling real estate buyer follow-up email. Suggest specific touring hours, highlight property features, and build trust-based momentum.'
    },
  ];

  const currentTool = tools.find(t => t.id === selectedTool) || tools[0];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please input details for the generator to parse.');
      return;
    }

    // Plan limits quota check
    const planLimits = getActivePlanLimits();
    const usage = getCurrentUsage();
    if (usage.aiCredits >= planLimits.aiCredits) {
      toast.error('Subscription Quota Limit Exhausted', {
        description: `Your active ${planLimits.name} tier limits you to ${planLimits.aiCredits} AI generations. Please upgrade your settings inside the active Billing Tab to unlock additional credits.`
      });
      return;
    }

    setLoading(true);

    const memoryContextPrompt = `You MUST write and tailor all generated copywriter outputs strictly for this active business/company workspace:
- Business/Company Name: "${memoryBusiness}"
- Writing Tone/Persona of Voice: "${memoryTone}". You MUST strictly adhere to this tone, including choice of vocabulary, styling, depth, and pacing.
- Core Services/Offerings Offered: "${memoryServices}"
${memoryFAQs.trim() ? `- Frequently Asked Questions & Corporate Knowledge Base:\n${memoryFAQs}` : ''}`;
    
    const systemInstruction = `You are a high-fidelity communications assistant. ${currentTool.instruction} Provide the copy formatted using elegant Markdown structure. Always output alternative options or fields clearly. Do not speak about yourself as an AI, start directly with the copy outputs.

ADDITIONAL SYSTEM BUSINESS CONTEXT FOR CALIBRATION:
The user is working within a calibrated business tenant. You MUST ground your guidelines and company context around this Assistant Memory context:
${memoryContextPrompt}`;
    
    const res = await aiService.complete({
      provider: 'gemini',
      prompt: prompt,
      systemInstruction
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      setResult(res.text);
      // Increment used credits
      const currentCredits = parseInt(localStorage.getItem('preet_ai_credits_used') || '0', 10);
      localStorage.setItem('preet_ai_credits_used', (currentCredits + 1).toString());
      toast.success("Professional communication copy generated successfully!");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  return (
    <SystemPageLayout>
      <PageHeader 
        category="AI assistant Engine (Gemini)"
        title="Preet AI Copywriting Assistant"
        description="Instantly compose custom client messaging, confirmations, therapy guidelines, or real-estate lead workflows."
        version="Generative Copywriter v1.0"
      />
      
      <PageContent>
        {/* Left column: Controls (col-span-12, md:col-span-1, lg:col-span-5) */}
        <div className="col-span-12 md:col-span-1 lg:col-span-5 space-y-6" id="ai-controls-column">
          
          {/* Active Workspace AI Memory Status Card */}
          <Card className="border-violet-200 shadow-3xs bg-gradient-to-br from-violet-50/40 via-white to-indigo-50/20 overflow-hidden relative border" id="active-workspace-ai-memory-card">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-200/10 to-indigo-200/10 rounded-full blur-xl pointer-events-none" />
            <CardHeader className="pb-2.5 pt-4 px-4 sm:px-4 flex flex-row items-center justify-between border-b border-violet-100">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-600"></span>
                </span>
                <CardTitle className="text-[10px] font-black text-violet-700 uppercase tracking-widest leading-none">Active Workspace AI Memory</CardTitle>
              </div>
              <Link 
                to="/settings?tab=aiMemory" 
                className="text-[10px] font-extrabold text-indigo-750 hover:text-indigo-900 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                Configure ↗
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[8.5px] uppercase font-black tracking-widest text-slate-400 block font-sans">Workspace Brand</span>
                  <p className="font-extrabold text-slate-900 leading-tight truncate">{memoryBusiness}</p>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[8.5px] uppercase font-black tracking-widest text-slate-400 block font-sans">Persona Tone</span>
                  <p className="font-extrabold text-violet-700 leading-tight truncate">{memoryTone}</p>
                </div>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-slate-100/60 text-xs">
                <span className="text-[8.5px] uppercase font-black tracking-widest text-slate-400 block font-sans">Calibrated Services</span>
                <p className="text-[10px] text-slate-600 font-semibold line-clamp-2 leading-relaxed">
                  {memoryServices}
                </p>
              </div>

              {memoryFAQs && (
                <div className="space-y-1 pt-1.5 border-t border-slate-100/60 text-xs">
                  <span className="text-[8.5px] uppercase font-black tracking-widest text-slate-400 block font-sans">Loaded FAQ Rules</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-extrabold">
                    <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                    <span>Company Guidelines Integrated ({memoryFAQs.split(/q:/i).length - 1} Q&As)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-3xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Select AI Generator Tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid grid-cols-1 gap-2">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedTool(tool.id);
                      setResult('');
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left group",
                      selectedTool === tool.id 
                        ? "bg-slate-950 border-slate-900 text-white shadow-md shadow-slate-100" 
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                      selectedTool === tool.id 
                        ? "bg-white/10 border-white/20 text-white" 
                        : "bg-slate-50 border-slate-150 text-slate-500 group-hover:text-slate-700"
                    )}>
                      <tool.icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-black tracking-tight">{tool.name}</p>
                      <p className={cn(
                        "text-[10px] truncate-2-lines",
                        selectedTool === tool.id ? "text-slate-400 font-semibold" : "text-slate-400 font-medium"
                      )}>
                        {tool.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentTool.name} Details</label>
                  <span className="text-[9px] text-[#a0aec0] font-black uppercase tracking-wider">Dynamic Fields</span>
                </div>
                <Textarea 
                  placeholder={currentTool.placeholder}
                  className="min-h-[140px] resize-none border-slate-250 bg-slate-50/20 rounded-xl focus:bg-white transition-all p-3.5 font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-[10px] text-slate-450 leading-normal font-medium italic">
                  Provide names, dates, constraints, or unique objectives. The Gemini API model translates these into professional, styled copy.
                </p>
              </div>

              <Button 
                className="w-full bg-slate-950 hover:bg-slate-800 text-white h-11 rounded-xl font-bold text-xs uppercase tracking-wider border-none shadow-sm cursor-pointer shrink-0"
                disabled={loading || !prompt.trim()}
                onClick={handleGenerate}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate professional Copy
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Output (col-span-12, md:col-span-1, lg:col-span-7) */}
        <div className="col-span-12 md:col-span-1 lg:col-span-7">
          <Card className="border-slate-200 shadow-3xs flex flex-col min-h-[635px] bg-white overflow-hidden border">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/30 px-6 py-4 shrink-0">
              <div>
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Document Editor Output</CardTitle>
              </div>
              {result && (
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="text-slate-700 border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-xl h-8 px-3 cursor-pointer">
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  Copy to Clipboard
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0 relative min-h-[500px]">
              {!result && !loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 select-none">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4 shadow-3xs">
                    <Sparkles className="w-7 h-7 text-slate-305" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight mb-1">Editor Ready</h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-[280px] leading-relaxed">
                    Select a target tool from the list, input specific details, and hit Generate to compose copy.
                  </p>
                </div>
              ) : loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-10 backdrop-blur-[1px]">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 text-center"
                  >
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin stroke-[3px]" />
                      <Sparkles className="w-4 h-4 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">Preet AI Prompt Engine</p>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mt-1 animate-pulse">Analyzing inputs & composing content...</p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <ScrollArea className="h-[550px] w-full">
                  <div className="p-6 sm:p-8">
                    <div className="markdown-body">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </SystemPageLayout>
  );
}
