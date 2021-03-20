const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const Channel = require('../models/channel')
const User = require('../models/user')

const { getOnlineUsers } = require('../config/onlineStatus.js')
const { formatDate } = require('../config/format.js')

const {ensureAuthenticated} = require('../config/auth.js')

//// Store message in db channel
//* move to posts.ja
router.put('/add-to-channel/:id', async (req, res) => {

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

//// DELETE POST
router.put('/delete/:id', ensureAuthenticated, (req, res) => {
    const is_admin = req.user.role == "Admin";
    const channel_id = req.body.channel_id;

    Channel.findById(channel_id).then((channel) => {
        var post = channel.posts.filter(post => post._id == req.params.id)[0];
        // Check authority to remove
        const user_id = JSON.stringify(req.user._id)
        const author = JSON.stringify(post.author)
        const is_authorized = author == user_id || is_admin

        if (is_authorized) {
            Channel.findByIdAndUpdate(channel_id, {
                $pull: {posts: { _id: req.params.id }}
            }, (error, result) => {
                if (error) {
                    res.status(500).json(error)
                }
                res.status(201).json(result)
            })
        }
    }).catch((error) => {
        res.status(500).json(error)
    })
})

//// DELETE REPLY
router.put('/:post_id/delete-reply/:reply_id', ensureAuthenticated, (req, res) => {
    const is_admin = req.user.role == "Admin";
    const channel_id = req.body.channel_id;

    Channel.findById(channel_id).then((channel) => {
        const post = channel.posts.filter(post => post._id == req.params.post_id)[0];
        const reply = post.replies.filter(reply => reply._id == req.params.reply_id)[0]
        // Check authority to remove
        const user_id = JSON.stringify(req.user._id)
        const author = JSON.stringify(reply.author)
        const is_authorized = author == user_id || is_admin

        if (is_authorized) {
            Channel.updateOne(
                { _id: channel_id, 'posts._id': req.params.post_id, },
                { $pull: { 'posts.$.replies': { _id: req.params.reply_id }, }, },
            (error, result) => { 
                if (error) {
                    res.status(500).json(error)
                }
                res.status(201).json(result)
            })
        }
    }).catch((error) => {
        res.status(500).json(error)
    })
})

//// EDIT POST
router.put('/edit/:id', ensureAuthenticated, (req, res) => {
    const channel_id = req.body.channel_id;
    Channel.findById(channel_id).then((channel) => {
        var post = channel.posts.filter(post => post._id == req.params.id)[0];
        //// Check authority to remove
        const user_id = JSON.stringify(req.user._id)
        const author = JSON.stringify(post.author)
        const is_authorized = author == user_id

        if (is_authorized) {
            Channel.updateOne(
                { _id: channel_id, 'posts._id': req.params.id, },
                { $set: { 'posts.$.content': req.body.new_value, }, },
            (error, result) => {

                if (error) {
                    res.status(500).json(error)
                }
                res.status(201).json(result)
            })
        }
    }).catch((error) => {
        res.status(500).json(error)
    })
})

//// EDIT REPLY
router.put('/:post_id/edit-reply/:reply_id', ensureAuthenticated, (req, res) => {
    const channel_id = req.body.channel_id;
    console.log(req.body);

    Channel.findById(channel_id).then((channel) => {
        const post = channel.posts.filter(post => post._id == req.params.post_id)[0];
        const reply = post.replies.filter(reply => reply._id == req.params.reply_id)[0]

        // Check authority to remove
        const is_authorized = reply.author == req.session.passport.user 

        if (is_authorized) {
            Channel.updateOne(
                { _id:  channel_id },
                { $set: { "posts.$[outer].replies.$[inner].content": req.body.new_value } },
                {
                  "arrayFilters": [
                    { "outer._id": mongoose.Types.ObjectId(req.params.post_id) },
                    { "inner._id": mongoose.Types.ObjectId(req.params.reply_id) }
                  ]
                }, (error, result) => {
                    if (error) {
                        res.status(500).json(error)
                    }
                    console.log(result);
                    res.status(201).json(result)
                }
              )
            }
    }).catch((error) => {
        res.status(500).json(error)
    }) 
})

//// Add reply to post in db
router.put('/:id/add-reply', (req, res) => {
    const post_id = req.params.id
    console.log(post_id);
    console.log(req.body);
    Channel.findOneAndUpdate({
                _id: req.body.channel_id, 
                "posts._id": post_id
            },
            {
                $addToSet: {
                    'posts.$.replies': {
                        content: req.body.content,
                        author: req.user._id
                    }
                }
            },  {new: true}, (error, channel) => {
                if (error) {
                    res.status(500).json(error)  
                }
                const post = channel.posts.filter(subdoc => subdoc._id == post_id)[0]
                const reply = post.replies.slice(-1)[0]
                console.log(typeof reply.published);
                console.log(reply.published);
                res.status(200).json(reply)
        })
        .catch(error => res.status(500).json(error))
})


module.exports = router