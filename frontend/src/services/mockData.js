// Mock data for offline mode
export const ASSESSMENT_QUESTIONS = [
  {
    id: 'q1',
    text: 'How would you describe your current emotional state?',
    options: ['Overwhelmed', 'Neutral', 'Grounded', 'Energized'],
  },
  {
    id: 'q2',
    text: 'What aspect of your life needs the most attention?',
    options: ['Work/Career', 'Relationships', 'Health', 'Personal growth'],
  },
  {
    id: 'q3',
    text: 'How often do you practice self-reflection?',
    options: ['Rarely', 'Occasionally', 'Regularly', 'Daily'],
  },
  {
    id: 'q4',
    text: 'What is your biggest obstacle to clarity?',
    options: ['Constant distraction', 'Overthinking', 'Fear', 'Lack of direction'],
  },
  {
    id: 'q5',
    text: 'How do you typically cope with stress?',
    options: ['Social withdrawal', 'Activity/distraction', 'Talking it out', 'Journaling/reflection'],
  },
  {
    id: 'q6',
    text: 'What does "mastery" mean to you?',
    options: ['Control', 'Understanding', 'Balance', 'Growth'],
  },
  {
    id: 'q7',
    text: 'How aligned are your actions with your values?',
    options: ['Not at all', 'Somewhat', 'Mostly', 'Completely'],
  },
  {
    id: 'q8',
    text: 'What would meaningful progress look like in 3 months?',
    options: ['Inner peace', 'Clear goals', 'Better relationships', 'Renewed sense of purpose'],
  },
  {
    id: 'q9',
    text: 'How do you typically respond to setbacks?',
    options: ['Blame others', 'Spiral', 'Reflect and adapt', 'Bounce back quickly'],
  },
  {
    id: 'q10',
    text: 'What is your relationship with uncertainty?',
    options: ['I fear it', 'I accept it', 'I embrace it', 'I avoid it'],
  },
];

// Focus areas based on assessment answers
const FOCUS_AREAS_CATALOG = [
  { title: 'Emotional Clarity', description: 'Understanding and naming your feelings' },
  { title: 'Intentional Action', description: 'Aligning daily choices with deeper values' },
  { title: 'Inner Resilience', description: 'Building strength to navigate challenges' },
  { title: 'Relational Depth', description: 'Deepening connections with others and self' },
  { title: 'Purpose Discovery', description: 'Reconnecting with what truly matters' },
  { title: 'Mindful Presence', description: 'Grounding into the here and now' },
];

export function generateFocusAreas(answers) {
  // Simple rule-based logic (mimics the backend)
  // In production, this would be more sophisticated
  return FOCUS_AREAS_CATALOG.slice(0, 3).map((area, i) => ({
    ...area,
    id: i + 1,
  }));
}

export const PRACTICES = [
  {
    id: 1,
    title: '5-Minute Grounding',
    duration: '5 min',
    category: 'Mindfulness',
    description: 'A quick sensory exercise to anchor yourself in the present moment.',
    steps: [
      'Close your eyes. Notice 5 things you can see.',
      'Notice 4 things you can touch.',
      'Notice 3 things you can hear.',
      'Notice 2 things you can smell.',
      'Notice 1 thing you can taste.',
    ],
  },
  {
    id: 2,
    title: 'Values Reflection',
    duration: '10 min',
    category: 'Reflection',
    description: 'Reconnect with what truly matters to you.',
    steps: [
      'List 3 core values you hold.',
      'For each, write one way today honored that value.',
      'Identify one action for tomorrow aligned with these values.',
    ],
  },
  {
    id: 3,
    title: 'Breath Awareness',
    duration: '7 min',
    category: 'Mindfulness',
    description: 'Calm your nervous system through intentional breathing.',
    steps: [
      'Sit comfortably. Breathe in for 4 counts.',
      'Hold for 4 counts. Exhale for 4 counts.',
      'Repeat for 7 rounds, noticing any shifts in your body.',
    ],
  },
  {
    id: 4,
    title: 'Gratitude Practice',
    duration: '5 min',
    category: 'Positivity',
    description: 'Shift perspective by acknowledging what you appreciate.',
    steps: [
      'Write 3 things (big or small) you are grateful for today.',
      'For each, note why it matters.',
      'Notice how your mood shifts as you reflect.',
    ],
  },
  {
    id: 5,
    title: 'Body Scan',
    duration: '8 min',
    category: 'Mindfulness',
    description: 'Develop awareness of how emotions live in your body.',
    steps: [
      'Lie down. Start at the top of your head.',
      'Slowly move attention through each body part.',
      'Notice sensations without judgment.',
      'End at your feet.',
    ],
  },
];

export const DAILY_PROMPTS = [
  'What felt true about you today?',
  'If today had a color, what would it be? Why?',
  'What small moment brought you peace?',
  'Where did you feel most like yourself?',
  'What do you need to hear right now?',
  'What are you learning about yourself?',
  'If fear were not a factor, what would you do?',
  'How did you honor yourself today?',
  'What boundary do you need to set?',
  'What are you becoming?',
];

export function getDailyPrompt() {
  return DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
}

export const AI_RESPONSES = [
  'That sounds like a significant moment for you. What feels most important about it?',
  'I hear you. Tell me more about what that brings up for you.',
  'There is depth in what you are sharing. What does your intuition say?',
  'That resonates. How does that align with what you value?',
  'I am with you. What would it feel like to sit with this feeling?',
  'There is wisdom in your reflection. What would you do if you trusted yourself completely?',
  'That is meaningful. How might this be an invitation for growth?',
  'I sense there is more here. What else wants to be known?',
  'That is a powerful observation. How can you honor that knowing?',
  'There is clarity emerging. What action feels right?',
];

export function getAIResponse(userMessage) {
  // Simple random response (in production, use actual LLM)
  return AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
}