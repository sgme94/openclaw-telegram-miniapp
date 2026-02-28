// Project State Management API
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'project-state.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Simple JSON-based storage (can be replaced with SQLite)
const store = {
  projects: [],
  events: [],
  blockers: [],
  standups: []
};

// Load existing data
function load() {
  try {
    const dbPath = path.join(DATA_DIR, 'project-state.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      Object.assign(store, data);
    }
  } catch (e) {
    console.warn('[ProjectState] Failed to load data:', e.message);
  }
}

// Save data
function save() {
  try {
    const dbPath = path.join(DATA_DIR, 'project-state.json');
    fs.writeFileSync(dbPath, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error('[ProjectState] Failed to save data:', e.message);
  }
}

// Initialize
load();

// API Functions
const api = {
  // Projects
  createProject(name, phase = 'planning') {
    const project = {
      id: `proj_${Date.now()}`,
      name,
      status: 'active',
      current_phase: phase,
      created_at: new Date().toISOString(),
      last_update: new Date().toISOString()
    };
    store.projects.push(project);
    save();
    return project;
  },

  updateProject(projectId, updates) {
    const project = store.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');
    
    Object.assign(project, updates, { last_update: new Date().toISOString() });
    save();
    return project;
  },

  getProjects() {
    return store.projects;
  },

  getProject(projectId) {
    return store.projects.find(p => p.id === projectId);
  },

  // Events
  logEvent(projectId, eventType, description, context = '') {
    const event = {
      id: `evt_${Date.now()}`,
      project_id: projectId,
      event_type: eventType,  // progress, blocker, decision, pivot
      description,
      context,
      timestamp: new Date().toISOString()
    };
    store.events.push(event);
    
    // Update project status based on event type
    if (eventType === 'blocker') {
      this.createBlocker(projectId, description);
    }
    
    save();
    return event;
  },

  getEvents(projectId, limit = 20) {
    let events = store.events.filter(e => e.project_id === projectId);
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return events.slice(0, limit);
  },

  // Blockers
  createBlocker(projectId, blockerText) {
    const blocker = {
      id: `blk_${Date.now()}`,
      project_id: projectId,
      blocker_text: blockerText,
      status: 'open',
      created_at: new Date().toISOString()
    };
    store.blockers.push(blocker);
    save();
    return blocker;
  },

  resolveBlocker(blockerId, resolvedBy = 'system') {
    const blocker = store.blockers.find(b => b.id === blockerId);
    if (!blocker) throw new Error('Blocker not found');
    
    blocker.status = 'resolved';
    blocker.resolved_at = new Date().toISOString();
    blocker.resolved_by = resolvedBy;
    save();
    return blocker;
  },

  getBlockers(projectId, status = 'open') {
    let blockers = store.blockers.filter(b => b.project_id === projectId);
    if (status) {
      blockers = blockers.filter(b => b.status === status);
    }
    return blockers;
  },

  // Standups
  createStandup(date, summary, stats) {
    const standup = {
      id: `std_${Date.now()}`,
      date,
      summary,
      projects_covered: stats.projects || 0,
      events_count: stats.events || 0,
      commits_count: stats.commits || 0,
      blockers_count: stats.blockers || 0,
      created_at: new Date().toISOString()
    };
    store.standups.push(standup);
    save();
    return standup;
  },

  getStandups(limit = 7) {
    return store.standups.slice(-limit);
  },

  // Dashboard data
  getDashboard() {
    const projects = store.projects.map(p => {
      const events = store.events.filter(e => e.project_id === p.id).length;
      const blockers = store.blockers.filter(b => b.project_id === p.id && b.status === 'open').length;
      return {
        ...p,
        events_count: events,
        open_blockers: blockers
      };
    });

    const recentEvents = store.events
      .slice(-10)
      .map(e => ({
        ...e,
        project_name: store.projects.find(p => p.id === e.project_id)?.name || 'Unknown'
      }));

    const openBlockers = store.blockers.filter(b => b.status === 'open');

    return {
      projects,
      recentEvents,
      openBlockers,
      totalProjects: store.projects.length,
      activeProjects: store.projects.filter(p => p.status === 'active').length
    };
  }
};

module.exports = api;
