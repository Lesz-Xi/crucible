/**
 * Profile Presets Component
 * 
 * Quick-fill buttons with example student profiles
 * Helps students understand the system and compare against archetypes
 */

'use client';

import React from 'react';
import { Sparkles, Target, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className={`space-y-6 pb-32 relative z-20 ${className}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>
        <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
          Example Profiles
        </h3>
      </div>
      
      <p className="text-xs text-white/40 leading-relaxed mb-4">
        Not sure where to start? Load a baseline and refine it to match your reality.
      </p>
      
      <div className="grid gap-3">
        {PRESET_PROFILES.map((profile, i) => (
          <motion.button
            key={profile.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectProfile(profile)}
            className="relative overflow-hidden p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md transition-all text-left group shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 opacity-0 group-hover:opacity-10 group-hover:from-emerald-500/10 group-hover:via-emerald-500/5 transition-all duration-500 pointer-events-none" />
            
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-emerald-500/30 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all duration-300">
                {profile.icon}
              </div>
              
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="font-sans font-medium text-sm text-white/90 mb-1.5 group-hover:text-emerald-400 transition-colors">
                  {profile.name}
                </h4>
                <p className="text-[11px] text-white/40 leading-relaxed mb-3">
                  {profile.description}
                </p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-mono text-white/60 uppercase tracking-widest border border-white/10 group-hover:border-white/20 transition-colors">
                  {profile.archetype}
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
      
      <div className="p-4 rounded-xl bg-[#0a0505] border border-red-500/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.02)] flex items-start gap-3 mt-4">
        <AlertTriangle className="w-4 h-4 text-red-500/80 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-white/50 leading-relaxed">
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
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
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
    icon: <Target className="w-5 h-5 text-orange-400" />,
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
    icon: <Brain className="w-5 h-5 text-cyan-400" />,
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
    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
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
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
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
    icon: <Target className="w-5 h-5 text-blue-400" />,
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
