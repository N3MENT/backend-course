import { randomUUID } from 'node:crypto';
import { AppError } from '../errors/app-error.js';
import { validateCreate, validatePatch } from '../dtos/supportTicket.schema.js';
import {
  DEFAULT_PRIORITY,
  INITIAL_STATUS,
  canTransition,
  isTerminal,
  isValidPriority,
  isValidStatus
} from '../domain/ticket-status.js';
import { findAll, findById, insert } from '../repositories/supportTickets.repository.js';

const MAX_DETAILS = 3;

function throwValidation(errors) {
  const first = errors[0];
  throw new AppError(
    400,
    first.code,
    first.issue,
    errors.slice(0, MAX_DETAILS).map(({ field, issue, code }) => ({ field, issue, code }))
  );
}

export function list(filters = {}) {
  const { status, priority } = filters;

  if (status !== undefined && !isValidStatus(status)) {
    throw new AppError(400, 'INVALID_STATUS', `"${status}" no es un estado válido.`, [
      { field: 'status', issue: 'Filtro con un valor desconocido.', code: 'INVALID_STATUS' }
    ]);
  }

  if (priority !== undefined && !isValidPriority(priority)) {
    throw new AppError(400, 'INVALID_PRIORITY', `"${priority}" no es una prioridad válida.`, [
      { field: 'priority', issue: 'Filtro con un valor desconocido.', code: 'INVALID_PRIORITY' }
    ]);
  }

  return findAll({ status, priority });
}

export function getById(id) {
  const ticket = findById(id);
  if (!ticket) {
    throw new AppError(404, 'TICKET_NOT_FOUND', `No existe un ticket con id ${id}.`, [
      { field: 'id', issue: `No se encontró el ticket ${id}.`, code: 'TICKET_NOT_FOUND' }
    ]);
  }
  return ticket;
}

export function create(input) {
  const issues = validateCreate(input);
  if (issues.length > 0) {
    throwValidation(issues);
  }

  const now = new Date().toISOString();
  const ticket = {
    id: randomUUID(),
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority === undefined ? DEFAULT_PRIORITY : input.priority,
    status: INITIAL_STATUS,
    createdAt: now,
    updatedAt: now
  };

  return insert(ticket);
}

export function update(id, body) {
  const ticket = getById(id);

  const { empty, errors } = validatePatch(body);
  if (empty) {
    throw new AppError(400, 'EMPTY_PATCH', 'No se proporcionó ningún campo modificable.', null);
  }
  if (errors.length > 0) {
    throwValidation(errors);
  }

  if (isTerminal(ticket.status)) {
    throw new AppError(409, 'TICKET_IN_TERMINAL_STATUS', `El ticket ${id} está en un estado terminal.`, [
      {
        field: 'status',
        issue: `El estado actual "${ticket.status}" es terminal: no admite más cambios.`,
        code: 'TICKET_IN_TERMINAL_STATUS'
      }
    ]);
  }

  if (Object.hasOwn(body, 'status') && body.status !== ticket.status && !canTransition(ticket.status, body.status)) {
    throw new AppError(409, 'INVALID_STATE_TRANSITION', `No se puede pasar de '${ticket.status}' a '${body.status}'.`, [
      {
        field: 'status',
        issue: `La transición '${ticket.status}' → '${body.status}' no está permitida.`,
        code: 'INVALID_STATE_TRANSITION'
      }
    ]);
  }

  if (Object.hasOwn(body, 'title')) ticket.title = body.title.trim();
  if (Object.hasOwn(body, 'description')) ticket.description = body.description.trim();
  if (Object.hasOwn(body, 'priority')) ticket.priority = body.priority;
  if (Object.hasOwn(body, 'status')) ticket.status = body.status;

  ticket.updatedAt = new Date().toISOString();

  return ticket;
}