import type { ListeningItem } from '../types';
import { dayIndex } from '../lib/date';

const steps = ['盲听', '看文本/题目', '跟读', '记录 3 个没听懂的词', '写 1 句英文总结'];

const officialPracticeUrls = {
  britishCouncil: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/listening',
  ieltsOrg: 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions',
  idp: 'https://ielts.idp.com/prepare/ielts-listening',
  cambridge: 'https://www.cambridgeenglish.org/learning-english/activities-for-learners/',
  bbc: 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english',
};

const rows: Array<Omit<ListeningItem, 'tasks'>> = [
  {
    id: 'l001',
    dayIndex: 0,
    title: 'IELTS Listening Practice Test - conversation',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Daily life',
    difficulty: 'Easy',
    sectionType: 'Section 1',
  },
  {
    id: 'l002',
    dayIndex: 1,
    title: 'IELTS sample listening questions',
    sourceName: 'IELTS.org Sample Questions',
    url: officialPracticeUrls.ieltsOrg,
    topic: 'IELTS sample tasks',
    difficulty: 'Medium',
    sectionType: 'General Listening',
  },
  {
    id: 'l003',
    dayIndex: 2,
    title: 'IDP listening preparation - everyday conversation',
    sourceName: 'IDP IELTS Prepare',
    url: officialPracticeUrls.idp,
    topic: 'Travel and services',
    difficulty: 'Easy',
    sectionType: 'Section 1',
  },
  {
    id: 'l004',
    dayIndex: 3,
    title: 'Campus services and student life',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Education',
    difficulty: 'Medium',
    sectionType: 'Section 2',
  },
  {
    id: 'l005',
    dayIndex: 4,
    title: 'Academic discussion practice',
    sourceName: 'IELTS.org Sample Questions',
    url: officialPracticeUrls.ieltsOrg,
    topic: 'Academic',
    difficulty: 'Medium',
    sectionType: 'Section 3',
  },
  {
    id: 'l006',
    dayIndex: 5,
    title: 'Mini lecture listening practice',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Science',
    difficulty: 'Hard',
    sectionType: 'Section 4',
  },
  {
    id: 'l007',
    dayIndex: 6,
    title: '6 Minute English - careful listening',
    sourceName: 'BBC Learning English',
    url: officialPracticeUrls.bbc,
    topic: 'Society',
    difficulty: 'Medium',
    sectionType: 'General Listening',
  },
  {
    id: 'l008',
    dayIndex: 7,
    title: 'Public announcement practice',
    sourceName: 'IDP IELTS Prepare',
    url: officialPracticeUrls.idp,
    topic: 'Transport',
    difficulty: 'Medium',
    sectionType: 'Section 2',
  },
  {
    id: 'l009',
    dayIndex: 8,
    title: 'Cambridge learner listening activity',
    sourceName: 'Cambridge English',
    url: officialPracticeUrls.cambridge,
    topic: 'General English',
    difficulty: 'Easy',
    sectionType: 'General Listening',
  },
  {
    id: 'l010',
    dayIndex: 9,
    title: 'IELTS Listening Practice Test - lecture',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Environment',
    difficulty: 'Hard',
    sectionType: 'Section 4',
  },
  {
    id: 'l011',
    dayIndex: 10,
    title: 'Booking and registration conversation',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Daily services',
    difficulty: 'Easy',
    sectionType: 'Section 1',
  },
  {
    id: 'l012',
    dayIndex: 11,
    title: 'Community event information',
    sourceName: 'IDP IELTS Prepare',
    url: officialPracticeUrls.idp,
    topic: 'Community',
    difficulty: 'Medium',
    sectionType: 'Section 2',
  },
  {
    id: 'l013',
    dayIndex: 12,
    title: 'Student project meeting',
    sourceName: 'IELTS.org Sample Questions',
    url: officialPracticeUrls.ieltsOrg,
    topic: 'Education',
    difficulty: 'Medium',
    sectionType: 'Section 3',
  },
  {
    id: 'l014',
    dayIndex: 13,
    title: 'Academic lecture note-taking',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Psychology',
    difficulty: 'Hard',
    sectionType: 'Section 4',
  },
  {
    id: 'l015',
    dayIndex: 14,
    title: 'Health appointment conversation',
    sourceName: 'IDP IELTS Prepare',
    url: officialPracticeUrls.idp,
    topic: 'Health',
    difficulty: 'Easy',
    sectionType: 'Section 1',
  },
  {
    id: 'l016',
    dayIndex: 15,
    title: 'Visitor information talk',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Tourism',
    difficulty: 'Medium',
    sectionType: 'Section 2',
  },
  {
    id: 'l017',
    dayIndex: 16,
    title: 'Seminar discussion practice',
    sourceName: 'IELTS.org Sample Questions',
    url: officialPracticeUrls.ieltsOrg,
    topic: 'Academic',
    difficulty: 'Medium',
    sectionType: 'Section 3',
  },
  {
    id: 'l018',
    dayIndex: 17,
    title: 'Lecture on environmental issues',
    sourceName: 'BBC Learning English',
    url: officialPracticeUrls.bbc,
    topic: 'Environment',
    difficulty: 'Hard',
    sectionType: 'General Listening',
  },
  {
    id: 'l019',
    dayIndex: 18,
    title: 'Banking and customer service',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Daily life',
    difficulty: 'Easy',
    sectionType: 'Section 1',
  },
  {
    id: 'l020',
    dayIndex: 19,
    title: 'Museum or gallery audio guide',
    sourceName: 'IDP IELTS Prepare',
    url: officialPracticeUrls.idp,
    topic: 'Culture',
    difficulty: 'Medium',
    sectionType: 'Section 2',
  },
  {
    id: 'l021',
    dayIndex: 20,
    title: 'Presentation preparation discussion',
    sourceName: 'IELTS.org Sample Questions',
    url: officialPracticeUrls.ieltsOrg,
    topic: 'Academic',
    difficulty: 'Medium',
    sectionType: 'Section 3',
  },
  {
    id: 'l022',
    dayIndex: 21,
    title: 'Extended talk note-taking',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'History',
    difficulty: 'Hard',
    sectionType: 'Section 4',
  },
  {
    id: 'l023',
    dayIndex: 22,
    title: 'Lost property conversation',
    sourceName: 'Cambridge English',
    url: officialPracticeUrls.cambridge,
    topic: 'Daily life',
    difficulty: 'Easy',
    sectionType: 'General Listening',
  },
  {
    id: 'l024',
    dayIndex: 23,
    title: 'Workplace safety information',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Work',
    difficulty: 'Medium',
    sectionType: 'Section 2',
  },
  {
    id: 'l025',
    dayIndex: 24,
    title: 'Research discussion practice',
    sourceName: 'IELTS.org Sample Questions',
    url: officialPracticeUrls.ieltsOrg,
    topic: 'Science',
    difficulty: 'Hard',
    sectionType: 'Section 3',
  },
  {
    id: 'l026',
    dayIndex: 25,
    title: 'Health and nutrition talk',
    sourceName: 'BBC Learning English',
    url: officialPracticeUrls.bbc,
    topic: 'Health',
    difficulty: 'Medium',
    sectionType: 'General Listening',
  },
  {
    id: 'l027',
    dayIndex: 26,
    title: 'Language school registration',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Education',
    difficulty: 'Easy',
    sectionType: 'Section 1',
  },
  {
    id: 'l028',
    dayIndex: 27,
    title: 'Local radio interview',
    sourceName: 'BBC Learning English',
    url: officialPracticeUrls.bbc,
    topic: 'Society',
    difficulty: 'Medium',
    sectionType: 'General Listening',
  },
  {
    id: 'l029',
    dayIndex: 28,
    title: 'Business case discussion',
    sourceName: 'IDP IELTS Prepare',
    url: officialPracticeUrls.idp,
    topic: 'Business',
    difficulty: 'Hard',
    sectionType: 'Section 3',
  },
  {
    id: 'l030',
    dayIndex: 29,
    title: 'Climate adaptation lecture',
    sourceName: 'British Council IELTS Practice',
    url: officialPracticeUrls.britishCouncil,
    topic: 'Environment',
    difficulty: 'Hard',
    sectionType: 'Section 4',
  },
];

function buildListeningScript(item: Omit<ListeningItem, 'tasks'>) {
  if (item.sectionType === 'Section 1') {
    return `Good morning. I would like to ask about the ${item.topic.toLowerCase()} service you mentioned on your website. I am preparing for an important exam, so I need a clear plan and a quiet place to study. Could you tell me what options are available during weekdays? 

Certainly. Most students choose the standard morning session because it is less crowded and easier to concentrate. The session starts at nine thirty and finishes at eleven. If you prefer the afternoon, we also have a shorter session from two to three thirty, but that one is usually busier.

That sounds useful. I am especially interested in improving my listening and speaking. Do I need to bring anything with me?

Please bring a notebook, a pen, and your phone if you want to record new vocabulary. However, phones must be on silent during the main activity. At the end, you will write a short summary of what you heard and discuss it with a partner. The purpose is not to understand every single word, but to identify the speaker's main idea, important details, and useful expressions.

Great. One more question. Is there a fee for joining?

The first session is free. After that, you can pay for individual sessions or buy a monthly pass. If you attend regularly, the monthly pass is better value.`;
  }

  if (item.sectionType === 'Section 3') {
    return `We need to decide how to structure our presentation on ${item.topic.toLowerCase()}. I think we should begin with the problem, then explain our research method, and finally present two practical solutions.

That makes sense, but we should be careful not to make the introduction too long. In the last seminar, the tutor said our group spent too much time giving background information and not enough time analysing evidence.

True. Maybe we can use one example at the beginning, such as how students manage their time when they have several deadlines in the same week. Then we can connect that example to the wider issue.

I like that. For the method section, should we mention the questionnaire results first or the interviews?

Let's start with the questionnaire because it gives a general picture. After that, we can use the interviews to explain why some students struggle. The tutor also reminded us to compare our findings with at least one published source.

Good point. I will prepare the slide on the published source. Could you handle the final recommendation slide?

Sure. I will focus on realistic advice rather than a perfect solution. For example, students could make a weekly schedule, but they also need to leave extra time for unexpected tasks. That sounds more balanced and more convincing.`;
  }

  if (item.sectionType === 'Section 4') {
    return `Today we are going to look at a topic connected with ${item.topic.toLowerCase()}. In many academic discussions, this topic is not only about facts, but also about how people respond to change. Researchers often begin by observing a simple pattern and then asking why it happens.

One important point is that behaviour is shaped by both individual choices and wider social conditions. For instance, a person may want to make a better decision, but their environment can make that decision easier or harder. This is why many modern studies combine data, interviews, and long-term observation.

A second point concerns the difference between short-term results and long-term impact. A policy or habit may appear successful at first because it produces quick improvements. However, if it is too expensive, too complicated, or too difficult to maintain, the benefits may disappear over time.

Finally, we should consider communication. Even strong evidence can be ignored if it is presented in a confusing way. Clear examples, precise language, and a logical structure help listeners understand the speaker's argument. When you listen to this type of lecture, do not try to write down every word. Instead, follow the structure: topic, reason, example, limitation, and conclusion.`;
  }

  return `Welcome to today's IELTS-style listening practice on ${item.topic.toLowerCase()}. In this recording, you will hear a short talk designed to train careful listening, note-taking, and spoken shadowing.

The speaker begins by introducing a familiar situation. Many learners believe that good listening means understanding every word immediately. In reality, strong listeners usually focus on meaning first. They notice the topic, the speaker's purpose, repeated words, and changes in tone.

The next step is to listen for details. These may include dates, prices, locations, reasons, advantages, disadvantages, or examples. If you miss one detail, do not panic. Keep listening and use the next sentence to recover the meaning.

For today's practice, listen three times. During the first round, keep your eyes away from the text and write only the main idea. During the second round, look at the text and underline useful phrases. During the third round, speak after the recording and copy the rhythm of the sentence. At the end, write one English sentence summarising the material.`;
}

export const listeningBank: ListeningItem[] = rows.map((item) => ({
  ...item,
  tasks: steps,
  localScript: buildListeningScript(item),
  focusQuestions: [
    'What is the main idea of the listening material?',
    'Which three words or phrases were difficult to catch?',
    'What is one useful sentence pattern you can reuse in IELTS?',
    'Can you repeat two sentences with similar rhythm and stress?',
  ],
}));

export function isPlaceholderListeningUrl(url: string) {
  return !url || url.includes('example.com');
}

export function getTodayListening() {
  return listeningBank[dayIndex(listeningBank.length)];
}
