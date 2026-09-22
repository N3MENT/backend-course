import * as ticketService from '../services/supportTickets.service.js';

export function list(req, res) {
  res.status(200).json(ticketService.list(req.query));
}

export function getById(req, res) {
  res.status(200).json(ticketService.getById(req.params.id));
}

export function create(req, res) {
  res.status(201).json(ticketService.create(req.body));
}

export function update(req, res) {
  res.status(200).json(ticketService.update(req.params.id, req.body));
}