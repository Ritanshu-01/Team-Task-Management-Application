const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { validate } = require('../middleware/error');
const c = require('../controllers/taskController');

router.use(auth);

router.get('/', c.list);
router.get('/:id', c.get);

router.post(
  '/',
  role('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  validate,
  c.create
);

router.put(
  '/:id',
  [
    body('status').optional().isIn(['todo', 'in_progress', 'completed']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  ],
  validate,
  c.update
);
router.delete('/:id', role('admin'), c.remove);

module.exports = router;
