(function initEngine(root) {
  function normalizeText(value) {
    return String(value || '')
      .replace(/[’‘]/g, "'")
      .replace(/[，。？！,.!?;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function testPattern(pattern, text) {
    if (!pattern) return true;
    pattern.lastIndex = 0;
    return pattern.test(text);
  }

  function evaluateRule(rule, answer) {
    const text = normalizeText(answer);
    if (!text) {
      return {
        ok: false,
        intentOK: false,
        formOK: false,
        missingFacts: (rule.required || []).length,
        evidence: 'none',
        text
      };
    }

    const intentOK = testPattern(rule.intent, text);
    const formOK = testPattern(rule.form, text);
    const required = rule.required || [];
    const missingFacts = required.filter((pattern) => !testPattern(pattern, text)).length;
    const ok = intentOK && missingFacts === 0;
    const evidence = !ok ? 'none' : formOK ? 'independent' : 'needs_confirmation';

    return { ok, intentOK, formOK, missingFacts, evidence, text };
  }

  function formatText(text, profile) {
    return String(text || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      const value = profile && profile[key];
      return value === undefined || value === null || value === '' ? match : String(value);
    });
  }

  function createCampProgress() {
    return {
      completed: [],
      skipped: [],
      evidence: [],
      skills: {}
    };
  }

  function completeCampNode(progress, nodeId, options) {
    const support = (options && options.support) || 'independent';
    const next = {
      ...progress,
      completed: [...(progress.completed || [])],
      skipped: [...(progress.skipped || [])],
      evidence: [...(progress.evidence || [])],
      skills: { ...(progress.skills || {}) }
    };
    if (!next.completed.includes(nodeId)) next.completed.push(nodeId);
    const status = support === 'independent' ? 'independent' : support === 'seen' ? 'seen' : 'prompted';
    next.skills[nodeId] = {
      status,
      support,
      completedAt: new Date().toISOString()
    };
    next.evidence.push({
      nodeId,
      support,
      status,
      createdAt: new Date().toISOString()
    });
    return next;
  }

  function skipCampNode(progress, nodeId) {
    return {
      ...progress,
      skipped: [...(progress.skipped || []), nodeId],
      completed: [...(progress.completed || [])],
      evidence: [...(progress.evidence || [])],
      skills: { ...(progress.skills || {}) }
    };
  }

  function recommendBand(progress) {
    const completed = (progress && progress.completed) || [];
    const l0Done = ['BASE-L0-SOUND', 'BASE-L0-CHUNK', 'BASE-L0-SKELETON', 'BASE-L0-VERB', 'BASE-L0-TALK']
      .every((id) => completed.includes(id));
    const l1Done = ['BASE-L1-SOUND', 'BASE-L1-CHUNK', 'BASE-L1-SKELETON', 'BASE-L1-VERB', 'BASE-L1-TALK']
      .every((id) => completed.includes(id));
    if (l1Done) return 'L2';
    if (l0Done) return 'L1';
    return 'L0';
  }

  function createChapterState(profile, band) {
    const safeProfile = {
      name: 'Lin',
      purpose: 'sightseeing',
      stay: 'about ten days',
      lodging: 'the Riverside Hotel',
      city: 'Osaka',
      phoneLast4: '2187',
      hasDriver: true,
      ...(profile || {})
    };
    return {
      sceneId: 'CH1-S1',
      taskId: 'CH1-T1',
      band: band || 'L1',
      itemIndex: 0,
      profile: safeProfile,
      bag_status: null,
      pickup_choice: null,
      meeting_place: null,
      meeting_confirmed: false,
      driver_confirmed: false,
      vehicle_confirmed: false,
      destination_confirmed: false,
      bag_told_to_driver: false,
      left_pickup_without_confirmation: false,
      endingId: null,
      evidence: []
    };
  }

  function applyChoice(state, option) {
    const sets = (option && option.set) || {};
    return {
      ...state,
      ...sets,
      sceneId: option && option.next ? option.next : state.sceneId,
      itemIndex: option && option.next ? 0 : state.itemIndex
    };
  }

  function resolveEnding(state) {
    if (state.left_pickup_without_confirmation) return 'bad';
    const allConfirmed = state.meeting_confirmed &&
      state.driver_confirmed &&
      state.vehicle_confirmed &&
      state.destination_confirmed;
    if (!allConfirmed) return null;
    if (state.bag_status === 'recovered') return 'best';
    if (state.bag_status === 'pending_delivery') return 'normal';
    return null;
  }

  function addChapterEvidence(state, abilityId, result) {
    return {
      ...state,
      evidence: [
        ...(state.evidence || []),
        {
          abilityId,
          evidence: result.evidence,
          intentOK: result.intentOK,
          formOK: result.formOK,
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  function seedNumber(seed) {
    let value = 2166136261;
    for (const char of String(seed || '')) {
      value ^= char.charCodeAt(0);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function shuffleOptions(options, seed) {
    const copy = [...options];
    let value = seedNumber(seed);
    for (let index = copy.length - 1; index > 0; index--) {
      value += 0x6D2B79F5;
      let mixed = value;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      const random = ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
      const swapIndex = Math.floor(random * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  const api = {
    normalizeText,
    evaluateRule,
    formatText,
    createCampProgress,
    completeCampNode,
    skipCampNode,
    recommendBand,
    createChapterState,
    applyChoice,
    resolveEnding,
    addChapterEvidence,
    shuffleOptions
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CourseEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
