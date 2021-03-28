const express = require('express')
const router  = express.Router()


const { ensureAuthenticated }  = require('../config/auth')
const directMessagesController = require('../controllers/directMessagesController')


////=== Direct Messages ==== ////

// 1. Add dm
// 2. Get populated DM data
// 3. Go to dm page

//// 1. Add direct message room
router.post('/add', directMessagesController.addNewDM)

//// 2. Send populated DM to client-side js
router.get('/populated/:id', directMessagesController.getDMData)

//// 3. Render DM page
router.get('/:id', ensureAuthenticated, directMessagesController.renderDMPage)


module.exports = router