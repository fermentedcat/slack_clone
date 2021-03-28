const Channel   = require('../models/channel')
const User      = require('../models/user')
const Invite    = require('../models/invite')

const { getPostData }       = require('../config/posts.js')

////==== CHANNELS ==== ////

// 1. Add channel
// 2. Edit channel
// 3. Delete channel
// 4. Add new subscriber
// 5. Remove subscriber
// 6. Get populated channel data
// 7. Render channel page

// 1.
exports.addChannel = async (req, res) => {
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
}

// 2.
exports.editChannel = (req, res) => {
    const channel_id = req.params.id
    
    Channel.findByIdAndUpdate(
        channel_id, {$set: req.body}, {new: true, upsert: true}, (error, channel) => {
            if (error) res.status(400).json({ message: error })
            res.status(201).json(channel)
        }
    )
}

// 3.
exports.deleteChannel = (req, res) => {
    Channel.findByIdAndDelete(req.params.id, async (error, channel) => {
        if (error) res.status(501)

        const invites = await Invite.find({channel: req.params.id});
        await Invite.deleteMany({channel: req.params.id}, (error, data) => {
            if (error) {
                res.status(501).json(error)
            }
            res.status(200).json(invites)
        })
        //* skicka flashmeddelande?
    })
}

// 4.
exports.addSubscriber = (req, res) => {
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
}

// 5.
exports.removeSubscriber = (req, res) => {
    const current_user = req.user
    const channel_id = req.params.id

    Channel.findByIdAndUpdate(channel_id, {
        $pull: {subscribers: current_user._id}
    }, (error, result) => {
        if (error) res.status(500).json(error)
        res.status(201).json({message: "Subscriber removed from channel"})
    })
}

// 6.
exports.getChannelData = (req, res) => {
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
}

// 7.
exports.renderChannel = (req, res) => {
    const current_user = req.user
    Channel.findById(req.params.id).then((channel) => {
        // Redirect user to dashboard if non-subscriber to private channel
        const is_subscriber = channel.subscribers.includes(current_user._id)
        if ((channel.private && !is_subscriber) || current_user.role == 'Admin') {
            res.redirect('/dashboard')
        }
        User.find({})
            .populate({ 
                path: 'pending_invites',
                ref: 'Invite',
                populate: [{
                    path: 'invited_by',
                    ref: 'User',
                    select: 'username'
                }, {
                    path: 'channel',
                    ref: 'Channel',
                    select: 'name'
                }]
            })
            .then((users) => {
            //// Filter out already subscribing or invited users
            const non_invited = users.filter(user => {
                if (channel.subscribers.includes(user._id)) {
                    return false
                } else if (user.pending_invites.length > 0) {
                    for (let invite of user.pending_invites) {
                        if (invite.channel._id == channel._id) {
                            return false
                        } else {
                            return true
                        }
                    } 
                } else {
                    return true
                }
            })
            res.render('channel', {
                channel,
                current_user_id: req.session.passport.user,
                non_invited
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
}