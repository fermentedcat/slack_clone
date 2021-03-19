const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const Channel = require('../models/channel')
const User = require('../models/user')

const { loginUser, logoutUser, getCurrentUser, getOnlineUsers } = require('../config/onlineStatus.js')
const { formatDate } = require('../config/format.js')

const {ensureAuthenticated} = require('../config/auth.js')
const { post } = require('./users')


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
            res.render('channel', {
                channel, 
                user: req.session.passport.user, 
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

//// Return current channel and current user to client side js
router.get('/api/:id', (req, res) => {
    const current_user = req.user

    Channel.findById(req.params.id).then( async (channel) => {
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


//* move to separate file?
async function getPostData(channel) {
    try {
        let post_data = []
        for (let post of channel.posts) {
            try {
                const username = await getUserName(post.author)
                const replies = await getReplyData(post.replies)
                formatDate(post.published)
                post_data.push({
                    _id: post.id,
                    author: post.author,
                    username: username,
                    published: post.published,
                    date: formatDate(post.published).date,
                    time: formatDate(post.published).time,
                    content: post.content,
                    replies: replies
                })
            } catch (error) {
                console.log(error);
            }
        }
        return post_data
    } catch (error) {
        return post_data;
    }
}
//* move to separate file?
async function getReplyData(replies) {
    try {
        let reply_data = []
        for (let reply of replies) {
            try {
                const username = await getUserName(reply.author)
                reply_data.push({
                    _id: reply.id,
                    author: reply.author,
                    username: username,
                    published: reply.published,
                    date: formatDate(reply.published).date,
                    time: formatDate(reply.published).time,
                    content: reply.content
                })
            } catch (error) {
                console.log(error);
            }
        }
        return reply_data
    } catch (error) {
        return reply_data;
    }
}
//* move to separate file?
async function getUserName(id) {
    try {
        const user = await User.findById(id);
        if (!user) {
            console.log("user id not found");
        }
        return user.username
    } catch (error) {
        console.log(error)
    }
}

//// Store message in db channel
router.put('/:id/add', async (req, res) => {

    console.log(req.body);
    Channel.findByIdAndUpdate(req.params.id, {
        $push: {
            posts: {
                content: req.body.content,
                author: req.user._id
            }}}, {new: true}, (error, channel) => {
        if (error) {
            res.status(500).json({message: "An error occured"})
        }
        const new_post = channel.posts.slice(-1)[0]
        console.log(new_post) //* log
        res.status(201).json(new_post)
    }) 
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


module.exports = router