const express = require('express')
const router = express.Router()

const channelsController        = require('../controllers/channelsController')
const { ensureAuthenticated }   = require('../config/auth.js')


////==== CHANNEL ROUTES ==== ////


//// 1. Add new channel
router.post('/add', channelsController.addChannel)

//// 4. Add new subscriber to channel
router.put('/add-subscriber/:id', channelsController.addSubscriber)

//// 5. Remove subscriber from channel
router.put('/remove-subscriber/:id', channelsController.removeSubscriber)

//// 6. Send populated Channel to client-side js
router.get('/populated/:id', channelsController.getChannelData)

//// 7. Render, edit, delete channel
router
    .route('/:id')
    .get(ensureAuthenticated, channelsController.renderChannel)
    .patch(channelsController.editChannel)
    .delete(ensureAuthenticated, channelsController.deleteChannel)


module.exports = router