const express = require('express')
const router = express.Router()

const Channel = require('../models/channel')
const User = require('../models/user')



const {ensureAuthenticated} = require('../config/auth.js')

router.get('/dashboard', ensureAuthenticated, (req, res) => {
    Channel.find({$or: [{private: false}, {subscribers: req.user}]}).then((channels) => {
        User.find().then((users) => {
            res.render('dashboard', { user: req.user, channels, users})
        })
    })
})


router.get('/', (req, res) => {
    // kolla om inloggad (api token?), skicka till startsida eller login
    // res.render('dashboard')
    res.render('login', {layout: false})
})

module.exports = router