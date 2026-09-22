export const TICKET_STATUSES = [
  'pending',
  'in_progress',
  'resolved',
  'cancelled'
];

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const DEFAULT_PRIORITY = 'medium';

export const INITIAL_STATUS = 'pending';

const ALLOWED_TRANSITIONS = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: [],
  cancelled: []
};

export function isValidStatus(status) {
  return TICKET_STATUSES.includes(status);
}

export function isValidPriority(priority) {
  return TICKET_PRIORITIES.includes(priority);
}

export function canTransition(currentStatus, newStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(newStatus));
}

export function isTerminal(status) {
  return Boolean(ALLOWED_TRANSITIONS[status] && ALLOWED_TRANSITIONS[status].length === 0);
}