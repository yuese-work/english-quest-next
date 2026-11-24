(function initCourseData(root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.CourseData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function buildCourseData() {
  const choice = (prompt, promptZh, options) => ({ kind: 'choice', prompt, promptZh, options });
  const apply = (prompt, promptZh, options) => ({ kind: 'apply', prompt, promptZh, options });
  const speak = (npc, prompt, promptZh, abilityId, rule, extra) => ({
    kind: 'speak',
    npc,
    prompt,
    promptZh,
    abilityId,
    rule,
    ...extra
  });
  const confirm = (prompt, promptZh, answers, abilityId, hint) => ({
    kind: 'confirm',
    prompt,
    promptZh,
    answers,
    abilityId,
    hint
  });

  const zones = [
    { id: 'sound', title: '声音与听辨', short: '听清关键信息' },
    { id: 'words', title: '词与词块', short: '把话说到点上' },
    { id: 'skeleton', title: '句子骨架', short: '把词排成句子' },
    { id: 'verb', title: '动词、时间与连接', short: '说清时间与动作' },
    { id: 'talk', title: '真实交流', short: '完成任务并修复交流' }
  ];

  const nodes = [
    {
      id: 'BASE-L0-SOUND', band: 'L0', zoneId: 'sound', title: '听见名字与需求', minutes: 5,
      scene: '训练营前台', ability: '能从短句中听出姓名和一个需求，并作出回应。',
      words: ['name', 'help', 'water'], chunks: ['Your name, please.', 'Do you need help?'],
      steps: [
        choice('工作人员说：Good morning. What’s your name? 你要先听懂什么？', '工作人员在问什么？', [
          { label: '姓名', ok: true }, { label: '价格', ok: false }, { label: '时间', ok: false }
        ]),
        speak('前台 Mina', 'What’s your name?', '说出你的名字。', 'BASE-L0-SOUND',
          { intent: /(?:i am|i'm|my name is|this is|name)/i, form: /(?:i am|i'm|my name is)/i }),
        confirm('Your ___, please.', '补全：Your ___, please.', ['name'], 'BASE-L0-SOUND', '前台需要核对姓名。')
      ]
    },
    {
      id: 'BASE-L0-CHUNK', band: 'L0', zoneId: 'words', title: '问候与求助开头', minutes: 5,
      scene: '第一次见面', ability: '能用礼貌词块完成问候和简短求助。',
      words: ['hello', 'help', 'please'], chunks: ['Excuse me.', 'I need help.'],
      steps: [
        choice('哪一个最像见面问候？', '选出问候语。', [
          { label: 'Hello.', ok: true }, { label: 'Thirty.', ok: false }, { label: 'Exit.', ok: false }
        ]),
        speak('前台 Mina', 'Do you need any help?', '说一句“我需要帮助”。', 'BASE-L0-CHUNK',
          { intent: /(?:help|assistance)/i, form: /(?:i need|can you help|i want)/i }),
        confirm('Excuse ___.', '补全礼貌开头。', ['me'], 'BASE-L0-CHUNK', 'Excuse me. 是自然的求助开头。')
      ]
    },
    {
      id: 'BASE-L0-SKELETON', band: 'L0', zoneId: 'skeleton', title: '我是谁，我有什么', minutes: 5,
      scene: '领取训练包', ability: '能用 I’m、This is、I have 说身份和物品，并理解 am/is/are 随主语变化。',
      words: ['bag', 'phone', 'ticket'], chunks: ['I’m + 姓名', 'This is + 物品'],
      steps: [
        {
          kind: 'explain',
          title: '人称代词 + be 动词',
          body: 'be 动词表示“是”。主语不同，形式也不同：I 用 am，you/we/they 用 are，he/she/it 用 is。',
          rows: [
            { label: 'I', form: 'am', example: 'I am Lin. / I’m Lin.' },
            { label: 'you / we / they', form: 'are', example: 'You are ready. / We are here.' },
            { label: 'he / she / it', form: 'is', example: 'She is my guide. / This is my bag.' }
          ],
          note: '表示“有”时用 have，不要把所有句子都塞进 be 动词。'
        },
        choice('哪一句在说明“这是我的包”？', '选出指认物品的句子。', [
          { label: 'This is my bag.', ok: true }, { label: 'I need a bag.', ok: false }, { label: 'Where is bag?', ok: false }
        ]),
        speak('前台 Mina', 'What’s your name? What do you have with you?', '说两句：我是谁、这是什么。', 'BASE-L0-SKELETON',
          { intent: /(?:i am|i'm|my name is|this is)/i, form: /(?:i am|i'm|this is)/i, required: [/(?:bag|phone|ticket)/i] }),
        confirm('This ___ my bag.', '补全指认句。', ['is'], 'BASE-L0-SKELETON', 'This is my bag.')
      ]
    },
    {
      id: 'BASE-L0-VERB', band: 'L0', zoneId: 'verb', title: '状态和需求', minutes: 5,
      scene: '训练途中', ability: '能区分 be 动词加状态与实义动词表达的需求。',
      words: ['tired', 'ready', 'water', 'break'], chunks: ['I’m tired.', 'I need water.'],
      steps: [
        {
          kind: 'explain',
          title: 'be 动词还是实义动词',
          body: 'be 动词后面常接身份、状态或特征；实义动词后面接动作涉及的人或物。',
          rows: [
            { label: 'I’m tired.', form: 'be + 状态', example: 'tired 是形容词，说明“我累了”。' },
            { label: 'I have a bag.', form: 'have + 物品', example: 'have 表示拥有。' },
            { label: 'I need water.', form: 'need + 物品', example: 'need 表示需要。' }
          ],
          note: 'I’m water 不是“我需要水”；需要水应说 I need water.'
        },
        choice('你现在很累，需要水。哪一句最合适？', '区分状态与需求。', [
          { label: 'I’m tired. I need water.', ok: true }, { label: 'I’m water.', ok: false }, { label: 'I need tired.', ok: false }
        ]),
        speak('教练 Noah', 'You look tired. Do you need a break?', '说明状态和需求。', 'BASE-L0-VERB',
          { intent: /(?:tired|break|rest)/i, form: /(?:i'm|i am).*(?:need)/i, required: [/tired/i, /(?:need|break|rest)/i] }),
        confirm('I ___ water.', '补全需求句。', ['need'], 'BASE-L0-VERB', 'need 后面接需要的东西。')
      ]
    },
    {
      id: 'BASE-L0-TALK', band: 'L0', zoneId: 'talk', title: '没听清时怎么办', minutes: 5,
      scene: '集合点确认', ability: '能请求重复并确认听到的信息。',
      words: ['room', 'repeat', 'again'], chunks: ['Could you repeat that?', 'So, room twelve?'],
      steps: [
        choice('你没听清房间号。应该说哪一句？', '选择修复交流的句子。', [
          { label: 'Could you repeat that?', ok: true }, { label: 'Goodbye.', ok: false }, { label: 'I’m fine.', ok: false }
        ]),
        speak('集合点工作人员', 'Your room is Room 12 on the second floor.', '请对方再说一次。', 'BASE-L0-TALK',
          { intent: /(?:repeat|say that again|pardon)/i, form: /(?:could you|can you|pardon)/i }),
        confirm('So, room ___?', '工作人员说的是 Room 12。请确认。', ['12', 'twelve'], 'BASE-L0-TALK', '用确认句确保没有听错。')
      ]
    },
    {
      id: 'BASE-L1-SOUND', band: 'L1', zoneId: 'sound', title: '数字、时间与站台', minutes: 6,
      scene: '售票柜台', ability: '能听懂关键数字和时间，并在不确定时追问。',
      words: ['fourteen', 'forty', 'platform', 'time'], chunks: ['At what time?', 'Platform six?'],
      steps: [
        choice('广播说的是 Platform 6 at 2:30。哪个信息帮你找到车？', '抓取站台和时间。', [
          { label: 'Platform 6, 2:30', ok: true }, { label: 'Seat 16, 4:30', ok: false }, { label: 'Car 6, 12:30', ok: false }
        ]),
        speak('售票员 Mia', 'Can I help you?', '询问下一班车的出发时间。', 'BASE-L1-SOUND',
          { intent: /(?:time|when|leave)/i, form: /(?:what time|when does)/i }),
        confirm('The next train leaves at ___ .', '补全时间：2:30。', ['2:30', 'two thirty'], 'BASE-L1-SOUND', '回答时间时保留数字信息。')
      ]
    },
    {
      id: 'BASE-L1-CHUNK', band: 'L1', zoneId: 'words', title: '买票与支付', minutes: 6,
      scene: '小商店', ability: '能用礼貌语块完成一次简单购买。',
      words: ['ticket', 'card', 'price'], chunks: ['I’d like...', 'Can I pay by card?'],
      steps: [
        choice('哪一句最适合礼貌地说“我想要一张票”？', '选择购买语块。', [
          { label: 'I’d like a ticket.', ok: true }, { label: 'Give ticket now.', ok: false }, { label: 'Ticket is me.', ok: false }
        ]),
        speak('店员 Leo', 'What would you like?', '购买一张去车站的票。', 'BASE-L1-CHUNK',
          { intent: /(?:ticket|station)/i, form: /(?:i'd like|i would like|can i have)/i, required: [/ticket/i] }),
        confirm('Can I pay by ___ ?', '补全支付方式。', ['card'], 'BASE-L1-CHUNK', 'Can I pay by card?')
      ]
    },
    {
      id: 'BASE-L1-SKELETON', band: 'L1', zoneId: 'skeleton', title: '问地点和条件', minutes: 6,
      scene: '城市信息台', ability: '能用常见疑问句询问地点，并识别五大基本句型。',
      words: ['platform', 'ticket machine', 'booking'], chunks: ['Where is...?', 'Is there...?', 'Do I need...?'],
      steps: [
        {
          kind: 'explain',
          title: '五大基本句型',
          body: '先看动词后面还缺什么。五大基本句型是理解句子成分的骨架，不要求先背术语。',
          rows: [
            { label: '主谓 SV', form: 'The train arrived.', example: '只有主语和动作，没有宾语。' },
            { label: '主系表 SP', form: 'She is a guide.', example: 'is 连接主语和身份。' },
            { label: '主谓宾 SVO', form: 'I need a taxi.', example: 'need 后面接需要的东西。' },
            { label: '主谓双宾 SVOO', form: 'He gave me a map.', example: '给“我”一张地图。' },
            { label: '主谓宾补 SVOC', form: 'The news made me happy.', example: 'happy 补充说明 me 的状态。' }
          ],
          note: '同一个动词在不同义项下可能使用不同句型，先看具体句子，不死记标签。'
        },
        choice('哪一句在问“3 号站台在哪里”？', '选出问地点句。', [
          { label: 'Where is Platform 3?', ok: true }, { label: 'Platform 3 is where?', ok: false }, { label: 'I am Platform 3.', ok: false }
        ]),
        speak('信息台 Aiko', 'Can I help you find something?', '询问售票机的位置。', 'BASE-L1-SKELETON',
          { intent: /(?:ticket machine|machine|where)/i, form: /where (?:is|can i find)/i, required: [/machine/i] }),
        confirm('Is ___ a ticket machine here?', '补全存在问句。', ['there'], 'BASE-L1-SKELETON', 'Is there a ticket machine here?')
      ]
    },
    {
      id: 'BASE-L1-VERB', band: 'L1', zoneId: 'verb', title: '计划和下一步', minutes: 6,
      scene: '候车区', ability: '能说明当前计划，并区分及物动词与不及物动词。',
      words: ['wait', 'leave', 'come back'], chunks: ['I need to...', 'I’m going to...'],
      steps: [
        {
          kind: 'explain',
          title: '及物动词与不及物动词',
          body: '不及物动词可以单独构成主谓句；及物动词通常还需要一个宾语，句子意思才完整。',
          rows: [
            { label: 'arrive', form: '不及物', example: 'The train arrived. 不能直接说 arrived the station。' },
            { label: 'need', form: '及物', example: 'I need a ticket. 需要谁/什么要说出来。' },
            { label: 'give', form: '可带双宾', example: 'He gave me a map. 给谁、给了什么都要说清。' },
            { label: 'make', form: '可带宾补', example: 'The news made me happy. 补充说明 me 的状态。' }
          ],
          note: '不要只看中文意思猜结构；学习单词时要连同搭配一起记。'
        },
        choice('哪一句表达“我打算等二十分钟”？', '选择计划表达。', [
          { label: 'I’m going to wait for twenty minutes.', ok: true }, { label: 'I waited twenty.', ok: false }, { label: 'Wait is me.', ok: false }
        ]),
        speak('信息台 Aiko', 'The desk opens again in twenty minutes. What would you like to do?', '说明等待计划并确认下一步。', 'BASE-L1-VERB',
          { intent: /(?:wait|twenty|come back|counter)/i, form: /(?:need to|going to)/i, required: [/wait/i] }),
        confirm('I’m going ___ wait.', '补全不定式结构。', ['to'], 'BASE-L1-VERB', 'going to + 动词原形。')
      ]
    },
    {
      id: 'BASE-L1-TALK', band: 'L1', zoneId: 'talk', title: '问路并复述', minutes: 7,
      scene: '城市街区', ability: '能问路、理解方向并确认路线。',
      words: ['exit', 'corner', 'lift'], chunks: ['How do I get to...?', 'Turn left.'],
      steps: [
        choice('对方说：Go straight and turn left. 你应该怎么走？', '理解方向。', [
          { label: '一直走，然后左转', ok: true }, { label: '马上右转', ok: false }, { label: '坐电梯下楼', ok: false }
        ]),
        speak('路人 Aiko', 'Can I help you?', '询问出口路线。', 'BASE-L1-TALK',
          { intent: /(?:exit|get to|how)/i, form: /how do i get to|where is/i, required: [/exit|station/i] }),
        confirm('Turn ___ at the corner.', '补全方向。', ['left'], 'BASE-L1-TALK', 'Turn left at the corner.')
      ]
    },
    {
      id: 'BASE-L2-SOUND', band: 'L2', zoneId: 'sound', title: '听取变化后的安排', minutes: 8,
      scene: '车站广播', ability: '能从连续信息中区分原计划、变化和最终安排。',
      words: ['delayed', 'instead', 'platform'], chunks: ['Leaves at... instead', 'Is it still leaving from...?'],
      steps: [
        choice('广播：The 4:15 train is delayed and now leaves at 4:45 from Platform 6. 最终安排是什么？', '找出最终安排。', [
          { label: '4:45, Platform 6', ok: true }, { label: '4:15, Platform 6', ok: false }, { label: '4:45, Platform 3', ok: false }
        ]),
        speak('站务员 Daniel', 'The 4:15 train is delayed. It now leaves at 4:45 from Platform 6.', '复述最终发车时间和站台。', 'BASE-L2-SOUND',
          { intent: /(?:4:45|four forty-five|platform|instead)/i, form: /instead|leaves at|from platform/i,
            required: [/(?:4:45|four forty-five)/i, /(?:platform|six|6)/i] }),
        confirm('So it leaves at 4:45 ___?', '确认变化后的安排。', ['instead'], 'BASE-L2-SOUND', 'instead 表示改为。')
      ]
    },
    {
      id: 'BASE-L2-CHUNK', band: 'L2', zoneId: 'words', title: '澄清与重述', minutes: 7,
      scene: '服务咨询台', ability: '能在不理解时要求澄清并确认对方意思。',
      words: ['mean', 'understand', 'refund'], chunks: ['I’m not sure I understand.', 'So you mean...?'],
      steps: [
        choice('工作人员说了一个你不懂的说法。最自然的回应是哪句？', '选择澄清语。', [
          { label: 'I’m not sure I understand.', ok: true }, { label: 'Good.', ok: false }, { label: 'I am refund.', ok: false }
        ]),
        speak('服务台 Daniel', 'We can offer you a refund.', '询问 refund 是什么意思。', 'BASE-L2-CHUNK',
          { intent: /(?:refund|mean|explain)/i, form: /(?:what does|mean|not sure i understand)/i }),
        confirm('I’m not sure I ___ .', '补全澄清句。', ['understand'], 'BASE-L2-CHUNK', 'I’m not sure I understand.')
      ]
    },
    {
      id: 'BASE-L2-SKELETON', band: 'L2', zoneId: 'skeleton', title: '请求加原因', minutes: 8,
      scene: '更改预约', ability: '能提出变更请求并说明原因。',
      words: ['appointment', 'change', 'sick'], chunks: ['I’d like to change...because...', 'Could we...instead?'],
      steps: [
        choice('你想改预约，因为生病。哪句最完整？', '选择请求加原因。', [
          { label: 'I’d like to change my appointment because I’m sick.', ok: true }, { label: 'Appointment sick change.', ok: false }, { label: 'I’m sick appointment.', ok: false }
        ]),
        speak('预约台 Aiko', 'How can I help you today?', '请求更改预约并说明原因。', 'BASE-L2-SKELETON',
          { intent: /(?:change|appointment|sick|ill)/i, form: /because/i, required: [/(?:change|appointment)/i, /(?:sick|ill)/i] }),
        confirm('I’d like to change it ___ I’m sick.', '补全原因连接。', ['because'], 'BASE-L2-SKELETON', 'because 连接原因。')
      ]
    },
    {
      id: 'BASE-L2-VERB', band: 'L2', zoneId: 'verb', title: '报告刚才发生的事', minutes: 8,
      scene: '失物登记台', ability: '能用一般过去时说明已发生事件。',
      words: ['lost', 'left', 'arrived'], chunks: ['I lost my...', 'I left it on the train.'],
      steps: [
        choice('哪一句说明“我把包落在火车上了”？', '选择过去事件。', [
          { label: 'I left my bag on the train.', ok: true }, { label: 'I leave my bag on the train.', ok: false }, { label: 'My bag leaves me.', ok: false }
        ]),
        speak('失物登记员 Daniel', 'What happened to your bag?', '说明发生过的丢包事件。', 'BASE-L2-VERB',
          { intent: /(?:lost|left|missing)/i, form: /(?:lost|left)/i, required: [/(?:bag|backpack)/i] }),
        confirm('I ___ my bag on the train.', '补全过去式。', ['left'], 'BASE-L2-VERB', 'left 是 leave 的过去式。')
      ]
    },
    {
      id: 'BASE-L2-TALK', band: 'L2', zoneId: 'talk', title: '处理服务问题', minutes: 8,
      scene: '城际车站服务台', ability: '能说明遗失物品、描述特征并确认后续方式。',
      words: ['suitcase', 'handle', 'deliver', 'contact'], chunks: ['It’s a...with...', 'Could you deliver it...?'],
      steps: [
        choice('服务台给出“等下一次更新”和“送到酒店”两个方案。你需要做的是？', '先理解方案差异。', [
          { label: '确认两种方式，再选择并核对后续', ok: true }, { label: '只重复“yes”', ok: false }, { label: '马上离开', ok: false }
        ]),
        speak('服务台 Daniel', 'How can I help you?', '描述行李箱并提出酒店配送请求。', 'BASE-L2-TALK',
          { intent: /(?:black|suitcase|ribbon|hotel|deliver)/i, form: /it's a|with|could you deliver/i,
            required: [/(?:black|suitcase)/i, /(?:ribbon|handle)/i, /(?:deliver|hotel)/i] }),
        confirm('How long will it ___ ?', '补全确认时间的问句。', ['take'], 'BASE-L2-TALK', 'How long will it take?')
      ]
    }
  ];

  const trials = [
    {
      id: 'BASE-TRIAL-L0', band: 'L0', title: '训练营报到', minutes: 10,
      scene: '接待处', ability: '说明姓名和需求，请求重复并确认集合信息。',
      steps: [
        choice('工作人员说：Welcome. What’s your name? 你想先做什么？', '判断交际目标。', [
          { label: '说明姓名', ok: true }, { label: '问价格', ok: false }, { label: '说我走了', ok: false }
        ]),
        speak('接待员 Mina', 'Welcome to the training center. Do you need any help?', '介绍姓名并说明需要帮助。', 'BASE-TRIAL-L0',
          { intent: /(?:i'm|i am|my name|need help|help)/i, form: /(?:i'm|i am|my name|need)/i, required: [/help/i] }),
        confirm('Could you ___ that?', '没听清时请对方重复。', ['repeat'], 'BASE-TRIAL-L0', 'Could you repeat that?')
      ]
    },
    {
      id: 'BASE-TRIAL-L1', band: 'L1', title: '半日城市任务', minutes: 12,
      scene: '车站与街区', ability: '完成买票、问站台并确认返回时间。',
      steps: [
        choice('售票员问你要去哪里。你需要说清什么？', '判断任务信息。', [
          { label: '目的地和张数', ok: true }, { label: '只说自己累了', ok: false }, { label: '只重复票价', ok: false }
        ]),
        speak('售票员 Leo', 'Where are you going?', '购买两张去市中心的票。', 'BASE-TRIAL-L1',
          { intent: /(?:two|tickets|city center)/i, form: /(?:i'd like|can i have)/i, required: [/two|2/i, /ticket/i] }),
        confirm('The train returns at ___ .', '票面写着 6:15。补全返回时间。', ['6:15', 'six fifteen'], 'BASE-TRIAL-L1', '确认返回时间。')
      ]
    },
    {
      id: 'BASE-TRIAL-L2', band: 'L2', title: '城际车站服务台', minutes: 12,
      scene: '服务台', ability: '报告问题、描述物品、选择方案并复述下一步。',
      steps: [
        choice('你丢了包，又需要赶上稍后的车。最先应该做什么？', '判断问题处理顺序。', [
          { label: '说明问题并登记，确认后续联系', ok: true }, { label: '只说自己很着急', ok: false }, { label: '不确认就直接离开', ok: false }
        ]),
        speak('服务台 Daniel', 'How can I help you?', '说明遗失物品并确认酒店配送。', 'BASE-TRIAL-L2',
          { intent: /(?:lost|missing|suitcase|bag|red ribbon|deliver|hotel)/i,
            form: /(?:lost|missing|it's a|with|deliver)/i,
            required: [/(?:lost|missing)/i, /(?:black|suitcase|bag)/i, /(?:ribbon|handle)/i, /(?:deliver|hotel)/i] }),
        confirm('So you’ll send it to my hotel ___?', '确认后续方式。', ['instead', 'yes'], 'BASE-TRIAL-L2', '确认对方会怎样处理。')
      ]
    }
  ];

  const baseScaffolds = {
    'BASE-L0-SOUND': { template: "I'm ___.", example: "I'm Lin.", fill: "I'm ", note: "I'm = 我是。空格里换成你的名字。" },
    'BASE-L0-CHUNK': { template: 'I need ___.', example: 'I need help.', fill: 'I need ', note: 'need = 需要；help = 帮助。' },
    'BASE-L0-SKELETON': { template: "I'm ___ . This is my ___ .", example: "I'm Lin. This is my bag.", fill: "I'm ", note: "I'm = 我是；This is = 这是。" },
    'BASE-L0-VERB': { template: "I'm tired. I need ___.", example: "I'm tired. I need a break.", fill: "I'm tired. I need ", note: 'tired = 累了；need = 需要；break = 休息。' },
    'BASE-L0-TALK': { template: 'Could you repeat that?', example: 'Could you repeat that?', fill: 'Could you repeat that?', note: 'Could you repeat that? = 你能再说一遍吗？' },
    'BASE-L1-SOUND': { template: 'What time does the next train leave?', example: 'What time does the next train leave?', fill: 'What time does the next train leave?', note: 'next train = 下一班车；leave = 出发。' },
    'BASE-L1-CHUNK': { template: "I'd like a ticket to the station.", example: "I'd like a ticket to the station.", fill: "I'd like a ticket to the station.", note: "I'd like = 我想要；ticket = 票。" },
    'BASE-L1-SKELETON': { template: 'Where is the ticket machine?', example: 'Where is the ticket machine?', fill: 'Where is the ', note: 'Where is...? = ……在哪里？' },
    'BASE-L1-VERB': { template: "I'm going to wait for twenty minutes. When should I come back?", example: "I'm going to wait for twenty minutes. When should I come back?", fill: "I'm going to wait for twenty minutes.", note: 'going to = 打算；come back = 回来。' },
    'BASE-L1-TALK': { template: 'How do I get to the exit?', example: 'How do I get to the exit?', fill: 'How do I get to ', note: 'How do I get to...? = 去……怎么走？' },
    'BASE-L2-SOUND': { template: 'It leaves at 4:45 from Platform 6 instead.', example: 'It leaves at 4:45 from Platform 6 instead.', fill: 'It leaves at ', note: 'instead = 改为；platform = 站台。' },
    'BASE-L2-CHUNK': { template: 'What does “refund” mean?', example: 'What does “refund” mean?', fill: 'What does “', note: 'What does ... mean? = ……是什么意思？' },
    'BASE-L2-SKELETON': { template: "I'd like to change my appointment because I'm sick.", example: "I'd like to change my appointment because I'm sick.", fill: "I'd like to change ", note: 'change = 更改；because = 因为；sick = 生病。' },
    'BASE-L2-VERB': { template: 'I lost my bag. I left it on the train.', example: 'I lost my bag. I left it on the train.', fill: 'I lost my bag. ', note: 'lost = 丢了；left = 落下。' },
    'BASE-L2-TALK': { template: 'My black suitcase has a red ribbon. Could you deliver it to my hotel?', example: 'My black suitcase has a red ribbon. Could you deliver it to my hotel?', fill: 'My black suitcase has ', note: 'deliver = 配送；hotel = 酒店。' },
    'BASE-TRIAL-L0': { template: "I'm ___. I need help.", example: "I'm Lin. I need help.", fill: "I'm ", note: "I'm = 我是；need help = 需要帮助。" },
    'BASE-TRIAL-L1': { template: "I'd like two tickets to the city center.", example: "I'd like two tickets to the city center.", fill: "I'd like ", note: "I'd like = 我想要；tickets = 票。" },
    'BASE-TRIAL-L2': { template: 'My black bag with the red ribbon is missing. Could you deliver it to my hotel?', example: 'My black bag with the red ribbon is missing. Could you deliver it to my hotel?', fill: 'My black bag ', note: 'missing = 不见了；deliver = 配送。' }
  };

  const baseSentenceZh = {
    'BASE-L0-SOUND': '你叫什么名字？',
    'BASE-L0-CHUNK': '你需要帮助吗？',
    'BASE-L0-SKELETON': '你叫什么名字？你带了什么？',
    'BASE-L0-VERB': '你看起来很累。你需要休息吗？',
    'BASE-L0-TALK': '你的房间是二楼的 12 号房。',
    'BASE-L1-SOUND': '需要帮助吗？',
    'BASE-L1-CHUNK': '你想要什么？',
    'BASE-L1-SKELETON': '需要我帮你找东西吗？',
    'BASE-L1-VERB': '服务台二十分钟后重新开放。你想怎么做？',
    'BASE-L1-TALK': '需要帮助吗？',
    'BASE-L2-SOUND': '四点十五的车晚点了，现在改到六号站台四点四十五分发车。',
    'BASE-L2-CHUNK': '我们可以给你退款。',
    'BASE-L2-SKELETON': '今天需要什么帮助？',
    'BASE-L2-VERB': '你的包发生什么了？',
    'BASE-L2-TALK': '需要帮助吗？',
    'BASE-TRIAL-L0': '欢迎来到训练中心。你需要帮助吗？',
    'BASE-TRIAL-L1': '你要去哪里？',
    'BASE-TRIAL-L2': '需要帮助吗？'
  };

  const baseExampleZh = {
    'BASE-L0-SOUND': '我是 Lin。',
    'BASE-L0-CHUNK': '我需要帮助。',
    'BASE-L0-SKELETON': '我是 Lin。这是我的包。',
    'BASE-L0-VERB': '我累了，我需要休息。',
    'BASE-L0-TALK': '你能再说一遍吗？',
    'BASE-L1-SOUND': '下一班火车几点出发？',
    'BASE-L1-CHUNK': '我想要一张去车站的票。',
    'BASE-L1-SKELETON': '自动售票机在哪里？',
    'BASE-L1-VERB': '我打算等二十分钟。我应该什么时候回来？',
    'BASE-L1-TALK': '去出口怎么走？',
    'BASE-L2-SOUND': '它改到 6 号站台 4:45 出发。',
    'BASE-L2-CHUNK': 'refund 是什么意思？',
    'BASE-L2-SKELETON': '我想更改预约，因为我生病了。',
    'BASE-L2-VERB': '我丢了我的包。我把它落在火车上了。',
    'BASE-L2-TALK': '我的黑色行李箱有红丝带。你能把它送到我的酒店吗？',
    'BASE-TRIAL-L0': '我是 Lin，我需要帮助。',
    'BASE-TRIAL-L1': '我想要两张去市中心的票。',
    'BASE-TRIAL-L2': '我的红丝带黑包不见了。你能把它送到我的酒店吗？'
  };

  const baseApplications = {
    'BASE-L0-SOUND': apply('Which question asks for a name?', '哪一句是在问姓名？', [
      { label: "What's your name?", ok: true },
      { label: 'Where are you?', ok: false },
      { label: 'How old are you?', ok: false }
    ]),
    'BASE-L0-CHUNK': apply('Staff are talking. How do you begin politely?', '怎样礼貌地插入对话并求助？', [
      { label: 'Excuse me. I need help.', ok: true },
      { label: 'Give me help.', ok: false },
      { label: 'I am help.', ok: false }
    ]),
    'BASE-L0-SKELETON': apply('Choose the correct be verb: Mina ___ my friend.', '选择正确的 be 动词。', [
      { label: 'is', ok: true },
      { label: 'are', ok: false },
      { label: 'am', ok: false }
    ]),
    'BASE-L0-VERB': apply('You are hungry and need food. Which pair is correct?', '表达“我饿了，需要食物”。', [
      { label: "I'm hungry. I need food.", ok: true },
      { label: "I'm food. I need hungry.", ok: false },
      { label: 'I need. I am hungry food.', ok: false }
    ]),
    'BASE-L0-TALK': apply('The room number was too fast. What do you say?', '没听清房间号时说什么？', [
      { label: 'Could you repeat that?', ok: true },
      { label: 'Room is goodbye.', ok: false },
      { label: 'I am Room 12.', ok: false }
    ]),
    'BASE-L1-SOUND': apply('The train leaves at 2:30 from Platform 6. Which detail is correct?', '哪项信息与广播一致？', [
      { label: '2:30, Platform 6', ok: true },
      { label: '2:13, Platform 6', ok: false },
      { label: '2:30, Platform 3', ok: false }
    ]),
    'BASE-L1-CHUNK': apply('Which request is polite and complete?', '哪一句是礼貌完整的购买请求？', [
      { label: "I'd like two tickets, please.", ok: true },
      { label: 'Give tickets now.', ok: false },
      { label: 'Two tickets is me.', ok: false }
    ]),
    'BASE-L1-SKELETON': apply('Which sentence is Subject + Verb + Object?', '哪一句是主谓宾？', [
      { label: 'I need a taxi.', ok: true },
      { label: 'The train arrived.', ok: false },
      { label: 'She is a guide.', ok: false }
    ]),
    'BASE-L1-VERB': apply('Which verb can make a complete Subject + Verb sentence by itself?', '哪个动词可以单独构成主谓句？', [
      { label: 'arrive', ok: true },
      { label: 'need', ok: false },
      { label: 'give', ok: false }
    ]),
    'BASE-L1-TALK': apply('“Go straight, then turn left at the corner.” What comes first?', '按指示应先做什么？', [
      { label: 'Go straight.', ok: true },
      { label: 'Turn left immediately.', ok: false },
      { label: 'Take the lift.', ok: false }
    ]),
    'BASE-L2-SOUND': apply('Original: 4:15, Platform 3. Update: 4:45, Platform 6. What is the final plan?', '最终安排是什么？', [
      { label: 'It leaves at 4:45 from Platform 6.', ok: true },
      { label: 'It leaves at 4:15 from Platform 3.', ok: false },
      { label: 'It leaves at 4:45 from Platform 3.', ok: false }
    ]),
    'BASE-L2-CHUNK': apply('Which question asks for the meaning of “refund”?', '哪一句是在问 refund 的意思？', [
      { label: 'What does “refund” mean?', ok: true },
      { label: 'Where is “refund”?', ok: false },
      { label: 'How much is “refund” arrive?', ok: false }
    ]),
    'BASE-L2-SKELETON': apply('Which sentence gives both a request and a reason?', '哪一句同时包含请求和原因？', [
      { label: "I'd like to change my appointment because I'm sick.", ok: true },
      { label: "I'm sick. I'd like my appointment.", ok: false },
      { label: "Change appointment because.", ok: false }
    ]),
    'BASE-L2-VERB': apply('The bag disappeared yesterday on the train. Which sentence is correct?', '哪一句正确说明昨天把包落在火车上？', [
      { label: 'I left my bag on the train yesterday.', ok: true },
      { label: 'I leave my bag on the train yesterday.', ok: false },
      { label: 'My bag leaves me yesterday.', ok: false }
    ]),
    'BASE-L2-TALK': apply('Which request includes the problem, a feature and a solution?', '哪一句完整包含问题、特征和解决方式？', [
      { label: 'My black bag with a red ribbon is missing. Could you deliver it to my hotel?', ok: true },
      { label: 'My bag is missing. Black.', ok: false },
      { label: 'Deliver my hotel because missing.', ok: false }
    ]),
    'BASE-TRIAL-L0': apply('Mina asks your name and asks if you need help. Which reply is complete?', '哪一句同时回应姓名和帮助？', [
      { label: "I'm Lin. I need help.", ok: true },
      { label: 'Lin help name.', ok: false },
      { label: 'I am help, you are name.', ok: false }
    ]),
    'BASE-TRIAL-L1': apply('You want two tickets to the city center. Which request is best?', '哪一句是完整购票请求？', [
      { label: "I'd like two tickets to the city center.", ok: true },
      { label: 'City center two is me.', ok: false },
      { label: 'Where is two tickets?', ok: false }
    ]),
    'BASE-TRIAL-L2': apply('Your black bag with a red ribbon is missing. Which handling request is complete?', '哪一句完整说明问题和配送处理？', [
      { label: 'My black bag with the red ribbon is missing. Could you deliver it to my hotel?', ok: true },
      { label: 'Black ribbon hotel missing.', ok: false },
      { label: 'Deliver because black.', ok: false }
    ])
  };

  [...nodes, ...trials].forEach((node) => {
    const scaffold = baseScaffolds[node.id];
    node.steps.forEach((step) => {
      if (step.kind === 'speak' && scaffold) {
        step.scaffold = scaffold;
        step.scaffold.exampleZh = baseExampleZh[node.id];
        step.sentenceZh = baseSentenceZh[node.id];
      }
    });
    if (baseApplications[node.id]) node.steps.push(baseApplications[node.id]);
  });

  const npc = (id, speaker, voice, text, textZh) => ({ id, type: 'npc', speaker, voice, text, textZh });
  const narration = (id, text, textZh) => ({ id, type: 'narration', text: { L0: text, L1: text, L2: text }, textZh });
  const says = (id, prompt, promptZh, abilityId, rule, hint) => ({ id, type: 'speak', prompt, promptZh, abilityId, rule, hint });

  const tasks = [
    { id: 'CH1-T1', title: '入境问答', order: 1 },
    { id: 'CH1-T2', title: '行李转盘', order: 2 },
    { id: 'CH1-T3', title: '遗失申报', order: 3 },
    { id: 'CH1-T4', title: '到达大厅', order: 4 },
    { id: 'CH1-T5', title: '处理接机问题', order: 5 },
    { id: 'CH1-T6', title: '离站首领', order: 6 }
  ];

  const scenes = [
    {
      id: 'CH1-S1', title: '入境排队区', taskId: 'CH1-T1', image: 'img/scene-immigration.png', next: 'CH1-S2',
      items: [
        narration('T1-01A', 'The line moves slowly. Keep your passport and arrival card ready.', '队伍缓慢向前。准备好护照和入境卡。'),
        npc('T1-01', '机场广播', 'announce',
          { L0: 'Welcome to Osaka. Please have your passport ready.', L1: 'Welcome to Osaka. Please have your passport and arrival card ready.', L2: 'Welcome to Osaka. Please have your passport and arrival card ready for immigration.' },
          '欢迎来到大阪。请准备好护照和入境卡。'),
        npc('T1-02', 'Officer Sato', 'officer',
          { L0: 'Passport and arrival card, please.', L1: 'Next, please. Passport and arrival card.', L2: 'Next, please. Passport and arrival card.' },
          '下一位，请出示护照和入境卡。'),
        says('T1-03', 'Show your passport and arrival card, and respond to the officer.', '出示护照和入境卡，并回应官员。', 'CH1-A01',
          { intent: /(?:here|passport|arrival card|sure|of course)/i, form: /(?:here you are|here it is|here you go)/i }),
        npc('T1-04', 'Officer Sato', 'officer',
          { L0: 'Thank you. Why are you here?', L1: "Thank you. What's the purpose of your visit?", L2: 'Thank you. What brings you to Osaka?' },
          '谢谢。你来的目的是什么？'),
        says('T1-05', 'Explain the purpose of your visit.', '说明来意。', 'CH1-A02',
          { intent: /(?:sightseeing|holiday|business|family|study|student|tourist)/i,
            form: /(?:here for|here to|on holiday|on business|visiting|tourist)/i }),
        npc('T1-06', 'Officer Sato', 'officer',
          { L0: 'How long will you stay?', L1: 'How long are you staying?', L2: 'How long are you planning to stay?' },
          '你打算待多久？'),
        says('T1-07', 'Say how long you’re staying.', '说明停留多久。', 'CH1-A03',
          { intent: /(?:day|days|week|weeks|month|months|night|nights)/i,
            form: /(?:i'm staying|i am staying|for|about)/i }),
        npc('T1-08', 'Officer Sato', 'officer',
          { L0: 'Where are you staying?', L1: 'Where will you be staying?', L2: 'Where are you based during your stay?' },
          '你会住在哪里？'),
        says('T1-09', 'Say where you’re staying.', '说明住处。', 'CH1-A04',
          { intent: /(?:hotel|hilton|riverside|apartment|family|osaka)/i,
            form: /(?:staying at|staying with|at the)/i }),
        npc('T1-10', 'Officer Sato', 'officer',
          { L0: 'Thank you. Welcome to Japan.', L1: 'Thank you. Enjoy your stay.', L2: 'Thank you. Enjoy your stay in Osaka.' },
          '谢谢。祝你旅途愉快。')
      ]
    },
    {
      id: 'CH1-S2', title: '行李大厅', taskId: 'CH1-T2', image: 'img/scene-baggage.png', next: 'CH1-S3',
      items: [
        npc('T2-01', '机场广播', 'announce',
          { L0: 'Flight CA123. Carousel 3.', L1: 'Flight CA123 is now on Carousel 3.', L2: 'Passengers on flight CA123, your baggage is now arriving on Carousel 3.' },
          'CA123 航班的行李在 3 号传送带。'),
        says('T2-02', 'Confirm this is Carousel 3 for flight CA123.', '确认传送带。', 'CH1-A05',
          { intent: /(?:carousel|belt|three|3|ca123)/i, form: /is this carousel|carousel 3/i, required: [/3|three/i] }),
        npc('T2-03', 'Daniel Ortiz', 'baggage',
          { L0: 'Yes. Is this your bag?', L1: 'Yes, it is. Is this black suitcase yours?', L2: "Yes, that's the one. Does this black suitcase belong to you?" },
          '是的。这个黑色行李箱是你的吗？'),
        says('T2-04', 'Ask to check the baggage tag.', '请允许你核对标签。', 'CH1-A06',
          { intent: /(?:tag|label|check)/i, form: /can i|could i/i }),
        npc('T2-05', 'Daniel Ortiz', 'baggage',
          { L0: 'Sure.', L1: 'Of course.', L2: 'Of course. Take a look.' },
          '当然。'),
        says('T2-06', 'The tag says D. Lee. Explain that the suitcase is not yours.', '排除这件行李。', 'CH1-A06',
          { intent: /(?:not mine|isn't mine|not my bag|d\. lee)/i, form: /(?:not mine|isn't mine|not my)/i }),
        npc('T2-07', 'Daniel Ortiz', 'baggage',
          { L0: 'Is your bag missing?', L1: 'The belt is empty now. Is your bag missing?', L2: 'The belt is nearly empty. Has your bag come out yet?' },
          '传送带快空了。你的行李还没出来吗？'),
        says('T2-08', 'Say that your bag has not arrived.', '报告行李未到。', 'CH1-A07',
          { intent: /(?:missing|didn't arrive|hasn't arrived|not here)/i, form: /(?:missing|didn't arrive|hasn't arrived)/i }),
        narration('T2-09', 'Daniel leads you to the baggage service desk.', 'Daniel 带你去行李服务台。')
      ]
    },
    {
      id: 'CH1-S3', title: '行李服务台', taskId: 'CH1-T3', image: 'img/scene-baggage.png', next: 'CH1-S4',
      items: [
        npc('T3-01', 'Daniel Ortiz', 'baggage',
          { L0: 'Can I help you?', L1: 'How can I help you?', L2: 'What can I do for you?' },
          '我能帮你什么？'),
        says('T3-02', 'Say that your bag has not arrived.', '报告问题。', 'CH1-A07',
          { intent: /(?:missing|didn't arrive|hasn't arrived|not here)/i, form: /(?:missing|didn't arrive|hasn't arrived)/i }),
        npc('T3-03', 'Daniel Ortiz', 'baggage',
          { L0: 'Which flight?', L1: 'Which flight were you on?', L2: 'Which flight did you arrive on?' },
          '你坐的是哪一班航班？'),
        says('T3-04', 'Answer with flight number CA123.', '提供航班号。', 'CH1-A07',
          { intent: /ca123|ca 123/i, form: /(?:was on|flight)/i }),
        npc('T3-05', 'Daniel Ortiz', 'baggage',
          { L0: 'Do you have your bag tag?', L1: 'Do you have your baggage tag?', L2: 'Do you have your baggage claim tag with you?' },
          '你有行李牌吗？'),
        says('T3-06', 'Show your baggage tag.', '回应凭证要求。', 'CH1-A09',
          { intent: /(?:yes|here|tag)/i, form: /(?:here it is|here you go)/i }),
        npc('T3-07', 'Daniel Ortiz', 'baggage',
          { L0: 'What does it look like?', L1: 'What does your bag look like?', L2: 'Can you describe your suitcase for me?' },
          '你的行李长什么样？'),
        says('T3-08', 'Describe the large black suitcase with the red ribbon.', '描述行李。', 'CH1-A08',
          { intent: /(?:black|large|big|suitcase|bag|ribbon|handle)/i, form: /(?:it's a|with)/i,
            required: [/(?:black|large|big)/i, /(?:ribbon|handle|suitcase)/i] }),
        npc('T3-09', 'Daniel Ortiz', 'baggage',
          { L0: 'We can wait or deliver it.', L1: 'We can wait for the next update in about twenty minutes, or we can deliver it to your hotel.', L2: 'We can check again in about twenty minutes, or arrange delivery to your hotel.' },
          '我们可以等下一次更新，也可以把行李送到酒店。'),
        says('T3-10', 'Ask how long delivery will take.', '追问时间。', 'CH1-A09',
          { intent: /(?:how long|time|quickly|take)/i, form: /how long/i }),
        npc('T3-11', 'Daniel Ortiz', 'baggage',
          { L0: 'About one day.', L1: 'About one day.', L2: 'Usually by the next afternoon.' },
          '大约一天。'),
        {
          id: 'T3-12', type: 'choice', prompt: '选择你的行李处理方式。',
          promptZh: '选择处理方法。',
          options: [
            { label: '等二十分钟，看行李是否会到', ok: true, set: { bag_status: 'recovered' }, feedback: '二十分钟后，行李在超大行李区找到。' },
            { label: '请送到酒店，先离站', ok: true, set: { bag_status: 'pending_delivery' }, feedback: '配送已登记，你会收到后续短信。' }
          ]
        }
      ]
    },
    {
      id: 'CH1-S4', title: '到达大厅', taskId: 'CH1-T4', image: 'img/scene-arrivals.png',
      items: [
        npc('T4-01', '机场广播', 'announce',
          { L0: 'Exit 3 is on the left.', L1: 'Exit 3 is on the left. Pickup Zone A is straight ahead.', L2: 'Exit 3 is on the left. Pickup Zone A is straight ahead, beside the taxi rank.' },
          '3 号出口在左边，接客区 A 在前面。'),
        npc('T4-02A', 'Kenji 语音', 'driver',
          { L0: 'I’ll meet you outside Exit 3.', L1: 'I’ll meet you outside Exit 3, near the coffee shop.', L2: 'I’ll be outside Exit 3, by the coffee shop.' },
          '我在 3 号出口外、咖啡店附近等你。'),
        npc('T4-02B', 'Kenji 语音', 'driver',
          { L0: 'A black Toyota. Plate ends in 2-7.', L1: 'I’m in a black Toyota. The plate ends in 2-7.', L2: 'I’m in a black Toyota; the plate ends in 2-7.' },
          '黑色 Toyota，车牌末两位 2-7。'),
        says('T4-03', 'Repeat at least two pickup details.', '确认接机信息。', 'CH1-A10',
          { intent: /(?:exit 3|three|black|toyota|2-7|two-seven)/i,
            form: /(?:exit 3|three|black toyota|plate)/i,
            required: [/(?:exit|three)/i, /(?:toyota|black|plate|2-7)/i] }),
        {
          id: 'T4-05', type: 'choice', prompt: '你到 3 号出口了。接下来怎么做？', promptZh: '选择行动。',
          options: [
            { label: '直接去 Pickup Zone A', ok: true, set: { pickup_choice: 'direct' }, next: 'CH1-S5A' },
            { label: '先去服务台核对信息', ok: true, set: { pickup_choice: 'info_desk' }, next: 'CH1-S5B' }
          ]
        }
      ]
    },
    {
      id: 'CH1-S5A', title: '会合点不熟', taskId: 'CH1-T5', image: 'img/scene-arrivals.png', next: 'CH1-S5C',
      items: [
        npc('T5A-01', 'Kenji Tanaka', 'driver', { L0: 'Hello?', L1: 'Hello?', L2: 'Hello, Kenji speaking.' }, '喂？'),
        says('T5A-02', 'Tell the driver your name and where you are.', '报告位置。', 'CH1-A11',
          { intent: /(?:i'm|this is|pickup|coffee|exit)/i, form: /(?:this is|i'm at|pickup zone)/i, required: [/(?:pickup|exit|coffee)/i] }),
        npc('T5A-03', 'Kenji Tanaka', 'driver',
          { L0: 'Which coffee shop?', L1: 'Which coffee shop? There are two. Are you near Exit 2 or Exit 3?', L2: 'There are two coffee shops here. Are you by Exit 2 or Exit 3?' },
          '哪一个咖啡店？你在 2 号出口还是 3 号出口？'),
        says('T5A-04', 'Say that you’re near Exit 3.', '澄清位置。', 'CH1-A11',
          { intent: /(?:exit 3|three)/i, form: /(?:near|by|at).*(?:exit|three)/i }),
        npc('T5A-05', 'Kenji Tanaka', 'driver',
          { L0: 'I’m at Exit 2, by the pharmacy.', L1: 'I’m outside Exit 2, by the pharmacy. Turn left at the escalator and go outside.', L2: 'I’m over at Exit 2, by the pharmacy. Head left at the escalator and come outside.' },
          '我在 2 号出口的药房旁。在扶梯处左转，然后出去。'),
        says('T5A-06', 'Confirm the new meeting point.', '复述新的会合点。', 'CH1-A11',
          { intent: /(?:exit 2|two|pharmacy)/i, form: /(?:so you're|so i need to|exit 2|pharmacy)/i, required: [/(?:exit 2|two)/i, /pharmacy/i] }),
        npc('T5A-07', 'Kenji Tanaka', 'driver', { L0: 'Yes. Black Toyota.', L1: 'That’s right. I’m in the black Toyota.', L2: 'Exactly. Black Toyota, plate ending in 2-7.' }, '没错，黑色 Toyota。'),
        says('T5A-08', 'Tell the driver you’ll meet by the pharmacy.', '结束电话。', 'CH1-A11', { intent: /(?:meet|pharmacy|there)/i, form: /(?:i'll|i will|pharmacy)/i })
      ]
    },
    {
      id: 'CH1-S5B', title: '接机信息变化', taskId: 'CH1-T5', image: 'img/scene-arrivals.png', next: 'CH1-S5C',
      items: [
        npc('T5B-01', 'Aiko Mori', 'info', { L0: 'Can I help?', L1: 'Can I help you?', L2: 'What can I help you with?' }, '需要帮助吗？'),
        says('T5B-02', 'Say that you’re looking for your driver, Kenji Tanaka.', '说明问题。', 'CH1-A11',
          { intent: /(?:driver|kenji|find|looking for)/i, form: /(?:looking for|can't find|find)/i, required: [/driver/i] }),
        npc('T5B-03', 'Aiko Mori', 'info',
          { L0: 'Which car?', L1: 'Do you know which car he’s driving?', L2: 'Which vehicle is he in?' },
          '他开什么车？'),
        says('T5B-04', 'Give the driver and car details.', '提供车辆信息。', 'CH1-A11',
          { intent: /(?:black|toyota|2-7|plate)/i, form: /(?:black toyota|plate|ends in)/i, required: [/toyota/i] }),
        npc('T5B-05', 'Aiko Mori', 'info',
          { L0: 'Exit 3 is closed. He’s at Exit 4.', L1: 'Exit 3 is closed for cleaning. He is waiting at Exit 4 now.', L2: 'Exit 3 is closed for cleaning, so he’s moved over to Exit 4.' },
          '3 号出口关闭了，他现在在 4 号出口。'),
        says('T5B-06', 'Confirm that you need to go to Exit 4.', '确认信息变化。', 'CH1-A11',
          { intent: /(?:exit 4|four|instead)/i, form: /(?:so i need to|instead|so he's)/i }),
        npc('T5B-07', 'Aiko Mori', 'info',
          { L0: 'Take the lift up one floor.', L1: 'Take the lift up one floor and follow the signs for Exit 4.', L2: 'Take the lift up one level and follow the signs for Exit 4.' },
          '坐电梯上一层，跟着 4 号出口指示走。'),
        says('T5B-08', 'Ask whether he’s still in the black Toyota.', '核对车辆。', 'CH1-A11',
          { intent: /toyota|black/i, form: /(?:still in|same black|toyota)/i }),
        npc('T5B-09', 'Aiko Mori', 'info',
          { L0: 'Yes. By the taxi sign.', L1: 'Yes. He’s waiting by the taxi sign.', L2: 'Yes, he’s waiting by the taxi sign at Exit 4.' },
          '是的，他在出租车牌旁等。')
      ]
    },
    {
      id: 'CH1-S5C', title: '安全确认', taskId: 'CH1-T5', image: 'img/scene-arrivals.png',
      items: [
        npc('T5C-01', 'Kenji Tanaka', 'driver',
          { L0: 'Wait by the pickup sign. I’m coming.', L1: 'Please wait by the pickup sign. I’m coming to the main door.', L2: 'Please wait by the pickup sign. I’m pulling up to the main door now.' },
          '请在接客牌旁等，我马上到主门。'),
        {
          ...npc('T5C-02A', '机场广播', 'announce',
            { L0: 'Don’t leave. Drivers can only stop here.', L1: 'Drivers can only stop in the pickup area for a few minutes. Please do not leave without confirming your pickup.', L2: 'Drivers can only wait in the pickup area briefly. Please stay here until your pickup is confirmed.' },
            '司机只能短暂停靠。未确认接机前请不要离开。'),
          branch: 'direct'
        },
        {
          ...npc('T5C-02B', 'Aiko Mori', 'info',
            { L0: 'Wait at Exit 4. Keep your phone on.', L1: 'Kenji is coming to Exit 4. Please wait by the taxi sign and keep your phone on.', L2: 'Kenji is on his way to Exit 4. Please stay by the taxi sign and keep your phone on.' },
            'Kenji 正在来 4 号出口。请在出租车牌旁等待并保持电话畅通。'),
          branch: 'info_desk'
        },
        {
          id: 'T5C-03', type: 'choice', prompt: '司机正在来会合点。你准备怎么做？', promptZh: '这是关键选择。',
          options: [
            { label: '留在接客牌旁，等待司机', ok: true, set: { meeting_confirmed: true }, next: 'CH1-S6' },
            { label: '去出租车区，但先告诉司机新位置', ok: true, set: { meeting_confirmed: true }, next: 'CH1-S6' },
            { label: '不回复、不确认，直接离开会合区', ok: false, set: { left_pickup_without_confirmation: true }, next: 'CH1-E3' }
          ]
        }
      ]
    },
    {
      id: 'CH1-S6', title: '车辆旁', taskId: 'CH1-T6', image: 'img/scene-arrivals.png', next: 'AUTO_ENDING',
      items: [
        npc('T6-01', 'Kenji Tanaka', 'driver', { L0: 'Are you {name}?', L1: 'Are you {name}?', L2: 'Are you {name}?' }, '你是 {name} 吗？'),
        says('T6-02', 'Confirm that you’re the pickup passenger.', '确认身份。', 'CH1-A12',
          { intent: /(?:yes|that's me|i am)/i, form: /(?:that's me|yes|i am)/i }),
        npc('T6-03', 'Kenji Tanaka', 'driver',
          { L0: 'I’m Kenji. Black Toyota.', L1: 'I’m Kenji. Here’s my ID. This is the black Toyota.', L2: 'I’m Kenji. Here’s my ID, and this is the black Toyota with the plate ending in 2-7.' },
          '我是 Kenji。这是黑色 Toyota。'),
        says('T6-03A', 'Confirm that this is the black Toyota.', '核对车辆。', 'CH1-A12',
          { intent: /(?:yes|this is|black|toyota|plate)/i, form: /(?:this is|black toyota|that's)/i }),
        says('T6-04', 'Ask the driver to confirm the destination.', '请求核对目的地。', 'CH1-A12',
          { intent: /(?:destination|hotel|where|going)/i, form: /(?:could you confirm|are we going|where are we going)/i }),
        npc('T6-05', 'Kenji Tanaka', 'driver', { L0: 'The {lodging_name}.', L1: 'The {lodging_name} in {lodging_area}.', L2: 'We’re going to the {lodging_name} in {lodging_area}.' }, '去 {lodging_name}。'),
        says('T6-06', 'Confirm that the destination is correct.', '核对目的地。', 'CH1-A12',
          { intent: /(?:yes|right|correct)/i, form: /(?:yes|that's right|correct)/i }),
        npc('T6-07', 'Kenji Tanaka', 'driver', { L0: 'All your bags?', L1: 'Is this all your luggage?', L2: 'Is this everything you’re travelling with?' }, '这是你全部的行李吗？'),
        says('T6-08', 'Tell the driver about your luggage.', '说明行李状态。', 'CH1-A09',
          { intent: /(?:yes|everything|luggage|suitcase|delivered|hotel)/i,
            form: /(?:this is|my suitcase|delivered|no)/i }),
        npc('T6-09', 'Kenji Tanaka', 'driver', { L0: 'About 40 minutes.', L1: 'It’ll take about forty minutes.', L2: 'It should take around forty minutes at this time.' }, '大约四十分钟。'),
        says('T6-10', 'Ask the driver to let you know when you arrive.', '确认下一步。', 'CH1-A12',
          { intent: /(?:arrive|tell|let me know)/i, form: /(?:let me know|tell me when)/i }),
        narration('T6-11', 'You check the car one last time, get in, and leave the airport.', '你最后确认车辆，上车离开机场。')
      ]
    },
    {
      id: 'CH1-E1', title: '带齐行李顺利上车', taskId: 'CH1-T6', endingId: 'best', image: 'img/scene-arrivals.png',
      items: [narration('E1-01', 'You leave the airport with everything you packed.', '你带齐行李顺利离开机场。')]
    },
    {
      id: 'CH1-E2', title: '先离站，行李后到', taskId: 'CH1-T6', endingId: 'normal', image: 'img/scene-arrivals.png',
      items: [narration('E2-01', 'You leave while your suitcase follows by delivery.', '你先离站，行李稍后送到酒店。')]
    },
    {
      id: 'CH1-E3', title: '错过接机', taskId: 'CH1-T5', endingId: 'bad', image: 'img/scene-arrivals.png', retryTo: 'CH1-S5C',
      items: [narration('E3-01', 'You leave without confirming the driver. The car cannot find you.', '你没有确认接机就离开，司机找不到你。')]
    }
  ];

  const abilities = [
    { id: 'CH1-A01', title: '出示文件并回应要求' },
    { id: 'CH1-A02', title: '说明旅行目的' },
    { id: 'CH1-A03', title: '说明停留时间' },
    { id: 'CH1-A04', title: '说明住处' },
    { id: 'CH1-A05', title: '确认航班与传送带' },
    { id: 'CH1-A06', title: '核对行李归属' },
    { id: 'CH1-A07', title: '报告行李未到' },
    { id: 'CH1-A08', title: '描述行李特征' },
    { id: 'CH1-A09', title: '确认配送与后续' },
    { id: 'CH1-A10', title: '找到接机区域' },
    { id: 'CH1-A11', title: '澄清变化后的会合点' },
    { id: 'CH1-A12', title: '核对司机、车辆和目的地' }
  ];

  const endings = [
    { id: 'best', title: '带齐行李顺利上车', description: '行李取回，接机确认完成。' },
    { id: 'normal', title: '先离站，行李后到', description: '配送已安排，接机确认完成。' },
    { id: 'bad', title: '错过接机', description: '两次安全提示后仍未确认会合。', retryTo: 'CH1-S5C' }
  ];

  const chapterChecks = {
    'T1-03': { prompt: 'Here ___ are.', promptZh: '补全出示文件的固定语块。', answers: ['you'] },
    'T1-05': { prompt: 'I’m here ___ sightseeing.', promptZh: '补全目的表达。', answers: ['for'] },
    'T1-07': { prompt: 'I’m staying ___ ten days.', promptZh: '补全时长表达。', answers: ['for'] },
    'T1-09': { prompt: 'I’m staying ___ the hotel.', promptZh: '补全地点介词。', answers: ['at'] },
    'T2-02': { prompt: 'Carousel ___ for CA123.', promptZh: '补全传送带号码。', answers: ['3', 'three'] },
    'T2-04': { prompt: 'Can I check the ___?', promptZh: '补全行李凭证。', answers: ['tag'] },
    'T2-06': { prompt: 'This one isn’t ___.', promptZh: '补全所属代词。', answers: ['mine'] },
    'T2-08': { prompt: 'My bag is ___.', promptZh: '补全“未见/丢失”。', answers: ['missing', "didn't arrive"] },
    'T3-02': { prompt: 'My bag ___ arrive.', promptZh: '补全否定结构。', answers: ["didn't", 'did not'] },
    'T3-04': { prompt: 'I was ___ CA123.', promptZh: '补全航班表达的介词。', answers: ['on'] },
    'T3-06': { prompt: 'Here it ___.', promptZh: '补全出示凭证的语块。', answers: ['is'] },
    'T3-08': { prompt: 'It’s a black suitcase ___ a red ribbon.', promptZh: '补全表示“带有”的连接词。', answers: ['with'] },
    'T3-10': { prompt: 'How long will it ___?', promptZh: '补全询问耗时的动词。', answers: ['take'] },
    'T4-03': { prompt: 'The plate ends in ___.', promptZh: '补全车牌末两位。', answers: ['2-7', 'two-seven', '2 7'] },
    'T5A-02': { prompt: 'I’m at Pickup Zone ___.', promptZh: '补全接客区。', answers: ['A'] },
    'T5A-04': { prompt: 'I’m near Exit ___.', promptZh: '补全出口号码。', answers: ['3', 'three'] },
    'T5A-06': { prompt: 'So you’re at Exit 2, by the ___?', promptZh: '补全会合地点。', answers: ['pharmacy'] },
    'T5A-08': { prompt: 'I’ll meet you by the ___.', promptZh: '补全会合地点。', answers: ['pharmacy'] },
    'T5B-02': { prompt: 'I’m looking ___ my driver.', promptZh: '补全寻找的固定搭配。', answers: ['for'] },
    'T5B-04': { prompt: 'The plate ends in ___.', promptZh: '补全车牌末两位。', answers: ['2-7', 'two-seven', '2 7'] },
    'T5B-06': { prompt: 'So I need to go to Exit ___ instead?', promptZh: '补全变化后的出口。', answers: ['4', 'four'] },
    'T5B-08': { prompt: 'He’s still in the black ___.', promptZh: '补全车辆品牌。', answers: ['Toyota'] },
    'T6-02': { prompt: 'Yes, that’s ___.', promptZh: '补全确认身份的表达。', answers: ['me'] },
    'T6-03A': { prompt: 'This is the black ___.', promptZh: '补全车辆品牌。', answers: ['Toyota'] },
    'T6-04': { prompt: 'Could you confirm the ___?', promptZh: '补全要核对的信息。', answers: ['destination'] },
    'T6-06': { prompt: 'That’s ___.', promptZh: '补全确认正确的表达。', answers: ['right', 'correct'] },
    'T6-08': {
      prompt: 'The luggage situation is ___.',
      promptZh: '补一个与你的行李状态相符的词。',
      answersByState: {
        recovered: ['everything', 'here', 'all'],
        pending_delivery: ['delivered', 'delivery', 'coming']
      }
    },
    'T6-10': { prompt: 'Please let me ___ when we arrive.', promptZh: '补全提醒的表达。', answers: ['know'] }
  };

  scenes.forEach((scene) => {
    (scene.items || []).forEach((item) => {
      if (item.type === 'speak' && chapterChecks[item.id]) item.check = chapterChecks[item.id];
    });
  });

  return {
    baseCamp: { zones, nodes, trials },
    chapterOne: {
      id: 'CHAPTER-LEAVING-AIRPORT-01',
      title: '出国',
      tasks,
      scenes,
      abilities,
      endings
    }
  };
});
