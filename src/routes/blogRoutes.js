
const express = require('express');
const router = express.Router();

const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', blogController.index);
router.get('/:id', blogController.show);

// Protected routes
router.post('/', authMiddleware, blogController.store);
router.put('/:id', authMiddleware, blogController.update);
router.delete('/:id', authMiddleware, blogController.destroy);

module.exports = router;
