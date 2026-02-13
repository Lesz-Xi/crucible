# Interactive Educational System - Design Plan
**Option B: Complete Replacement with Productivity-Focused Features**

## Vision
Transform the education page from passive data display into an **active learning companion** that empowers students to understand their learning patterns, experiment with interventions, track progress, and build sustainable study habits through causal reasoning.

---

## Core Principles for Student Productivity

### 1. **Evidence-Based Design**
Every feature rooted in learning science research (Roediger, Dweck, Ericsson, Cepeda, etc.)

### 2. **Actionability Over Information**
Students don't just see data—they get specific next steps

### 3. **Gradual Engagement**
Progressive disclosure: simple → intermediate → advanced features

### 4. **Ownership & Agency**
Students control their data, set their own goals, run their own experiments

### 5. **Feedback Loops**
Immediate visual feedback on hypothetical changes before committing

---

## Feature Set Overview

| Feature | Purpose | Learning Science Basis |
|---------|---------|------------------------|
| **Causal Graph Explorer** | Understand personal learning system | Mental models (Craik & Lockhart, 1972) |
| **What-If Simulator** | Test interventions before committing | Counterfactual reasoning (Pearl, 2018) |
| **Intervention Lab** | Compare strategies side-by-side | Comparative evaluation (Dunlosky et al., 2013) |
| **Progress Tracker** | Visualize improvement over time | Growth mindset reinforcement (Dweck, 2006) |
| **Study Contract** | Set goals with micro-commitments | Implementation intentions (Gollwitzer, 1999) |
| **Reflection Journal** | Weekly check-ins with prompts | Metacognitive monitoring (Zimmerman, 2002) |
| **Insight Library** | Save discoveries for later review | Spaced retrieval (Cepeda et al., 2006) |
| **Accountability Buddy** | Opt-in reminders & nudges | Social accountability (Cialdini, 2006) |

---

## Detailed Feature Specifications

### 1. Interactive Causal Graph Explorer

**What It Does:**
- Visualizes student's causal graph as clickable network
- Nodes show current values (0-10 scales)
- Edges show strength as thickness/opacity
- Click node → see:
  - **Definition** (what this means)
  - **Research** (why it matters, with citations)
  - **Current state** (your value vs. benchmark)
  - **Interventions** (what you can do about it)

**Interaction Flow:**
```
Student clicks "Motivation" node
  → Modal opens with:
     - "Motivation combines intrinsic love of learning + extrinsic goal-drive"
     - Your score: 6.2/10 (above average for juniors)
     - Research: "Self-Determination Theory (Deci & Ryan, 2000) shows intrinsic motivation predicts..."
     - 3 evidence-based interventions to try
```

**Visual Design:**
- Wabi-Sabi aesthetics: organic curves, earthy tones
- Nodes pulse subtly to show "aliveness"
- Bottleneck node has gentle amber glow
- Leverage point has emerald highlight
- Hover shows mini-preview (no click required)

**Implementation:**
- Use D3.js or Cytoscape.js for graph rendering
- Store node positions in localStorage (persistent layout)
- Animate transitions when values change

---

### 2. What-If Simulator

**What It Does:**
- Drag sliders to change node values
- See downstream effects propagate in real-time
- Compare "Current State" vs. "Simulated State"
- Lock in changes as a "commitment" (saves as goal)

**Interaction Flow:**
```
Student moves "Study Habits" slider from 5 → 8
  → Graph animates:
     - "Practice Quality" increases 5 → 7.2 (80% causal strength)
     - "Performance" increases 6 → 7.8 (90% causal strength from practice)
  → Side panel shows:
     - Expected gain: +1.8 points
     - Required effort: Moderate (3 weeks of consistency)
     - Interventions to get there: [Spaced Repetition, Active Recall]
```

**Counterfactual Scenarios:**
- Preset scenarios:
  - "What if I had perfect sleep?"
  - "What if family support was stronger?"
  - "What if I started with zero motivation?"
- Custom scenario builder

**Implementation:**
- React state for simulated values
- Causal propagation algorithm (breadth-first traversal)
- Debounced slider updates (smooth animation)
- "Reset" button to restore current state
- "Commit as Goal" button to save simulation

---

### 3. Intervention Comparison Lab

**What It Does:**
- Side-by-side comparison of 2-3 interventions
- Show expected gains, effort cost, time to effect
- Highlight trade-offs (high gain but high effort vs. low gain but easy)
- Students rate interventions based on personal constraints

**Comparison Table:**
```
| Intervention           | Gain | Effort | Time  | Fit for You        |
|------------------------|------|--------|-------|--------------------|
| Spaced Repetition      | +8   | High   | 4 wks | ⭐⭐⭐ (if you can commit) |
| Active Recall Protocol | +7.5 | Med    | 2 wks | ⭐⭐⭐⭐ (quick wins)       |
| Sleep Hygiene          | +4   | Low    | 1 wk  | ⭐⭐⭐⭐⭐ (easy start)      |
```

**Personal Constraint Filter:**
- Time available per week: Slider (0-20 hours)
- Willingness to change routine: Low/Med/High
- Deadline pressure: None/Moderate/High

**Implementation:**
- Checkbox multi-select for interventions
- Filter algorithm based on constraints
- "Fit Score" calculated from constraint match
- Expand/collapse for detailed mechanism explanation

---

### 4. Progress Tracker (Longitudinal View)

**What It Does:**
- Line graph showing node values over time
- Compare "You vs. Benchmark" (aggregate data from other students)
- Annotate interventions tried (markers on timeline)
- Show correlation: "When you did X, Y improved"

**Visualizations:**
- **Line Chart:** Node values over weeks/months
- **Heatmap:** Which days you studied vs. performance
- **Intervention Timeline:** Visual markers for when you tried each strategy

**Insight Generation:**
```
AI-detected pattern:
  "Your Performance consistently dips after low-sleep weeks.
   But when Sleep Quality > 7, you score 15% higher on quizzes.
   Consider: Sleep Hygiene intervention."
```

**Implementation:**
- Store weekly snapshots in database
- Chart.js or Recharts for visualizations
- Pattern detection algorithm (correlation + lag analysis)
- Export data as CSV for external analysis

---

### 5. Study Contract (Goal Setting)

**What It Does:**
- Student sets SMART goals with system's guidance
- Break large goals into micro-commitments
- Daily/weekly check-ins with progress bars
- Celebration moments when milestones hit

**Contract Template:**
```
Goal: Improve "Study Habits" from 5 → 7 by Week 8

Micro-commitments:
  Week 1-2: Use Anki 15 min/day, 5 days/week
  Week 3-4: Add practice tests on Fridays
  Week 5-6: Join study group 2x/week
  Week 7-8: Maintain all habits + self-assess

Success Metrics:
  - Anki streak: [■■■■■■□] 6/7 days this week
  - Practice tests completed: [■■□] 2/3 done
  - Study group: [■■] 2/2 attended
```

**Accountability Features:**
- "Tell a friend" button (share contract)
- Opt-in SMS reminders
- Weekly reflection prompts
- "Break the chain" calendar (Seinfeld method)

**Implementation:**
- Goal state stored in database
- Push notifications via service worker (optional)
- Reflection prompts triggered by cron job
- Progress visualization with animated bars

---

### 6. Reflection Journal

**What It Does:**
- Guided weekly check-ins with prompts
- Metacognitive questions based on learning science
- Track subjective well-being vs. performance
- Identify friction points ("What's blocking you?")

**Prompt Examples:**
```
Week 3 Reflection:

1. What study technique surprised you this week? Why?
2. When did you feel most focused? Least focused?
3. If you could change one thing about your study environment, what would it be?
4. Rate this week: Effort (1-10) ___ | Effectiveness (1-10) ___
5. Next week's micro-experiment: _____________
```

**Implementation:**
- Markdown editor for freeform responses
- Save entries to database
- Optional: sentiment analysis on responses
- Timeline view of past reflections
- Export as journal

---

### 7. Insight Library (Save & Review)

**What It Does:**
- Bookmark key insights from analyses
- Tag insights by category (bottleneck, intervention, correlation)
- Spaced retrieval: System surfaces old insights at intervals
- Search/filter saved insights

**Example Saved Insight:**
```
📌 Saved Insight - Feb 3, 2026

Causal Discovery:
  "Your 'Family Support' score (7/10) strongly predicts 'Motivation' (6/10).
   When family support drops below 5, your study consistency declines within 1 week."

Tagged: #bottleneck #family_support
Recommended Action: Communicate weekly study goals to family
```

**Implementation:**
- Insight model in database (user_id, content, tags, created_at)
- Spaced retrieval algorithm (show insights at increasing intervals)
- Full-text search on insights
- Export as PDF report

---

### 8. Accountability Buddy (Optional Nudges)

**What It Does:**
- Opt-in nudge system (not forced)
- Gentle reminders based on study contract
- Encouragement messages after milestones
- Friction alerts ("You're breaking your streak—want to adjust goals?")

**Nudge Types:**
```
Daily:
  - "📚 15-min Anki session before lunch?"
  - "🎯 Today's micro-goal: Review Chapter 3 notes"

Weekly:
  - "🔍 Reflection time: How did this week's experiment go?"
  - "🌟 You hit 80% of your goals—celebrate with a break!"

Adaptive:
  - "⚠️ Sleep Quality dropped to 4/10 this week. Prioritize rest?"
  - "🚀 Your Progress bar is ahead of schedule—keep it up!"
```

**Customization:**
- Nudge frequency: None / Weekly / Daily
- Nudge channel: In-app only / Email / SMS (opt-in)
- Nudge tone: Supportive / Challenging / Neutral

**Implementation:**
- Nudge scheduler (cron jobs)
- Notification service (web push, email via Resend)
- A/B test nudge effectiveness
- User can pause/resume anytime

---

## Technical Architecture

### Frontend Components

```
/src/app/education/
  page.tsx                        // Main orchestrator
  components/
    IntakeForm.tsx                // Initial survey (existing)
    CausalGraphExplorer.tsx       // Interactive D3 graph
    NodeDetailModal.tsx           // Click node → show details
    WhatIfSimulator.tsx           // Slider panel for simulations
    InterventionComparison.tsx    // Side-by-side comparison table
    ProgressTracker.tsx           // Line charts over time
    StudyContract.tsx             // Goal setting + micro-commitments
    ReflectionJournal.tsx         // Weekly check-in prompts
    InsightLibrary.tsx            // Saved insights with search
    AccountabilitySettings.tsx    // Nudge preferences
```

### API Routes

```
/src/app/api/education/
  analyze-student/route.ts         // Existing
  optimize-intervention/route.ts   // Existing
  simulate-counterfactual/route.ts // NEW: What-if scenarios
  save-goal/route.ts               // NEW: Save study contract
  log-reflection/route.ts          // NEW: Save journal entries
  save-insight/route.ts            // NEW: Bookmark insights
  get-progress/route.ts            // NEW: Fetch historical data
  update-nudge-prefs/route.ts      // NEW: Accountability settings
```

### Database Extensions

```sql
-- Student goals
CREATE TABLE educational_goals (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES student_causal_profiles(id),
  target_node VARCHAR(100),
  current_value DECIMAL(3,2),
  target_value DECIMAL(3,2),
  deadline DATE,
  micro_commitments JSONB,
  progress_snapshots JSONB,
  status VARCHAR(50), -- 'active', 'achieved', 'abandoned'
  created_at TIMESTAMP
);

-- Reflection entries
CREATE TABLE reflection_journal (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES student_causal_profiles(id),
  week_number INTEGER,
  prompts JSONB,
  responses JSONB,
  sentiment_score DECIMAL(3,2), -- -1 to 1
  created_at TIMESTAMP
);

-- Saved insights
CREATE TABLE saved_insights (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES student_causal_profiles(id),
  insight_type VARCHAR(50), -- 'bottleneck', 'correlation', 'intervention'
  content TEXT,
  tags TEXT[],
  last_reviewed_at TIMESTAMP,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP
);

-- Progress snapshots (weekly)
CREATE TABLE progress_snapshots (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES student_causal_profiles(id),
  snapshot_date DATE,
  node_values JSONB, -- {FamilySupport: 7, Motivation: 6, ...}
  interventions_active TEXT[],
  subjective_well_being DECIMAL(3,2),
  created_at TIMESTAMP
);

-- Nudge preferences
CREATE TABLE nudge_preferences (
  profile_id UUID PRIMARY KEY REFERENCES student_causal_profiles(id),
  enabled BOOLEAN DEFAULT false,
  frequency VARCHAR(20), -- 'none', 'weekly', 'daily'
  channel VARCHAR(20), -- 'in_app', 'email', 'sms'
  tone VARCHAR(20), -- 'supportive', 'challenging', 'neutral'
  quiet_hours JSONB, -- {start: '22:00', end: '08:00'}
  updated_at TIMESTAMP
);
```

---

## User Journey Example

### Week 1: Discovery
1. Student completes intake form
2. Sees causal graph with bottleneck = "Study Habits"
3. Clicks "Study Habits" node → learns about deliberate practice
4. Explores "What If I improved this?" → sees +2.5 point gain in Performance
5. Saves insight: "Improving study habits has cascading effects"
6. Sets goal: "Study Habits 5 → 7 by Week 4"

### Week 2: Experimentation
1. Tries "Spaced Repetition" intervention (from recommendations)
2. Logs daily Anki sessions (15 min/day)
3. Weekly reflection: "Anki feels slow but I'm remembering more"
4. Progress tracker shows Study Habits 5 → 5.8
5. Receives nudge: "🎯 Consistency is key—keep going!"

### Week 3: Adjustment
1. Compares "Spaced Repetition" vs. "Active Recall" in Comparison Lab
2. Decides to add Active Recall (practice tests on Fridays)
3. Simulation shows combined approach → +3.2 point gain
4. Updates study contract with new micro-commitment
5. Reflection: "Practice tests reveal gaps I didn't know existed"

### Week 4: Reinforcement
1. Progress tracker shows Study Habits 5 → 7.2 ✅ (goal exceeded!)
2. Celebrates milestone with in-app animation
3. Reviews saved insights: "I underestimated the power of testing myself"
4. Sets new goal: "Practice Quality 6 → 8 by Week 8"
5. Shares progress with accountability buddy (optional)

### Week 8: Mastery
1. Performance improved from 6 → 8.5
2. Causal graph shows new bottleneck = "Content Engagement"
3. Student now understands own learning system
4. Exports full progress report as PDF for advisor meeting
5. Continues using tool for ongoing optimization

---

## Design Philosophy: Wabi-Sabi Meets Learning Science

### Visual Language
- **Earthy Palette:** Emerald (growth), Amber (caution), Clay (warmth)
- **Organic Shapes:** Rounded corners, flowing lines (not harsh rectangles)
- **Breathing Animations:** Subtle pulses, not jarring transitions
- **Imperfection Embraced:** Hand-drawn feel for graph edges

### Typography
- **Serif for warmth:** Georgia, Merriweather (results, explanations)
- **Mono for data:** JetBrains Mono (numbers, metrics)
- **Sans for UI:** Inter (buttons, labels)

### Accessibility
- High contrast ratios (WCAG AAA)
- Keyboard navigation for all interactions
- Screen reader support for graph nodes
- Reduced motion option

---

## Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Repeat usage** | 60% return within 1 week | Tool is genuinely useful |
| **Goal completion rate** | 40% achieve micro-commitment | Interventions are actionable |
| **Insight saves** | 3+ per student | Students find value |
| **Reflection engagement** | 50% complete weekly check-in | Metacognition is sticky |
| **Intervention trials** | 2+ strategies tested | Experimentation culture |
| **Performance improvement** | 20% show gains after 4 weeks | Causal interventions work |

---

## Implementation Roadmap

### Phase 1: Foundation (Completed)
- [x] Type definitions
- [x] EducationalSCM class
- [x] Database migration
- [x] API routes (analyze, optimize)
- [x] Basic UI

### Phase 2: Interactive Core (Current)
- [ ] Fix styling issues (spacing, highlighting)
- [ ] Add tooltips with research citations
- [ ] Build interactive causal graph (D3.js)
- [ ] Implement What-If simulator

### Phase 3: Productivity Features
- [ ] Intervention comparison tool
- [ ] Progress tracker with historical data
- [ ] Study contract with micro-commitments
- [ ] Reflection journal

### Phase 4: Persistence & Accountability
- [ ] Insight library with spaced retrieval
- [ ] Nudge system (opt-in)
- [ ] Export reports (PDF)
- [ ] Share progress (optional)

### Phase 5: Polish & Optimization
- [ ] Performance optimization (lazy loading)
- [ ] A/B testing on interventions
- [ ] User onboarding flow
- [ ] Mobile responsive design

---

## Research Citations (Embedded in UI)

Every claim will link to research:

```tsx
<Tooltip content="Roediger & Karpicke (2006) showed retrieval practice produces 
50% better retention than re-reading. [Read study →]">
  <span>Active Recall Protocol</span>
</Tooltip>
```

**Key Papers to Surface:**
1. Roediger & Karpicke (2006) - Testing Effect
2. Cepeda et al. (2006) - Spacing Effect meta-analysis
3. Dweck (2006) - Growth Mindset
4. Ericsson (1993) - Deliberate Practice
5. Zimmerman (2002) - Self-Regulated Learning
6. Dunlosky et al. (2013) - Effective Learning Techniques
7. Sweller (1988) - Cognitive Load Theory
8. Deci & Ryan (2000) - Self-Determination Theory

---

## Ethical Considerations

### Data Privacy
- All data de-identified (student_pseudonym, not real ID)
- FERPA-compliant (no PII in analysis)
- Students can delete all data anytime
- No data sharing without explicit consent

### Avoiding Harm
- No "shame" language (e.g., "You're lazy")
- Growth-oriented framing ("You're building habits")
- Encourage self-compassion in reflections
- Warn against over-optimization (burnout risk)

### Transparency
- Show how causal model works (not black box)
- Explain limitations (correlations ≠ causation for all)
- Provide opt-out for nudges
- Acknowledge individual differences

---

## Next Steps

1. **Switch to Code mode** to implement Phase 2
2. **Build interactive causal graph** first (highest value)
3. **Add What-If simulator** second (engagement driver)
4. **Iterate based on user feedback** (real student testing)

Ready to build the future of personalized learning?
