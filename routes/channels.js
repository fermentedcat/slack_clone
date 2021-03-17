const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const Channel = require('../models/channel')
const User = require('../models/user')

// Add new channel
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

// Go to channel
router.get('/:id', (req, res) => {
    Channel.findById(req.params.id).then((channel) => {
        User.find().then((users) => {
            // Filter out already subscribing users
            const non_subscribers = users.filter(user => !channel.subscribers.includes(user._id))
            res.render('channel', {channel, user: req.session.passport.user, non_subscribers})
        })
        .catch(error => console.log(error))
    })
    .catch(error => console.log(error))

})

//// store message in db channel
router.put('/:id/add', async (req, res) => {

    const subDocument = {
        _id: mongoose.Types.ObjectId(),
        content: req.body.content,
        author: req.body.author
    }
    try {
        await Channel.findById(req.params.id).then((channel) => {
            channel['posts'].push(subDocument);
            channel.save(function(err, model){
                if (err) {
                    res.status(500).json({message: "An error occured"})
                }
            })
        })
        res.status(201).json(subDocument)
    } catch {
        res.status(500).json({message: "An error occured"})
    }    
})

//// add reply to channel post in db
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
        .catch(error => console.log(error))
})

module.exports = router