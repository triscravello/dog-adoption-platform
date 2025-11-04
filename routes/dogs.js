const express = require("express");
const router = express.Router();
const { registerDog, adoptDog, removeDog, listRegisteredDogs, listAdoptedDogs } = require('../controllers/dogController');

const { requireAuth } = require('../middlewares/auth');

router.use(requireAuth); // all dog routes require auth

router.post('/', registerDog); // POST /dogs
router.post('/:id/adopt', adoptDog); // POST /:id/adopt
router.delete('/:id', removeDog); // DELETE /:id
router.get('/registered', listRegisteredDogs); // GET /registered?status=available&page=1
router.get('/adopted', listAdoptedDogs); // GET /adopted?page=1

module.exports = router;