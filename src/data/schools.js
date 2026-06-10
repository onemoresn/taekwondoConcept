/** Demo multi-school data — Phase 6 */
export const DEMO_SCHOOLS = [
  {
    id: 'school-alpha',
    name: 'Alpha Dojang',
    city: 'Seattle, WA',
    primary_color: '#e8222a',
    logo_url: null,
  },
  {
    id: 'school-beta',
    name: 'Beta Martial Arts',
    city: 'Portland, OR',
    primary_color: '#c9a227',
    logo_url: null,
  },
];

/** student profile id → school id */
export const DEMO_STUDENT_SCHOOLS = {
  'demo-student-id': 'school-alpha',
  'demo-student': 'school-alpha',
  'demo-student-2': 'school-beta',
};

/** instructor profile id → school ids */
export const DEMO_INSTRUCTOR_SCHOOLS = {
  'demo-instructor-id': ['school-alpha', 'school-beta'],
};
