import type { VocabItem } from '../types';
import { dayIndex } from '../lib/date';

const rawWords: Array<[string, string, VocabItem['tag']]> = [
  ['analyze', '分析', 'writing'], ['approach', '方法；方式', 'speaking'], ['assume', '假设；认为', 'reading'], ['benefit', '益处；好处', 'writing'],
  ['challenge', '挑战', 'speaking'], ['clarify', '澄清；说明', 'listening'], ['compare', '比较', 'writing'], ['consistent', '稳定的；一致的', 'speaking'],
  ['consume', '消耗', 'reading'], ['contrast', '对比；差异', 'writing'], ['criteria', '标准', 'writing'], ['decline', '下降；减少', 'writing'],
  ['define', '定义；界定', 'speaking'], ['demonstrate', '展示；证明', 'writing'], ['derive', '获得；来源于', 'reading'], ['domestic', '国内的；家庭的', 'listening'],
  ['efficient', '高效的', 'speaking'], ['emphasis', '强调；重点', 'listening'], ['enhance', '提升；增强', 'writing'], ['evidence', '证据', 'reading'],
  ['expand', '扩展；展开', 'speaking'], ['factor', '因素', 'reading'], ['feature', '特点；特征', 'listening'], ['fluctuate', '波动', 'writing'],
  ['function', '功能；起作用', 'reading'], ['generate', '生成；产生', 'speaking'], ['global', '全球的', 'reading'], ['identify', '识别；确认', 'reading'],
  ['impact', '影响', 'writing'], ['implement', '实施；执行', 'writing'], ['imply', '暗示；意味着', 'listening'], ['income', '收入', 'writing'],
  ['indicate', '表明；显示', 'writing'], ['individual', '个人；个体', 'speaking'], ['industry', '行业；工业', 'reading'], ['interpret', '解释；理解', 'writing'],
  ['involve', '涉及；包含', 'listening'], ['issue', '问题；议题', 'speaking'], ['maintain', '保持；维持', 'speaking'], ['majority', '大多数', 'reading'],
  ['method', '方法', 'listening'], ['minority', '少数', 'writing'], ['obvious', '明显的', 'writing'], ['occupy', '占据；占用', 'reading'],
  ['occur', '发生', 'listening'], ['option', '选择', 'speaking'], ['participate', '参与', 'speaking'], ['policy', '政策', 'writing'],
  ['predict', '预测', 'reading'], ['priority', '优先事项', 'writing'], ['process', '过程；流程', 'writing'], ['proportion', '比例', 'writing'],
  ['purchase', '购买', 'listening'], ['range', '范围', 'reading'], ['relevant', '相关的', 'speaking'], ['reliable', '可靠的', 'reading'],
  ['require', '需要；要求', 'listening'], ['research', '研究', 'writing'], ['resource', '资源', 'reading'], ['respond', '回应', 'speaking'],
  ['restrict', '限制', 'writing'], ['significant', '显著的；重要的', 'writing'], ['similar', '相似的', 'reading'], ['specific', '具体的', 'speaking'],
  ['strategy', '策略', 'speaking'], ['structure', '结构', 'writing'], ['sufficient', '足够的', 'reading'], ['survey', '调查', 'writing'],
  ['sustain', '维持；支撑', 'reading'], ['trend', '趋势', 'writing'], ['valid', '有效的；合理的', 'writing'], ['vary', '变化；不同', 'reading'],
  ['vehicle', '车辆；工具', 'listening'], ['welfare', '福利', 'writing'], ['whereas', '然而；而', 'writing'], ['accurate', '准确的', 'speaking'],
  ['adapt', '适应；调整', 'speaking'], ['adequate', '充足的；合适的', 'reading'], ['allocate', '分配', 'speaking'], ['alternative', '替代的；替代方案', 'writing'],
  ['annual', '年度的', 'writing'], ['aware', '意识到的', 'speaking'], ['capacity', '容量；能力', 'listening'], ['category', '类别', 'reading'],
  ['complex', '复杂的', 'speaking'], ['conduct', '开展；进行', 'reading'], ['consequence', '后果；结果', 'writing'], ['considerable', '相当大的', 'reading'],
  ['context', '语境；背景', 'reading'], ['create', '创造', 'speaking'], ['cycle', '周期；循环', 'reading'], ['debate', '辩论；争议', 'writing'],
  ['emerge', '出现', 'reading'], ['estimate', '估计', 'listening'], ['exclude', '排除', 'reading'], ['focus', '重点；聚焦', 'speaking'],
  ['fundamental', '根本的；基础的', 'writing'], ['justify', '证明合理', 'speaking'], ['lecture', '讲座', 'listening'], ['overall', '总体的', 'writing'],
  ['principle', '原则', 'writing'], ['professional', '专业的', 'reading'], ['publish', '发布；出版', 'listening'], ['role', '作用；角色', 'speaking'],
  ['sector', '部门；领域', 'writing'], ['shift', '转变', 'reading'], ['stable', '稳定的', 'writing'], ['transfer', '转移；迁移', 'reading'],
];

const special: Record<string, Partial<VocabItem>> = {
  approach: {
    example_en: 'This approach can improve speaking fluency.',
    example_cn: '这种方法可以提高口语流利度。',
    collocations: ['a practical approach', 'a balanced approach', 'an effective approach', 'an approach to solving problems'],
    synonyms: ['method', 'strategy', 'way'],
    ielts_usage: 'Governments should adopt a more practical approach to environmental protection.',
    common_mistake: '不要说 “make an approach”。更常见是 “adopt / take / use an approach”。',
    pronunciation_tip: '重音在第二音节：ap-PROACH。',
  },
  evidence: {
    collocations: ['strong evidence', 'clear evidence', 'scientific evidence', 'provide evidence'],
    synonyms: ['proof', 'support', 'data'],
    ielts_usage: 'This argument is more convincing when it is supported by clear evidence.',
  },
  significant: {
    collocations: ['a significant increase', 'a significant impact', 'significant differences'],
    synonyms: ['important', 'notable', 'substantial'],
    ielts_usage: 'There was a significant increase in the number of students studying abroad.',
  },
};

function defaultExample(word: string, meaning: string) {
  const readableMeaning = meaning.split('；')[0];
  return {
    example_en: `A clear ${word} can make an IELTS answer more convincing.`,
    example_cn: `清晰使用“${readableMeaning}”相关表达，可以让雅思回答更有说服力。`,
  };
}

function enrich([word, meaning_cn, tag]: [string, string, VocabItem['tag']]): VocabItem {
  const base = defaultExample(word, meaning_cn);
  return {
    word,
    meaning_cn,
    tag,
    example_en: base.example_en,
    example_cn: base.example_cn,
    collocations: [`a common ${word}`, `a useful ${word}`, `${word} in education`, `${word} in modern society`],
    synonyms: ['idea', 'method', 'factor'].filter((item) => item !== word),
    ielts_usage: `In IELTS writing or speaking, ${word} can help you express ideas more precisely.`,
    ...special[word],
  };
}

export const vocabularyBank: VocabItem[] = rawWords.map(enrich);

export function getTodayVocabulary() {
  const start = dayIndex(vocabularyBank.length / 10) * 10;
  return vocabularyBank.slice(start, start + 10);
}

export function findVocabulary(word: string) {
  return vocabularyBank.find((item) => item.word === word);
}
