const express = require('express')
const router = express.Router()

const Channel = require('../models/channel')
const User = require('../models/user')

const { loginUser, logoutUser, getCurrentUser, getOnlineUsers } = require('../config/onlineStatus.js')

const {ensureAuthenticated} = require('../config/auth.js')

// Get all users, current user channels
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    const online_users = getOnlineUsers()
    Channel.find(
        {$or: [
            {private: false}, 
            {subscribers: req.user}]}
    )
        .then((channels) => {
            User.find().then((users) => {
                res.render('dashboard', { current_user: req.user, channels, users, online_users})
            })
        })

})


router.get('/', (req, res) => {
    // kolla om inloggad (api token?), skicka till startsida eller login
    // res.render('dashboard')
    res.render('login', {layout: false})
})

module.exports = router