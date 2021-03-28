const express = require('express')
const router  = express.Router()

const postsController         = require('../controllers/postsController')
const { ensureAuthenticated } = require('../config/auth.js')

////=== Channel/DM POSTS & REPLIES ==== ////
//* TODO: make more consistent paths

// 1. Add post
// 2. Add reply
// 3. Delete post
// 4. Delete reply
// 5. Edit post
// 6. Edit reply

//// 1. Add post
router.put('/add-to-channel/:id', postsController.addPost)

//// 2. Add reply to post
router.put('/:id/add-reply', postsController.addReply)

//// 3. DELETE POST
router.put('/delete/:id', ensureAuthenticated, postsController.deletePost)

//// 4. DELETE REPLY
router.put('/:post_id/delete-reply/:reply_id', ensureAuthenticated, postsController.deleteReply)

//// 5. EDIT POST
router.put('/edit/:id', ensureAuthenticated, postsController.editPost)

//// 6. EDIT REPLY
router.put('/:post_id/edit-reply/:reply_id', ensureAuthenticated, postsController.editReply)


module.exports = router