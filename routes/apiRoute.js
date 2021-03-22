const express = require('express')
const router = express.Router()

const User = require('../models/user')
const Invite = require('../models/invite')
const Channel = require('../models/channel')

const { getOnlineUsers } = require('../config/onlineStatus.js')
const {ensureAuthenticated} = require('../config/auth.js')


const bcrypt = require('bcrypt')
const passport = require('passport')
const fs = require('fs')
const { formatDate } = require('../config/format')

router.get('/users/username/:username', (req, res) => {
    console.log("we got thtis far");
    console.log(req.session.passport.user);
    User.findOne({
        $and: [{
            username: req.params.username
        }, {
            _id: {
                $ne: req.session.passport.user
            }}]
        }, (error, user) => {
            if (error) res.status(500)
            res.status(200).json(user)
        })

})


module.exports = router