const express = require('express')
const router = express.Router()

const channelsController        = require('../controllers/channelsController')
const { ensureAuthenticated }   = require('../config/auth.js')


////==== CHANNEL ROUTES ==== ////


//// 1. Add new channel
router.post('/add', channelsController.addChannel)

//// 2. Edit channel info
router.patch('/edit/:id', channelsController.editChannel)

//// 3. Delete channel and any docs of invites connected to it
router.delete('/delete/:id', ensureAuthenticated, channelsController.deleteChannel)

//// 4. Add new subscriber to channel
router.put('/add-subscriber/:id', channelsController.addSubscriber)

//// 5. Remove subscriber from channel
router.put('/remove-subscriber/:id', channelsController.removeSubscriber)

//// 6. Send populated Channel to client-side js
router.get('/populated/:id', channelsController.getChannelData)

//// 7. Render channel
router.get('/:id', ensureAuthenticated, channelsController.renderChannel)


module.exports = router