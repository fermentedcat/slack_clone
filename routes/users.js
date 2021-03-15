const express = require('express')
const router = express.Router()

const User = require('../models/user')
const Channel = require('../models/channel')
const bcrypt = require('bcrypt')
const passport = require('passport')
const { session } = require('passport')

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
    res.render('register')
})

router.get('/login', (req, res) => {
    res.render('login')
})

router.get('/logout', (req, res) => {
    req.logout()
    req.flash('success_msg', 'Successfully logged out.')
    res.redirect('/users/login')
})

router.get('/:id', (req, res) => {
    const session_user = req.session.passport.user
    User.findById(req.params.id).then((user) => {
        let invites = []
        // Find pending invites if user is current session user
        if (user.pending_invites.length > 0 && session_user == req.params.id) {
            console.log(user.pending_invites);
            for (invite of user.pending_invites) {
                Channel.findById(invite.channel_id).then((channel) => {
                    User.findById(invite.invited_by).then((invited_by) => {
                        invites.push({
                            channel: channel.name, 
                            invited_by: invited_by.username, 
                            _id: invite._id
                        })
                        res.render('profile', {session_user, user, invites})
                    }).catch(error => console.log(error))
                }).catch(error => console.log(error))
            }
        } else {
            res.render('profile', {session_user, user, invites})
        }
    }).catch(error => console.log(error))
})

// add invites to user db
router.put('/invite-to-channel/:id', (req, res) => {
    const user = req.session.passport.user
    console.log("send out invites");
    const invites = req.body
    console.log(invites);
    for (invite of invites) {
        User.findByIdAndUpdate(
            invite,
            { 
                $push: {
                    pending_invites: {
                        invited_by: user, 
                        channel_id: req.params.id
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

app.post('/upload-profile-pic', (req, res) => {
    const user = req.session.passport.user

    try {
        if (req.files) {
            let profile_pic = req.files.profile_pic

            let file_name = `./public/images/profile/${ user }`

            profile_pic.mv(file_name)

            res.render(`/users/${user}`)
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