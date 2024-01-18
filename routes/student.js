const express = require("express");
const authController = require("../controllers/student.js");

const router = express.Router();

// router.post('/register', authController.register)
// router.post('/login', authController.login);
router.get('/student', authController.logout);

module.exports = router;