const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const kb = require('../controllers/knowledgeController');
const router = express.Router();

const staff = roleGuard('admin', 'member');

router.get('/kb/categories', auth, staff, kb.listCategories);
router.post('/kb/categories', auth, staff, kb.createCategory);
router.put('/kb/categories/:id', auth, staff, kb.updateCategory);
router.delete('/kb/categories/:id', auth, staff, kb.deleteCategory);

router.get('/kb/articles', auth, staff, kb.listArticles);
router.get('/kb/articles/:id', auth, staff, kb.getArticle);
router.post('/kb/articles', auth, staff, kb.createArticle);
router.put('/kb/articles/:id', auth, staff, kb.updateArticle);
router.delete('/kb/articles/:id', auth, staff, kb.deleteArticle);

module.exports = router;
