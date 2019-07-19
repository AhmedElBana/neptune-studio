var express = require('express');
var router = express.Router();

let {authenticate} = require('../middleware/authenticate');

/* GET users listing. */
router.get('/', authenticate, function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
