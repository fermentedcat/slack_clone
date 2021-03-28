const express = require('express')
const router = express.Router()

const Channel = require('../models/channel')
const DirectMessage = require('../models/direct_message')
const User = require('../models/user')

const {ensureAuthenticated} = require('../config/auth.js')

////=== Index / dashboard ==== ////

// dashboard
//  index

//// Get all users, current user channels
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    const page_data = { current_user: req.user, channels: [], users: [], dms: [] }
    Channel.find(
        {$or: [
            {private: false}, 
            {subscribers: req.user}]}
        )
        .exec((error, channels) => {
            if (error) {
                res.render('dashboard', page_data)
            }
            page_data.channels = channels

            User.find({}).exec((error, users) => {
                if (error) {
                    res.render('dashboard', page_data)
                }
                page_data.users = users

                DirectMessage.find({subscribers: req.user})
                    .populate('subscribers')
                    .exec((error, dms) => {
                        if (error) {
                            res.render('dashboard', page_data)
                        }
                        page_data.dms = dms
                        res.render('dashboard', page_data)
                })
            })
        })
})


////  Register
router.get('/register', (req, res) => {
    res.render('register', {layout: false})
})
////  Login
router.get('/login', (req, res) => {
    res.render('login', {layout: false})
})

//* TODO: make landing page
//// Redirect user to login or dashboard
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard')
    }
    res.redirect('/login')
})



module.exports = router