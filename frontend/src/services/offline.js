// Offline service — all data stored locally in localStorage
// No API calls, fully self-contained

const STORAGE_KEYS = {
  USER: 'nouvel_user',
  PROFILE: 'nouvel_profile',
  ASSESSMENT: 'nouvel_assessment',
  JOURNAL: 'nouvel_journal_entries',
  PRACTICES: 'nouvel_practices_completed',
  PROGRESS: 'nouvel_progress',
};

export const offlineService = {
  // Auth
  getUser() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
  setUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  clearUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Profile
  getProfile() {
    const profile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return profile ? JSON.parse(profile) : null;
  },
  setProfile(profile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  // Assessment
  getAssessment() {
    const assessment = localStorage.getItem(STORAGE_KEYS.ASSESSMENT);
    return assessment ? JSON.parse(assessment) : null;
  },
  setAssessment(assessment) {
    localStorage.setItem(STORAGE_KEYS.ASSESSMENT, JSON.stringify(assessment));
  },

  // Journal entries
  addJournalEntry(entry) {
    const entries = this.getJournalEntries();
    const newEntry = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      favorite: false,
      ...entry,
    };
    entries.push(newEntry);
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(entries));
    return newEntry;
  },
  getJournalEntries(filter = '') {
    const entries = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    let items = entries ? JSON.parse(entries) : [];
    if (filter) {
      items = items.filter((e) =>
        e.tags?.toLowerCase().includes(filter.toLowerCase()) ||
        e.journal_text?.toLowerCase().includes(filter.toLowerCase())
      );
    }
    return items;
  },
  toggleFavorite(id) {
    const entries = this.getJournalEntries();
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      entry.favorite = !entry.favorite;
      localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(entries));
    }
  },

  // Practices completion
  completePractice(id) {
    const completed = localStorage.getItem(STORAGE_KEYS.PRACTICES);
    const list = completed ? JSON.parse(completed) : [];
    if (!list.includes(id)) list.push(id);
    localStorage.setItem(STORAGE_KEYS.PRACTICES, JSON.stringify(list));
  },
  isPracticeCompleted(id) {
    const completed = localStorage.getItem(STORAGE_KEYS.PRACTICES);
    return completed ? JSON.parse(completed).includes(id) : false;
  },
  getCompletedPractices() {
    const completed = localStorage.getItem(STORAGE_KEYS.PRACTICES);
    return completed ? JSON.parse(completed).length : 0;
  },

  // Progress tracking
  updateProgress() {
    const entries = this.getJournalEntries();
    const completed = this.getCompletedPractices();
    const streak = this.calculateStreak();
    const progress = {
      entryCount: entries.length,
      completedPractices: completed,
      streak,
      lastUpdate: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    return progress;
  },
  getProgress() {
    this.updateProgress(); // Update before returning
    const progress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return progress ? JSON.parse(progress) : { entryCount: 0, completedPractices: 0, streak: 0 };
  },
  calculateStreak() {
    const entries = this.getJournalEntries().sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    let streak = 0;
    let lastDate = null;
    for (const entry of entries) {
      const entryDate = new Date(entry.created_at).toDateString();
      if (!lastDate) {
        lastDate = entryDate;
        streak = 1;
      } else {
        const last = new Date(lastDate);
        const curr = new Date(entryDate);
        const diff = (last - curr) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          streak++;
          lastDate = entryDate;
        } else {
          break;
        }
      }
    }
    return streak;
  },
};