'use client';

/**
 * Educational Systems Page
 * 
 * Interface for personalized learning interventions using Pearl's SCM.
 * Implements the causal fingerprint: Motivation → Study_Habits → Performance
 * 
 * The Taoist Principle: "The master doesn't teach by explaining,
 * but by revealing the path already within."
 * (Personalized causal interventions, not one-size-fits-all)
 * 
 * Phase: Educational Systems - Causal Fingerprint for Learning
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Brain,
  Target,
  TrendingUp,
  Clock,
  Moon,
  Users,
  Lightbulb,
  Leaf,
  Check,
  Smile,
  Meh,
  Frown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import {
  StudentIntakeData,
  StudentDemographics,
  MotivationProfile,
  StudyEnvironment,
  LearningStyle,
  AnalyzeStudentResponse,
  OptimizeInterventionResponse,
  InterventionResult,
  ApprenticeshipSession,
  ApprenticeshipWeekProgress,
  ApprenticeshipMood
} from '@/types/education';
import { formatNodeName, getNodeDescription, getNodeResearch } from '@/lib/utils/text-formatting';
import { ResearchTooltip } from '@/components/education/ResearchTooltip';
import { CausalGraphExplorer } from '@/components/education/CausalGraphExplorer';
import { NodeDetailModal } from '@/components/education/NodeDetailModal';
import { WhatIfSimulator } from '@/components/education/WhatIfSimulator';
import { EnhancedSlider, SLIDER_METADATA } from '@/components/education/EnhancedSlider';
import { IntakeFormProgress, DEFAULT_INTAKE_STEPS } from '@/components/education/IntakeFormProgress';
import { ProfilePresets, applyPresetProfile, StudentProfile } from '@/components/education/ProfilePresets';
import { ApprenticeshipPanel } from '@/components/education/apprenticeship/ApprenticeshipPanel';
import { LabSessionModal } from '@/components/education/apprenticeship/LabSessionModal';
import { AppDashboardShell } from '@/components/dashboard/AppDashboardShell';

interface AnalysisState {
  stage: 'intake' | 'analyzing' | 'results' | 'error';
  message: string;
}

const APPRENTICESHIP_MODE = true;
const APPRENTICESHIP_LOCAL_KEY = 'educationApprenticeshipV1';

type AllowedOutputClass = 'association_only' | 'intervention_inferred' | 'intervention_supported';

function formatAllowedOutputClass(value: AllowedOutputClass | undefined): string {
  if (value === 'intervention_supported') return 'Intervention Supported';
  if (value === 'intervention_inferred') return 'Intervention Inferred';
  return 'Association Only';
}

function gateTone(value: AllowedOutputClass | undefined): {
  shell: string;
  chip: string;
} {
  if (value === 'intervention_supported') {
    return {
      shell: 'border-emerald-300/60 bg-emerald-100/60',
      chip: 'bg-emerald-100 text-emerald-700',
    };
  }
  if (value === 'intervention_inferred') {
    return {
      shell: 'border-amber-300/60 bg-amber-100/60',
      chip: 'bg-amber-100 text-amber-700',
    };
  }
  return {
    shell: 'border-rose-300/60 bg-rose-100/60',
    chip: 'bg-rose-100 text-rose-700',
  };
}

export default function EducationPage() {
  useEffect(() => {
    document.body.classList.add('liquid-glass-v2', 'lab-glass-system');
    return () => {
      document.body.classList.remove('liquid-glass-v2', 'lab-glass-system');
    };
  }, []);

  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    stage: 'intake',
    message: 'Complete your learning profile to discover your causal fingerprint'
  });
  
  // Modal states
  const [selectedNodeForDetail, setSelectedNodeForDetail] = useState<string | null>(null);
  
  // Form progress
  const [currentStep, setCurrentStep] = useState(1);
  const [showPresets, setShowPresets] = useState(false);
  
  // Intake form state
  const [demographics, setDemographics] = useState<Partial<StudentDemographics>>({
    academicLevel: 'Junior',
    primaryLanguage: 'English'
  });
  
  const [motivation, setMotivation] = useState<Partial<MotivationProfile>>({
    intrinsic: 6,
    extrinsic: 7,
    amotivation: 3,
    perceivedValueOfCourse: 7,
    goals: []
  });
  
  const [environment, setEnvironment] = useState<Partial<StudyEnvironment>>({
    familySupport: 7,
    financialStress: 4,
    housingStability: 8,
    socialBelonging: 6,
    mentalHealth: 7
  });
  
  const [learningStyle, setLearningStyle] = useState<LearningStyle>('Multimodal');
  const [selfEfficacy, setSelfEfficacy] = useState(6);
  const [priorKnowledge, setPriorKnowledge] = useState(65);
  
  // Results state
  const [analysisResult, setAnalysisResult] = useState<AnalyzeStudentResponse | null>(null);
  const [interventions, setInterventions] = useState<OptimizeInterventionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planSaved, setPlanSaved] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [planSaveMessage, setPlanSaveMessage] = useState<string | null>(null);
  const [planSaveError, setPlanSaveError] = useState<string | null>(null);
  const [reflectionMood, setReflectionMood] = useState<'low' | 'mid' | 'high' | null>(null);
  const [reflectionNotice, setReflectionNotice] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDay, setReminderDay] = useState('Mon');
  const [reminderTime, setReminderTime] = useState('18:00');
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);
  const [apprenticeshipSessions, setApprenticeshipSessions] = useState<ApprenticeshipSession[]>([]);
  const [apprenticeshipProgress, setApprenticeshipProgress] = useState<ApprenticeshipWeekProgress | null>(null);
  const [apprenticeshipNotice, setApprenticeshipNotice] = useState<string | null>(null);
  const [apprenticeshipLoading, setApprenticeshipLoading] = useState(false);
  const [activeLabSession, setActiveLabSession] = useState<ApprenticeshipSession | null>(null);
  const [savingLabSession, setSavingLabSession] = useState(false);

  useEffect(() => {
    if (analysisState.stage !== 'results') {
      setPlanSaved(false);
      setPlanId(null);
      setPlanSaveMessage(null);
      setPlanSaveError(null);
      setReflectionMood(null);
      setReflectionNotice(null);
      setReminderEnabled(false);
      setReminderNotice(null);
      setApprenticeshipSessions([]);
      setApprenticeshipProgress(null);
      setApprenticeshipNotice(null);
      setActiveLabSession(null);
      setSavingLabSession(false);
    }
  }, [analysisState.stage]);

  const actionPlanSteps = useMemo(() => {
    const top = interventions?.topRecommendation?.intervention;
    const targetNode = top?.target || analysisResult?.causalGraph.leveragePoint || 'PracticeQuality';
    const targetName = formatNodeName(targetNode);
    return [
      `Block two ${targetName} sessions this week (25 minutes each).`,
      `Use "${top?.name || 'focused practice'}" during each session.`,
      `Write a 2-line reflection after each session to anchor progress.`
    ];
  }, [interventions, analysisResult]);

  const normalizeNodeValue = (value: unknown, fallback: number) => {
    if (typeof value !== 'number') return fallback;
    if (value > 10) return value / 10;
    return value;
  };

  const getWeekStartIso = () => {
    const now = new Date();
    const day = now.getUTCDay();
    const distanceToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() + distanceToMonday);
    return monday.toISOString().slice(0, 10);
  };

  const saveLocalApprenticeship = (payload: { planId: string; sessions: ApprenticeshipSession[]; progress: ApprenticeshipWeekProgress }) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(APPRENTICESHIP_LOCAL_KEY, JSON.stringify(payload));
  };

  const loadLocalApprenticeship = () => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(APPRENTICESHIP_LOCAL_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.sessions || !Array.isArray(parsed.sessions)) return null;
      return parsed as { planId: string; sessions: ApprenticeshipSession[]; progress: ApprenticeshipWeekProgress };
    } catch {
      return null;
    }
  };

  const buildLocalApprenticeshipSessions = (
    focusNode: string,
    interventionName: string,
    currentPlanId: string
  ): ApprenticeshipSession[] => {
    const weekStart = getWeekStartIso();
    return [1, 2].map((number) => ({
      id: `local-${weekStart}-${number}`,
      planId: currentPlanId,
      sessionNumber: number as 1 | 2,
      weekStart,
      durationMinutes: 25,
      status: 'pending',
      focusNode,
      interventionName,
      intentNote: null,
      mood: null,
      reflectionNote: null,
      completedAt: null,
    }));
  };

  const computeLocalProgress = (sessions: ApprenticeshipSession[]): ApprenticeshipWeekProgress => {
    const weekStart = sessions[0]?.weekStart || getWeekStartIso();
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((session) => session.status === 'completed').length;
    return {
      weekStart,
      totalSessions,
      completedSessions,
      pendingSessions: totalSessions - completedSessions,
      completionRate: totalSessions === 0 ? 0 : completedSessions / totalSessions,
    };
  };

  const loadApprenticeship = async () => {
    if (!APPRENTICESHIP_MODE || analysisState.stage !== 'results') return;
    setApprenticeshipLoading(true);
    setApprenticeshipNotice(null);
    try {
      const response = await fetch('/api/education/apprenticeship/active', { method: 'GET' });
      if (response.status === 401 || response.status === 403) {
        const local = loadLocalApprenticeship();
        if (local) {
          setPlanId((prev) => prev || local.planId);
          setApprenticeshipSessions(local.sessions);
          setApprenticeshipProgress(local.progress);
          setApprenticeshipNotice('Loaded locally — sign in to sync across devices.');
        }
        return;
      }
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (data?.planId && Array.isArray(data.sessions)) {
        setPlanId((prev) => prev || data.planId);
        setApprenticeshipSessions(data.sessions);
        setApprenticeshipProgress(data.progress ?? null);
      }
    } catch (err) {
      console.error('[Education] Failed to load apprenticeship:', err);
    } finally {
      setApprenticeshipLoading(false);
    }
  };

  const startApprenticeship = async () => {
    if (!analysisResult || !interventions?.topRecommendation) return;
    const top = interventions.topRecommendation;
    setApprenticeshipLoading(true);
    setApprenticeshipNotice(null);
    setPlanSaveError(null);

    try {
      const response = await fetch('/api/education/apprenticeship/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planId ?? undefined,
          studentId: analysisResult.causalGraph.studentId,
          interventionId: top.intervention.id,
          focusNode: top.intervention.target,
          interventionName: top.intervention.name,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        const localPlanId = planId || `local-plan-${Date.now()}`;
        const localSessions = buildLocalApprenticeshipSessions(
          top.intervention.target,
          top.intervention.name,
          localPlanId
        );
        const localProgress = computeLocalProgress(localSessions);
        setPlanId(localPlanId);
        setApprenticeshipSessions(localSessions);
        setApprenticeshipProgress(localProgress);
        setApprenticeshipNotice('Saved locally — sign in to sync across devices.');
        saveLocalApprenticeship({ planId: localPlanId, sessions: localSessions, progress: localProgress });
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setPlanSaveError(data.error || 'Unable to start apprenticeship');
        return;
      }

      const data = await response.json();
      setPlanId(data.planId ?? null);
      setPlanSaved(true);
      setPlanSaveMessage('Apprenticeship started and plan tracked.');
      setApprenticeshipSessions(data.sessions || []);
      setApprenticeshipProgress(data.progress || null);
    } catch (err) {
      console.error('[Education] Failed to start apprenticeship:', err);
      setPlanSaveError('Unable to start apprenticeship right now.');
    } finally {
      setApprenticeshipLoading(false);
    }
  };

  const completeApprenticeshipSession = async (
    session: ApprenticeshipSession,
    payload: { intentNote?: string; mood: ApprenticeshipMood; reflectionNote?: string }
  ) => {
    setSavingLabSession(true);
    setApprenticeshipNotice(null);
    try {
      if (session.id.startsWith('local-')) {
        const updatedSessions: ApprenticeshipSession[] = apprenticeshipSessions.map((candidate) => {
          if (candidate.id !== session.id) return candidate;
          return {
            ...candidate,
            status: 'completed',
            completedAt: new Date().toISOString(),
            intentNote: payload.intentNote || '',
            mood: payload.mood,
            reflectionNote: payload.reflectionNote || '',
          };
        });
        const progress = computeLocalProgress(updatedSessions);
        setApprenticeshipSessions(updatedSessions);
        setApprenticeshipProgress(progress);
        if (planId) {
          saveLocalApprenticeship({ planId, sessions: updatedSessions, progress });
        }
        setActiveLabSession(null);
        return;
      }

      const response = await fetch(`/api/education/apprenticeship/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        setApprenticeshipNotice('Sign in to sync apprenticeship progress.');
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setApprenticeshipNotice(data.error || 'Unable to save session progress.');
        return;
      }

      const data = await response.json();
      setApprenticeshipSessions((prev) =>
        prev.map((candidate) => (candidate.id === session.id ? data.session : candidate))
      );
      setApprenticeshipProgress(data.progress ?? null);
      setActiveLabSession(null);
    } catch (err) {
      console.error('[Education] Failed to complete session:', err);
      setApprenticeshipNotice('Unable to save session progress right now.');
    } finally {
      setSavingLabSession(false);
    }
  };

  useEffect(() => {
    if (!APPRENTICESHIP_MODE) return;
    if (analysisState.stage === 'results') {
      loadApprenticeship();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisState.stage]);

  const persistPlan = async (status: 'draft' | 'active', simulationNodes?: { id: string; currentValue: number; simulatedValue: number }[]) => {
    if (!analysisResult) return;
    setPlanSaving(true);
    setPlanSaveError(null);
    setPlanSaveMessage(null);

    const top = interventions?.topRecommendation;
    const targetNode = top?.intervention.target || analysisResult.causalGraph.leveragePoint || 'PracticeQuality';
    const analysisSnapshot = {
      bottleneck: analysisResult.causalGraph.bottleneck,
      leveragePoint: analysisResult.causalGraph.leveragePoint,
      chain: ['FamilySupport', 'Motivation', 'StudyHabits', 'PracticeQuality', 'Performance'],
      generatedAt: new Date().toISOString(),
      simulation: simulationNodes ?? null
    };

    const reminderPayload = reminderEnabled
      ? {
          dayOfWeek: reminderDay,
          timeLocal: reminderTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          enabled: true
        }
      : null;

    try {
      const response = await fetch('/api/education/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: analysisResult.causalGraph.studentId,
          title: "This Week's 3-Step Plan",
          status,
          targetNode,
          steps: actionPlanSteps,
          interventionId: top?.intervention.id ?? null,
          expectedGain: top?.expectedGain ?? null,
          confidence: top?.confidence ?? null,
          causalPath: top?.causalPath ?? null,
          analysisSnapshot,
          reminder: reminderPayload
        })
      });

      const data = await response.json().catch(() => ({} as { error?: string; planId?: string }));
      const unauthorized = response.status === 401
        || response.status === 403
        || (typeof data.error === 'string' && data.error.toLowerCase().includes('unauthorized'));

      if (unauthorized) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('educationActionPlan', JSON.stringify(actionPlanSteps));
        }
        setPlanSaved(true);
        setPlanSaveMessage('Saved locally — sign in to sync across devices.');
        return;
      }

      if (!response.ok) {
        setPlanSaveError(data.error || 'Unable to save plan');
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('educationActionPlan', JSON.stringify(actionPlanSteps));
        }
        setPlanSaved(true);
        setPlanSaveMessage('Saved locally in this browser.');
        return;
      }

      setPlanId(data.planId);
      setPlanSaved(true);
      setPlanSaveMessage(status === 'active' ? 'Plan applied and tracked.' : 'Plan saved to your account.');
    } catch (err) {
      console.error('[Education] Plan save failed:', err);
      setPlanSaveError(err instanceof Error ? err.message : 'Unable to save plan');
      // Fallback: store locally for offline continuity
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('educationActionPlan', JSON.stringify(actionPlanSteps));
      }
      setPlanSaved(true);
      setPlanSaveMessage('Saved locally in this browser.');
    } finally {
      setPlanSaving(false);
    }
  };

  const syncReminder = async (nextEnabled: boolean, nextDay: string, nextTime: string) => {
    if (!planId) {
      setReminderNotice('Save this plan to sync reminders.');
      return;
    }
    setReminderNotice(null);
    try {
      const response = await fetch('/api/education/plans/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          dayOfWeek: nextDay,
          timeLocal: nextTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          enabled: nextEnabled
        })
      });
      if (response.status === 401 || response.status === 403) {
        setReminderNotice('Sign in to sync reminders.');
        return;
      }
      if (!response.ok) {
        setReminderNotice('Unable to sync reminder right now.');
        return;
      }
      setReminderNotice('Reminder synced.');
    } catch (err) {
      console.error('[Education] Reminder sync failed:', err);
      setReminderNotice('Unable to sync reminder right now.');
    }
  };

  const saveReflection = async (mood: 'low' | 'mid' | 'high') => {
    setReflectionNotice(null);
    if (!planId) {
      setReflectionNotice('Save this plan to sync reflections.');
      return;
    }
    try {
      const response = await fetch('/api/education/plans/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, mood })
      });
      if (response.status === 401 || response.status === 403) {
        setReflectionNotice('Sign in to sync reflections.');
        return;
      }
      if (!response.ok) {
        setReflectionNotice('Unable to sync reflection right now.');
        return;
      }
    } catch (err) {
      console.error('[Education] Reflection save failed:', err);
      setReflectionNotice('Unable to sync reflection right now.');
    }
  };
  
  /**
   * Handle preset profile selection
   */
  const handlePresetSelect = (profile: StudentProfile) => {
    applyPresetProfile(
      profile,
      setDemographics,
      setMotivation,
      setEnvironment,
      setLearningStyle,
      setSelfEfficacy,
      setPriorKnowledge
    );
    setShowPresets(false);
  };
  
  /**
   * Submit intake form for analysis
   */
  const handleAnalyze = async () => {
    setAnalysisState({ stage: 'analyzing', message: 'Building your causal fingerprint...' });
    setError(null);
    
    try {
      const studentId = `student-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const intakeData: StudentIntakeData = {
        demographics: demographics as StudentDemographics,
        motivationProfile: motivation as MotivationProfile,
        learningStyle,
        studyEnvironment: environment as StudyEnvironment,
        selfEfficacy,
        priorKnowledgeScore: priorKnowledge
      };
      
      // Analyze student
      const analyzeResponse = await fetch('/api/education/analyze-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          intakeData,
          options: { includeInsights: true, includeLeverageAnalysis: true }
        })
      });
      
      if (!analyzeResponse.ok) {
        throw new Error(`Analysis failed: ${analyzeResponse.statusText}`);
      }
      
      const analysis: AnalyzeStudentResponse = await analyzeResponse.json();
      setAnalysisResult(analysis);
      
      // Get intervention recommendations
      const optimizeResponse = await fetch('/api/education/optimize-intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          optimizationGoal: 'performance',
          causalGraph: analysis.causalGraph,
          constraints: { maxEffort: 0.5 }
        })
      });
      
      if (optimizeResponse.ok) {
        const recommendations: OptimizeInterventionResponse = await optimizeResponse.json();
        setInterventions(recommendations);
      }
      
      setAnalysisState({ stage: 'results', message: 'Analysis complete' });
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAnalysisState({ stage: 'error', message: 'Analysis failed' });
    }
  };
  
  /**
   * Reset to intake form
   */
  const handleReset = () => {
    setAnalysisState({ stage: 'intake', message: 'Complete your learning profile' });
    setAnalysisResult(null);
    setInterventions(null);
    setError(null);
  };
  
  return (
    <AppDashboardShell>
      <main className="edu-page feature-education min-h-screen transition-colors duration-500">
      {/* Header */}
      <header className="edu-header px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-6 h-6 text-wabi-moss" />
            <h1 className="font-serif text-2xl tracking-wide">Educational Systems</h1>
          </div>
          <p className="text-[var(--text-secondary)] font-mono text-sm">
            Personalized Learning Through Causal Fingerprinting
          </p>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Status Banner */}
        <div className="mb-8">
          <div className="edu-status">
            {analysisState.stage === 'analyzing' && (
              <div className="w-4 h-4 border-2 border-wabi-clay border-t-transparent rounded-full animate-spin" />
            )}
            {analysisState.stage === 'results' && (
              <CheckCircle className="w-4 h-4 text-wabi-moss" />
            )}
            {analysisState.stage === 'error' && (
              <AlertTriangle className="w-4 h-4 text-wabi-rust" />
            )}
            {analysisState.stage === 'intake' && (
              <Lightbulb className="w-4 h-4 text-[var(--text-tertiary)]" />
            )}
            <span className="font-mono text-sm">{analysisState.message}</span>
          </div>
        </div>
        
        {/* Intake Form */}
        {analysisState.stage === 'intake' && (
          <div className="grid lg:grid-cols-[300px,1fr] gap-8">
            {/* Left Sidebar - Progress & Presets */}
            <aside className="space-y-6">
              {/* Progress Indicator */}
              <div className="edu-card p-4">
                <IntakeFormProgress
                  currentStep={currentStep}
                  steps={DEFAULT_INTAKE_STEPS}
                />
              </div>
              
              {/* Quick Presets */}
              <div className="edu-card p-5">
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="w-full flex items-center justify-between mb-3 group"
                >
                  <div className="text-left">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)] block">
                      Quick Start
                    </span>
                    <span className="font-serif text-base text-[var(--text-primary)]">
                      Example Profiles
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-wabi-clay group-hover:border-wabi-clay/50 transition-colors">
                    <ChevronRight className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  Load a gentle baseline to see how the system interprets your profile, then refine.
                </p>

                {showPresets && (
                  <ProfilePresets onSelectProfile={handlePresetSelect} />
                )}
              </div>
            </aside>
            
            {/* Main Form Content */}
            <div className="space-y-8">
              {/* Demographics Section */}
              <section className="edu-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-serif text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-wabi-moss" />
                    Your Background
                  </h2>
                  <span className="edu-chip">
                    Step 1/4
                  </span>
                </div>
                
                <details className="mb-6">
                  <summary className="text-xs text-[var(--text-secondary)] cursor-pointer font-mono uppercase tracking-[0.2em]">
                    Why this matters
                  </summary>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2 leading-relaxed">
                    Context helps calibrate recommendations to your current level and pace.
                  </p>
                </details>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                      Academic Level
                    </label>
                    <select
                      value={demographics.academicLevel}
                      onChange={(e) => {
                        setDemographics({ ...demographics, academicLevel: e.target.value as any });
                        setCurrentStep(1);
                      }}
                      className="lab-select"
                    >
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                      Prior GPA (optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      step="0.1"
                      value={demographics.priorGPA || ''}
                      onChange={(e) => setDemographics({ ...demographics, priorGPA: parseFloat(e.target.value) || undefined })}
                      placeholder="0.0 - 4.0"
                      className="lab-input"
                    />
                  </div>
                </div>
              </section>
            
              {/* Motivation Section */}
              <section className="edu-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-serif text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-wabi-clay" />
                    Motivation Profile
                  </h2>
                  <span className="edu-chip">
                    Step 2/4
                  </span>
                </div>
                
                <details className="mb-6">
                  <summary className="text-xs text-[var(--text-secondary)] cursor-pointer font-mono uppercase tracking-[0.2em]">
                    Why this matters
                  </summary>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2 leading-relaxed">
                    Motivation shapes habits and persistence. Small shifts here create large downstream effects.
                  </p>
                </details>
                
                <div className="space-y-6">
                  <EnhancedSlider
                    value={motivation.intrinsic || 5}
                    onChange={(v) => {
                      setMotivation({ ...motivation, intrinsic: v });
                      setCurrentStep(2);
                    }}
                    metadata={SLIDER_METADATA.intrinsic}
                    showRecommendations={true}
                  />
                  
                  <EnhancedSlider
                    value={motivation.extrinsic || 5}
                    onChange={(v) => setMotivation({ ...motivation, extrinsic: v })}
                    metadata={SLIDER_METADATA.extrinsic}
                    showRecommendations={true}
                  />
                  
                  <EnhancedSlider
                    value={motivation.perceivedValueOfCourse || 5}
                    onChange={(v) => setMotivation({ ...motivation, perceivedValueOfCourse: v })}
                    metadata={SLIDER_METADATA.courseValue}
                    showRecommendations={true}
                  />
                </div>
              </section>
            
              {/* Study Environment Section */}
              <section className="edu-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-serif text-lg flex items-center gap-2">
                    <Moon className="w-5 h-5 text-wabi-moss" />
                    Study Environment
                  </h2>
                  <span className="edu-chip">
                    Step 3/4
                  </span>
                </div>
                
                <details className="mb-6">
                  <summary className="text-xs text-[var(--text-secondary)] cursor-pointer font-mono uppercase tracking-[0.2em]">
                    Why this matters
                  </summary>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2 leading-relaxed">
                    Environment shapes energy, focus, and resilience during hard weeks.
                  </p>
                </details>
                
                <div className="space-y-6">
                  <EnhancedSlider
                    value={environment.familySupport || 5}
                    onChange={(v) => {
                      setEnvironment({ ...environment, familySupport: v });
                      setCurrentStep(3);
                    }}
                    metadata={SLIDER_METADATA.familySupport}
                    showRecommendations={true}
                  />
                  
                  <EnhancedSlider
                    value={environment.socialBelonging || 5}
                    onChange={(v) => setEnvironment({ ...environment, socialBelonging: v })}
                    metadata={SLIDER_METADATA.socialBelonging}
                    showRecommendations={true}
                  />
                  
                  <EnhancedSlider
                    value={environment.mentalHealth || 5}
                    onChange={(v) => setEnvironment({ ...environment, mentalHealth: v })}
                    metadata={SLIDER_METADATA.mentalHealth}
                    showRecommendations={true}
                  />
                </div>
              </section>
            
              {/* Learning Style & Prior Knowledge */}
              <section className="edu-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-serif text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-wabi-ink-light" />
                    Learning Profile
                  </h2>
                  <span className="edu-chip">
                    Step 4/4
                  </span>
                </div>
                
                <details className="mb-6">
                  <summary className="text-xs text-[var(--text-secondary)] cursor-pointer font-mono uppercase tracking-[0.2em]">
                    Why this matters
                  </summary>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2 leading-relaxed">
                    Your learning style and foundations determine which strategies will actually work.
                  </p>
                </details>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                      Learning Style
                    </label>
                    <select
                      value={learningStyle}
                      onChange={(e) => {
                        setLearningStyle(e.target.value as LearningStyle);
                        setCurrentStep(4);
                      }}
                      className="lab-select"
                    >
                      <option value="Visual">Visual (diagrams, charts)</option>
                      <option value="Auditory">Auditory (lectures, discussions)</option>
                      <option value="ReadWrite">Read/Write (textbooks, notes)</option>
                      <option value="Kinesthetic">Kinesthetic (hands-on practice)</option>
                      <option value="Multimodal">Multimodal (mixed)</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 space-y-6">
                  <EnhancedSlider
                    value={selfEfficacy}
                    onChange={(v) => setSelfEfficacy(v)}
                    metadata={SLIDER_METADATA.selfEfficacy}
                    showRecommendations={true}
                  />
                  
                  <EnhancedSlider
                    value={priorKnowledge / 10}
                    onChange={(v) => setPriorKnowledge(v * 10)}
                    metadata={SLIDER_METADATA.priorKnowledge}
                    showRecommendations={true}
                  />
                </div>
              </section>
              
              {/* Submit Button */}
              <button
                onClick={handleAnalyze}
                className="lab-button-primary w-full"
              >
                <Sparkles className="w-4 h-4" />
                Discover My Causal Fingerprint
              </button>
            </div>
          </div>
        )}
        
        {/* Analyzing State */}
        {analysisState.stage === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-wabi-clay border-t-transparent rounded-full animate-spin mb-6" />
            <p className="font-serif text-xl mb-2">Building Your Causal Graph</p>
            <p className="text-[var(--text-secondary)] font-mono text-sm">
              Tracing causal paths: Motivation → Study_Habits → Performance
            </p>
          </div>
        )}
        
        {/* Results */}
        {analysisState.stage === 'results' && analysisResult && (
          <div className="space-y-8">
            {/* Completion Ritual */}
            <section className="edu-card p-6 relative overflow-hidden">
              <div className="absolute inset-0 edu-confetti opacity-70 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <Leaf className="w-6 h-6 text-wabi-clay" />
                  <div>
                    <p className="font-serif text-xl">Analysis complete</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Your learning system has been mapped. Start with one small action.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Next step: build a light, three‑step plan for this week.
                  </p>
                  <a
                    href="#action-plan"
                    className="lab-button-primary"
                  >
                    Build This Week
                    <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </section>

            {/* Fingerprint Reveal */}
            <section id="fingerprint" className="edu-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-wabi-moss" />
                  Your Causal Fingerprint
                </h2>
                <span className="edu-chip">Fingerprint</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="edu-card-soft p-4 border-l-4 border-wabi-rust/40">
                  <div className="flex items-center gap-2 mb-2">
                    <ResearchTooltip
                      title="Bottleneck"
                      description="A bottleneck is the node that most constrains performance in the causal chain. Improving this factor has limited impact until other upstream factors improve first."
                      research={{
                        citation: "Pearl (2009) - Causality: Models, Reasoning and Inference",
                        url: "https://doi.org/10.1017/CBO9780511803161"
                      }}
                    >
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-wabi-rust">
                        Bottleneck
                      </span>
                    </ResearchTooltip>
                  </div>
                  <ResearchTooltip
                    title={formatNodeName(analysisResult.causalGraph.bottleneck || 'StudyHabits')}
                    description={getNodeDescription(analysisResult.causalGraph.bottleneck || 'StudyHabits')}
                    research={getNodeResearch(analysisResult.causalGraph.bottleneck || 'StudyHabits')}
                  >
                    <p className="font-serif text-lg">
                      {formatNodeName(analysisResult.causalGraph.bottleneck || 'StudyHabits')}
                    </p>
                  </ResearchTooltip>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">
                    Primary limiting factor in your chain
                  </p>
                </div>

                <div className="edu-card-soft p-4 border-l-4 border-wabi-moss/40">
                  <div className="flex items-center gap-2 mb-2">
                    <ResearchTooltip
                      title="Leverage Point"
                      description="A leverage point is where small interventions create maximum system-wide impact. This is where your efforts will have the highest return on investment."
                      research={{
                        citation: "Meadows (1999) - Leverage Points: Places to Intervene in a System",
                        url: "https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/"
                      }}
                    >
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-wabi-moss">
                        Leverage Point
                      </span>
                    </ResearchTooltip>
                  </div>
                  <ResearchTooltip
                    title={formatNodeName(analysisResult.causalGraph.leveragePoint || 'Motivation')}
                    description={getNodeDescription(analysisResult.causalGraph.leveragePoint || 'Motivation')}
                    research={getNodeResearch(analysisResult.causalGraph.leveragePoint || 'Motivation')}
                  >
                    <p className="font-serif text-lg">
                      {formatNodeName(analysisResult.causalGraph.leveragePoint || 'Motivation')}
                    </p>
                  </ResearchTooltip>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">
                    Highest‑ROI intervention target
                  </p>
                </div>
              </div>

              {/* Learning Chain */}
              <div className="mt-6 edu-card-soft p-4">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-4">
                  Your Learning Chain
                </h3>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {['FamilySupport', 'Motivation', 'StudyHabits', 'PracticeQuality', 'Performance'].map((node, i, arr) => (
                    <React.Fragment key={node}>
                      <ResearchTooltip
                        title={formatNodeName(node)}
                        description={getNodeDescription(node)}
                        research={getNodeResearch(node)}
                      >
                        <div className={`px-3 py-2 rounded-full text-xs border ${
                          node === analysisResult.causalGraph.bottleneck
                            ? 'bg-wabi-rust/10 text-wabi-rust border-wabi-rust/40 font-semibold'
                            : node === analysisResult.causalGraph.leveragePoint
                              ? 'bg-wabi-moss/10 text-wabi-moss border-wabi-moss/40 font-semibold'
                              : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                        }`}>
                          {formatNodeName(node)}
                        </div>
                      </ResearchTooltip>
                      {i < arr.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </section>

            {/* Interventions */}
            {interventions && (
              <section id="interventions" className="edu-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-wabi-clay" />
                    Recommended Interventions
                  </h2>
                  <span className="edu-chip">Action‑First</span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mb-6">
                  Start with one action. Depth beats volume.
                </p>

                {interventions.allowedOutputClass && (
                  <div className={`mb-6 rounded-lg border p-4 ${gateTone(interventions.allowedOutputClass).shell}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.14em] ${gateTone(interventions.allowedOutputClass).chip}`}>
                        {formatAllowedOutputClass(interventions.allowedOutputClass)}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                        Allowed {interventions.interventionGateSummary?.allowedInterventions ?? 0} • Blocked {interventions.interventionGateSummary?.blockedInterventions ?? 0}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {interventions.interventionGateSummary?.rationale || 'Intervention gate status unavailable.'}
                    </p>
                    {(interventions.counterfactualTraceIds?.length ?? 0) > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {interventions.counterfactualTraceIds?.slice(0, 3).map((traceId) => (
                          <a
                            key={traceId}
                            href={`/api/scm/counterfactual-traces/${traceId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[var(--border-subtle)] bg-white/75 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--text-secondary)] hover:border-wabi-clay/45"
                          >
                            Trace {traceId.slice(0, 8)}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Top Recommendation */}
                {interventions.topRecommendation && (
                  <div className="p-5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-wabi-moss">
                          Living Prescription
                        </span>
                        <h3 className="font-serif text-lg mt-1">
                          {interventions.topRecommendation.intervention.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xl text-wabi-moss">
                          +{interventions.topRecommendation.expectedGain}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">expected points</div>
                      </div>
                    </div>

                    <p className="text-[var(--text-secondary)] text-sm mt-3">
                      {interventions.topRecommendation.intervention.mechanism}
                    </p>

                    {interventions.topRecommendation.interventionGate && (
                      <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                            Intervention Gate
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.14em] ${gateTone(interventions.topRecommendation.interventionGate.allowedOutputClass).chip}`}>
                            {formatAllowedOutputClass(interventions.topRecommendation.interventionGate.allowedOutputClass)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-[var(--text-secondary)]">
                          {interventions.topRecommendation.interventionGate.rationale}
                        </p>
                        {interventions.topRecommendation.interventionGate.counterfactualTrace && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                              {interventions.topRecommendation.interventionGate.counterfactualTrace.method}
                            </span>
                            <a
                              href={interventions.topRecommendation.interventionGate.counterfactualTrace.retrievalPath}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-[var(--border-subtle)] bg-white/75 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--text-secondary)] hover:border-wabi-clay/45"
                            >
                              Trace {interventions.topRecommendation.interventionGate.counterfactualTrace.traceId.slice(0, 8)}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs font-mono text-[var(--text-tertiary)] mt-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {interventions.topRecommendation.timeToEffect}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {Math.round(interventions.topRecommendation.confidence * 100)}% confidence
                      </span>
                      <span>
                        Effort: {interventions.topRecommendation.effortCost < 0.3 ? 'Low' : interventions.topRecommendation.effortCost < 0.6 ? 'Medium' : 'High'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          await startApprenticeship();
                          if (typeof document !== 'undefined') {
                            document.getElementById('apprenticeship-lab')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="lab-button-primary"
                      >
                        {apprenticeshipLoading ? 'Starting...' : 'Start Apprenticeship Lab'}
                      </button>
                      <details className="text-xs text-[var(--text-secondary)]">
                        <summary className="cursor-pointer font-mono uppercase tracking-[0.2em] text-[10px]">
                          Why this works
                        </summary>
                        <p className="mt-2 leading-relaxed">
                          Targets {formatNodeName(interventions.topRecommendation.intervention.target)} using a high‑leverage mechanism.
                        </p>
                      </details>
                    </div>
                  </div>
                )}

                {/* Other Interventions */}
                <div className="space-y-3">
                  {interventions.rankedInterventions.slice(1, 4).map((result, index) => (
                    <InterventionCard key={result.intervention.id} result={result} rank={index + 2} />
                  ))}
                </div>

                {/* Explanation */}
                {interventions.explanation && (
                  <details className="mt-6">
                    <summary className="cursor-pointer font-mono uppercase tracking-[0.2em] text-[10px] text-[var(--text-secondary)]">
                      Understanding Your Results
                    </summary>
                    <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed">
                      {interventions.explanation}
                    </p>
                  </details>
                )}
              </section>
            )}

            {APPRENTICESHIP_MODE && interventions?.topRecommendation && (
              <ApprenticeshipPanel
                focusNode={interventions.topRecommendation.intervention.target}
                interventionName={interventions.topRecommendation.intervention.name}
                sessions={apprenticeshipSessions}
                progress={apprenticeshipProgress}
                loading={apprenticeshipLoading}
                notice={apprenticeshipNotice}
                onStartLab={startApprenticeship}
                onOpenSession={setActiveLabSession}
              />
            )}

            {/* Action Plan */}
            <section id="action-plan" className="edu-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg flex items-center gap-2">
                  <Check className="w-5 h-5 text-wabi-moss" />
                  This Week’s 3‑Step Plan
                </h2>
                <span className="edu-chip">Commitment</span>
              </div>

              <div className="space-y-3">
                {actionPlanSteps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <span className="w-6 h-6 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-mono">
                      {index + 1}
                    </span>
                    <p className="text-sm text-[var(--text-secondary)]">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => persistPlan('draft')}
                  className="lab-button-primary"
                >
                  {planSaving ? 'Saving...' : 'Save This Plan'}
                </button>
                <button
                  onClick={handleReset}
                  className="lab-button-secondary"
                >
                  Start New Analysis
                </button>
              </div>

              {planSaved && (
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  {planSaveMessage || 'Saved locally in this browser.'}
                </p>
              )}
              {planSaveError && (
                <p className="text-xs text-wabi-rust mt-2">{planSaveError}</p>
              )}

              <div className="mt-4 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                      Weekly reminder (local only)
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Optional nudge to revisit your plan.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !reminderEnabled;
                      setReminderEnabled(next);
                      if (typeof window !== 'undefined') {
                        window.localStorage.setItem('educationReminderEnabled', JSON.stringify(next));
                      }
                      syncReminder(next, reminderDay, reminderTime);
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] border ${
                      reminderEnabled
                        ? 'border-wabi-clay/60 text-wabi-clay bg-wabi-clay/10'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {reminderEnabled ? 'Enabled' : 'Enable'}
                  </button>
                </div>
                {reminderEnabled && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-3">
                    <select
                      value={reminderDay}
                      onChange={(e) => {
                        const next = e.target.value;
                        setReminderDay(next);
                        syncReminder(reminderEnabled, next, reminderTime);
                      }}
                      className="lab-select w-full sm:w-auto"
                    >
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => {
                        const next = e.target.value;
                        setReminderTime(next);
                        syncReminder(reminderEnabled, reminderDay, next);
                      }}
                      className="lab-input w-full sm:w-auto"
                    />
                  </div>
                )}
              </div>
              {reminderNotice && (
                <p className="text-xs text-[var(--text-tertiary)] mt-2">{reminderNotice}</p>
              )}

              <div className="edu-divider my-6" />

              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  How did this feel today?
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'low', icon: <Frown className="w-4 h-4" />, label: 'Heavy' },
                    { id: 'mid', icon: <Meh className="w-4 h-4" />, label: 'Okay' },
                    { id: 'high', icon: <Smile className="w-4 h-4" />, label: 'Light' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        const mood = option.id as 'low' | 'mid' | 'high';
                        setReflectionMood(mood);
                        saveReflection(mood);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-mono uppercase tracking-[0.2em] transition-colors ${
                        reflectionMood === option.id
                          ? 'border-wabi-clay/60 text-wabi-clay bg-wabi-clay/10'
                          : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
                {reflectionNotice && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">{reflectionNotice}</p>
                )}
              </div>
            </section>

            {/* Explore the System */}
            <section className="edu-card p-6">
              <h2 className="font-serif text-lg mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-wabi-ink-light" />
                Explore the System
              </h2>
              <details className="mb-4">
                <summary className="cursor-pointer font-mono uppercase tracking-[0.2em] text-[10px] text-[var(--text-secondary)]">
                  Interactive Causal Graph
                </summary>
                <div className="mt-4">
                  <CausalGraphExplorer
                    nodes={[
                      { id: 'FamilySupport', value: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'FamilySupport')?.value, 7) },
                      { id: 'Motivation', value: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'Motivation')?.value, 6) },
                      { id: 'StudyHabits', value: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'StudyHabits')?.value, 5.5) },
                      { id: 'PracticeQuality', value: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'PracticeQuality')?.value, 5.8) },
                      { id: 'Performance', value: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'Performance')?.value, 6.2) }
                    ]}
                    edges={analysisResult.causalGraph.edges.map(e => ({ from: e.from, to: e.to, strength: e.strength })) || [
                      { from: 'FamilySupport', to: 'Motivation', strength: 0.6 },
                      { from: 'Motivation', to: 'StudyHabits', strength: 0.7 },
                      { from: 'StudyHabits', to: 'PracticeQuality', strength: 0.8 },
                      { from: 'PracticeQuality', to: 'Performance', strength: 0.75 }
                    ]}
                    bottleneck={analysisResult.causalGraph.bottleneck}
                    leveragePoint={analysisResult.causalGraph.leveragePoint}
                    onNodeClick={setSelectedNodeForDetail}
                  />
                </div>
              </details>

              <div className="edu-divider my-4" />

              <details>
                <summary className="cursor-pointer font-mono uppercase tracking-[0.2em] text-[10px] text-[var(--text-secondary)]">
                  What‑If Simulator
                </summary>
                <div className="mt-4">
                  <WhatIfSimulator
                    initialNodes={[
                      { id: 'FamilySupport', currentValue: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'FamilySupport')?.value, 7), simulatedValue: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'FamilySupport')?.value, 7) },
                      { id: 'Motivation', currentValue: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'Motivation')?.value, 6), simulatedValue: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'Motivation')?.value, 6) },
                      { id: 'StudyHabits', currentValue: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'StudyHabits')?.value, 5.5), simulatedValue: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'StudyHabits')?.value, 5.5) },
                      { id: 'PracticeQuality', currentValue: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'PracticeQuality')?.value, 5.8), simulatedValue: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'PracticeQuality')?.value, 5.8) },
                      { id: 'Performance', currentValue: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'Performance')?.value, 6.2), simulatedValue: normalizeNodeValue(analysisResult.causalGraph.nodes.find(n => n.name === 'Performance')?.value, 6.2) }
                    ]}
                    edges={analysisResult.causalGraph.edges.map(e => ({ from: e.from, to: e.to, strength: e.strength })) || [
                      { from: 'FamilySupport', to: 'Motivation', strength: 0.6 },
                      { from: 'Motivation', to: 'StudyHabits', strength: 0.7 },
                      { from: 'StudyHabits', to: 'PracticeQuality', strength: 0.8 },
                      { from: 'PracticeQuality', to: 'Performance', strength: 0.75 }
                    ]}
                    maxValue={10}
                    step={0.1}
                    onCommitGoal={async (nodes) => {
                      await persistPlan('active', nodes);
                    }}
                  />
                </div>
              </details>
            </section>
          </div>
        )}

        {APPRENTICESHIP_MODE && (
          <LabSessionModal
            open={Boolean(activeLabSession)}
            session={activeLabSession}
            saving={savingLabSession}
            onClose={() => setActiveLabSession(null)}
            onComplete={async (payload) => {
              if (!activeLabSession) return;
              await completeApprenticeshipSession(activeLabSession, payload);
            }}
          />
        )}
        
        {/* Node Detail Modal */}
        {selectedNodeForDetail && analysisResult && (
          <NodeDetailModal
            nodeId={selectedNodeForDetail}
            currentValue={typeof analysisResult.causalGraph.nodes.find(n => n.name === selectedNodeForDetail)?.value === 'number' ? analysisResult.causalGraph.nodes.find(n => n.name === selectedNodeForDetail)?.value as number : 50}
            influences={analysisResult.causalGraph.edges
              .filter(e => e.to === selectedNodeForDetail)
              .map(e => ({
                from: e.from,
                strength: e.strength,
                description: `${formatNodeName(e.from)} influences ${formatNodeName(selectedNodeForDetail)}`
              }))}
            effects={analysisResult.causalGraph.edges
              .filter(e => e.from === selectedNodeForDetail)
              .map(e => ({
                to: e.to,
                strength: e.strength,
                description: `${formatNodeName(selectedNodeForDetail)} affects ${formatNodeName(e.to)}`
              }))}
            isBottleneck={selectedNodeForDetail === analysisResult.causalGraph.bottleneck}
            isLeveragePoint={selectedNodeForDetail === analysisResult.causalGraph.leveragePoint}
            onClose={() => setSelectedNodeForDetail(null)}
          />
        )}
        
        {/* Error State */}
        {analysisState.stage === 'error' && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-wabi-rust mx-auto mb-4" />
            <h2 className="font-serif text-xl mb-2">Analysis Failed</h2>
            <p className="text-[var(--text-secondary)] mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="lab-button-secondary"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      </main>
    </AppDashboardShell>
  );
}

/**
 * Intervention Card Component
 */
function InterventionCard({ result, rank }: { result: InterventionResult; rank: number }) {
  const tone = gateTone(result.interventionGate?.allowedOutputClass);
  return (
    <details className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="w-6 h-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center font-mono text-xs">
              {rank}
            </span>
            <div>
              <h4 className="font-mono text-sm">{result.intervention.name}</h4>
              <p className="text-xs text-[var(--text-tertiary)]">
                Targets: {result.intervention.target}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg text-wabi-moss">+{result.expectedGain}</div>
            <div className="text-xs text-[var(--text-tertiary)]">
              Utility: {result.utility}
            </div>
          </div>
        </div>
      </summary>
      <div className="mt-3 text-xs text-[var(--text-secondary)] leading-relaxed">
        {result.intervention.mechanism}
      </div>
      {result.interventionGate && (
        <div className={`mt-3 rounded-md border p-2.5 ${tone.shell}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Intervention Gate
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.14em] ${tone.chip}`}>
              {formatAllowedOutputClass(result.interventionGate.allowedOutputClass)}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
            {result.interventionGate.rationale}
          </p>
          {result.interventionGate.counterfactualTrace && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {result.interventionGate.counterfactualTrace.method}
              </span>
              <a
                href={result.interventionGate.counterfactualTrace.retrievalPath}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[var(--border-subtle)] bg-white/75 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--text-secondary)] hover:border-wabi-clay/45"
              >
                Trace {result.interventionGate.counterfactualTrace.traceId.slice(0, 8)}
              </a>
            </div>
          )}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)]">
          Confidence: {Math.round(result.confidence * 100)}%
        </span>
        <a
          href="#action-plan"
          className="lab-button-secondary !px-3 !py-1 text-[10px]"
        >
          Apply
        </a>
      </div>
    </details>
  );
}
