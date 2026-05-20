const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { validate } = require('../middleware/error');
const c = require('../controllers/projectController');

router.use(auth);

router.get('/', c.list);
router.get('/:id', c.get);

router.post(
  '/',
  role('admin'),
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  validate,
  c.create
);

router.put(
  '/:id',
  role('admin'),
  [body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty')],
  validate,
  c.update
);
router.delete('/:id', role('admin'), c.remove);

router.post(
  '/:id/members',
  role('admin'),
  [body('userId').notEmpty().withMessage('userId required')],
  validate,
  c.addMember
);
router.delete('/:id/members/:userId', role('admin'), c.removeMember);

module.exports = router;
