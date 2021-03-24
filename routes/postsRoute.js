const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const Channel = require('../models/channel')
const DirectMessage = require('../models/direct_message')

const {ensureAuthenticated} = require('../config/auth.js')

////=== Channel/DM POSTS & REPLIES ==== ////
//* TODO: make more consistent paths

// 1. Add post
// 2. Add reply
// 3. Delete post
// 4. Delete reply
// 5. Edit post
// 6. Edit reply

//// 1. Add post
router.put('/add-to-channel/:id', async (req, res) => {
    const is_channel = req.body.location == 'channels'
    if (is_channel) { //// Update channel
        Channel.findByIdAndUpdate(req.params.id, {
            $push: {
                posts: {
                    content: req.body.content,
                    author: req.user._id
                }}}, {new: true})
                .populate('posts.author')
                .exec((error, channel) => {
                    if (error) {
                        res.status(500).json({message: "An error occured"})
                    }
                    
                    const new_post = channel.posts.slice(-1)[0]
                    res.status(201).json(new_post)
                })
    } else {
        DirectMessage.findByIdAndUpdate(req.params.id, {
            $push: {
                posts: {
                    content: req.body.content,
                    author: req.user._id
                }}}, {new: true})
                .populate('posts.author')
                .exec((error, dm) => {
                    if (error) {
                        res.status(500).json({message: "An error occured"})
                    }
                    
                    const new_post = dm.posts.slice(-1)[0]
                    res.status(201).json(new_post)
                })
    }
})

//// 2. Add reply to post
router.put('/:id/add-reply', (req, res) => {
    const post_id = req.params.id
    const chat_id = req.body.chat_id
    const is_channel = req.body.location == 'channels'

    if (is_channel) { //// Edit channel
        Channel.findOneAndUpdate({
                    _id: chat_id, 
                    "posts._id": post_id
                },
                {
                    $addToSet: {
                        'posts.$.replies': {
                            content: req.body.content,
                            author: req.user._id
                        }
                    }
                },  {new: true})
                .populate('posts.replies.author')
                .exec((error, channel) => {
                    if (error) {
                        res.status(500).json(error)  
                    }
                    const post = channel.posts.filter(subdoc => subdoc._id == post_id)[0]
                    const reply = post.replies.slice(-1)[0]
                    res.status(200).json(reply)
                })
    } else { //// Edit DM
        DirectMessage.findOneAndUpdate({
            _id: chat_id, 
            "posts._id": post_id
        },
        {
            $addToSet: {
                'posts.$.replies': {
                    content: req.body.content,
                    author: req.user._id
                }
            }
        },  {new: true})
        .populate('posts.replies.author')
        .exec((error, dm) => {
            if (error) {
                res.status(500).json(error)  
            }
            const post = dm.posts.filter(subdoc => subdoc._id == post_id)[0]
            const reply = post.replies.slice(-1)[0]
            res.status(200).json(reply)
        })
    }
})

//// 3. DELETE POST
router.put('/delete/:id', ensureAuthenticated, (req, res) => {
    const is_admin = req.user.role == "Admin";
    const chat_id = req.body.chat_id;
    const is_channel = req.body.location == 'channels'
    if (is_channel) {
        Channel.findById(chat_id).then((channel) => {
            var post = channel.posts.filter(post => post._id == req.params.id)[0];
            //// Check authority to remove
            const user_id = JSON.stringify(req.user._id)
            const author = JSON.stringify(post.author)
            const is_authorized = author == user_id || is_admin
    
            if (is_authorized) {
                Channel.findByIdAndUpdate(chat_id, {
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
    } else {
        DirectMessage.findById(chat_id).then((dm) => {
            var post = dm.posts.filter(post => post._id == req.params.id)[0];
            // Check authority to remove
            const user_id = JSON.stringify(req.user._id)
            const author = JSON.stringify(post.author)
            const is_authorized = author == user_id || is_admin
    
            if (is_authorized) {
                DirectMessage.findByIdAndUpdate(chat_id, {
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
    }

})

//// 4. DELETE REPLY
router.put('/:post_id/delete-reply/:reply_id', ensureAuthenticated, (req, res) => {
    const is_admin = req.user.role == "Admin";
    const chat_id = req.body.chat_id;
    const is_channel = req.body.location == 'channels'

    if (is_channel) { //// Edit channel
        Channel.findById(chat_id).then((channel) => {
            const post = channel.posts.filter(post => post._id == req.params.post_id)[0];
            const reply = post.replies.filter(reply => reply._id == req.params.reply_id)[0]
            // Check authority to remove
            const user_id = JSON.stringify(req.user._id)
            const author = JSON.stringify(reply.author)
            const is_authorized = author == user_id || is_admin
    
            if (is_authorized) {
                Channel.updateOne(
                    { _id: chat_id, 'posts._id': req.params.post_id, },
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
    } else {   //// Edit DM
        DirectMessage.findById(chat_id).then((dm) => {
            const post = dm.posts.filter(post => post._id == req.params.post_id)[0];
            const reply = post.replies.filter(reply => reply._id == req.params.reply_id)[0]
            // Check authority to remove
            const user_id = JSON.stringify(req.user._id)
            const author = JSON.stringify(reply.author)
            const is_authorized = author == user_id || is_admin
    
            if (is_authorized) {
                DirectMessage.updateOne(
                    { _id: chat_id, 'posts._id': req.params.post_id, },
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
    }
})

//// 5. EDIT POST
router.put('/edit/:id', ensureAuthenticated, (req, res) => {
    const chat_id = req.body.chat_id;
    const is_channel = req.body.location == 'channels'
    if (is_channel) {
        //// Edit channel
        Channel.findById(chat_id).then((channel) => {
            var post = channel.posts.filter(post => post._id == req.params.id)[0];
            //// Check authority to remove
            const user_id = JSON.stringify(req.user._id)
            const author = JSON.stringify(post.author)
            const is_authorized = author == user_id
    
            if (is_authorized) {
                Channel.updateOne(
                    { _id: chat_id, 'posts._id': req.params.id, },
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
    } else {
        //// Edit DM
        DirectMessage.findById(chat_id).then((dm) => {
            var post = dm.posts.filter(post => post._id == req.params.id)[0];
            //// Check authority to remove
            const user_id = JSON.stringify(req.user._id)
            const author = JSON.stringify(post.author)
            const is_authorized = author == user_id
    
            if (is_authorized) {
                DirectMessage.updateOne(
                    { _id: chat_id, 'posts._id': req.params.id, },
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
    }
})

//// 6. EDIT REPLY
router.put('/:post_id/edit-reply/:reply_id', ensureAuthenticated, (req, res) => {
    const chat_id = req.body.chat_id;
    const is_channel = req.body.location == 'channels'

    if (is_channel) { //// Edit channel
        Channel.findById(chat_id).then((channel) => {
            const post = channel.posts.filter(post => post._id == req.params.post_id)[0];
            const reply = post.replies.filter(reply => reply._id == req.params.reply_id)[0]
    
            // Check authority to remove
            const is_authorized = reply.author == req.session.passport.user 
    
            if (is_authorized) {
                Channel.updateOne(
                    { _id:  chat_id },
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
                        res.status(201).json(result)
                    }
                  )
                }
        }).catch((error) => {
            res.status(500).json(error)
        }) 
    } else { //// Edit DM
        DirectMessage.findById(chat_id).then((dm) => {
            const post = dm.posts.filter(post => post._id == req.params.post_id)[0];
            const reply = post.replies.filter(reply => reply._id == req.params.reply_id)[0]
    
            // Check authority to remove
            const is_authorized = reply.author == req.session.passport.user 
    
            if (is_authorized) {
                DirectMessage.updateOne(
                    { _id:  chat_id },
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
                        res.status(201).json(result)
                    }
                  )
                }
        }).catch((error) => {
            res.status(500).json(error)
        }) 
    }
})


module.exports = router