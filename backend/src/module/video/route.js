
const express = require('express');
const router = express.Router();
const videoController = require('../video/controller/video.controller');

router.get('/info',videoController.info);

module.exports = router;



