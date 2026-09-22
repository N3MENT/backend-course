import express from 'express';
import ticketsRoutes from './routes/supportTickets.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());

app.use('/api/v1/support-tickets', ticketsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;