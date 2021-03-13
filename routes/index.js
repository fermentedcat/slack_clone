const express = require('express')
const router = express.Router()

const {ensureAuthenticated} = require('../config/auth.js')

router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.user })
})

//* lägg till id
router.get('/chat', (req, res) => {
    res.render('chat')
})

router.get('/', (req, res) => {
    // kolla om inloggad (api token?), skicka till startsida eller login
    // res.render('dashboard')
    res.render('login')
})

module.exports = router