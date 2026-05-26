import type { ListeningItem } from '../types';
import { dayIndex } from '../lib/date';

const steps = ['盲听', '看文本', '跟读', '记录 3 个没听懂的词', '写 1 句英文总结'];

export const listeningBank: ListeningItem[] = [
  ['l001', 0, 'Campus library orientation', 'Replaceable IELTS resource', 'Education', 'Easy', 'Section 1'],
  ['l002', 1, 'Booking a city tour', 'Replaceable IELTS resource', 'Travel', 'Easy', 'Section 1'],
  ['l003', 2, 'Museum volunteer briefing', 'Replaceable IELTS resource', 'Culture', 'Medium', 'Section 2'],
  ['l004', 3, 'Student project meeting', 'Replaceable IELTS resource', 'Education', 'Medium', 'Section 3'],
  ['l005', 4, 'Lecture on urban gardens', 'Replaceable IELTS resource', 'Environment', 'Medium', 'Section 4'],
  ['l006', 5, 'Apartment rental enquiry', 'Replaceable IELTS resource', 'Housing', 'Easy', 'Section 1'],
  ['l007', 6, 'Fitness centre membership', 'Replaceable IELTS resource', 'Health', 'Easy', 'Section 1'],
  ['l008', 7, 'Public transport announcement', 'Replaceable IELTS resource', 'Transport', 'Medium', 'Section 2'],
  ['l009', 8, 'Research methods discussion', 'Replaceable IELTS resource', 'Academic', 'Hard', 'Section 3'],
  ['l010', 9, 'Lecture on renewable energy', 'Replaceable IELTS resource', 'Science', 'Hard', 'Section 4'],
  ['l011', 10, 'Hotel reservation call', 'Replaceable IELTS resource', 'Travel', 'Easy', 'Section 1'],
  ['l012', 11, 'Community centre events', 'Replaceable IELTS resource', 'Community', 'Medium', 'Section 2'],
  ['l013', 12, 'Seminar group planning', 'Replaceable IELTS resource', 'Academic', 'Medium', 'Section 3'],
  ['l014', 13, 'Lecture on memory and learning', 'Replaceable IELTS resource', 'Psychology', 'Hard', 'Section 4'],
  ['l015', 14, 'Doctor appointment booking', 'Replaceable IELTS resource', 'Health', 'Easy', 'Section 1'],
  ['l016', 15, 'Farm visit information', 'Replaceable IELTS resource', 'Nature', 'Medium', 'Section 2'],
  ['l017', 16, 'Course feedback meeting', 'Replaceable IELTS resource', 'Education', 'Medium', 'Section 3'],
  ['l018', 17, 'Lecture on ocean pollution', 'Replaceable IELTS resource', 'Environment', 'Hard', 'Section 4'],
  ['l019', 18, 'Bank account enquiry', 'Replaceable IELTS resource', 'Daily life', 'Easy', 'Section 1'],
  ['l020', 19, 'Art gallery audio guide', 'Replaceable IELTS resource', 'Art', 'Medium', 'Section 2'],
  ['l021', 20, 'Presentation preparation', 'Replaceable IELTS resource', 'Academic', 'Medium', 'Section 3'],
  ['l022', 21, 'Lecture on ancient trade', 'Replaceable IELTS resource', 'History', 'Hard', 'Section 4'],
  ['l023', 22, 'Lost property report', 'Replaceable IELTS resource', 'Daily life', 'Easy', 'Section 1'],
  ['l024', 23, 'Workplace safety tour', 'Replaceable IELTS resource', 'Work', 'Medium', 'Section 2'],
  ['l025', 24, 'Lab experiment discussion', 'Replaceable IELTS resource', 'Science', 'Hard', 'Section 3'],
  ['l026', 25, 'Lecture on childhood nutrition', 'Replaceable IELTS resource', 'Health', 'Hard', 'Section 4'],
  ['l027', 26, 'Language school registration', 'Replaceable IELTS resource', 'Education', 'Easy', 'Section 1'],
  ['l028', 27, 'Local radio interview', 'Replaceable IELTS resource', 'Society', 'Medium', 'General Listening'],
  ['l029', 28, 'Business case study talk', 'Replaceable IELTS resource', 'Business', 'Hard', 'Section 3'],
  ['l030', 29, 'Lecture on climate adaptation', 'Replaceable IELTS resource', 'Environment', 'Hard', 'Section 4'],
].map(([id, day, title, sourceName, topic, difficulty, sectionType]) => ({
  id: String(id),
  dayIndex: Number(day),
  title: String(title),
  sourceName: String(sourceName),
  url: `https://example.com/ielts-listening/${id}`,
  topic: String(topic),
  difficulty: String(difficulty),
  sectionType: sectionType as ListeningItem['sectionType'],
  tasks: steps,
}));

export function getTodayListening() {
  return listeningBank[dayIndex(listeningBank.length)];
}
