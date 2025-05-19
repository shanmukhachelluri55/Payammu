const express = require('express');
const { renewSubscription } = require('../controllers/renewSubscription');

const router = express.Router();

router.post('/renew', renewSubscription);

module.exports = router;
