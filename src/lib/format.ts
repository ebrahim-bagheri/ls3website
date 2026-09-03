/** Small shared helpers. No styling decisions live here. */

const strip = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').trim();

/** "Bagheri, Ebrahim" -> "Ebrahim Bagheri". Leaves already-natural names alone. */
export function displayName(author: string): string {
  const parts = author.split(',');
  if (parts.length !== 2) return author.trim();
  return `${parts[1].trim()} ${parts[0].trim()}`.replace(/\s+/g, ' ');
}

/** A loose key so "Rad, Radin Hamidi" and "Radin Hamidi Rad" collide. */
export function nameKey(name: string): string {
  return strip(displayName(name)).split(' ').filter(Boolean).sort().join(' ');
}

export function slugify(s: string): string {
  return strip(s).replace(/ +/g, '-');
}

export const ROLE_LABEL: Record<string, string> = {
  director: 'Director',
  faculty: 'Affiliated faculty',
  'research-staff': 'Research & support staff',
  postdoc: 'Postdoctoral fellows',
  phd: 'PhD students',
  msc: 'MSc students',
  undergrad: 'Undergraduate researchers',
  visitor: 'Research interns',
};

/** Display order for role groupings on the People page. */
export const ROLE_ORDER = [
  'director',
  'faculty',
  'research-staff',
  'postdoc',
  'phd',
  'msc',
  'undergrad',
  'visitor',
] as const;

/**
 * Order the People and Alumni pages group by. Distinct from ROLE_ORDER, which
 * is the taxonomy's own ordering: this is a presentation choice — degrees
 * first, newest stage down, then the roles that are not a degree.
 */
export const PEOPLE_GROUP_ORDER = [
  'director',
  'postdoc',
  'phd',
  'msc',
  'undergrad',
  'visitor',
  'research-staff',
] as const;

export const TYPE_LABEL: Record<string, string> = {
  journal: 'Journal',
  conference: 'Conference',
  workshop: 'Workshop',
  preprint: 'Preprint',
  thesis: 'Thesis',
  'book-section': 'Book section',
  patent: 'Patent',
};

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}
