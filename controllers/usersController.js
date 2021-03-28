const bcrypt = require('bcrypt')
const passport = require('passport')
const fs = require('fs')

const User = require('../models/user')
const Invite = require('../models/invite')
const Channel = require('../models/channel')
const DirectMessage = require('../models/direct_message')

const { getOnlineUsers } = require('../config/onlineStatus.js')
const { formatDate } = require('../config/format')

////=== USERS ==== ////

// 1. Login
// 2. Logout
// 3. Register 

// 4. Profile page
// 5. Get current user (populated)

// 6. Add invites
// 7. Remove one invite
// 8. Remove all user invites (after channel delete)

// 9. Edit user
// 10. Upload profile pic

// 11. Check existing username
// 12. Send all online statuses

// 13. Render dashboard

// 1.
exports.loginUser = (req, res, next) => {
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
}
// 2.
exports.logoutUser = (req, res) => {
    req.logout()
    req.flash('success_msg', 'Successfully logged out.')
    res.redirect('/login')
}
// 3.
exports.registerUser = (req, res) => {
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
        User.findOne({ username: username }).then(data => {
            // check that username is not already registered
            if (data != null) {
                errors.push({ message: 'Username is already taken. Please try another one.'})
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
                    errors, first_name, last_name, email, username, layout: false
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
                        res.redirect('/login')
                    })
                    .catch(error => console.log(error))
                })
            }
        })
    })
}

// 4.
exports.renderProfile = (req, res) => {
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
}
// 5.
exports.getCurrentUser = (req, res) => {
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
            if (error) res.status(200).json(req.user)
            res.status(200).json(user)
        })
}

// 6.
exports.addInvites = async (req, res) => {
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
                            pending_invites: [invite._id]
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
        res.status(201).json(populated_invitees)
        } catch (error) {
            console.log(error)
        }
}
// 7.
exports.removeOneInvite = async (req, res) => {
    const current_user = req.session.passport.user
    const invite_id = req.params.id

    User.findByIdAndUpdate(current_user, {
        $pull: {
            pending_invites:  invite_id
        }
    }, () => {
        Invite.findByIdAndDelete(invite_id, (error, result) => {
            if (error) res.status(501).json(error)
            res.status(204).json(result)
        })
    }).catch(error => res.status(500).json(error))
}
// 8.
exports.removeUserInvites = async (req, res) => {
    const invites = req.body
    try {
        for (invite of invites) {
            await User.updateOne({
                pending_invites: invite._id
            }, {
                $pull: {
                    pending_invites: invite._id
                }}, (error) => {
                    console.log(error);
                })
        }
        res.status(200).json({message: "Pending invites successfully removed."})
    } catch (error) {
        res.status(500)
    }
}

// 9.
exports.editUser = (req, res) => {
    const user = req.session.passport.user
    
    User.findByIdAndUpdate(
        user, {$set: req.body}, {new: true, upsert: true}, (error, user) => {
            if (error) {
                res.status(400).json({ message: error })
            }
            res.status(201).json(user)
        }
    )
}
// 10.
exports.uploadProfilePic = (req, res) => {
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
            res.redirect(`/users/${user}`)
        }
    } catch (error) {
        req.flash('error_msg', 'Error')
        res.redirect(`/users/${user}`)
    }
}

// 11.
exports.findByUsername = (req, res) => {
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
}
// 12.
exports.getOnlineStatuses = (req, res) => {
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
}

// 13.
exports.renderDashboard = (req, res) => {
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
}