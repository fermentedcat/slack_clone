const express = require('express')
const router = express.Router()

const DirectMessage = require('../models/direct_message')

const { ensureAuthenticated } = require('../config/auth')
const { getPostData } = require('../config/posts.js')

////=== Direct Messages ==== ////

// 1. Add dm
// 2. Get populated DM
// 3. Go to dm page

//// 1. Add direct message room
router.post('/add', async (req, res) => {
    const subscribers = req.body.invites
    subscribers.push(req.session.passport.user)
    
    const new_dm = new DirectMessage({
        subscribers
    })
    try {
        await new_dm.save()
        new_dm.populate('subscribers', (error, dm) => {
            if (error) {
                console.log(error);
                res.status(500).json({message: 'An error occured'})
            }
            req.flash('success_msg', 'Dm created!') //* fixa flash
            res.status(201).json(dm)
        })
    } catch {
        res.status(400).json({message: 'An error occured'})
        req.flash('error_msg', 'An error occured while creating the Dm. Please try again later.')
    }
})

//// 2. Send populated DM to client-side js
router.get('/populated/:id', (req, res) => {
    const current_user = req.user

    DirectMessage.findById(req.params.id)
        .populate('posts.author')
        .populate('posts.replies.author')
        .then( async (dm) => {
            try {
                const post_data = await getPostData(dm)
                res.status(200).json({dm, current_user, post_data})
            } catch (error) {
                res.status(500).json({message: "An error occured"})
            }
    }).catch((error) => {
        res.status(500).json({message: "An error occured"})
    })
})

//// 3. Render DM page
router.get('/:id', ensureAuthenticated, (req, res) => {
    const current_user = req.user
    DirectMessage.findById(req.params.id)
        .populate('subscribers')
        .then((dm) => {
            res.render('direct_message', {dm, current_user})
        })
        .catch((error) => {
            console.log(error);
            res.redirect('/dashboard')
        })
})


module.exports = router