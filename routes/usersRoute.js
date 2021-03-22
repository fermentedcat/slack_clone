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

////=== USERS ==== ////

// Register
// Login
// Logout
// Login post

// Get current user (populated)
// All users with online statuses

// Add invites
// Remove invite
// Remove invites by channel_id //! fix
// Edit user
// Upload profile pic

// Login post
// Register post

// Profile page


//// Register
router.get('/register', (req, res) => {
    res.render('register', {layout: false})
})
//// Login
router.get('/login', (req, res) => {
    res.render('login', {layout: false})
})
//// Logout
router.get('/logout', (req, res) => {
    req.logout()
    req.flash('success_msg', 'Successfully logged out.')
    res.redirect('/users/login')
})


//// Provide populated current user (api provider)
router.get('/current-user', ensureAuthenticated, (req, res) => {
    User.findById(req.user._id)
        .populate({ 
            path: 'pending_invites',
            ref: 'Invite',
            populate: [{
                path: 'invited_by',
                ref: 'User'
            }, {
                path: 'channel',
                ref: 'Channel'
            }]
        })
        .exec((error, user) => {
            if (error) {
                res.status(200).json(req.user)
            }
            res.status(200).json(user)
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
        try {
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
        } catch (error) {
            console.log(error);
            res.json(online_users)
        }
    })
})

//// Add invites to user db
router.put('/invite-to-channel/:id', async (req, res) => {
    const current_user = req.user
    const invitees = req.body

    try {
        let populated_invitees = []
        
        for (invitee of invitees) {
            let invite = new Invite({
                invited_by: current_user._id, 
                channel: req.params.id
            })
            await invite.save()

                const user = await User.findByIdAndUpdate(
                    invitee,
                    { 
                        $push: {
                            pending_invites: [invite]
                        } 
                    }, 
                    {new: true})
                    .populate({ 
                        path: 'pending_invites',
                        ref: 'Invite',
                        populate: [{
                            path: 'invited_by',
                            ref: 'User'
                        }, {
                            path: 'channel',
                            ref: 'Channel'
                        }]
                    })
                    .exec()
                populated_invitees.push(user)
            
        } 

        console.log("populated_invitees");
        console.log(populated_invitees[0].channel);
        res.status(201).json(populated_invitees)
        } catch (error) {
            console.log(error);
        }
})

//// Remove invite (also after accepted)
router.delete('/remove-channel-invite/:id', async(req, res) => {
    const current_user = req.session.passport.user
    const invite_id = req.params.id
    console.log("here");

    User.findByIdAndUpdate(current_user, {
        $pull: {
            pending_invites:  invite_id
        }
    }, () => {
        Invite.findByIdAndDelete(invite_id, (error, result) => {
            if (error) {
                res.status(501).json(error)
            }
            res.status(204).json(result)
        })
    }).catch(error => res.status(500).json(error))
})

//// Remove one or more invites (after channel delete)
router.put('/remove-pending-invites', (req, res) => {
    const channel_id = req.body
    console.log(channel_id);
    User.updateMany({'pending_invites.$.channel': channel_id}, {
        $pop: {
            pending_invites: -1 //* hitta rätt query...
        }
    }, (result) => {
        res.status(201).json({message: "Pending invite successfully removed."})
    }).catch(error => res.status(500).json({message: "An error occured removing the invite."}))
})

//// Edit user info
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

//// Store or replace profile pic in server
router.post('/upload-profile-pic', (req, res) => {
    const user = req.session.passport.user

    try {
        if (req.files) {
            let profile_pic = req.files.profile_pic
            const accepted_files = ['image/jpeg','image/png']
            const is_image = accepted_files.includes(profile_pic.mimetype);
            if (is_image) {
                let file_name = `./public/images/profile/${ user }`
                profile_pic.mv(file_name)
                res.redirect(`/users/${user}`)
            } else {
                req.flash('error_msg', 'Please uploade a picture of type jpeg/jpg/png.')
                res.redirect(`/users/${req.user._id}`)
            }
        } else {
            req.flash('error_msg', 'Error uploading file. Please try another picture.')
            res.end(`<h1>No file uploaded!</h1>`)
        }
    } catch (error) {
        res.end(error)
    }
})

//// Login
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

//// Register new user
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

//// Profile page
router.get('/:id', ensureAuthenticated, (req, res) => {
    // Channel.findOne({subscribers: req.user._id}).exec((err, doc) => console.log(doc.channelName))
    const current_user = req.user
    const current_user_id = req.session.passport.user
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
            user.registered = formatDate(user.date_registered)
            const online_users = getOnlineUsers();
            res.render('profile', {
                current_user, 
                current_user_id: current_user_id, 
                user, 
                img_url: path, 
                online_users, 
                users
            })
        })
    })
})

module.exports = router;