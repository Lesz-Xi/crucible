"use client";

import { useEffect, useState, useRef } from "react";
import { 
  ChatInterface, 
  ExecutionStream, 
  FileTreeItem 
} from "@/components/epistemic-ui";
import { 
  KDenseSession, 
  VirtualFile, 
  ExecutionStep, 
} from "@/lib/epistemic/types";
import { 
   Loader2, Shield, Lightbulb, Building, Microscope, 
   FileText, Layers, Share2, Box, Zap 
} from "lucide-react";
import { StreamEvent, AgentPersona } from "@/lib/streaming-event-emitter";

interface SynthesisAuditViewProps {
  files: File[];
  companies: string[];
  latestEvent?: StreamEvent | null;
  agentPersona?: AgentPersona;
  userPrompt?: string;
}

// --- DARK LANDSCAPE METRICS ---
// Simplified and darker metrics for the new card style

interface ContextSourceMetrics {
  entropy: number;        
  tokenCount: string;    
  vectorDensity: string;  
  status: "live" | "indexing" | "vectorized" | "standby";
  relevance: number;     
}

interface FuturisticFile extends VirtualFile {
  metrics: ContextSourceMetrics;
}

export function SynthesisAuditView({ files, companies, latestEvent, agentPersona, userPrompt }: SynthesisAuditViewProps) {
  const [session, setSession] = useState<KDenseSession | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeAgent, setActiveAgent] = useState<AgentPersona>('creator');
  const [confidenceFactors, setConfidenceFactors] = useState<Record<string, number>>({});
  const simStarted = useRef(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (simStarted.current) return;
    simStarted.current = true;

    const generateMetrics = (name: string, size: number, type: "pdf" | "json"): ContextSourceMetrics => {
      const estTokens = Math.ceil(size / 4);
      const tokenStr = estTokens > 1000 ? `${(estTokens / 1000).toFixed(1)}K` : `${estTokens}`;
      return {
        entropy: Math.random() * 0.5 + 0.5,
        tokenCount: tokenStr,
        vectorDensity: type === "pdf" ? "HIGH" : "SPARSE",
        status: "live", 
        relevance: type === "pdf" ? 90 : 60 
      };
    };

    const virtualFiles: FuturisticFile[] = [
      ...files.map(f => ({
        name: f.name,
        type: "file" as const,
        path: `/contracts/${f.name}`,
        size: f.size,
        content: "[Binary]",
        lastModified: f.lastModified,
        createdAt: f.lastModified,
        metrics: generateMetrics(f.name, f.size, "pdf")
      })),
      ...companies.map(c => ({
        name: `${c}.json`,
        type: "file" as const,
        path: `/market_data/${c}.json`,
        size: 2400, 
        content: JSON.stringify({ company: c }),
        lastModified: Date.now(),
        createdAt: Date.now(),
        metrics: generateMetrics(c, 2400, "json")
      }))
    ];

    const initialPlan: ExecutionStep[] = [
      { id: "1", order: 0, label: "Dialectical Analysis", description: "Extract claims across papers to identify logical contradictions", status: "pending", logs: [], artifacts: [] },
      { id: "2", order: 1, label: "Hypothesis Calibration", description: "Generate novel hypotheses with Bayesian confidence scoring", status: "pending", logs: [], artifacts: [] },
      { id: "3", order: 2, label: "Prior Art Falsification", description: "Query Scholar API to reject ideas that already exist in literature", status: "pending", logs: [], artifacts: [] },
      { id: "4", order: 3, label: "Sovereign Synthesis", description: "Integrate validated concepts into sovereign knowledge artifacts", status: "pending", logs: [], artifacts: [] }
    ];

    const newSession: KDenseSession = {
      id: `synth-${Date.now()}`,
      title: `Hybrid Synthesis - ${new Date().toLocaleDateString()}`,
      status: "initializing_problem",
      messages: [
        {
          id: "msg-0",
          role: "agent",
          content: `Sovereign Mastermind Initialized.\nTarget: Hybrid Synthesis [${files.length} PDFs, ${companies.length} Companies].`,
          timestamp: Date.now()
        }
      ],
      plan: initialPlan,
      currentStepIndex: 0,
      fileSystem: virtualFiles,
      persona: "CriticalRationalist",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setSession(newSession);
  }, [files, companies]);

  // --- EVENT HANDLER ---
  useEffect(() => {
    if (!latestEvent || !session) return;
    const createLog = (msg: string) => ({ id: `log-${Date.now()}-${Math.random()}`, timestamp: Date.now(), message: msg, type: "system" as const });

    const updatePlan = (stepIndex: number, logMsg?: string, statusUpdate?: ExecutionStep['status']) => {
       setSession(prev => {
         if (!prev) return null;
         const plan = [...prev.plan];
         
         if (logMsg) {
            // DEDUPLICATION: Check last 5 logs for same message matches
            const isDuplicate = plan[stepIndex].logs
                .slice(-5)
                .some(log => log.message === logMsg);
                
            if (!isDuplicate) {
                plan[stepIndex].logs.push(createLog(logMsg));
            }
         }
         
         if (statusUpdate) plan[stepIndex].status = statusUpdate;
         return { ...prev, plan, currentStepIndex: stepIndex };
       });
    };

    switch (latestEvent.event) {
      case 'ingestion_start': updatePlan(0, "Stream connected...", "running"); break;
      case 'pdf_processed': updatePlan(0, `Processed: ${latestEvent.filename}`); break;
      case 'pdf_error': updatePlan(0, `Error: ${latestEvent.error}`); break;
      case 'thinking_step': 
        setSession(prev => { 
            if (!prev) return null; 
            const plan = [...prev.plan];
            const currentStepLogs = plan[prev.currentStepIndex].logs;
            
            // DEDUPLICATION for generic thinking steps
            const isDuplicate = currentStepLogs
                .slice(-5)
                .some(log => log.message === latestEvent.content);
                
            if (!isDuplicate) {
                currentStepLogs.push(createLog(latestEvent.content)); 
            }
            return { ...prev, plan }; 
        });
        break;
      case 'phase_transition':
        setSession(prev => {
           if (!prev) return null;
           const plan = [...prev.plan];
           // @ts-ignore - phase_transition has stepIndex
           const targetIndex = latestEvent.stepIndex;
           
           // Mark previous steps as completed
           for(let i=0; i < targetIndex; i++) {
              if (plan[i].status !== 'completed') plan[i].status = 'completed';
           }
           
           // Activate target step
           if (plan[targetIndex].status === 'pending') plan[targetIndex].status = 'running';
           
           return { ...prev, plan, currentStepIndex: targetIndex };
        });
        break;
      case 'hypothesis_generated':
        setSession(prev => {
          if (!prev) return null; 
          let idx = prev.currentStepIndex; 
          if (idx < 1) { 
            prev.plan[0].status = "completed"; 
            prev.plan[1].status = "running"; 
            idx = 1; 
          }
          // DEDUPLICATION: Check if hypothesis already logged by ID or label prefix
          const hypothesisId = latestEvent.hypothesis.id;
          const labelPrefix = latestEvent.hypothesis.label.slice(0, 60);
          const alreadyLogged = prev.plan[idx].logs.some(log => 
            log.message.includes(`[${hypothesisId}]`) || 
            log.message.includes(labelPrefix)
          );
          if (!alreadyLogged) {
            prev.plan[idx].logs.push(createLog(`Hypothesis: ${latestEvent.hypothesis.label}`));
          }
          return { ...prev, currentStepIndex: idx };
        });
        break;
      case 'confidence_update': setConfidenceFactors(prev => ({ ...prev, [latestEvent.factor]: latestEvent.score })); break;
      case 'agent_switch': setActiveAgent(latestEvent.agent); break;
      case 'complete': updatePlan(3, "Synthesis Complete.", "completed"); break;
    }
  }, [latestEvent]);

  if (!session) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-neutral-500" /></div>;

  // --- UNIFIED PANEL LAYOUT ---

  const AuditSection = ({ title, sub, icon: Icon, children, className = "" }: any) => (
    <div className={`flex flex-col h-full ${className}`}>
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-orange-400">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
                <h3 className="text-sm font-bold font-mono text-neutral-200 tracking-wider uppercase">{title}</h3>
                <p className="text-[10px] text-neutral-500 font-medium tracking-wider uppercase">{sub}</p>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 relative group p-0">
            {/* Inner Content Scrollable Area */}
            <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4">
                {children}
            </div>
        </div>
    </div>
  );

  return (
    <div className="w-full">
        {/* Unified Main Container - Cinematic Landscape */}
        <div className="w-full h-[550px] bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col mx-auto">
             
            {/* Top Tactical Line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-50" />

            {/* Internal Grid Layout - Balanced Panoramic 3-Column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                
                {/* SECTION 1: METHODOLOGIST (Left) */}
                <AuditSection 
                    title="Methodologist" 
                    sub="Live Dialectic" 
                    icon={Share2}
                >
                    <div className="h-full flex flex-col">
                        {userPrompt && (
                            <div className="mb-4 p-3 rounded-xl border border-orange-500/20 bg-orange-500/5">
                                <div className="text-[10px] text-orange-400 font-bold tracking-wider mb-1 uppercase flex items-center gap-2">
                                    <Zap className="w-3 h-3" />
                                    Research Directive
                                </div>
                                <p className="text-sm text-orange-100/90 font-mono leading-relaxed">
                                    {userPrompt}
                                </p>
                            </div>
                        )}
                        <div className="flex-1 -mx-2">
                            <ChatInterface 
                                messages={session.messages} 
                                onSendMessage={() => {}} 
                                isTyping={false} 
                            />
                        </div>
                    </div>
                </AuditSection>

                {/* SECTION 2: EXECUTION STREAM (Center) */}
                <AuditSection 
                    title="Sovereign Synthesis" 
                    sub="Epistemic Audit Protocol" 
                    icon={Layers}
                    className="bg-white/[0.01]" // Subtle highlighting for center panel
                >
                    <div className="h-full pr-1">
                        <ExecutionStream plan={session.plan} currentStepIndex={session.currentStepIndex} />
                    </div>
                </AuditSection>

                {/* SECTION 3: KNOWLEDGE (Right) */}
                <AuditSection 
                    title="Knowledge Matrix" 
                    sub={`${session.fileSystem.length} Tensors Active`} 
                    icon={Box}
                >
                     <div className="space-y-4 pr-1">
                        {(session.fileSystem as FuturisticFile[]).map((file) => (
                            <div key={file.path} className="group/file p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-orange-500/30 transition-all cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-lg ${file.name.endsWith('pdf') ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-neutral-300 truncate group-hover/file:text-white transition-colors">
                                            {file.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Indexed</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Mini Metrics */}
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="p-2 rounded-lg bg-black/40">
                                        <div className="text-[9px] text-neutral-500 uppercase">Entropy</div>
                                        <div className="text-xs text-neutral-300 font-mono mt-0.5">{(file.metrics.entropy).toFixed(2)}</div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-black/40">
                                        <div className="text-[9px] text-neutral-500 uppercase">Tokens</div>
                                        <div className="text-xs text-orange-300 font-mono mt-0.5">{file.metrics.tokenCount}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                </AuditSection>

            </div>
        </div>
    </div>
  );
}
