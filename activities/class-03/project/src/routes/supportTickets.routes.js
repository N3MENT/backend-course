import express from 'express';
import { list, getById, create, update } from '../controllers/supportTickets.controller.js';

const router = express.Router();

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id', update);

export default router;