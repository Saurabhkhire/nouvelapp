// Assessment questions (PRD §6 Screen 6) and category mapping used by the
// rule-based focus-area engine. Each option maps to one or more growth categories.

export const QUESTIONS = [
  {
    id: 1,
    category: 'Purpose',
    text: 'What area of your life feels most unclear right now?',
    options: [
      { label: 'My emotions', categories: ['Emotional regulation'] },
      { label: 'My relationships', categories: ['Relationships'] },
      { label: 'My purpose', categories: ['Purpose'] },
      { label: 'My confidence', categories: ['Confidence'] },
      { label: 'My daily habits', categories: ['Consistency'] },
    ],
  },
  {
    id: 2,
    category: 'Purpose',
    text: 'What do you desire most in this season of your life?',
    options: [
      { label: 'More peace', categories: ['Nervous system'] },
      { label: 'More clarity', categories: ['Purpose'] },
      { label: 'More confidence', categories: ['Confidence'] },
      { label: 'More discipline', categories: ['Discipline'] },
      { label: 'More emotional balance', categories: ['Emotional regulation'] },
      { label: 'More alignment', categories: ['Self-trust'] },
    ],
  },
  {
    id: 3,
    category: 'Emotional regulation',
    text: 'When you feel overwhelmed, what do you usually do?',
    options: [
      { label: 'Shut down', categories: ['Nervous system'] },
      { label: 'Overthink', categories: ['Emotional regulation'] },
      { label: 'Distract myself', categories: ['Consistency'] },
      { label: 'Push through', categories: ['Stress'] },
      { label: 'Talk to someone', categories: ['Relationships'] },
      { label: 'Journal or reflect', categories: ['Self-trust'] },
    ],
  },
  {
    id: 4,
    category: 'Self-worth',
    text: 'Which statement feels most true right now?',
    options: [
      { label: "I know I'm meant for more, but I feel blocked", categories: ['Purpose'] },
      { label: 'I want to trust myself more', categories: ['Self-trust'] },
      { label: 'I need to slow down and reconnect', categories: ['Nervous system'] },
      { label: 'I want stronger boundaries', categories: ['Relationships'] },
      { label: 'I want to become more consistent', categories: ['Consistency'] },
    ],
  },
  {
    id: 5,
    category: 'Purpose',
    text: 'What do you want Nouvel to help you with most?',
    options: [
      { label: 'Understanding myself better', categories: ['Self-trust'] },
      { label: 'Creating better habits', categories: ['Consistency'] },
      { label: 'Healing emotionally', categories: ['Emotional regulation'] },
      { label: 'Building confidence', categories: ['Confidence'] },
      { label: 'Strengthening my mindset', categories: ['Discipline'] },
      { label: 'Feeling more aligned', categories: ['Purpose'] },
    ],
  },
  {
    id: 6,
    category: 'Self-trust',
    text: 'How connected do you currently feel to yourself?',
    options: [
      { label: 'Very disconnected', categories: ['Self-trust', 'Nervous system'] },
      { label: 'Somewhat disconnected', categories: ['Self-trust'] },
      { label: 'Neutral', categories: ['Self-worth'] },
      { label: 'Somewhat connected', categories: ['Confidence'] },
      { label: 'Very connected', categories: ['Purpose'] },
    ],
  },
  {
    id: 7,
    category: 'Emotional regulation',
    text: 'What pattern do you want to shift?',
    options: [
      { label: 'Self-doubt', categories: ['Confidence'] },
      { label: 'People pleasing', categories: ['Relationships'] },
      { label: 'Overthinking', categories: ['Emotional regulation'] },
      { label: 'Avoidance', categories: ['Discipline'] },
      { label: 'Inconsistency', categories: ['Consistency'] },
      { label: 'Fear of change', categories: ['Self-trust'] },
    ],
  },
  {
    id: 8,
    category: 'Nervous system',
    text: 'How do you want to feel daily?',
    options: [
      { label: 'Peaceful', categories: ['Nervous system'] },
      { label: 'Powerful', categories: ['Confidence'] },
      { label: 'Clear', categories: ['Purpose'] },
      { label: 'Grounded', categories: ['Self-trust'] },
      { label: 'Inspired', categories: ['Discipline'] },
      { label: 'Emotionally safe', categories: ['Emotional regulation'] },
    ],
  },
  {
    id: 9,
    category: 'Purpose',
    text: 'What kind of support feels best for you?',
    options: [
      { label: 'Gentle reflection', categories: ['Emotional regulation'] },
      { label: 'Direct mindset shifts', categories: ['Discipline'] },
      { label: 'Emotional processing', categories: ['Emotional regulation'] },
      { label: 'Practical daily action', categories: ['Consistency'] },
      { label: 'Spiritual guidance', categories: ['Purpose'] },
      { label: 'A mix of all', categories: ['Self-trust'] },
    ],
  },
  {
    id: 10,
    category: 'Self-worth',
    text: 'What are you becoming?',
    options: [
      { label: 'More confident', categories: ['Confidence'] },
      { label: 'More peaceful', categories: ['Nervous system'] },
      { label: 'More disciplined', categories: ['Discipline'] },
      { label: 'More emotionally secure', categories: ['Emotional regulation'] },
      { label: 'More aligned', categories: ['Self-trust'] },
      { label: 'More powerful in my identity', categories: ['Confidence'] },
    ],
  },
];

// Catalog of focus areas (PRD §7 Feature 2). Keyed by the category that most
// drives them, with a personalized explanation template.
export const FOCUS_AREA_CATALOG = {
  Relationships: {
    title: 'Relationship Clarity & Emotional Boundaries',
    desc: 'You may be learning how to protect your energy, communicate more clearly, and create relationships that feel emotionally safe and aligned.',
  },
  'Nervous system': {
    title: 'Deepening Peace Over Performance',
    desc: 'Your growth may come from learning how to slow down, regulate your nervous system, and stop measuring your worth only by how much you accomplish.',
  },
  Confidence: {
    title: 'Strengthening Confidence in Identity',
    desc: 'You may benefit from expressing your needs, desires, and truth with more confidence, calmness, and self-trust.',
  },
  'Emotional regulation': {
    title: 'Releasing Overthinking & Emotional Loops',
    desc: 'Your next level may come from meeting your emotions with steadiness, so reactions become responses and overthinking loosens its grip.',
  },
  'Self-worth': {
    title: 'Rebuilding Self-Worth from Within',
    desc: 'You may be reclaiming a sense of worth that is sourced from within, independent of approval, output, or comparison.',
  },
  'Self-trust': {
    title: 'Expanding Trust in Your Own Standards',
    desc: 'Your growth may center on trusting your inner knowing and honoring your own standards instead of seeking external certainty.',
  },
  Consistency: {
    title: 'Creating Consistency Through Self-Devotion',
    desc: 'You may be building gentle, repeatable rhythms so consistency feels like devotion to yourself rather than pressure.',
  },
  Discipline: {
    title: 'Strengthening Aligned Discipline',
    desc: 'You may benefit from discipline that flows from alignment and care — steady action that matches who you are becoming.',
  },
  Purpose: {
    title: 'Clarifying Purpose & Direction',
    desc: 'Your next chapter may ask for clarity about what matters most, so your daily choices point toward a direction that feels true.',
  },
  Stress: {
    title: 'Protecting Nervous System Balance',
    desc: 'You may be learning to recognize early signs of overwhelm and create space to recover before stress accumulates.',
  },
};
