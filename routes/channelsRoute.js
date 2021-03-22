const express = require('express')
const router = express.Router()

const Channel = require('../models/channel')
const User = require('../models/user')
const Invite = require('../models/invite')

const { getCurrentUser, getOnlineUsers } = require('../config/onlineStatus.js')
const { getPostData } = require('../config/posts.js')

const {ensureAuthenticated} = require('../config/auth.js')

////=== CHANNELS ==== ////

// Add channel
// Edit channel
// Delete channel

// Add new subscriber
// Remove subscriber

// Get channel data with formatted messages
// Go to channel page


//// Add new channel
router.post('/add', async (req, res) => {
    const name = req.body.name
    const description = req.body.description
    const private = req.body.private
    const creator = req.session.passport.user
    const subscribers = [creator]

    if (name.trim().length > 0) {
        const new_channel = new Channel({
            name, description, creator, subscribers, private
        })
        try {
            await new_channel.save()
            req.flash('success_msg', 'Channel created!')
            res.status(201).json(new_channel)
        } catch {
            res.status(400).json({message: 'An error occured'})
            req.flash('error_msg', 'An error occured while creating the channel. Please try again later.')
        }
    }
})

//// Edit channel info
router.patch('/edit/:id', (req, res) => {
    const channel_id = req.params.id
    
    Channel.findByIdAndUpdate(
        channel_id, {$set: req.body}, {new: true, upsert: true}, (error, channel) => {
            if (error) {
                res.status(400).json({ message: error })
            }
            res.status(201).json(channel)
        }
    )
})

//// Delete channel and any docs of invites connected to it
router.delete('/delete/:id', ensureAuthenticated, (req, res) => {
    Channel.findByIdAndDelete(req.params.id, (error, channel) => {
        if (error) {
            res.status(501)
        }
        console.log(channel);
        Invite.deleteMany({channel: req.params.id}, (error, result) => {
            if (error) {
                res.status(501).json(error)
            }
            res.status(204).json(result)
        })
        //* skicka flashmeddelande?
        res.status(204)
    })
})

//// Add new subscriber to channel
router.put('/add-subscriber/:id', (req, res) => {
    const current_user = req.user
    const channel_id = req.params.id

    Channel.findByIdAndUpdate(channel_id, {
        $push: {subscribers: current_user._id}
    }, (error, result) => {
        if (error) {
            res.status(500).json(error)
        }
        res.status(201).json({message: "Subscriber added to channel"})
    })
})

//// Remove subscriber from channel
router.put('/remove-subscriber/:id', (req, res) => {
    const current_user = req.user
    const channel_id = req.params.id

    Channel.findByIdAndUpdate(channel_id, {
        $pull: {subscribers: current_user._id}
    }, (error, result) => {
        if (error) {
            res.status(500).json(error)
        }
        res.status(201).json({message: "Subscriber removed from channel"})
    })
})

//// Return current channel and current user to client side js
router.get('/api/:id', (req, res) => {
    const current_user = req.user

    Channel.findById(req.params.id)
        .populate('posts.author')
        .populate('posts.replies.author')
        .then( async (channel) => {
            try {
                const post_data = await getPostData(channel)
                res.status(200).json({channel, current_user, post_data})
            } catch (error) {
                res.status(500).json({message: "An error occured"})
            }
    }).catch((error) => {
        res.status(500).json({message: "An error occured"})
    })
})

//// Go to channel
router.get('/:id', ensureAuthenticated, (req, res) => {
    const online_users = getOnlineUsers()
    const current_user = req.user
    Channel.findById(req.params.id).then((channel) => {
        // Redirect user to dashboard if non-subscriber to private channel
        const is_subscriber = channel.subscribers.includes(current_user._id)
        if (channel.private && !is_subscriber) {
            res.redirect('/dashboard')
        }
        User.find().then((users) => {
            // Filter out already subscribing users
            const non_subscribers = users.filter(user => !channel.subscribers.includes(user._id))
            console.log(current_user._id);
            console.log(channel.creator);
            res.render('channel', {
                channel, //* används i ejs
                current_user_id: req.session.passport.user, //* används i ejs
                non_subscribers, 
                users, 
                online_users, 
                current_user 
            })
        })
        .catch(error => {
            res.redirect('/dashboard')
            console.log(error)}
        )
    })
    .catch(error => {
        res.redirect('/dashboard')
        console.log(error)}
    )
})


module.exports = router