export const DAY = 86400000;
export const TYPES = ['Vacation', 'Personal day', 'Sick leave'];
export const TEAM = [
  { id: 'alex', name: 'Alex Morgan', role: 'Product lead', team: 'Product', color: 'orange' },
  { id: 'nina', name: 'Nina Patel', role: 'Product designer', team: 'Design', color: 'purple' },
  { id: 'sam', name: 'Sam Chen', role: 'Software engineer', team: 'Engineering', color: 'blue' },
  {
    id: 'maya',
    name: 'Maya Thompson',
    role: 'Software engineer',
    team: 'Engineering',
    color: 'pink',
  },
  { id: 'leo', name: 'Leo Fischer', role: 'UX researcher', team: 'Design', color: 'green' },
  { id: 'omar', name: 'Omar Hassan', role: 'Operations lead', team: 'Operations', color: 'yellow' },
  { id: 'ella', name: 'Ella Brooks', role: 'Marketing lead', team: 'Marketing', color: 'pink' },
  { id: 'jules', name: 'Jules Martin', role: 'Data analyst', team: 'Product', color: 'blue' },
];
export const dateKey = (date) => new Date(date).toISOString().slice(0, 10);
export const addDays = (date, count) => dateKey(Date.parse(date + 'T12:00:00Z') + count * DAY);
export function monday(date) {
  const day = new Date(date + 'T12:00:00Z').getUTCDay();
  return addDays(date, -((day + 6) % 7));
}
export function validDate(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    dateKey(Date.parse(value)) === value
  );
}
export function workdays(start, end) {
  let total = 0;
  for (let day = start; day <= end; day = addDays(day, 1)) {
    const weekday = new Date(day + 'T12:00:00Z').getUTCDay();
    if (weekday !== 0 && weekday !== 6) total++;
  }
  return total;
}
export function validateAbsence(input, existing, today) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Invalid absence.';
  if (!TEAM.some((p) => p.id === input.person_id)) return 'Choose a teammate.';
  if (!TYPES.includes(input.type)) return 'Choose a valid absence type.';
  if (
    !validDate(input.start_date) ||
    !validDate(input.end_date) ||
    input.end_date < input.start_date
  )
    return 'Choose valid start and end dates, in that order.';
  if (input.start_date < addDays(today, -366) || input.end_date > addDays(today, 730))
    return 'Choose dates within the past year or next two years.';
  if (Date.parse(input.end_date) - Date.parse(input.start_date) > 90 * DAY)
    return 'An absence can cover up to 91 calendar days.';
  if (!workdays(input.start_date, input.end_date))
    return 'Choose a range with at least one weekday.';
  if (typeof input.title !== 'string' || input.title.trim().length > 80)
    return 'Keep the handover title to 80 characters or fewer.';
  if (typeof input.notes !== 'string' || input.notes.trim().length > 1000)
    return 'Keep handover notes to 1,000 characters or fewer.';
  if (
    input.cover_id &&
    (!TEAM.some((p) => p.id === input.cover_id) || input.cover_id === input.person_id)
  )
    return 'Choose a different teammate as your cover.';
  if (typeof input.ready !== 'boolean') return 'Invalid handover status.';
  if (input.ready && (!input.cover_id || !input.notes.trim()))
    return 'Add a cover teammate and handover notes before marking it ready.';
  if (
    existing.some(
      (a) =>
        a.id !== input.id &&
        a.person_id === input.person_id &&
        a.start_date <= input.end_date &&
        a.end_date >= input.start_date,
    )
  )
    return 'These dates overlap an existing absence for this teammate.';
  if (
    input.cover_id &&
    existing.some(
      (a) =>
        a.id !== input.id &&
        a.person_id === input.cover_id &&
        a.start_date <= input.end_date &&
        a.end_date >= input.start_date,
    )
  )
    return 'Your cover teammate is away during these dates. Choose someone available.';
  if (
    existing.some(
      (a) =>
        a.id !== input.id &&
        a.cover_id === input.person_id &&
        a.start_date <= input.end_date &&
        a.end_date >= input.start_date,
    )
  )
    return 'This teammate is covering another absence during these dates. Update that handover first.';
  return null;
}
export function seedAbsences(today) {
  const week = monday(today);
  const make = (id, person, start, end, type, title, cover, notes, ready) => ({
    id,
    person_id: person,
    start_date: addDays(week, start),
    end_date: addDays(week, end),
    type,
    title,
    cover_id: cover,
    notes,
    ready,
    version: 1,
  });
  return [
    make(
      'seed-nina',
      'nina',
      0,
      4,
      'Vacation',
      'Design system handoff',
      'leo',
      'The component library is up to date. Leo has the review checklist; please route design questions to him. Nothing urgent needs to wait for me.',
      true,
    ),
    make(
      'seed-sam',
      'sam',
      2,
      3,
      'Personal day',
      'Release watch',
      'maya',
      'The release is ready to go. Maya has the deployment runbook and will keep an eye on the error dashboard.',
      true,
    ),
    make(
      'seed-alex',
      'alex',
      7,
      11,
      'Vacation',
      'Launch planning',
      'jules',
      'Launch brief is in the shared project folder. Jules will run the Monday check-in and collect feedback. I’ll pick things up when I’m back.',
      true,
    ),
    make(
      'seed-maya',
      'maya',
      8,
      10,
      'Vacation',
      'API documentation',
      'sam',
      'Documentation draft is ready for review. Sam can answer questions about the new endpoints.',
      true,
    ),
    make(
      'seed-omar',
      'omar',
      11,
      11,
      'Personal day',
      'Supplier check-in',
      '',
      'Please make sure the Friday supplier check-in has someone covering it.',
      false,
    ),
    make(
      'seed-ella',
      'ella',
      16,
      18,
      'Vacation',
      'Campaign launch',
      'omar',
      'Campaign assets are scheduled. Omar has the contact list for any last-minute questions.',
      true,
    ),
  ];
}
