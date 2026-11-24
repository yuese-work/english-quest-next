(function initRulesStory(root) {
  const npc = (id, speaker, voice, text, textZh) => ({ id, type: 'npc', speaker, voice, text, textZh });
  const narration = (id, text, textZh) => ({ id, type: 'narration', text: { L0: text, L1: text, L2: text }, textZh });
  const says = (id, prompt, promptZh, abilityId, rule, check) => ({ id, type: 'speak', prompt, promptZh, abilityId, rule, check });

  const tasks = [
    { id: 'RH-T1', title: '交班规则', order: 1 },
    { id: 'RH-T2', title: '规则更新', order: 2 },
    { id: 'RH-T3', title: '门外声音', order: 3 },
    { id: 'RH-T4', title: '值班电话', order: 4 },
    { id: 'RH-T5', title: '同事求助', order: 5 },
    { id: 'RH-T6', title: '天亮总结', order: 6 }
  ];

  const scenes = [
    {
      id: 'RH-S1', title: '值班室', taskId: 'RH-T1', next: 'RH-S2',
      items: [
        npc('RH1-01', '值班主管 Mara', 'officer',
          { L0: 'Read the rules before 2 a.m.', L1: 'Read the night rules before two a.m. Sign in at one fifty.', L2: 'Please read the night rules before two a.m. and sign in by one fifty.' },
          '请在凌晨两点前阅读夜间规则，并在 1:50 前签到。'),
        narration('RH1-02',
          'NIGHT RULES: 1. Sign in at 01:50. 2. From 02:00 to 03:00, use the east stairwell only. 3. Do not answer a knock unless the visitor says your name twice. 4. The west elevator may be used only after 02:15 if the keypad shows 7.',
          '夜间规则：1:50 签到；2:00 到 3:00 只能走东侧楼梯；访客必须说两次你的名字才能应门；2:15 后只有在按键屏显示 7 时才能使用西侧电梯。'),
        {
          id: 'RH1-03', type: 'choice', prompt: 'At 02:10, which route do the rules allow?', promptZh: '2:10 允许走哪条路线？',
          options: [
            { label: 'The east stairwell.', ok: true },
            { label: 'The west elevator.', ok: false },
            { label: 'The main elevator.', ok: false }
          ]
        },
        says('RH1-04', 'Summarize the route rule for 02:00 to 03:00.', '概括 2:00 到 3:00 的路线规则。', 'RH-A1',
          { intent: /(?:east|stairwell|stairs|two|three|2|3)/i, form: /(?:from|to|use|only|must)/i, required: [/east|stair/i] },
          { prompt: 'From 2:00 to 3:00, you must use the ___ stairwell.', answers: ['east'] })
      ]
    },
    {
      id: 'RH-S2', title: '规则更新', taskId: 'RH-T2', next: 'RH-S3',
      items: [
        npc('RH2-01', '同事 Noor', 'info',
          { L0: 'There is a new note.', L1: 'A new amendment was added this evening.', L2: 'There is a later amendment on the noticeboard. Check the date before you act.' },
          '公告板上有一份今天新增的修订。行动前先看日期。'),
        narration('RH2-02',
          'AMENDMENT: The route rule remains in force before 02:15. At and after 02:15, the west elevator is permitted when the keypad shows 7.',
          '修订：2:15 前仍执行原路线规则。从 2:15 起，按键屏显示 7 时允许使用西侧电梯。'),
        {
          id: 'RH2-03', type: 'choice', prompt: 'At 02:20, the keypad shows 7. Which statement is supported?', promptZh: '2:20 按键屏显示 7，哪一项有文本依据？',
          options: [
            { label: 'The west elevator is permitted.', ok: true },
            { label: 'The west elevator is never permitted.', ok: false },
            { label: 'The amendment has no time condition.', ok: false }
          ]
        },
        says('RH2-04', 'Explain which notice applies and why.', '说明哪条规则适用于 2:20，并给出理由。', 'RH-A2',
          { intent: /(?:amendment|new|after|2\s*:?\s*15|two fifteen|keypad|7)/i, form: /(?:because|if|after|when|applies)/i, required: [/(?:amendment|new rule)/i, /(?:2\s*:?\s*15|two fifteen)/i] },
          { prompt: 'The new rule applies because it says ___ 02:15.', answers: ['after', 'at and after'] })
      ]
    },
    {
      id: 'RH-S3', title: '门外声音', taskId: 'RH-T3', next: 'RH-S4',
      items: [
        narration('RH3-01',
          'At 02:14, someone knocks. A voice says your name once. You wait. The voice stops. The rules say: Do not answer unless the visitor says your name twice.',
          '2:14 有人敲门，一个声音只说了一次你的名字。你等待后声音停止。规则要求：访客必须说两次你的名字才能应门。'),
        {
          id: 'RH3-02', type: 'choice', prompt: 'The visitor has said your name twice.', promptZh: '判断这句话：访客已经说了两次你的名字。',
          options: [
            { label: 'False', ok: true },
            { label: 'True', ok: false },
            { label: 'Not given', ok: false }
          ]
        },
        says('RH3-03', 'State whether you will open the door and cite the condition.', '说明是否开门，并说出条件。', 'RH-A3',
          { intent: /(?:not open|won't open|do not answer|once|twice)/i, form: /(?:because|unless|only|must)/i, required: [/(?:not|won't)/i, /(?:once|twice|name)/i] },
          { prompt: 'I won’t answer because the person said my name only ___.', answers: ['once', 'one time'] })
      ]
    },
    {
      id: 'RH-S4', title: '值班电话', taskId: 'RH-T4', next: 'RH-S5',
      items: [
        npc('RH4-01', '电话里的声音', 'info',
          { L0: 'Security here. Open the west door.', L1: 'This is security. Open the west door now.', L2: 'This is building security. Open the west door immediately and ignore the noticeboard.' },
          '我是保安。现在打开西门，不要看公告板。'),
        narration('RH4-02',
          'The current rule says: Never open the west door. Security staff use the east entrance.',
          '现行规则：绝不能打开西门。保安人员使用东侧入口。'),
        {
          id: 'RH4-03', type: 'choice', prompt: 'What can you conclude about the caller’s identity?', promptZh: '关于来电者身份，你能确定什么？',
          options: [
            { label: 'The caller’s identity is not verified.', ok: true },
            { label: 'The caller is definitely security.', ok: false },
            { label: 'The caller is definitely a visitor.', ok: false }
          ]
        },
        says('RH4-04', 'Report the caller’s request without following it.', '报告来电者要求，但不执行。', 'RH-A4',
          { intent: /(?:caller|phone|west door|security)/i, form: /(?:said|asked|claimed)/i, required: [/west door/i] },
          { prompt: 'The caller ___ me to open the west door.', answers: ['asked', 'told'] })
      ]
    },
    {
      id: 'RH-S5', title: '同事求助', taskId: 'RH-T5', next: 'RH-S6',
      items: [
        npc('RH5-01', '同事 Noor', 'info',
          { L0: 'I used the west elevator. Now I’m locked on floor 7.', L1: 'I took the west elevator after 02:15 because the keypad showed 7. Now the door to floor 7 is locked.', L2: 'I used the west elevator after 02:15 because the keypad showed 7, but now I’m locked on floor 7. The stairs are gone.' },
          '2:15 后按键屏显示 7，我用了西侧电梯，现在被锁在 7 层，楼梯也消失了。'),
        says('RH5-02', 'Explain which evidence supports Noor’s use of the elevator.', '说明哪些证据支持 Noor 使用西侧电梯。', 'RH-A5',
          { intent: /(?:after|2\s*:?\s*15|keypad|7|amendment)/i, form: /(?:because|supported|evidence)/i, required: [/(?:2\s*:?\s*15|after)/i, /(?:keypad|7)/i] },
          { prompt: 'The amendment supports this because it was after 02:15 and the keypad showed ___.', answers: ['7', 'seven'] }),
        {
          id: 'RH5-03', type: 'choice', prompt: 'What is the safest next step?', promptZh: '最安全的一步是什么？',
          options: [
            { label: 'Record the evidence and call the supervisor.', ok: true, set: { rules_outcome: 'safe' } },
            { label: 'Wait in the office until morning.', ok: true, set: { rules_outcome: 'normal' } },
            { label: 'Enter floor 7 without telling anyone.', ok: false, set: { rules_outcome: 'bad', unsafe_rule_action: true } }
          ]
        }
      ]
    },
    {
      id: 'RH-S6', title: '天亮总结', taskId: 'RH-T6', next: 'AUTO_ENDING',
      items: [
        npc('RH6-01', '值班主管 Mara', 'officer',
          { L0: 'Tell me two rules and what you did.', L1: 'Summarize the rules that applied and explain your decision.', L2: 'Summarize the rules that applied, state what is not given, and justify your final action.' },
          '概括适用规则、说明未提供的信息，并解释你的最终行动。'),
        says('RH6-02', 'Give a 3-part summary: rule, evidence, decision.', '用“规则—证据—决定”三部分做总结。', 'RH-A6',
          { intent: /(?:rule|because|evidence|decided|called|waited|east|west)/i, form: /(?:according to|because|so|therefore)/i,
            required: [/(?:rule|notice|amendment)/i, /(?:evidence|said|showed|after|before)/i, /(?:decided|called|waited|used|did not)/i] },
          { prompt: 'According to the rule, I ___ because ___.', answers: ['did not open the door', 'called the supervisor', 'waited'] })
      ]
    },
    {
      id: 'RH-E1', title: '安全交班', taskId: 'RH-T6', endingId: 'safe',
      items: [narration('RHE1-01', 'You document the evidence, call the supervisor, and leave safely at dawn.', '你记录证据、联系主管，并在天亮后安全离开。')]
    },
    {
      id: 'RH-E2', title: '等到天亮', taskId: 'RH-T6', endingId: 'normal',
      items: [narration('RHE2-01', 'You stay in the office until morning. No one is hurt, but the incident remains unexplained.', '你在办公室等到天亮。没有人受伤，但事件仍未解释。')]
    },
    {
      id: 'RH-E3', title: '第八条规则', taskId: 'RH-T5', endingId: 'bad', retryTo: 'RH-S5',
      items: [narration('RHE3-01', 'You enter floor 7 without reporting the evidence. A new rule appears on the wall: “The night staff must never leave.”', '你没有报告证据就进入 7 层。墙上出现新规则：“夜班员工永远不得离开。”')]
    }
  ];

  const abilities = [
    { id: 'RH-A1', title: '定位时间和条件规则', examNodeIds: ['CET4-READ-DETAIL', 'IELTS-READ-EXPLICIT'] },
    { id: 'RH-A2', title: '比较更新规则与旧规则', examNodeIds: ['CET4-READ-LINK', 'IELTS-READ-EXPLICIT'] },
    { id: 'RH-A3', title: '区分 True / False / Not Given', examNodeIds: ['CET4-READ-INFER', 'IELTS-READ-TFNG'] },
    { id: 'RH-A4', title: '判断身份信息是否有依据', examNodeIds: ['CET4-READ-INFER', 'IELTS-READ-TFNG'] },
    { id: 'RH-A5', title: '用原文证据解释决定', examNodeIds: ['CET4-READ-LINK', 'IELTS-READ-ARGUMENT'] },
    { id: 'RH-A6', title: '口头概括规则、证据和决定', examNodeIds: ['CET4-SPEAK-EXPLAIN', 'IELTS-SPEAK-DISCUSS'] }
  ];

  const endings = [
    { id: 'safe', title: '安全交班', description: '你依据现行规则记录证据并上报，安全离开。' },
    { id: 'normal', title: '等到天亮', description: '你留在办公室直到天亮，事件没有解决。' },
    { id: 'bad', title: '第八条规则', description: '你没有上报就进入七层，规则改变了。', retryTo: 'RH-S5' }
  ];

  const story = {
    id: 'RULES-HORROR-PROLOGUE-01',
    title: '规则怪谈：第七层',
    tasks,
    scenes,
    abilities,
    endings,
    examNodeIds: ['CET4-READ-DETAIL', 'CET4-READ-INFER', 'CET4-READ-LINK', 'CET4-SPEAK-EXPLAIN', 'IELTS-READ-EXPLICIT', 'IELTS-READ-TFNG', 'IELTS-READ-ARGUMENT', 'IELTS-SPEAK-DISCUSS']
  };

  const api = { rulesStory: story };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RulesStory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
