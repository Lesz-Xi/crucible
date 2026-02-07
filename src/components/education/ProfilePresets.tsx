/**
 * Profile Presets Component
 * 
 * Quick-fill buttons with example student profiles
 * Helps students understand the system and compare against archetypes
 */

'use client';

import React from 'react';
import { Sparkles, Target, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { StudentIntakeData, StudentDemographics, MotivationProfile, StudyEnvironment, LearningStyle } from '@/types/education';

export interface StudentProfile {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  archetype: string;
  intakeData: StudentIntakeData;
}

interface ProfilePresetsProps {
  onSelectProfile: (profile: StudentProfile) => void;
  className?: string;
}

export function ProfilePresets({ onSelectProfile, className = '' }: ProfilePresetsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-wabi-clay" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          Example Profiles
        </h3>
      </div>
      
      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
        Not sure where to start? Load a gentle baseline and refine it to match your current reality.
      </p>
      
      <div className="grid gap-3">
        {PRESET_PROFILES.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onSelectProfile(profile)}
            className="p-4 rounded-xl bg-[var(--bg-card)]/70 border border-[var(--border-subtle)] hover:border-wabi-clay/40 hover:bg-[var(--bg-card)] transition-all text-left group shadow-wabi"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)]/70 flex items-center justify-center flex-shrink-0 group-hover:border-wabi-clay/40 transition-colors">
                {profile.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-serif text-base text-[var(--text-primary)] mb-1 group-hover:text-wabi-clay transition-colors">
                  {profile.name}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">
                  {profile.description}
                </p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest border border-[var(--border-subtle)]/60">
                  {profile.archetype}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="p-3 rounded-lg bg-wabi-rust/10 border border-wabi-rust/30 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-wabi-rust flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          These are illustrative archetypes. Adjust any values that do not reflect your lived context.
        </p>
      </div>
    </div>
  );
}

/**
 * Predefined student profiles based on common patterns
 */
export const PRESET_PROFILES: StudentProfile[] = [
  {
    id: 'high-achiever',
    name: 'The High Achiever',
    description: 'Strong foundation, high motivation, stable environment. Looking to optimize.',
    icon: <TrendingUp className="w-5 h-5 text-wabi-moss" />,
    archetype: 'Optimizer',
    intakeData: {
      demographics: {
        academicLevel: 'Junior',
        primaryLanguage: 'English',
        priorGPA: 3.7
      } as StudentDemographics,
      motivationProfile: {
        intrinsic: 8,
        extrinsic: 9,
        amotivation: 1,
        perceivedValueOfCourse: 9,
        goals: ['Graduate with honors', 'Prepare for grad school']
      } as MotivationProfile,
      learningStyle: 'Multimodal' as LearningStyle,
      studyEnvironment: {
        familySupport: 9,
        financialStress: 2,
        housingStability: 9,
        socialBelonging: 8,
        mentalHealth: 8
      } as StudyEnvironment,
      selfEfficacy: 8,
      priorKnowledgeScore: 80
    }
  },
  
  {
    id: 'struggling-motivation',
    name: 'The Unmotivated Student',
    description: 'Capable but disengaged. Low perceived value, unclear goals.',
    icon: <Target className="w-5 h-5 text-wabi-clay" />,
    archetype: 'Reengager',
    intakeData: {
      demographics: {
        academicLevel: 'Sophomore',
        primaryLanguage: 'English',
        priorGPA: 2.4
      } as StudentDemographics,
      motivationProfile: {
        intrinsic: 3,
        extrinsic: 4,
        amotivation: 7,
        perceivedValueOfCourse: 3,
        goals: []
      } as MotivationProfile,
      learningStyle: 'Visual' as LearningStyle,
      studyEnvironment: {
        familySupport: 6,
        financialStress: 5,
        housingStability: 7,
        socialBelonging: 4,
        mentalHealth: 5
      } as StudyEnvironment,
      selfEfficacy: 4,
      priorKnowledgeScore: 55
    }
  },
  
  {
    id: 'knowledge-gaps',
    name: 'The Underprepared Student',
    description: 'Motivated but lacks foundation. Needs prerequisite review.',
    icon: <Brain className="w-5 h-5 text-wabi-ink-light" />,
    archetype: 'Gap-Filler',
    intakeData: {
      demographics: {
        academicLevel: 'Freshman',
        primaryLanguage: 'English',
        priorGPA: undefined
      } as StudentDemographics,
      motivationProfile: {
        intrinsic: 7,
        extrinsic: 8,
        amotivation: 2,
        perceivedValueOfCourse: 8,
        goals: ['Pass this course', 'Build strong foundation']
      } as MotivationProfile,
      learningStyle: 'Kinesthetic' as LearningStyle,
      studyEnvironment: {
        familySupport: 7,
        financialStress: 4,
        housingStability: 8,
        socialBelonging: 6,
        mentalHealth: 7
      } as StudyEnvironment,
      selfEfficacy: 5,
      priorKnowledgeScore: 30
    }
  },
  
  {
    id: 'stress-challenges',
    name: 'The Stressed Student',
    description: 'Environmental challenges affecting performance despite ability.',
    icon: <AlertTriangle className="w-5 h-5 text-wabi-rust" />,
    archetype: 'Stress-Manager',
    intakeData: {
      demographics: {
        academicLevel: 'Senior',
        primaryLanguage: 'English',
        priorGPA: 3.1
      } as StudentDemographics,
      motivationProfile: {
        intrinsic: 6,
        extrinsic: 7,
        amotivation: 4,
        perceivedValueOfCourse: 7,
        goals: ['Graduate on time', 'Manage workload']
      } as MotivationProfile,
      learningStyle: 'ReadWrite' as LearningStyle,
      studyEnvironment: {
        familySupport: 4,
        financialStress: 8,
        housingStability: 5,
        socialBelonging: 5,
        mentalHealth: 3
      } as StudyEnvironment,
      selfEfficacy: 6,
      priorKnowledgeScore: 65
    }
  },
  
  {
    id: 'balanced',
    name: 'The Balanced Student',
    description: 'Average across all dimensions. Typical college experience.',
    icon: <Sparkles className="w-5 h-5 text-purple-500" />,
    archetype: 'Balanced',
    intakeData: {
      demographics: {
        academicLevel: 'Junior',
        primaryLanguage: 'English',
        priorGPA: 3.0
      } as StudentDemographics,
      motivationProfile: {
        intrinsic: 6,
        extrinsic: 6,
        amotivation: 3,
        perceivedValueOfCourse: 6,
        goals: ['Pass with B or better', 'Apply concepts to projects']
      } as MotivationProfile,
      learningStyle: 'Multimodal' as LearningStyle,
      studyEnvironment: {
        familySupport: 6,
        financialStress: 5,
        housingStability: 7,
        socialBelonging: 6,
        mentalHealth: 6
      } as StudyEnvironment,
      selfEfficacy: 6,
      priorKnowledgeScore: 60
    }
  },
  
  {
    id: 'first-gen',
    name: 'The First-Gen Student',
    description: 'Navigating college without family academic guidance. Building network.',
    icon: <Target className="w-5 h-5 text-indigo-500" />,
    archetype: 'Pathfinder',
    intakeData: {
      demographics: {
        academicLevel: 'Sophomore',
        primaryLanguage: 'English',
        priorGPA: 2.9
      } as StudentDemographics,
      motivationProfile: {
        intrinsic: 7,
        extrinsic: 9,
        amotivation: 2,
        perceivedValueOfCourse: 8,
        goals: ['Graduate college', 'Set example for siblings', 'Build career']
      } as MotivationProfile,
      learningStyle: 'Auditory' as LearningStyle,
      studyEnvironment: {
        familySupport: 5,
        financialStress: 7,
        housingStability: 6,
        socialBelonging: 4,
        mentalHealth: 6
      } as StudyEnvironment,
      selfEfficacy: 5,
      priorKnowledgeScore: 50
    }
  }
];

/**
 * Helper to apply a preset profile
 */
export function applyPresetProfile(
  profile: StudentProfile,
  setDemographics: (d: Partial<StudentDemographics>) => void,
  setMotivation: (m: Partial<MotivationProfile>) => void,
  setEnvironment: (e: Partial<StudyEnvironment>) => void,
  setLearningStyle: (l: LearningStyle) => void,
  setSelfEfficacy: (s: number) => void,
  setPriorKnowledge: (p: number) => void
) {
  setDemographics(profile.intakeData.demographics);
  setMotivation(profile.intakeData.motivationProfile);
  setEnvironment(profile.intakeData.studyEnvironment);
  setLearningStyle(profile.intakeData.learningStyle);
  setSelfEfficacy(profile.intakeData.selfEfficacy);
  setPriorKnowledge(profile.intakeData.priorKnowledgeScore);
}
