const seedTickets = [
  {
    id: 'b1e6d2f0-1c9a-4e5d-8a3f-2c5b7d9e1a23',
    title: 'Error al exportar reporte PDF',
    description: 'Al hacer clic en "Exportar", la pantalla se queda congelada.',
    priority: 'medium',
    status: 'pending',
    createdAt: '2026-09-22T08:00:00.000Z',
    updatedAt: '2026-09-22T08:00:00.000Z'
  },
  {
    id: 'c2f7e3a1-2dab-4f6e-9b40-3d6c8eaf2b34',
    title: 'Login con doble factor falla',
    description: 'La app no envía el código por SMS.',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2026-09-22T08:05:00.000Z',
    updatedAt: '2026-09-22T09:00:00.000Z'
  },
  {
    id: 'd3a8f4b2-3ebc-4a7f-ac51-4e7d9fb0c345',
    title: 'Impresora no imprime en red',
    description: 'La impresora del piso 3 no responde.',
    priority: 'urgent',
    status: 'resolved',
    createdAt: '2026-09-21T17:00:00.000Z',
    updatedAt: '2026-09-22T08:30:00.000Z'
  },
  {
    id: 'e4b9a5c3-4fcd-4b8a-bd62-5f8e0ac1d456',
    title: 'Cuenta duplicada en el sistema',
    description: 'El usuario reporta una cuenta duplicada.',
    priority: 'low',
    status: 'cancelled',
    createdAt: '2026-09-21T15:00:00.000Z',
    updatedAt: '2026-09-21T15:45:00.000Z'
  }
];

const tickets = [...seedTickets];

export function findAll({ status, priority } = {}) {
  return tickets.filter((ticket) => {
    const matchesStatus = status === undefined || ticket.status === status;
    const matchesPriority = priority === undefined || ticket.priority === priority;
    return matchesStatus && matchesPriority;
  });
}

export function findById(id) {
  return tickets.find((ticket) => ticket.id === id);
}

export function insert(ticket) {
  tickets.push(ticket);
  return ticket;
}