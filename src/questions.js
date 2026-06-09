export const QUESTIONS = [
  // ===== E/I 外向 / 内向（direction: E）=====
  { id: 1, dimension: "EI", direction: "E", reverse: false, text: "在聚会或活动中，我会主动和不认识的人攀谈。" },
  { id: 2, dimension: "EI", direction: "E", reverse: false, text: "和一群人待在一起会让我感到精力充沛。" },
  { id: 3, dimension: "EI", direction: "E", reverse: false, text: "我喜欢成为众人关注的焦点。" },
  { id: 4, dimension: "EI", direction: "E", reverse: false, text: "我习惯一边说一边把想法理清楚。" },
  { id: 5, dimension: "EI", direction: "E", reverse: false, text: "认识新朋友对我来说轻松又愉快。" },
  { id: 6, dimension: "EI", direction: "E", reverse: true, text: "长时间社交之后，我需要独处来恢复精力。" },
  { id: 7, dimension: "EI", direction: "E", reverse: true, text: "比起热闹的场合，我更喜欢安静的小圈子或独处。" },
  { id: 8, dimension: "EI", direction: "E", reverse: true, text: "我倾向于先在心里想清楚，再开口表达。" },
  { id: 9, dimension: "EI", direction: "E", reverse: true, text: "周末我更愿意安静地待在家里，而不是外出社交。" },

  // ===== S/N 实感 / 直觉（direction: S）=====
  { id: 10, dimension: "SN", direction: "S", reverse: false, text: "我更关注具体的事实和细节，而不是背后的可能性。" },
  { id: 11, dimension: "SN", direction: "S", reverse: false, text: "我做事喜欢按照已经验证有效的步骤来进行。" },
  { id: 12, dimension: "SN", direction: "S", reverse: false, text: "我更相信亲身经历，而不是直觉或推测。" },
  { id: 13, dimension: "SN", direction: "S", reverse: false, text: "我擅长记住具体的细节，比如数字、日期和事实。" },
  { id: 14, dimension: "SN", direction: "S", reverse: false, text: "我更愿意处理眼前实际的问题，而不是设想未来。" },
  { id: 15, dimension: "SN", direction: "S", reverse: true, text: "我经常思考事物背后隐含的意义和可能性。" },
  { id: 16, dimension: "SN", direction: "S", reverse: true, text: "我喜欢想象各种尚未发生的未来场景。" },
  { id: 17, dimension: "SN", direction: "S", reverse: true, text: "比起细节，我更容易先抓住整体的概念和模式。" },
  { id: 18, dimension: "SN", direction: "S", reverse: true, text: "我常常被新奇的创意和抽象的理论所吸引。" },

  // ===== T/F 思考 / 情感（direction: T）=====
  { id: 19, dimension: "TF", direction: "T", reverse: false, text: "做决定时，我主要依靠逻辑分析而不是个人感受。" },
  { id: 20, dimension: "TF", direction: "T", reverse: false, text: "我认为公平和原则比照顾个别人的感受更重要。" },
  { id: 21, dimension: "TF", direction: "T", reverse: false, text: "评价一件事时，我会先看它是否合理、是否有效。" },
  { id: 22, dimension: "TF", direction: "T", reverse: false, text: "我能够比较客观地指出别人的问题，即使可能让对方不快。" },
  { id: 23, dimension: "TF", direction: "T", reverse: false, text: "争论时，我更在意谁的观点更有道理，而非气氛是否和谐。" },
  { id: 24, dimension: "TF", direction: "T", reverse: true, text: "做决定时，我会很在意它会如何影响他人的感受。" },
  { id: 25, dimension: "TF", direction: "T", reverse: true, text: "我很容易体会和感受到别人的情绪。" },
  { id: 26, dimension: "TF", direction: "T", reverse: true, text: "维持人际关系的和谐对我来说非常重要。" },
  { id: 27, dimension: "TF", direction: "T", reverse: true, text: "我倾向于用鼓励和体谅的方式给别人反馈。" },

  // ===== J/P 判断 / 知觉（direction: J）=====
  { id: 28, dimension: "JP", direction: "J", reverse: false, text: "我喜欢提前做好计划，并按计划执行。" },
  { id: 29, dimension: "JP", direction: "J", reverse: false, text: "把任务尽早完成会让我感到安心。" },
  { id: 30, dimension: "JP", direction: "J", reverse: false, text: "我喜欢把生活和工作安排得井井有条。" },
  { id: 31, dimension: "JP", direction: "J", reverse: false, text: "我习惯列清单来安排自己要做的事。" },
  { id: 32, dimension: "JP", direction: "J", reverse: false, text: "事情一旦定下来，我希望尽快得出明确的结论。" },
  { id: 33, dimension: "JP", direction: "J", reverse: true, text: "我喜欢保持灵活，根据情况随时调整计划。" },
  { id: 34, dimension: "JP", direction: "J", reverse: true, text: "我常常拖到截止日期临近才开始行动。" },
  { id: 35, dimension: "JP", direction: "J", reverse: true, text: "我更享受随性、不被安排束缚的生活方式。" },
  { id: 36, dimension: "JP", direction: "J", reverse: true, text: "面对选择时，我倾向于先保留余地而不急于下决定。" }
];

const ORDER_IDS = [
  1, 10, 19, 28, 6, 15, 24, 33, 2, 11, 20, 29,
  7, 16, 25, 34, 3, 12, 21, 30, 8, 17, 26, 35,
  4, 13, 22, 31, 9, 18, 27, 36, 5, 14, 23, 32
];

export const ORDERED_QUESTIONS = ORDER_IDS.map((id) => QUESTIONS.find((question) => question.id === id));
