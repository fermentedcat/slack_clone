const express = require('express')
const router = express.Router()

const Channel = require('../models/channel')
const User = require('../models/user')


router.post('/add', (req, res) => {
    let errors = []
    const name = req.body.name
    const description = req.body.description
    const creator = req.session.passport.user

    if (name.trim().length > 0) {
        const new_channel = new Channel({
            name, description, creator
        })
        new_channel.save().then(() => {
            req.flash('success_msg', 'Channel created!')
            res.redirect('/dashboard')
        })
        .catch(error => console.log(error))
    }
})

module.exports = router