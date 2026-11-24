(function initExamKnowledge(root) {
  const sources = [
    {
      id: 'CET4-2016-SYLLABUS',
      exam: 'CET4',
      title: '全国大学英语四、六级考试大纲（2016年修订版）',
      publisher: '教育部教育考试院',
      publishedYear: 2016,
      verifiedOn: '2026-11-23',
      kind: 'official_exam_syllabus',
      url: 'https://cet.neea.edu.cn/html1/folder/16113/1588-1.htm',
      pdfUrl: 'https://cet.neea.edu.cn/res/Home/1704/55b02330ac17274664f06d9d3db8249d.pdf',
      note: '中国教育考试网“考试大纲”页面当前列出的英语四、六级大纲。官方 PDF 已下载并抽取正文；页 2–20 已核对。'
    },
    {
      id: 'IELTS-ACADEMIC-FORMAT-2026',
      exam: 'IELTS_ACADEMIC',
      title: 'IELTS Academic test format and sections',
      publisher: 'IELTS Partners',
      publishedYear: 2026,
      verifiedOn: '2026-11-23',
      kind: 'official_test_format',
      url: 'https://ielts.org/take-a-test/test-types/ielts-academic-test',
      note: '官网 2026 年版页面；总时长、阅读、写作、口语和分项题型均已核对。'
    },
    {
      id: 'IELTS-SCORING-2026',
      exam: 'IELTS_ACADEMIC',
      title: 'IELTS scoring in detail',
      publisher: 'IELTS Partners',
      publishedYear: 2026,
      verifiedOn: '2026-11-23',
      kind: 'official_scoring',
      url: 'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail',
      note: '官网总分与 0–9 分段说明；四项评分标准另见写作、口语格式页。'
    },
    {
      id: 'CAMBRIDGE-IELTS-21-ACADEMIC',
      exam: 'IELTS_ACADEMIC',
      title: "IELTS 21 Practice Tests Academic Student's Book with Answers with Digital Pack",
      publisher: 'Cambridge University Press & Assessment',
      published: 'July 2026',
      verifiedOn: '2026-11-23',
      kind: 'official_practice_book',
      isbn: '9781009826723',
      cefr: 'B1-C2',
      tests: 4,
      url: 'https://www.cambridge.org/is/cambridgeenglish/catalog/cambridge-english-exams-ielts/ielts-21-practice-tests/ielts-21-practice-tests-academic-students-book-answers-digital-pack',
      note: 'Cambridge 官方商品页确认 2026 年 7 月出版、四套完整 Academic 试题。'
    }
  ];

  const tracks = {
    CET4: {
      id: 'CET4',
      title: '大学英语四级',
      role: '主路线：大学英语综合运用与四级考试能力',
      sourcePolicy: '以教育部教育考试院考试大纲和真题为准；商业教材只作为教学编排，不作为考试定义来源。',
      format: {
        totalMinutes: 125,
        writing: { weight: 0.15, minutes: 30, minWords: 120 },
        listening: { weight: 0.35, minutes: 25, wpm: [120, 140], questions: 25 },
        reading: { weight: 0.35, minutes: 40, questions: 30 },
        translation: { weight: 0.15, minutes: 30, minChineseCharacters: 140, maxChineseCharacters: 160 }
      },
      vocabulary: {
        totalHeadwords: 5418,
        note: '官方合并词表词目总数，六级词另有标记；词表只列词形，不提供词性、释义或读音。'
      },
      nodes: [
        {
          id: 'CET4-LISTEN-MAIN', exam: 'CET4', skill: 'listening', title: '理解听力主旨大意',
          canDo: '听懂短篇英语广播、熟悉话题会话或讲话的主旨。',
          sourceIds: ['CET4-2016-SYLLABUS'], evidence: '主旨题正确率', taskTypes: ['news', 'conversation', 'passage']
        },
        {
          id: 'CET4-LISTEN-DETAIL', exam: 'CET4', skill: 'listening', title: '获取听力事实与细节',
          canDo: '抓住人物、地点、时间、原因、结果和关键数字。',
          sourceIds: ['CET4-2016-SYLLABUS'], evidence: '明细题正确且有语音依据', taskTypes: ['news', 'conversation', 'passage']
        },
        {
          id: 'CET4-LISTEN-INFER', exam: 'CET4', skill: 'listening', title: '推断隐含意义与交际功能',
          canDo: '根据语气、上下文和句间关系判断态度、观点或交际功能。',
          sourceIds: ['CET4-2016-SYLLABUS'], evidence: '推断题答案与证据句', taskTypes: ['conversation', 'passage']
        },
        {
          id: 'CET4-READ-MAIN', exam: 'CET4', skill: 'reading', title: '概括文章主旨',
          canDo: '区分主题、主旨和局部细节。',
          sourceIds: ['CET4-2016-SYLLABUS'], evidence: '概括题正确并说明依据', taskTypes: ['long_reading', 'careful_reading']
        },
        {
          id: 'CET4-READ-DETAIL', exam: 'CET4', skill: 'reading', title: '定位并理解细节信息',
          canDo: '按题干关键词定位原文并核对限定条件。',
          sourceIds: ['CET4-2016-SYLLABUS'], evidence: '定位句与答案一致', taskTypes: ['long_reading', 'careful_reading']
        },
        {
          id: 'CET4-READ-INFER', exam: 'CET4', skill: 'reading', title: '推断作者观点与隐含意义',
          canDo: '根据证据推断，不把常识或猜测当成原文信息。',
          sourceIds: ['CET4-2016-SYLLABUS'], evidence: '答案与推断依据句', taskTypes: ['careful_reading']
        },
        {
          id: 'CET4-READ-LINK', exam: 'CET4', skill: 'reading', title: '利用词汇语法衔接理解篇章',
          canDo: '理解因果、比较、条件等句间关系，并利用指代和连接词定位信息。',
          sourceIds: ['CET4-2016-SYLLABUS'], evidence: '复述句间关系和指代对象', taskTypes: ['careful_reading', 'cloze']
        },
        {
          id: 'CET4-WRITE-SHORT', exam: 'CET4', skill: 'writing', title: '30 分钟写出不少于 120 词短文',
          canDo: '表达中心、组织段落、使用基本衔接和正确语言。',
          sourceIds: ['CET4-2016-SYLLABUS'], evidence: '按官方档次量表评分', taskTypes: ['essay', 'description', 'applied_writing']
        },
        {
          id: 'CET4-TRANSLATE', exam: 'CET4', skill: 'translation', title: '汉译英段落转换',
          canDo: '30 分钟内将约 140–160 个汉字的文化、历史或社会主题段落译成英语。',
          sourceIds: ['CET4-2016-SYLLABUS'], evidence: '按官方翻译评分档次评估', taskTypes: ['paragraph_translation']
        },
        {
          id: 'CET4-SPEAK-EXPLAIN', exam: 'CET4', skill: 'speaking', title: '口头陈述和互动',
          canDo: '陈述事实、理由和观点，交换意见，并进行解释、比较和论证。',
          sourceIds: ['CET4-2016-SYLLABUS'], evidence: '准确性与范围、话语长短和连贯性、灵活性和适切性', taskTypes: ['short_answer', 'presentation', 'interaction']
        }
      ]
    },
    IELTS_ACADEMIC: {
      id: 'IELTS_ACADEMIC',
      title: 'IELTS Academic',
      role: '主路线：学术英语与 IELTS Academic 四项能力',
      sourcePolicy: '以 IELTS 官方考试格式、评分标准和 Cambridge 官方练习题为主；雅思没有统一固定词表。',
      format: {
        totalMinutes: 165,
        listening: { minutes: 30, parts: 4, questions: 40, plays: 1 },
        reading: { minutes: 60, passages: 3, questions: 40, wordRange: [2150, 2750] },
        writing: { minutes: 60, task1Minutes: 20, task1MinWords: 150, task2Minutes: 40, task2MinWords: 250 },
        speaking: { minutes: [11, 14], parts: 3 }
      },
      nodes: [
        {
          id: 'IELTS-LISTEN-DETAIL', exam: 'IELTS_ACADEMIC', skill: 'listening', title: '按录音顺序获取细节',
          canDo: '在只听一次的多口音录音中定位事实、数字和关键词。',
          sourceIds: ['IELTS-ACADEMIC-FORMAT-2026'], evidence: '40 题中的细节题正确率', taskTypes: ['multiple_choice', 'matching', 'completion']
        },
        {
          id: 'IELTS-READ-EXPLICIT', exam: 'IELTS_ACADEMIC', skill: 'reading', title: '辨认明示信息与段落功能',
          canDo: '在 2150–2750 词的非专业学术文本中定位明示信息。',
          sourceIds: ['IELTS-ACADEMIC-FORMAT-2026'], evidence: '定位题和匹配题正确并说明依据', taskTypes: ['matching_information', 'matching_headings', 'completion']
        },
        {
          id: 'IELTS-READ-TFNG', exam: 'IELTS_ACADEMIC', skill: 'reading', title: '区分 True / False / Not Given',
          canDo: '区分原文支持、原文矛盾、原文没有提供三种状态。',
          sourceIds: ['IELTS-ACADEMIC-FORMAT-2026'], evidence: '三值判断和证据句', taskTypes: ['true_false_not_given']
        },
        {
          id: 'IELTS-READ-ARGUMENT', exam: 'IELTS_ACADEMIC', skill: 'reading', title: '理解逻辑论证与观点',
          canDo: '理解至少一篇含详细逻辑论证的学术文本及作者观点。',
          sourceIds: ['IELTS-ACADEMIC-FORMAT-2026'], evidence: '论证结构图和观点题正确', taskTypes: ['multiple_choice', 'yes_no_not_given']
        },
        {
          id: 'IELTS-WRITE-T1', exam: 'IELTS_ACADEMIC', skill: 'writing', title: 'Task 1 数据和图示描述',
          canDo: '约 20 分钟用至少 150 词描述图表、表格或流程的主要信息。',
          sourceIds: ['IELTS-ACADEMIC-FORMAT-2026', 'IELTS-SCORING-2026'], evidence: '四项评分标准分项反馈', taskTypes: ['graph_description', 'diagram_description']
        },
        {
          id: 'IELTS-WRITE-T2', exam: 'IELTS_ACADEMIC', skill: 'writing', title: 'Task 2 观点论证',
          canDo: '约 40 分钟用至少 250 词回应观点、论点或问题，并给证据和例子。',
          sourceIds: ['IELTS-ACADEMIC-FORMAT-2026', 'IELTS-SCORING-2026'], evidence: '四项评分标准分项反馈；Task 2 权重为 Task 1 两倍', taskTypes: ['argument_essay', 'problem_solution']
        },
        {
          id: 'IELTS-SPEAK-INTERVIEW', exam: 'IELTS_ACADEMIC', skill: 'speaking', title: 'Part 1 熟悉话题问答',
          canDo: '就家庭、工作、学习、兴趣等熟悉话题表达信息和观点。',
          sourceIds: ['IELTS-ACADEMIC-FORMAT-2026'], evidence: '流利度、词汇、语法、发音四项证据', taskTypes: ['interview']
        },
        {
          id: 'IELTS-SPEAK-LONG', exam: 'IELTS_ACADEMIC', skill: 'speaking', title: 'Part 2 两分钟个人陈述',
          canDo: '根据提示卡准备 1 分钟并连续陈述约 2 分钟。',
          sourceIds: ['IELTS-ACADEMIC-FORMAT-2026'], evidence: '连续时长、结构、词法和发音证据', taskTypes: ['long_turn']
        },
        {
          id: 'IELTS-SPEAK-DISCUSS', exam: 'IELTS_ACADEMIC', skill: 'speaking', title: 'Part 3 抽象讨论',
          canDo: '解释观点，分析、讨论并推测较抽象的问题。',
          sourceIds: ['IELTS-ACADEMIC-FORMAT-2026'], evidence: '论证展开、互动和四项评分证据', taskTypes: ['discussion']
        }
      ]
    }
  };

  const api = { sources, tracks };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ExamKnowledge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
