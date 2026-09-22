import { TICKET_PRIORITIES, TICKET_STATUSES } from '../domain/ticket-status.js';

const MODIFIABLE_FIELDS = ['title', 'description', 'priority', 'status'];

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

export function validateCreate(input) {
  const issues = [];

  if (isBlank(input?.title)) {
    issues.push({ code: 'MISSING_TITLE', field: 'title', issue: 'El título es obligatorio.' });
  }

  if (isBlank(input?.description)) {
    issues.push({
      code: 'MISSING_DESCRIPTION',
      field: 'description',
      issue: 'La descripción es obligatoria.'
    });
  }

  const priority = input?.priority;
  if (priority !== undefined && !TICKET_PRIORITIES.includes(priority)) {
    issues.push({
      code: 'INVALID_PRIORITY',
      field: 'priority',
      issue: `"${priority}" no es una prioridad válida.`
    });
  }

  return issues;
}

export function validatePatch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { empty: true, errors: [] };
  }

  const errors = [];
  const empty = !MODIFIABLE_FIELDS.some((field) => Object.hasOwn(body, field));

  if (Object.hasOwn(body, 'title') && isBlank(body.title)) {
    errors.push({ code: 'MISSING_TITLE', field: 'title', issue: 'El título no puede quedar vacío.' });
  }

  if (Object.hasOwn(body, 'description') && isBlank(body.description)) {
    errors.push({
      code: 'MISSING_DESCRIPTION',
      field: 'description',
      issue: 'La descripción no puede quedar vacía.'
    });
  }

  if (Object.hasOwn(body, 'priority') && !TICKET_PRIORITIES.includes(body.priority)) {
    errors.push({
      code: 'INVALID_PRIORITY',
      field: 'priority',
      issue: `"${body.priority}" no es una prioridad válida.`
    });
  }

  if (Object.hasOwn(body, 'status') && !TICKET_STATUSES.includes(body.status)) {
    errors.push({
      code: 'INVALID_STATUS',
      field: 'status',
      issue: `"${body.status}" no es un estado válido.`
    });
  }

  return { empty, errors };
}