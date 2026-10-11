/**
 * Site-wide content: names, blog categories, the "what's changing"
 * timeline, the links page and teaching resources.
 */

export type LevelId = 'ks3' | 'gcse' | 'alevel' | 'tlevel';

export const site = {
  name: 'Mr Huyck',
  role: 'Teacher of Computing',
  /** Used for the terminal prompt: `${handle}@computing`. */
  handle: 'mr-huyck',
  description:
    'Mr Huyck: Teacher of Computing. Writing on secondary and post-16 pedagogy, curriculum change and qualifications in Computing.',
  /**
   * Optional public links. Leave a value empty to hide it.
   * A school email is a better choice here than a personal one.
   */
  links: {
    email: '',
    github: 'https://github.com/jdhuyck',
  },
} as const;

/** Audience badges for blog posts (frontmatter `levels:`). */
export interface KeyStage {
  id: LevelId;
  /** Label as used in blog frontmatter `levels:` (case-insensitive). */
  label: string;
}

export const keyStages: KeyStage[] = [
  { id: 'ks3', label: 'KS3' },
  { id: 'gcse', label: 'GCSE' },
  { id: 'alevel', label: 'A Level' },
  { id: 'tlevel', label: 'T Level' },
];

export const levelById = (id: string): KeyStage | undefined =>
  keyStages.find(k => k.id === id);

/** Map a free-text label from frontmatter ("A Level", "a-level", "GCSE") to an id. */
export const levelFromLabel = (label: string): LevelId | undefined => {
  const norm = label.toLowerCase().replace(/[^a-z0-9]/g, '');
  return keyStages.find(k => k.id === norm || k.label.toLowerCase().replace(/[^a-z0-9]/g, '') === norm)?.id;
};

// ── Blog categories ─────────────────────────────────────

export type CategoryId =
  | 'pedagogy'
  | 'adaptive-practice'
  | 'curriculum-design'
  | 'curriculum-policy'
  | 'cognition-inclusion'
  | 'computing-landscape'
  | 'computational-past';

export interface BlogCategory {
  id: CategoryId;
  /** Kept to a similar length (17–21 characters) so tiles and chips line up. */
  label: string;
  /** One line for the home page and blog filters. */
  blurb: string;
}

/**
 * The blog's categories. Each post sets one in its frontmatter
 * (`category: pedagogy`); the blog filters and home page tiles use this list,
 * however many there are.
 */
export const blogCategories: BlogCategory[] = [
  {
    id: 'pedagogy',
    label: 'Pedagogy in Action',
    blurb: 'Teaching Computing well: PRIMM, worked examples, live coding, questioning and modelling.',
  },
  {
    id: 'adaptive-practice',
    label: 'Adaptive Practice',
    blurb: 'Adjusting teaching in the moment so every learner can access the lesson and be stretched by it.',
  },
  {
    id: 'curriculum-design',
    label: 'Curriculum Design',
    blurb: 'What to teach and when: content, sequencing, flow and progression from KS3 to post-16.',
  },
  {
    id: 'curriculum-policy',
    label: 'Curriculum Policy',
    blurb: 'The national curriculum, exam specifications and reform: what is changing and why.',
  },
  {
    id: 'cognition-inclusion',
    label: 'Cognition & Inclusion',
    blurb: 'Cognitive science in the classroom, and inclusive practice for SEND and EAL learners.',
  },
  {
    id: 'computing-landscape',
    label: 'Computing Landscape',
    blurb: 'AI, industry practice and post-16 routes: Computing as it is now, and what students need from it.',
  },
  {
    id: 'computational-past',
    label: 'Computational Past',
    blurb: 'From Babbage and Lovelace to Bletchley Park and the web: the ideas behind the machines.',
  },
];

/** Ids from earlier versions of the blog, so old posts and links still resolve. */
const LEGACY_CATEGORY: Record<string, CategoryId> = {
  'adaptive-teaching': 'adaptive-practice',
  curriculum: 'curriculum-design',
  'cs-landscape': 'computing-landscape',
  'computing-history': 'computational-past',
};

export const categoryById = (id: string): BlogCategory | undefined =>
  blogCategories.find(c => c.id === (LEGACY_CATEGORY[id] ?? id));

// ── Home page: what's changing ──────────────────────────

export interface HorizonItem {
  when: string;
  title: string;
  body: string;
  sources: { label: string; url: string }[];
}

/**
 * Policy and qualification changes, in date order. These summarise public
 * announcements; keep them current and update `horizonReviewed` when you do.
 */
export const horizonReviewed = 'October 2026';

export const horizon: HorizonItem[] = [
  {
    when: 'Sept 2025',
    title: 'Pearson T Level in Digital Software Development',
    body: 'First teaching of the Digital Software Development T Level, which succeeds Digital Production, Design and Development. It pairs a classroom-based technical qualification with an industry placement, as an employer-designed alternative to A Levels.',
    sources: [
      { label: 'Pearson specification', url: 'https://qualifications.pearson.com/content/dam/pdf/TLevels/digital-software-development/2025/specification-and-sample-assessment-materials/digital-dsd-specification.pdf' },
      { label: 'Skills England', url: 'https://skillsengland.education.gov.uk/qualifications/TL0006a' },
    ],
  },
  {
    when: 'Oct 2025',
    title: 'V Levels announced',
    body: 'The Post-16 Education and Skills White Paper introduced V Levels: A Level-sized vocational qualifications forming a third route alongside A Levels and T Levels. Digital is among the first subjects, planned for teaching from September 2027.',
    sources: [
      { label: 'City & Guilds summary', url: 'https://www.cityandguilds.com/news/october-2025/understanding-the-post-16-education-and-skills-white-paper' },
    ],
  },
  {
    when: 'Nov 2025',
    title: 'Curriculum and Assessment Review: a GCSE in Computing',
    body: 'The review’s final report recommended replacing GCSE Computer Science with a broader GCSE in Computing that keeps core computer science but adds digital literacy, data and applied technology. The government accepted this, along with AI literacy for all pupils, and will explore a new Level 3 qualification in data science and AI.',
    sources: [
      { label: 'Government response', url: 'https://assets.publishing.service.gov.uk/media/690b2a4a14b040dfe82922ea/Government_response_to_the_Curriculum_and_Assessment_Review.pdf' },
      { label: 'CAS summary', url: 'https://www.computingatschool.org.uk/forum-news-blogs/2025/november/car-final-report-summary/' },
    ],
  },
  {
    when: 'Jan 2026',
    title: 'OCR on GCSE Computing and A Level Computer Science',
    body: 'OCR expects GCSE Computing to rebalance towards digital literacy and AI while keeping computer science, with less depth per topic across the full breadth of the subject. The review didn’t address A Level directly, but OCR expects A Level Computer Science (H446), whose content is over ten years old, to be refreshed to align with the new GCSE.',
    sources: [
      { label: 'OCR blog', url: 'https://www.ocr.org.uk/blog/what-does-the-curriculum-and-assessment-review-mean-for-gq-computer-science/' },
    ],
  },
  {
    when: 'Ongoing',
    title: 'OCR: on-screen GCSE Computer Science',
    body: 'OCR is developing a fully on-screen GCSE Computer Science alongside the paper-based J277, so programming can be assessed more authentically. It remains subject to Ofqual approval, and Ofqual has suggested on-screen GCSEs are unlikely before the 2030s.',
    sources: [
      { label: 'OCR digital exams', url: 'https://www.ocr.org.uk/qualifications/digital-exams/digital-exams-for-gcse-computer-science/' },
      { label: 'Schools Week', url: 'https://schoolsweek.co.uk/ofqual-on-screen-assessments-could-be-introduced-by-2030/' },
    ],
  },
  {
    when: '2027 → 2028',
    title: 'A revised national curriculum',
    body: 'The government aims to publish the revised national curriculum in 2027 for first teaching from September 2028, with reformed GCSEs, including Computing, to follow. Awarding bodies such as OCR will need to redevelop their GCSE to the new subject content.',
    sources: [
      { label: 'Tes: key recommendations', url: 'https://www.tes.com/magazine/news/general/curriculum-and-assessment-review-key-recommendations' },
      { label: 'Teach Computing', url: 'https://teachcomputing.org/blog/curriculum-assessment-review-25' },
    ],
  },
];

// ── Links page ──────────────────────────────────────────

export interface LinkGroup {
  title: string;
  links: { label: string; url: string; note: string }[];
}

/** Curated links for the /links page, by theme. Every URL was checked in October 2026. */
export const linkGroups: LinkGroup[] = [
  {
    title: 'Curriculum and policy',
    links: [
      { label: 'National curriculum: computing programmes of study', url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-computing-programmes-of-study', note: 'The statutory KS1–4 curriculum in England (DfE).' },
      { label: 'Curriculum and Assessment Review: final report', url: 'https://www.gov.uk/government/publications/curriculum-and-assessment-review-final-report', note: 'The 2025 review recommending a new GCSE in Computing.' },
    ],
  },
  {
    title: 'Qualifications',
    links: [
      { label: 'OCR GCSE Computer Science (J277)', url: 'https://www.ocr.org.uk/qualifications/gcse/computer-science-j277-from-2020/', note: 'Specification, past papers and teaching resources.' },
      { label: 'OCR A Level Computer Science (H446)', url: 'https://www.ocr.org.uk/qualifications/as-and-a-level/computer-science-h046-h446-from-2015/', note: 'Specification, past papers and NEA guidance.' },
      { label: 'Pearson T Level: Digital Software Development', url: 'https://qualifications.pearson.com/en/qualifications/t-levels/digital-software-development.html', note: 'The technical qualification, from September 2025.' },
      { label: 'Skills England: T Level outline', url: 'https://skillsengland.education.gov.uk/qualifications/TL0006a', note: 'Occupational standard and T Level content.' },
    ],
  },
  {
    title: 'Teaching and CPD',
    links: [
      { label: 'Teach Computing (NCCE)', url: 'https://teachcomputing.org/', note: 'Free curriculum resources and CPD from the National Centre for Computing Education.' },
      { label: 'Teach Computing: pedagogy', url: 'https://teachcomputing.org/pedagogy', note: 'The NCCE’s twelve principles of computing pedagogy.' },
      { label: 'Computing at School (CAS)', url: 'https://www.computingatschool.org.uk/', note: 'The subject community for computing teachers.' },
      { label: 'Isaac Computer Science', url: 'https://isaaccomputerscience.org/', note: 'Free GCSE and A Level learning platform.' },
      { label: 'BCS, The Chartered Institute for IT', url: 'https://www.bcs.org/', note: 'Professional body, with support for computing teachers.' },
    ],
  },
  {
    title: 'Research',
    links: [
      { label: 'Raspberry Pi Computing Education Research Centre', url: 'https://computingeducationresearch.org/', note: 'University of Cambridge research into how young people learn computing.' },
      { label: 'Raspberry Pi Foundation research', url: 'https://www.raspberrypi.org/research', note: 'Research seminars and reports on computing education.' },
      { label: 'Hello World magazine', url: 'https://helloworld.raspberrypi.org/', note: 'Free magazine by and for computing educators.' },
    ],
  },
  {
    title: 'Teacher training',
    links: [
      { label: 'ITT and Early Career Framework', url: 'https://www.gov.uk/government/publications/initial-teacher-training-and-early-career-framework', note: 'The minimum entitlement for trainee and early career teachers.' },
      { label: 'Teachers’ Standards', url: 'https://www.gov.uk/government/publications/teachers-standards', note: 'The standards trainees are assessed against.' },
    ],
  },
  {
    title: 'Computing history',
    links: [
      { label: 'The National Museum of Computing', url: 'https://www.tnmoc.org/', note: 'At Bletchley Park: Colossus, the WITCH and school workshops.' },
      { label: 'Bletchley Park', url: 'https://www.bletchleypark.org.uk/', note: 'The codebreaking story, with learning resources.' },
      { label: 'Centre for Computing History', url: 'https://www.computinghistory.org.uk/', note: 'Cambridge museum with an online archive of machines and people.' },
    ],
  },
];

// ── Teaching resources (scoped for later) ──────────────

export type ResourceKind = 'lesson' | 'worksheet' | 'quiz' | 'interactive' | 'slides' | 'guide';

/**
 * A teaching resource listed on /links. Add entries to `resources` to
 * publish them. Put files in /public/resources/<id>/ and list them in `files`.
 */
export interface TeachingResource {
  id: string;
  title: string;
  summary: string;
  kind: ResourceKind;
  levels: LevelId[];
  category: CategoryId;
  /** Specification reference, e.g. "OCR J277 1.1". */
  spec?: string;
  /** Internal route (e.g. "/lab#cpu") or file path under /public. */
  href?: string;
  files?: { label: string; path: string }[];
  /** ISO date last updated. */
  updated: string;
}

export const resources: TeachingResource[] = [
  {
    id: 'fde-simulator',
    title: 'Fetch–decode–execute simulator',
    summary: 'Step a Von Neumann CPU through LDA, ADD and STA, register by register. Works on the board or on students’ own devices.',
    kind: 'interactive',
    levels: ['gcse', 'alevel'],
    category: 'curriculum-design',
    spec: 'OCR J277 1.1 · H446 1.1',
    href: '/lab#cpu',
    updated: '2026-10-10',
  },
  {
    id: 'binary-and-logic',
    title: 'Binary dial and logic gates',
    summary: 'Explore denary, binary and hex with one byte, then build truth tables for AND, OR, NOT, NAND, NOR and XOR.',
    kind: 'interactive',
    levels: ['ks3', 'gcse'],
    category: 'curriculum-design',
    href: '/lab',
    updated: '2026-10-10',
  },
];
