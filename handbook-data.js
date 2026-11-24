(function initHandbook(root) {
  const sections = [
    {
      id: 'pronouns-be',
      level: 'L0',
      title: '人称代词与 be 动词',
      summary: '先判断主语是谁，再选择 am、is 或 are。',
      body: 'I 用 am；you、we、they 用 are；he、she、it 和单数名词用 is。be 动词后面可以接身份、状态或特征。',
      examples: ['I am Lin. / I’m Lin.', 'You are ready.', 'She is my guide.', 'This is my bag.']
    },
    {
      id: 'verbs',
      level: 'L0–L1',
      title: '动词：状态、动作与及物性',
      summary: 'be 动词说明状态；实义动词说明动作、拥有或需求。',
      body: '实义动词分为不及物动词和及物动词。不及物动词可以单独构成主谓句；及物动词通常还需要宾语。有的动词还可以带双宾语或宾语补足语。动词要和搭配一起学。',
      examples: ['The train arrived. 不及物', 'I need a ticket. 及物', 'He gave me a map. 双宾', 'The news made me happy. 宾补']
    },
    {
      id: 'five-patterns',
      level: 'L1',
      title: '五大基本句型',
      summary: '先看动词后面还需要谁来补全意思。',
      body: '主谓 SV；主系表 SP；主谓宾 SVO；主谓双宾 SVOO；主谓宾补 SVOC。句型是理解骨架，不是要求背术语。',
      examples: ['The train arrived. SV', 'She is a guide. SP', 'I need a taxi. SVO', 'He gave me a map. SVOO', 'The news made me happy. SVOC']
    },
    {
      id: 'questions',
      level: 'L0–L1',
      title: '疑问与否定',
      summary: 'be 动词直接提前；实义动词常用 do/does 构成疑问和否定。',
      body: 'What is your name? Where is the exit? Do you need help? I don’t need a taxi. 回答前先判断句子里是 be 动词还是实义动词。',
      examples: ['Are you ready?', 'Do you need help?', 'I’m not late.', 'It isn’t my bag.']
    },
    {
      id: 'time-past',
      level: 'L1–L2',
      title: '时间与过去',
      summary: '先确定事件发生在现在、将来还是过去，再调整动词形式。',
      body: '一般过去时用来说明已经发生并结束的事。规则动词通常加 -ed，常见动词有 went、left、lost、arrived 等不规则或特殊形式。',
      examples: ['I left my bag on the train yesterday.', 'The flight arrived at 4:30.', 'I’m going to wait here.', 'I’ll let you know.']
    },
    {
      id: 'chunks',
      level: 'L0–L2',
      title: '必须先记整块的场景表达',
      summary: '有些内容应作为整块语块记忆，不要逐词硬翻。',
      body: 'What’s your name?、Here you are.、How do I get to...?、My bag is missing. 都是高频整体表达。先会整块使用，再拆开理解。',
      examples: ['Excuse me.', 'Could you repeat that?', 'I’m looking for my driver.', 'Could you confirm the destination?']
    },
    {
      id: 'pronunciation',
      level: 'L0–L1',
      title: '先听句子重音，再练单个音',
      summary: '句子的关键词通常更重；功能词通常更轻。',
      body: '先抓住 name、gate、platform、hotel 等关键词，再处理 I、the、to 等轻读词。没听清时使用重复和确认句，不靠猜测。',
      examples: ['What’s your NAME?', 'Carousel THREE.', 'Exit TWO, by the PHARMACY.']
    }
  ];

  const sources = [
    '义务教育英语课程标准（2022 年版）：词类、句子成分、基本句型和常见时态等语法范围。',
    '普通高中英语课程标准（2020 年修订）：更完整的句法结构和语篇能力。',
    'English Grammar Profile：A1–C2 语法能力描述，目前只用于校准，不直接全量导入。',
    'Pearson GSE Grammar for Adult Learners：语法形式、用途和等级映射。',
    'British Council：任务、词块、注意机制和口语交际参考。'
  ];

  const curriculumSample = {
    id: 'CN2022-SEG-01',
    label: '课标导入样段 01',
    title: '人称主语 + be 动词',
    stage: '义务教育基础语法范围',
    sourceTitle: '《义务教育英语课程标准（2022 年版）》',
    sourcePage: 'http://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html',
    sourcePdf: 'http://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582349487953.pdf',
    verification: '教育部通知页已打开并确认英语课标 PDF 链接；当前网络环境无法下载 PDF，因此本段是依据课标词类、句子成分和简单句范围做的结构化整理，不是逐字摘录。',
    objectives: [
      '识别 I、you、he、she、it、we、they 等基础人称代词',
      '根据主语选择 am、is、are',
      '用 be 动词说明身份、状态和特征',
      '组成肯定句、否定句和一般疑问句'
    ],
    examples: [
      'I am Lin. / I’m Lin.',
      'You are ready.',
      'She is my friend.',
      'It is my bag.',
      'They are here.',
      'I am not late.',
      'Are you ready?'
    ],
    nextCheck: '需要继续核对课标 PDF 的具体页码和原文表述，再补充分级顺序和对应练习。'
  };

  const api = { sections, sources, curriculumSample };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CourseHandbook = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
