/**
 * Seeds src/content/people/*.md from the roster below.
 *
 * Files with `manual: true` in their frontmatter are NEVER overwritten — that is
 * how a hand-edited profile survives a re-run. Delete a file to have it regenerated.
 *
 *   node scripts/seed-people.mjs
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'src/content/people');
mkdirSync(OUT, { recursive: true });

const slug = (s) =>
  s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/* --- Affiliated faculty ------------------------------------------------- */
/* Carried over from the previous site. Institution names updated:
   "Ryerson University" became Toronto Metropolitan University in 2022.
   VERIFY each affiliation before launch — some may have changed again. */
const faculty = [
  ['Jelena Jovanovic',  'Professor, Department of Software Engineering, University of Belgrade', 'jeljov@fon.rs'],
  ['Mehdi Kargar',      'Associate Professor, Ted Rogers School of Management, Toronto Metropolitan University', null],
  ['Zeinab Noorian',    'Associate Professor, Ted Rogers School of Management, Toronto Metropolitan University', null],
  ['Fattane Zarrinkalam','Assistant Professor, School of Engineering, University of Guelph', 'fzarrink@uoguelph.ca'],
  ['Morteza Zihayat',   'Associate Professor, Ted Rogers School of Management, Toronto Metropolitan University', null],
];

/* --- Alumni, migrated verbatim from the previous site -------------------- */
const alumni = [
  // [name, role, nowAt]
  ['Samad Paydar', 'postdoc', 'Assistant Professor, Computer Engineering Department, FUM'],
  ['Shoaleh Hashemi-Namin', 'postdoc', 'PhD Student, University of Windsor'],
  ['Amin Milani Fard', 'postdoc', 'Assistant Professor of Computer Science, New York Tech'],
  ['Tam T. Nguyen', 'postdoc', 'Postdoctoral Research Fellow'],
  ['Sina Adham Khiabani', 'postdoc', 'Image Processing and Remote Sensing Engineer, A.U.G. Signals Ltd.'],
  ['Morteza Mashayekhi', 'postdoc', 'Director, Data Science'],
  ['Alireza Vazifedoost', 'postdoc', 'AVP, Advanced AI Initiatives, Sun Life'],
  ['Zoran Jeremic', 'postdoc', 'Software Development Team Lead, YoppWorks'],
  ['Mani Malek Esmaeili', 'postdoc', 'Applied Research Scientist, Meta'],
  ['Marko Boskovic', 'postdoc', 'Postdoctoral Research Fellow'],
  ['Roohollah Etemadi', 'postdoc', null],
  ['Duc-Thuan Vo', 'postdoc', null],

  ['Fatemeh Pourgholamali', 'phd', 'Assistant Professor, Vali-e-Asr University'],
  ['Hossein Fani', 'phd', 'Assistant Professor, University of Windsor'],
  ['Fatemeh Lashkari', 'phd', 'Research Scientist, Sharif University of Technology'],
  ['Maryam Khodabakhsh', 'phd', 'Assistant Professor, Shahrood University of Technology'],
  ['Mahdi Bashari', 'phd', 'Principal Software Engineer, IBM'],
  ['Asef Pourmasoomi', 'phd', 'Product Manager and Data Scientist, UTravs'],
  ['Mahdi Noorian', 'phd', 'Machine Learning Engineer, RBC'],
  ['Behshid Behkamal', 'phd', 'Assistant Professor, Ferdowsi University'],
  ['Hawre Hosseini', 'phd', null],
  ['Jaleh Mahdavi Moghaddam', 'phd', null],
  ['Amin Mirlohi', 'phd', null],
  ['Hoang Nguyen', 'phd', null],
  ['Kent Poots', 'phd', null],

  ['Farzaneh Zarei', 'visitor', 'PhD Student, Concordia University'],
  ['Florent Mouysset', 'visitor', null],
  ['Masoud Bashari', 'visitor', 'Director of AI and Software Development, IEMS Ltd'],
  ['Yuri Malheiros', 'visitor', 'Professor, Universidade Federal da Paraiba'],

  ['Soroosh Sorkhani', 'msc', 'Research Assistant'],
  ['Bilal Khan', 'msc', null],
  ['Chaitra Hosmani', 'msc', 'Technical Architect, Ontario Ministry of Education'],
  ['Naresh Sirwani', 'msc', 'MDM Consultant & Data Scientist, Cognizant'],
  ['Anil Kumar Trikha', 'msc', null],
  ['Afsah Qandeel Durrani', 'msc', 'Senior Performance Analyst'],
  ['Alireza Pourali', 'msc', 'PhD Student, Electrical Engineering and Computer Science, York University'],
  ['Maryam Ghorbani', 'msc', null],
  ['Seyed Muhammad Ali', 'msc', null],
  ['Luna Feng', 'msc', 'Software Engineer, Amazon'],
  ['Andisheh Keikha', 'msc', 'Senior Frontend Developer, Drop'],
  ['Mehrnaz Ghashghaei', 'msc', 'Technical Lead, TWG at Deloitte'],
  ['Suba Thiruvasagam', 'msc', 'Director, Software Engineering, Loblaw Digital'],
  ['Buturab Rizvi', 'msc', 'Assistant Professor, Sheridan College'],
  ['Jason Paul Campbell', 'msc', null],
  ['Chris Evans', 'msc', null],
  ['George Krys', 'msc', 'Data Architect, Government of Alberta'],
  ['Minal Patel', 'msc', null],
  ['Esraa Al-Wakel', 'msc', null],
  ['Alfonz Koncan', 'msc', 'Founder, AKoncan and Associates'],
  ['Mahtab Tamannaee', 'msc', null],
  ['John Cuzzola', 'research-staff', 'Research Associate (former)'],
];

const yaml = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => (typeof v === 'string' ? `${k}: ${JSON.stringify(v)}` : `${k}: ${v}`))
    .join('\n');

let written = 0, skipped = 0;

const emit = (name, front, body = '') => {
  const path = join(OUT, `${slug(name)}.md`);
  if (existsSync(path) && /^manual:\s*true/m.test(readFileSync(path, 'utf8'))) {
    skipped++;
    return;
  }
  writeFileSync(path, `---\n${yaml(front)}\n---\n${body}`);
  written++;
};

for (const [name, title, email] of faculty) {
  emit(name, { name, role: 'faculty', status: 'current', title, email, order: 10 });
}

for (const [name, role, nowAt] of alumni) {
  emit(name, { name, role, status: 'alumni', nowAt, order: 100 });
}

console.log(`people: ${written} written, ${skipped} preserved (manual: true)`);
