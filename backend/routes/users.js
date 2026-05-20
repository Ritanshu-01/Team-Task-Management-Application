const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const c = require('../controllers/userController');

router.use(auth);

router.get('/', role('admin'), c.list);
router.put('/:id/role', role('admin'), c.updateRole);

module.exports = router;
