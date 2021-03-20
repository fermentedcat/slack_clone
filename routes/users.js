const express = require('express')
const router = express.Router()

const User = require('../models/user')
const Channel = require('../models/channel')

const { getOnlineUsers } = require('../config/onlineStatus.js')
const {ensureAuthenticated} = require('../config/auth.js')


const bcrypt = require('bcrypt')
const passport = require('passport')
const fs = require('fs')


router.post('/login', (req, res, next) => {
    console.log("log in");
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: {
            type: 'error_msg',
            message: 'Invalid email and/or password.'
        },
        successFlash: {
            type: 'success_msg',
            message: 'Successfully logged in.'
        }
    })(req, res, next)
})

router.get('/register', (req, res) => {
    res.render('register', {layout: false})
})

//// Provide current user
router.get('/current-user', ensureAuthenticated, (req, res) => {
    res.status(200).json(req.user)
})

router.get('/login', (req, res) => {
    res.render('login', {layout: false})
})

router.get('/logout', (req, res) => {
    req.logout()
    req.flash('success_msg', 'Successfully logged out.')
    res.redirect('/users/login')
})

//// Profile page
router.get('/:id', ensureAuthenticated, (req, res) => {
    // Channel.findOne({subscribers: req.user._id}).exec((err, doc) => console.log(doc.channelName))
    const current_user = req.session.passport.user
    const user_id = req.params.id

    //// Find profile pic
    let path = ""
    const dir = `./public/images/profile/${user_id}`
    try {
        if(fs.existsSync(dir)) {
            path = `/public/images/profile/${user_id}`
        } else {
            path = "/public/images/profile/default.png"
        }
    } catch (err) {
        console.error(err);
        path = "/public/images/profile/default.png"
    }

    //// Get all users
    User.find({}).exec((error, users) => {
        if (error) {
            console.log(error);
        }
        //// Get profile user
        User.findById(user_id).exec((error, user) => {
            if (error) {
                console.log(error);
            }
            const online_users = getOnlineUsers();
            res.render('profile', {current_user, user, img_url: path, online_users, users})
        })
    })
})

//// Send online statuses to client
router.get('/api/online-status', (req, res) => {
    const online_users = getOnlineUsers()
    User.find({}).exec((error, users) => {
        if (error) {
            res.status(500)
        }
        let users_data = []
        for (let user of users) {
            const is_current_user = user._id == req.session.passport.user;
            let user_data = {
                _id: user._id,
                username: user.username,
                online: is_current_user
            }
            for (let online of online_users) {
                if (user._id == online._id) {
                    user_data.online = true
                }
            }
            users_data.push(user_data)
        }
        res.status(200).json(users_data)
    })
})

//// add invites to user db
router.put('/invite-to-channel/:id', (req, res) => {
    const user = req.user
    const invites = req.body
    Channel.findById(req.params.id).exec((error, channel) => {
        if (error) {
            console.log(error);
        }
        for (invite of invites) {
            User.findByIdAndUpdate(
                invite,
                { 
                    $push: {
                        pending_invites: {
                            invited_by: {
                                _id: user._id,
                                username: user.username
                            }, 
                            channel: {
                                _id: req.params.id,
                                name: channel.name
                            }
                        }
                    } 
                }, 
                {new: true}, (error, docs) => {
                    if (error) {
                        console.log(error)
                    }
                })
            }
            res.end()
        })
})

//// Remove invite (also after accepted)
router.put('/remove-channel-invite/:id', (req, res) => {
    const current_user = req.session.passport.user
    const invite_id = req.params.id
    User.findByIdAndUpdate(current_user, {
        $pull: {
            pending_invites: { _id: invite_id} 
        }
    }, (result) => {
        res.status(201).json({message: "Pending invite successfully removed."})
    }).catch(error => res.status(500).json({message: "An error occured removing the invite."}))
})

// Edit user info
router.patch('/edit', (req, res) => {
    const user = req.session.passport.user
    
    User.findByIdAndUpdate(
        user, {$set: req.body}, {new: true, upsert: true}, (error, user) => {
            if (error) {
                res.status(400).json({ message: error })
            }
            res.status(201).json(user)
        }
    )
})

// Store or replace profile pic in server
router.post('/upload-profile-pic', (req, res) => {
    const user = req.session.passport.user

    try {
        if (req.files) {
            let profile_pic = req.files.profile_pic

            let file_name = `./public/images/profile/${ user }`

            profile_pic.mv(file_name)

            res.redirect(`/users/${user}`)
        } else {
            req.flash('error_msg', 'Error uploading file. Please try another picture.')
            res.end(`<h1>No file uploaded!</h1>`)
        }
    } catch (error) {
        res.end(error)
    }
})

router.post('/register', (req, res) => {
    let errors = []

    const {
        first_name,
        last_name,
        email,
        password,
        username
    } = req.body

    User.findOne({ email: email }).then(data => {
        // check that email is not already registered
        if (data != null) {
            errors.push({ message: 'Email is already registered.'})
        }
        // check fields are filled in correctly
        if (!first_name || !last_name || !email || !password) {
            errors.push({ message: 'Please fill out all fields.'})
        }
        if (password.length < 6) {
            errors.push({ message: 'Password needs to be at least 6 characters long.'})
        }
        
        //render register ejs again with current values except password, to show errors
        if (errors.length > 0) {
            res.render('register', {
                errors, first_name, last_name, email, username
            })
        } else {
            const new_user = new User({
                first_name, last_name, email, username, password
            })
            
            bcrypt.hash(password, 10, function (error, hash) {
                if (error) {
                    console.log(error)
                }
                new_user.password = hash
                
                new_user
                .save()
                .then(() => {
                    req.flash('success_msg', 'Registration succesful!')
                    res.redirect('/users/login')
                })
                .catch(error => console.log(error))
            })
        }
    })
})

module.exports = router;