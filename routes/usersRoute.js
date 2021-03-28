const express   = require('express')
const router    = express.Router()

const usersController           = require('../controllers/usersController')
const { ensureAuthenticated }   = require('../config/auth.js')

////=== USERS === ////

//// Login
router.post('/login', usersController.loginUser)

//// Logout
router.get('/logout', usersController.logoutUser)

//// Register new user
router.post('/register', usersController.registerUser)

//// Add invites to user db
router.put('/invite-to-channel/:id', usersController.addInvites)

//// Remove invite (also after accepted)
router.delete('/remove-channel-invite/:id', usersController.removeOneInvite)

//// Remove one or more invites (after channel delete)
router.put('/remove-pending-invites', usersController.removeUserInvites)

//// Edit user info
router.patch('/edit', ensureAuthenticated, usersController.editUser)

//// Store or replace profile pic in server
router.post('/upload-profile-pic', ensureAuthenticated, usersController.uploadProfilePic)

//// Send populated current user to client-side js
router.get('/current-user', ensureAuthenticated, usersController.getCurrentUser)

//// Find other users with this username
router.get('/username/:username', usersController.findByUsername)

//// Send online statuses to client
router.get('/api/online-status', usersController.getOnlineStatuses)

//// Profile page
router.get('/:id', ensureAuthenticated, usersController.renderProfile)

module.exports = router;