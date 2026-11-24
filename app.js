(function initCourseApp(root) {
  const SAVE_KEY = 'eng_next_v1';
  const DATA = root.CourseData;
  const ENGINE = root.CourseEngine;
  const LOOKUP = root.CourseLookup;
  const HANDBOOK = root.CourseHandbook;
  const EXAM = root.ExamKnowledge;
  const RULES = root.RulesStory;

  const DEFAULT_PROFILE = {
    name: 'Lin',
    purpose: 'sightseeing',
    stay: 'about ten days',
    lodging: 'the Riverside Hotel',
    city: 'Osaka',
    phoneLast4: '2187',
    hasDriver: true
  };

  let state;
  let lesson = null;
  let mounted = false;
  let toastTimer = null;
  let recognition = null;
  let currentSpeakText = '';
  let currentSpeakKind = 'narration';
  let lastChapterEnglish = '';
  let lastChapterKind = 'narration';
  let hintShown = false;
  let pendingChapterCheck = null;
  let lessonFailures = 0;
  let lookupSpeech = '';

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderLookupTokensOnly(text) {
    if (!LOOKUP) return escapeHtml(text);
    const segments = LOOKUP.segment(text);
    return segments.map((part) => {
      if (part.kind === 'text') return escapeHtml(part.text);
      return `<button class="lookup-token ${part.kind}" type="button" data-lookup-term="${escapeHtml(part.term)}" data-lookup-text="${escapeHtml(part.text)}">${escapeHtml(part.text)}</button>`;
    }).join('');
  }

  function renderLookupWordsOnly(text) {
    const source = String(text || '');
    const pattern = /[A-Za-z]+(?:[’'][A-Za-z]+)*(?:-[A-Za-z0-9]+)?|\d+(?::\d+)?|\d+-\d+/g;
    let output = '';
    let cursor = 0;
    for (const match of source.matchAll(pattern)) {
      output += escapeHtml(source.slice(cursor, match.index));
      const term = LOOKUP.normalize(match[0]);
      output += `<button class="lookup-token word" type="button" data-lookup-term="${escapeHtml(term)}" data-lookup-text="${escapeHtml(match[0])}">${escapeHtml(match[0])}</button>`;
      cursor = match.index + match[0].length;
    }
    output += escapeHtml(source.slice(cursor));
    return output;
  }

  function renderLookupText(text, sentenceZh, kind) {
    if (!LOOKUP) return escapeHtml(text);
    const body = renderLookupTokensOnly(text);
    return `<span class="interactive-english" data-sentence-en="${escapeHtml(text)}" data-sentence-zh="${escapeHtml(sentenceZh || '')}" data-sentence-kind="${escapeHtml(kind || 'narration')}">${body}<button class="sentence-lookup" type="button">整句</button></span>`;
  }

  function defaultState() {
    return {
      version: 1,
      profile: { ...DEFAULT_PROFILE },
      band: 'L1',
      storyVersion: 'L1',
      camp: ENGINE.createCampProgress(),
      stories: { airport: null, rules_horror: null },
      chapter: null
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(root.localStorage.getItem(SAVE_KEY));
      if (!parsed || typeof parsed !== 'object') return defaultState();
      return {
        ...defaultState(),
        ...parsed,
        profile: { ...DEFAULT_PROFILE, ...(parsed.profile || {}) },
        storyVersion: parsed.storyVersion || (parsed.chapter && parsed.chapter.band) || 'L1',
        camp: {
          ...ENGINE.createCampProgress(),
          ...(parsed.camp || {})
        },
        stories: {
          airport: parsed.stories && parsed.stories.airport ? parsed.stories.airport : null,
          rules_horror: parsed.stories && parsed.stories.rules_horror ? parsed.stories.rules_horror : null
        }
      };
    } catch (error) {
      return defaultState();
    }
  }

  function saveState() {
    try {
      if (state.chapter) {
        state.stories[state.chapter.storyId || 'airport'] = state.chapter;
      }
      root.localStorage.setItem(SAVE_KEY, JSON.stringify({
        version: state.version,
        profile: state.profile,
        band: state.band,
        storyVersion: state.storyVersion,
        camp: state.camp,
        stories: state.stories,
        chapter: state.chapter
      }));
      $('saveBadge').textContent = '已存本机';
      $('saveNotice').textContent = '最近保存：' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      $('saveBadge').textContent = '保存失败';
      $('saveNotice').textContent = '本机存储不可用。完成记录只能保留在当前页面。';
    }
  }

  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.hidden = screen.id !== id;
    });
    root.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hydrateProfile() {
    $('profileName').value = state.profile.name || '';
    $('profilePurpose').value = state.profile.purpose || 'sightseeing';
    $('profileStay').value = state.profile.stay || '';
    $('profileLodging').value = state.profile.lodging || '';
    $('profileCity').value = state.profile.city || '';
    $('bandSelect').value = state.band || 'L1';
    $('chapterBand').value = state.storyVersion || 'L1';
    $('rulesBand').value = state.storyVersion || 'L1';
  }

  function readProfile() {
    state.profile = {
      ...state.profile,
      name: $('profileName').value.trim() || DEFAULT_PROFILE.name,
      purpose: $('profilePurpose').value,
      stay: $('profileStay').value.trim() || DEFAULT_PROFILE.stay,
      lodging: $('profileLodging').value.trim() || DEFAULT_PROFILE.lodging,
      city: $('profileCity').value.trim() || DEFAULT_PROFILE.city
    };
    state.band = $('bandSelect').value;
    saveState();
    renderHomeStats();
  }

  function renderHomeStats() {
    const completed = (state.camp && state.camp.completed ? state.camp.completed.length : 0);
    const skipped = (state.camp && state.camp.skipped ? state.camp.skipped.length : 0);
    const chapterStatus = state.chapter
      ? state.chapter.storyId === 'rules_horror'
        ? state.chapter.endingId ? '规则怪谈已结束' : '规则怪谈中'
        : state.chapter.endingId ? '已到结局' : '进行中'
      : '未开始';
    $('homeStats').innerHTML = `
      <div class="stat"><b>${completed}/15</b><span>基础营完成</span></div>
      <div class="stat"><b>${skipped}</b><span>已跳过</span></div>
      <div class="stat"><b>${escapeHtml(state.band)}</b><span>基础营等级</span></div>
      <div class="stat"><b>${chapterStatus}</b><span>剧本进度</span></div>
    `;
  }

  function renderHome() {
    hydrateProfile();
    renderHomeStats();
    $('btnContinueChapter').hidden = !state.stories.airport;
    $('btnContinueRules').hidden = !state.stories.rules_horror;
    showScreen('screenHome');
  }

  function renderCamp() {
    const bands = [
      { id: 'L0', label: 'L0 · 能参与' },
      { id: 'L1', label: 'L1 · 能办成事' },
      { id: 'L2', label: 'L2 · 能处理小问题' }
    ];
    const html = bands.map((band) => {
      const nodes = DATA.baseCamp.nodes.filter((node) => node.band === band.id);
      const trial = DATA.baseCamp.trials.find((item) => item.band === band.id);
      return `
        <section class="band-section">
          <div class="band-head"><h2>${band.label}</h2><span>${nodes.length} 个微关卡 + 1 个阶段试炼</span></div>
          <div class="course-grid">
            ${nodes.map((node) => {
              const done = state.camp.completed.includes(node.id);
              const skipped = state.camp.skipped.includes(node.id);
              return `
                <button class="course-card ${done ? 'done' : ''} ${skipped ? 'skipped' : ''}" data-camp-id="${node.id}" type="button">
                  <span class="state-dot"></span>
                  <span class="tag">${escapeHtml(DATA.baseCamp.zones.find((zone) => zone.id === node.zoneId).title)}</span>
                  <h3>${escapeHtml(node.title)}</h3>
                  <p>${escapeHtml(node.ability)}</p>
                </button>`;
            }).join('')}
          </div>
          <div class="trial-row">
            <button class="trial-card" data-trial-id="${trial.id}" type="button">
              <strong>${escapeHtml(trial.title)}</strong>
              <p>${escapeHtml(trial.ability)}</p>
            </button>
          </div>
        </section>`;
    }).join('');
    $('campMap').innerHTML = html;
    $('campMap').querySelectorAll('[data-camp-id]').forEach((button) => {
      button.addEventListener('click', () => startCampItem(button.dataset.campId));
    });
    $('campMap').querySelectorAll('[data-trial-id]').forEach((button) => {
      button.addEventListener('click', () => startCampItem(button.dataset.trialId, true));
    });
    showScreen('screenCamp');
  }

  function renderHandbook(query) {
    const needle = String(query || '').trim().toLowerCase();
    const sample = HANDBOOK.curriculumSample;
    const sections = HANDBOOK.sections.filter((section) => {
      if (!needle) return true;
      return [section.title, section.summary, section.body, ...(section.examples || [])]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
    $('handbookGrid').innerHTML = sections.length ? sections.map((section) => `
      <article class="handbook-card" data-handbook-id="${escapeHtml(section.id)}">
        <span class="pill">${escapeHtml(section.level)}</span>
        <h2>${escapeHtml(section.title)}</h2>
        <p><strong>${escapeHtml(section.summary)}</strong></p>
        <p>${escapeHtml(section.body)}</p>
        ${(section.examples || []).map((example) => `<p class="handbook-example">${escapeHtml(example)}</p>`).join('')}
      </article>`).join('') : '<div class="notice">没有找到对应知识，可以换一个更短的关键词。</div>';
    $('handbookSources').innerHTML = `
      <h2>来源与当前边界</h2>
      <p class="muted">当前手册是基础营原型的知识索引，不等同于已经完整导入某一学段教材。后续会按官方课程标准建立完整清单。</p>
      <ul>${HANDBOOK.sources.map((source) => `<li>${escapeHtml(source)}</li>`).join('')}</ul>
      <h2>考试主路线</h2>
      <div class="exam-track-grid">
        ${Object.values(EXAM.tracks).map((track) => `
          <article class="handbook-card exam-track">
            <span class="pill">${escapeHtml(track.title)}</span>
            <h3>${escapeHtml(track.role)}</h3>
            <p>${escapeHtml(track.sourcePolicy)}</p>
            <p><strong>首批能力节点：</strong>${track.nodes.length} 个</p>
            <ul>${track.nodes.slice(0, 5).map((node) => `<li><strong>${escapeHtml(node.title)}</strong>：${escapeHtml(node.canDo)}</li>`).join('')}</ul>
          </article>`).join('')}
      </div>
      <h3>已核验版本</h3>
      <ul>${EXAM.sources.map((source) => `<li><strong>${escapeHtml(source.title)}</strong> · ${escapeHtml(source.publisher || '')} · ${escapeHtml(source.published || source.publishedYear || '')} ${source.isbn ? '· ISBN ' + escapeHtml(source.isbn) : ''}</li>`).join('')}</ul>`;
    $('curriculumSample').innerHTML = `
      <p class="eyebrow">${escapeHtml(sample.label)}</p>
      <h2>${escapeHtml(sample.title)}</h2>
      <p><span class="pill">${escapeHtml(sample.stage)}</span></p>
      <p><strong>来源：</strong>${escapeHtml(sample.sourceTitle)}</p>
      <p class="muted">${escapeHtml(sample.verification)}</p>
      <div class="handbook-grid">
        <div>
          <h3>本段学习目标</h3>
          <ul>${sample.objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
        <div>
          <h3>基础例句</h3>
          ${sample.examples.map((example) => `<p class="handbook-example">${escapeHtml(example)}</p>`).join('')}
        </div>
      </div>
      <p class="source-note">官方通知：<a href="${escapeHtml(sample.sourcePage)}" target="_blank" rel="noreferrer">教育部页面</a> · 英语课标附件：<a href="${escapeHtml(sample.sourcePdf)}" target="_blank" rel="noreferrer">PDF 链接</a></p>
      <p class="source-note">${escapeHtml(sample.nextCheck)}</p>`;
    showScreen('screenHandbook');
  }

  function startCampItem(id, isTrial) {
    const item = isTrial
      ? DATA.baseCamp.trials.find((entry) => entry.id === id)
      : DATA.baseCamp.nodes.find((entry) => entry.id === id);
    if (!item) return;
    lesson = {
      item,
      index: 0,
      resolved: false,
      support: 'independent',
      isTrial: Boolean(isTrial)
    };
    hintShown = false;
    lessonFailures = 0;
    showScreen('screenLesson');
    renderLessonStep();
  }

  function lessonSpeakerLine(name, english, chinese) {
    return `
      <div class="speaker-line">
        <div class="speaker-avatar">${escapeHtml((name || 'A').slice(0, 1))}</div>
        <div>
          <p class="speaker-name">${escapeHtml(name || 'NPC')}</p>
          <p class="english-line">${renderLookupText(english, chinese, currentSpeakKind)}</p>
          <p class="line-zh" hidden>${escapeHtml(chinese || '')}</p>
        </div>
      </div>`;
  }

  function renderLessonStep() {
    if (!lesson) return;
    const step = lesson.item.steps[lesson.index];
    if (!step) return finishCampItem();
    hintShown = false;
    lessonFailures = 0;
    currentSpeakText = '';
    currentSpeakKind = lesson.item.zoneId === 'talk' ? 'info' : 'officer';
    $('lessonEyebrow').textContent = `${lesson.item.band} · ${lesson.item.zoneId.toUpperCase()}`;
    $('lessonTitle').textContent = lesson.item.title;
    $('lessonGoal').textContent = lesson.item.ability;
    $('lessonProgress').style.width = `${Math.round((lesson.index / lesson.item.steps.length) * 100)}%`;
    $('lessonProgress').textContent = `${lesson.index + 1} / ${lesson.item.steps.length}`;
    $('feedback').textContent = '';
    $('feedback').className = 'feedback';
    $('hintBox').hidden = true;
    $('hintBox').textContent = '';
    $('lessonChoices').innerHTML = '';
    $('answerBox').hidden = true;
    $('btnContinue').hidden = true;
    $('lessonBody').innerHTML = '';

    if (step.kind === 'explain') {
      $('lessonBody').innerHTML = `
        <p class="eyebrow">FOUNDATION</p>
        <h2>${escapeHtml(step.title)}</h2>
        <p>${escapeHtml(step.body)}</p>
        <div class="explain-table">
          ${(step.rows || []).map((row) => `
            <div class="explain-row">
              <b>${escapeHtml(row.label)}</b>
              <span>${escapeHtml(row.form)}</span>
              <span>${escapeHtml(row.example)}</span>
            </div>`).join('')}
        </div>
        <p class="muted">${escapeHtml(step.note || '')}</p>`;
      $('btnSpeak').hidden = true;
      $('btnContinue').hidden = false;
      lesson.resolved = true;
      return;
    }

    if (step.kind === 'choice' || step.kind === 'apply') {
      $('btnSpeak').hidden = true;
      const label = step.kind === 'apply' ? 'TRANSFER · APPLY IT AGAIN' : 'CHOOSE';
      $('lessonBody').innerHTML = `<p class="eyebrow">${label}</p><h2>${renderLookupText(step.prompt, step.promptZh, 'narration')}</h2><p class="muted">${escapeHtml(step.promptZh || '')}</p>`;
      ENGINE.shuffleOptions(step.options, `${lesson.item.id}-${lesson.index}`).forEach((option, index) => {
        const row = document.createElement('div');
        row.className = 'choice-option';
        row.dataset.optionLabel = option.label;
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.type = 'button';
        button.textContent = option.label;
        button.addEventListener('click', () => {
          if (option.ok) {
            $('feedback').className = 'feedback good';
            $('feedback').textContent = '判断正确。';
            $('btnContinue').hidden = false;
            lesson.resolved = true;
          } else {
            $('feedback').className = 'feedback warn';
            const meaning = LOOKUP && LOOKUP.translateSentence(option.label);
            $('feedback').textContent = (meaning ? `这句意思是：“${meaning}”。 ` : '') + '再看一下题目中的交际目标，然后重选。';
          }
        });
        const help = document.createElement('button');
        help.className = 'option-help';
        help.type = 'button';
        help.textContent = '看意思';
        help.addEventListener('click', () => openOptionHelp(option));
        row.append(button, help);
        $('lessonChoices').appendChild(row);
      });
      return;
    }

    if (step.kind === 'speak') {
      $('btnSpeak').hidden = false;
      currentSpeakText = step.prompt;
      $('lessonBody').innerHTML = lessonSpeakerLine(step.npc, step.prompt, step.sentenceZh || step.promptZh);
      $('answerBox').hidden = false;
      $('answerInput').value = '';
      return;
    }

    if (step.kind === 'confirm') {
      $('btnSpeak').hidden = false;
      currentSpeakText = step.prompt;
      currentSpeakKind = 'officer';
      $('lessonBody').innerHTML = `
        <p class="eyebrow">QUICK CHECK</p>
        <h2>${renderLookupText(step.prompt, step.promptZh, currentSpeakKind)}</h2>
        <p class="muted">${escapeHtml(step.promptZh || '')}</p>`;
      $('answerBox').hidden = false;
      $('answerInput').value = '';
      $('hintBox').textContent = step.hint || '先不看答案，补全或替换一个关键词。';
    }
  }

  function evaluateCampAnswer(step, text) {
    if (step.kind === 'confirm') {
      const normalized = ENGINE.normalizeText(text);
      const ok = step.answers.some((answer) => normalized === ENGINE.normalizeText(answer));
      return { ok, intentOK: ok, formOK: ok, missingFacts: ok ? 0 : 1, evidence: ok ? 'independent' : 'none' };
    }
    return ENGINE.evaluateRule(step.rule, text);
  }

  function submitCampAnswer() {
    if (!lesson) return;
    const step = lesson.item.steps[lesson.index];
    const answer = $('answerInput').value;
    if (!answer.trim()) {
      $('feedback').className = 'feedback warn';
      $('feedback').textContent = '先输入一句或点“开始说”。';
      return;
    }
    const result = evaluateCampAnswer(step, answer);
    if (!result.ok) {
      lessonFailures += 1;
      const missing = result.missingFacts ? `还缺少 ${result.missingFacts} 项信息。` : '';
      $('feedback').className = 'feedback warn';
      $('feedback').textContent = result.intentOK ? `${missing}再补完整一点。` : '我还没听懂这个交际意图，再试一次。';
      if (lessonFailures >= 1) renderLessonHint(step);
      return;
    }
    const support = hintShown ? 'frame' : result.evidence === 'needs_confirmation' ? 'correction' : 'independent';
    lesson.support = support;
    $('feedback').className = 'feedback good';
    $('feedback').textContent = result.formOK ? '说得清楚，可以继续。' : '意思到了。继续后会用更自然的目标形式再确认一次。';
    lesson.resolved = true;
    $('btnContinue').hidden = false;
    $('btnSubmitAnswer').disabled = true;
  }

  function continueLesson() {
    if (!lesson || !lesson.resolved) return;
    lesson.resolved = false;
    lesson.index += 1;
    $('btnSubmitAnswer').disabled = false;
    if (lesson.index >= lesson.item.steps.length) finishCampItem();
    else renderLessonStep();
  }

  function renderLessonHint(step) {
    hintShown = true;
    document.querySelectorAll('#lessonBody .line-zh').forEach((line) => { line.hidden = false; });
    const scaffold = step.scaffold;
    $('hintBox').hidden = false;
    if (!scaffold) {
      $('hintBox').textContent = step.hint || step.promptZh || '先抓住任务中的一个关键词。';
      return;
    }
    $('hintBox').innerHTML = `
      <p>${escapeHtml(step.promptZh || '先照着句型说，再替换成你的信息。')}</p>
      ${scaffold.note ? `<p>${escapeHtml(scaffold.note)}</p>` : ''}
      <p><strong>句型：</strong>${renderLookupText(scaffold.template, '', currentSpeakKind)}</p>
      <p><strong>示例：</strong>${renderLookupText(scaffold.example, scaffold.exampleZh || '', currentSpeakKind)}</p>
      <div class="answer-actions">
        <button class="secondary-btn" id="btnFillTemplate" type="button">填入句型</button>
        <button class="ghost-btn" id="btnSpeakExample" type="button">听示例</button>
      </div>`;
    $('btnFillTemplate').addEventListener('click', () => {
      $('answerInput').value = scaffold.fill;
      $('answerInput').focus();
    });
    $('btnSpeakExample').addEventListener('click', () => {
      speakText(scaffold.example, currentSpeakKind, lesson.item.band);
    });
  }

  function finishCampItem() {
    state.camp = ENGINE.completeCampNode(state.camp, lesson.item.id, { support: lesson.support });
    saveState();
    toast('已完成，但不会自动标记为掌握。');
    lesson = null;
    renderCamp();
  }

  function skipCurrentCampItem() {
    if (!lesson) return;
    state.camp = ENGINE.skipCampNode(state.camp, lesson.item.id);
    saveState();
    toast('已跳过。后续遇到相关问题时仍会插入补课。');
    lesson = null;
    renderCamp();
  }

  function renderChapterStart() {
    $('chapterBand').value = state.storyVersion || 'L1';
    $('btnContinueChapter').hidden = !state.stories.airport;
    showScreen('screenChapterStart');
  }

  function renderRulesStart() {
    $('rulesBand').value = state.storyVersion || 'L1';
    $('btnContinueRules').hidden = !state.stories.rules_horror;
    showScreen('screenRulesStart');
  }

  function startChapterNew() {
    readProfile();
    const band = $('chapterBand').value || 'L1';
    state.storyVersion = band;
    state.chapter = ENGINE.createChapterState({
      ...state.profile,
      lodging_name: state.profile.lodging,
      lodging_area: state.profile.city
    }, band);
    state.chapter.storyId = 'airport';
    saveState();
    lastChapterEnglish = '';
    lastChapterKind = 'narration';
    showScreen('screenChapter');
    renderChapterItem();
  }

  function continueChapter() {
    if (!state.stories.airport) return;
    state.chapter = state.stories.airport;
    state.storyVersion = state.chapter.band;
    showScreen('screenChapter');
    renderChapterItem();
  }

  function startRulesStory() {
    readProfile();
    const band = $('rulesBand').value || 'L1';
    state.storyVersion = band;
    state.chapter = ENGINE.createChapterState(state.profile, band);
    state.chapter.storyId = 'rules_horror';
    state.chapter.sceneId = 'RH-S1';
    state.chapter.taskId = 'RH-T1';
    state.chapter.rules_outcome = null;
    state.chapter.unsafe_rule_action = false;
    saveState();
    lastChapterEnglish = '';
    lastChapterKind = 'narration';
    showScreen('screenChapter');
    renderChapterItem();
  }

  function continueRulesStory() {
    if (!state.stories.rules_horror) return;
    state.chapter = state.stories.rules_horror;
    state.storyVersion = state.chapter.band;
    showScreen('screenChapter');
    renderChapterItem();
  }

  function activeStory() {
    return state.chapter && state.chapter.storyId === 'rules_horror'
      ? RULES.rulesStory
      : DATA.chapterOne;
  }

  function sceneById(id) {
    return activeStory().scenes.find((scene) => scene.id === id);
  }

  function currentScene() {
    return state.chapter ? sceneById(state.chapter.sceneId) : null;
  }

  function taskById(id) {
    return activeStory().tasks.find((task) => task.id === id);
  }

  function renderTaskRail(scene) {
    const current = taskById(scene.taskId);
    $('chapterTasks').innerHTML = activeStory().tasks.map((task) => {
      const done = current && task.order < current.order;
      const active = current && task.id === current.id;
      return `<div class="task-chip ${done ? 'done' : ''} ${active ? 'active' : ''}">${task.order}. ${task.title}</div>`;
    }).join('');
  }

  function displayProfileText(text) {
    return ENGINE.formatText(text, state.chapter ? state.chapter.profile : state.profile);
  }

  function renderChapterItem() {
    const scene = currentScene();
    if (!scene) return renderEnding(ENGINE.resolveEnding(state.chapter));
    $('chapterTask').textContent = `${scene.taskId} · ${taskById(scene.taskId).title}`;
    $('chapterScene').textContent = scene.title;
    $('chapterImage').hidden = !scene.image;
    if (scene.image) $('chapterImage').src = scene.image;
    $('chapterImage').alt = scene.title;
    $('chapterBandLive').value = state.chapter.band;
    renderTaskRail(scene);
    $('chapterChoices').innerHTML = '';
    $('chapterAnswerBox').hidden = true;
    $('chapterCheckBox').hidden = true;
    $('chapterCheckInput').value = '';
    pendingChapterCheck = null;
    $('chapterHintBox').hidden = true;
    $('chapterHintBox').textContent = '';
    $('chapterFeedback').textContent = '';
    $('chapterFeedback').className = 'feedback';
    $('btnChapterContinue').hidden = true;
    $('btnChapterSpeak').hidden = false;
    $('btnSubmitChapterAnswer').disabled = false;
    hintShown = false;
    currentSpeakText = '';
    currentSpeakKind = 'narration';

    let item = scene.items[state.chapter.itemIndex];
    while (item && item.branch && item.branch !== state.chapter.pickup_choice) {
      state.chapter.itemIndex += 1;
      item = scene.items[state.chapter.itemIndex];
    }
    if (!item) return finishChapterScene(scene);
    if (item.type === 'narration' || item.type === 'npc') {
      const text = item.text ? (item.text[state.chapter.band] || item.text.L1) : '';
      const english = displayProfileText(text);
      currentSpeakText = english;
      currentSpeakKind = item.voice || 'narration';
      lastChapterEnglish = english;
      lastChapterKind = currentSpeakKind;
      $('chapterBody').innerHTML = item.type === 'npc'
        ? lessonSpeakerLine(item.speaker, english, item.textZh || '')
        : `<p class="eyebrow">SCENE</p><p class="english-line">${renderLookupText(english, item.textZh || '', currentSpeakKind)}</p><p class="line-zh" hidden>${escapeHtml(item.textZh || '')}</p>`;
      $('btnChapterContinue').hidden = false;
      return;
    }

    if (item.type === 'speak') {
      const prompt = displayProfileText(item.prompt);
      currentSpeakText = lastChapterEnglish;
      currentSpeakKind = lastChapterKind;
      $('chapterBody').innerHTML = `<p class="eyebrow">YOUR TURN</p><h2>${renderLookupText(prompt, item.promptZh, 'officer')}</h2><p class="muted">Answer in English. Use “Hint” if you need Chinese support.</p>`;
      $('chapterAnswerBox').hidden = false;
      $('chapterAnswer').value = '';
      $('chapterHintBox').textContent = [item.promptZh, item.hint || '可以先用短句完成交际目标；系统会再检查目标形式。'].filter(Boolean).join(' ');
      return;
    }

    if (item.type === 'choice') {
      $('chapterBody').innerHTML = `<p class="eyebrow">CHOICE</p><h2>${escapeHtml(item.prompt)}</h2><p class="muted">${escapeHtml(item.promptZh || '')}</p>`;
      $('btnChapterSpeak').hidden = true;
      item.options.forEach((option) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice-btn';
        button.textContent = option.label;
        button.addEventListener('click', () => chooseChapterOption(item, option));
        $('chapterChoices').appendChild(button);
      });
    }
  }

  function chooseChapterOption(item, option) {
    state.chapter = ENGINE.applyChoice(state.chapter, option);
    if (option.feedback) toast(option.feedback);
    if (!option.next) state.chapter.itemIndex += 1;
    saveState();
    if (state.chapter.sceneId.startsWith('CH1-E') || state.chapter.sceneId.startsWith('RH-E')) {
      renderEnding(state.chapter.sceneId.slice(-2) === 'E3' ? 'bad' : ENGINE.resolveEnding(state.chapter));
    } else {
      renderChapterItem();
    }
  }

  function chapterContinue() {
    const scene = currentScene();
    state.chapter.itemIndex += 1;
    saveState();
    if (state.chapter.itemIndex >= scene.items.length) finishChapterScene(scene);
    else renderChapterItem();
  }

  function finishChapterScene(scene) {
    if (scene.endingId) {
      state.chapter.endingId = scene.endingId;
      saveState();
      return renderEnding(scene.endingId);
    }
    if (scene.next === 'AUTO_ENDING') {
      const ending = resolveStoryEnding();
      return renderEnding(ending || 'bad');
    }
    if (scene.next) {
      state.chapter.sceneId = scene.next;
      state.chapter.itemIndex = 0;
      saveState();
      return renderChapterItem();
    }
    renderEnding(resolveStoryEnding());
  }

  function resolveStoryEnding() {
    if (state.chapter && state.chapter.storyId === 'rules_horror') {
      if (state.chapter.unsafe_rule_action) return 'bad';
      if (state.chapter.rules_outcome === 'safe') return 'safe';
      return 'normal';
    }
    return ENGINE.resolveEnding(state.chapter);
  }

  function applySuccessFlags(itemId) {
    const chapter = state.chapter;
    if (itemId === 'T6-02') chapter.driver_confirmed = true;
    if (itemId === 'T6-03A') chapter.vehicle_confirmed = true;
    if (itemId === 'T6-06') chapter.destination_confirmed = true;
    if (itemId === 'T6-08') chapter.bag_told_to_driver = true;
  }

  function submitChapterAnswer() {
    const scene = currentScene();
    const item = scene.items[state.chapter.itemIndex];
    const answer = $('chapterAnswer').value;
    if (!answer.trim()) {
      $('chapterFeedback').className = 'feedback warn';
      $('chapterFeedback').textContent = '先输入一句或点“开始说”。';
      return;
    }
    const result = ENGINE.evaluateRule(item.rule, answer);
    if (!result.ok) {
      $('chapterFeedback').className = 'feedback warn';
      $('chapterFeedback').textContent = result.intentOK
        ? `交际意图是对的，但还缺少 ${result.missingFacts || 1} 项信息。`
        : '这个回答还没有完成当前交际目标。可以在提示后重说。';
      return;
    }
    state.chapter = ENGINE.addChapterEvidence(state.chapter, item.abilityId, result);
    applySuccessFlags(item.id);
    saveState();
    $('chapterFeedback').className = 'feedback good';
    $('chapterFeedback').textContent = result.formOK
      ? '任务通过，目标形式也出现了。'
      : '任务通过。目标形式还不稳定，后续复习会再次抽取。';
    $('btnSubmitChapterAnswer').disabled = true;
    if (item.check) {
      pendingChapterCheck = item.check;
      $('chapterCheckPrompt').textContent = item.check.prompt;
      $('chapterCheckInput').value = '';
      $('chapterCheckBox').hidden = false;
      $('btnChapterContinue').hidden = true;
    } else {
      $('btnChapterContinue').hidden = false;
    }
  }

  function submitChapterCheck() {
    if (!pendingChapterCheck) return;
    const answer = ENGINE.normalizeText($('chapterCheckInput').value);
    const acceptedAnswers = pendingChapterCheck.answersByState
      ? pendingChapterCheck.answersByState[state.chapter.bag_status] || []
      : pendingChapterCheck.answers || [];
    const accepted = acceptedAnswers.some((entry) => ENGINE.normalizeText(entry) === answer);
    if (!accepted) {
      $('chapterFeedback').className = 'feedback warn';
      $('chapterFeedback').textContent = '关键词还没对，再看一眼当前句子的缺口。';
      return;
    }
    $('chapterFeedback').className = 'feedback good';
    $('chapterFeedback').textContent = '即时确认完成。剧情可以继续。';
    $('chapterCheckBox').hidden = true;
    $('btnChapterContinue').hidden = false;
    pendingChapterCheck = null;
  }

  function renderEnding(endingId) {
    const story = activeStory();
    const safeEnding = story.endings.find((ending) => ending.id === endingId) || story.endings[story.endings.length - 1];
    state.chapter = state.chapter || ENGINE.createChapterState(state.profile, state.band);
    state.chapter.endingId = safeEnding.id;
    saveState();
    $('endingTitle').textContent = safeEnding.title;
    $('endingText').textContent = safeEnding.description;
    $('endingEyebrow').textContent = safeEnding.id === 'bad' ? 'CHAPTER ENDED EARLY' : 'CHAPTER COMPLETE';
    document.querySelector('.ending-card').className = `card ending-card ${safeEnding.id}`;
    const evidence = state.chapter.evidence || [];
    const independent = evidence.filter((entry) => entry.evidence === 'independent').length;
    if (state.chapter.storyId === 'rules_horror') {
      $('endingStats').innerHTML = `
        <div class="stat"><b>${escapeHtml(state.chapter.rules_outcome || '未选择')}</b><span>规则决策</span></div>
        <div class="stat"><b>${state.chapter.unsafe_rule_action ? '是' : '否'}</b><span>违反现行规则</span></div>
        <div class="stat"><b>${independent}</b><span>独立证据</span></div>
      `;
    } else {
      $('endingStats').innerHTML = `
        <div class="stat"><b>${state.chapter.bag_status === 'recovered' ? '已取回' : state.chapter.bag_status === 'pending_delivery' ? '配送中' : '未完成'}</b><span>行李</span></div>
        <div class="stat"><b>${state.chapter.meeting_confirmed ? '已确认' : '未确认'}</b><span>接机</span></div>
        <div class="stat"><b>${independent}</b><span>独立表达证据</span></div>
      `;
    }
    $('btnEndingRetry').hidden = safeEnding.id !== 'bad';
    showScreen('screenEnding');
  }

  function retryBadEnding() {
    const ending = activeStory().endings.find((entry) => entry.id === 'bad');
    state.chapter.sceneId = ending && ending.retryTo ? ending.retryTo : 'CH1-S5C';
    state.chapter.itemIndex = 0;
    state.chapter.left_pickup_without_confirmation = false;
    state.chapter.unsafe_rule_action = false;
    state.chapter.rules_outcome = null;
    state.chapter.endingId = null;
    saveState();
    showScreen('screenChapter');
    renderChapterItem();
  }

  function getVoices() {
    try {
      return root.speechSynthesis ? root.speechSynthesis.getVoices().filter((voice) => /^en/i.test(voice.lang)) : [];
    } catch (error) {
      return [];
    }
  }

  function pickVoice(kind) {
    const voices = getVoices();
    const female = ['samantha', 'ava', 'aria', 'jenny', 'zira', 'female'];
    const male = ['daniel', 'alex', 'brian', 'guy', 'male'];
    const wanted = kind === 'driver' || kind === 'baggage' ? male : female;
    return voices.find((voice) => wanted.some((name) => voice.name.toLowerCase().includes(name))) || voices[0] || null;
  }

  function speakText(text, kind, band) {
    if (!text || !root.speechSynthesis || !root.SpeechSynthesisUtterance) {
      toast('当前浏览器不能播放语音，请先看屏幕文本。');
      return;
    }
    root.speechSynthesis.cancel();
    const utterance = new root.SpeechSynthesisUtterance(text);
    const voice = pickVoice(kind);
    if (voice) utterance.voice = voice;
    utterance.lang = voice ? voice.lang : 'en-US';
    utterance.rate = band === 'L0' ? 0.72 : band === 'L2' ? 1.0 : 0.86;
    utterance.pitch = kind === 'driver' ? 0.9 : 1;
    root.speechSynthesis.speak(utterance);
  }

  function startRecognition(inputId, submitFn) {
    const Recognizer = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!Recognizer) {
      toast('当前浏览器不支持语音识别，可以先用文本输入。');
      return;
    }
    try {
      if (recognition) recognition.abort();
      recognition = new Recognizer();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        $(inputId).value = text;
        submitFn();
      };
      recognition.onerror = () => toast('没有收到语音结果，可以再试或直接输入。');
      recognition.start();
      toast('正在听，请说英语。');
    } catch (error) {
      toast('麦克风暂时不可用，可以先用文本输入。');
    }
  }

  function exportSave() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `english-course-save-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function openLookup(data) {
    hintShown = true;
    lookupSpeech = data.speech;
    $('lookupType').textContent = data.type;
    $('lookupTerm').textContent = data.term;
    $('lookupMeaning').textContent = data.meaning || '暂无释义';
    $('lookupNote').textContent = data.note || '';
    $('lookupBreakdown').innerHTML = data.type === 'WORD' ? '' : renderLookupWordsOnly(data.term);
    $('lookupPanel').hidden = false;
  }

  function openOptionHelp(option) {
    openLookup({
      type: 'OPTION',
      term: option.label,
      meaning: LOOKUP.translateSentence(option.label) || '暂未收录该选项的整句翻译',
      note: '这里只解释这个选项，不提示它是否是正确答案。可以继续点击里面的词。',
      speech: option.label
    });
  }

  function handleLookupClick(event) {
    const token = event.target.closest('.lookup-token');
    if (token) {
      const entry = LOOKUP.lookup(token.dataset.lookupTerm);
      openLookup({
        type: entry && entry.type === 'phrase' ? 'PHRASE' : 'WORD',
        term: token.dataset.lookupText,
        meaning: entry ? entry.zh : '暂无词义记录',
        note: entry ? entry.note || '' : '这个词还没有收录释义。',
        speech: token.dataset.lookupText
      });
      return;
    }
    const sentence = event.target.closest('.sentence-lookup');
    if (sentence) {
      const holder = sentence.closest('.interactive-english');
      openLookup({
        type: 'SENTENCE',
        term: holder.dataset.sentenceEn,
        meaning: holder.dataset.sentenceZh || '暂无整句翻译',
        note: '带下划线的词或短语可以分别点击查看。',
        speech: holder.dataset.sentenceEn
      });
    }
  }

  function importSaveFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object') throw new Error('bad save');
        state = {
          ...defaultState(),
          ...parsed,
          profile: { ...DEFAULT_PROFILE, ...(parsed.profile || {}) },
          camp: { ...ENGINE.createCampProgress(), ...(parsed.camp || {}) }
        };
        saveState();
        hydrateProfile();
        renderHome();
        toast('存档已导入。');
      } catch (error) {
        toast('存档文件无法识别。');
      }
    };
    reader.readAsText(file);
  }

  function bindEvents() {
    ['profileName', 'profilePurpose', 'profileStay', 'profileLodging', 'profileCity', 'bandSelect'].forEach((id) => {
      $(id).addEventListener('change', readProfile);
      if ($(id).tagName === 'INPUT') $(id).addEventListener('blur', readProfile);
    });
    $('chapterBand').addEventListener('change', () => {
      state.storyVersion = $('chapterBand').value;
      saveState();
    });
    $('rulesBand').addEventListener('change', () => {
      state.storyVersion = $('rulesBand').value;
      saveState();
    });
    $('chapterBandLive').addEventListener('change', () => {
      if (!state.chapter) return;
      state.chapter.band = $('chapterBandLive').value;
      state.storyVersion = state.chapter.band;
      saveState();
      renderChapterItem();
      toast('剧情版本已切换，从当前剧情项开始使用。');
    });
    $('btnHome').addEventListener('click', renderHome);
    $('btnBaseCamp').addEventListener('click', renderCamp);
    $('btnHandbook').addEventListener('click', () => {
      $('handbookSearch').value = '';
      renderHandbook('');
    });
    $('btnHandbookHome').addEventListener('click', renderHome);
    $('handbookSearch').addEventListener('input', () => renderHandbook($('handbookSearch').value));
    $('btnCampHome').addEventListener('click', renderHome);
    $('btnChapterOne').addEventListener('click', renderChapterStart);
    $('btnRulesStory').addEventListener('click', renderRulesStart);
    $('btnStartChapter').addEventListener('click', startChapterNew);
    $('btnStartRules').addEventListener('click', startRulesStory);
    $('btnContinueChapter').addEventListener('click', continueChapter);
    $('btnContinueRules').addEventListener('click', continueRulesStory);
    $('btnChapterMap').addEventListener('click', () => {
      if (state.chapter && state.chapter.storyId === 'rules_horror') renderRulesStart();
      else renderChapterStart();
    });
    $('btnSkipNode').addEventListener('click', skipCurrentCampItem);
    $('btnContinue').addEventListener('click', continueLesson);
    $('btnSubmitAnswer').addEventListener('click', submitCampAnswer);
    $('btnHint').addEventListener('click', () => {
      const step = lesson.item.steps[lesson.index];
      renderLessonHint(step);
    });
    $('btnMic').addEventListener('click', () => startRecognition('answerInput', submitCampAnswer));
    $('btnSpeak').addEventListener('click', () => speakText(currentSpeakText, currentSpeakKind, lesson ? lesson.item.band : state.band));
    $('btnChapterContinue').addEventListener('click', chapterContinue);
    $('btnSubmitChapterAnswer').addEventListener('click', submitChapterAnswer);
    $('btnSubmitChapterCheck').addEventListener('click', submitChapterCheck);
    $('btnChapterHint').addEventListener('click', () => {
      hintShown = true;
      document.querySelectorAll('#chapterBody .line-zh').forEach((line) => { line.hidden = false; });
      $('chapterHintBox').hidden = false;
    });
    $('btnChapterMic').addEventListener('click', () => startRecognition('chapterAnswer', submitChapterAnswer));
    $('btnChapterSpeak').addEventListener('click', () => speakText(currentSpeakText, currentSpeakKind, state.chapter ? state.chapter.band : state.band));
    $('btnEndingHome').addEventListener('click', renderHome);
    $('btnEndingRetry').addEventListener('click', retryBadEnding);
    $('btnExport').addEventListener('click', exportSave);
    $('btnImport').addEventListener('click', () => $('importSave').click());
    $('importSave').addEventListener('change', () => {
      if ($('importSave').files[0]) importSaveFile($('importSave').files[0]);
      $('importSave').value = '';
    });
    $('btnReset').addEventListener('click', () => {
      if (!root.confirm || !root.confirm('清空本机原型记录？已导出存档不受影响。')) return;
      state = defaultState();
      saveState();
      renderHome();
      toast('原型记录已清空。');
    });
    $('btnInstructionZh').addEventListener('click', () => {
      const showZh = $('instructionZh').hidden;
      $('instructionZh').hidden = !showZh;
      $('instructionEn').hidden = showZh;
      $('btnInstructionZh').textContent = showZh ? 'English' : '中文说明';
    });
    document.addEventListener('click', handleLookupClick);
    $('btnLookupClose').addEventListener('click', () => { $('lookupPanel').hidden = true; });
    $('lookupPanel').addEventListener('click', (event) => {
      if (event.target === $('lookupPanel')) $('lookupPanel').hidden = true;
    });
    $('btnLookupSpeak').addEventListener('click', () => {
      speakText(lookupSpeech, 'officer', state.chapter ? state.chapter.band : state.band);
    });
  }

  function init() {
    if (mounted) return;
    mounted = true;
    state = loadState();
    bindEvents();
    hydrateProfile();
    renderHome();
  }

  root.CourseApp = {
    init,
    getState() { return state; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof globalThis !== 'undefined' ? globalThis : this);
