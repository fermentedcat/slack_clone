const express = require('express')
const router = express.Router()

const Channel = require('../models/channel')
const User = require('../models/user')

// Add new channel
router.post('/add', (req, res) => {
    const name = req.body.name
    const description = req.body.description
    const creator = req.session.passport.user
    const subscribers = [creator]

    if (name.trim().length > 0) {
        const new_channel = new Channel({
            name, description, creator, subscribers
        })
        new_channel.save().then(() => {
            req.flash('success_msg', 'Channel created!')
            res.redirect('/dashboard')
        })
        .catch(error => console.log(error))
    }
})

// Go to channel
router.get('/:id', (req, res) => {
    Channel.findById(req.params.id).then((channel) => {
        User.find().then((users) => {
            // Filter out already subscribing users
            const non_subscribers = users.filter(user => !channel.subscribers.includes(user._id))
            res.render('channel', {channel, user: req.session.passport.user, non_subscribers})
        })
    })
})

// add post to channel in db
router.put('/:id/add', (req, res) => {
    Channel.findByIdAndUpdate(
        req.params.id,
        { $push: {posts: req.body} }, {new: true}, (error, docs) => {
            if (error) {
                console.log(error)
            }
            res.end()
        })
})


// add reply to channel post in db
router.put('/:id/:post_id/add', (req, res) => {
    const channel_id = req.params.id
    const post_id = req.params.post_id
    Channel.updateOne({
                _id: channel_id, 
                "posts._id": post_id
            },
            {
                $addToSet: {
                    'posts.$.replies': req.body
                }
            },  (error, docs) => {
                if (error) {
                    console.log(error)
                }
            res.end()
        })
})

module.exports = router