const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChannelSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        type: String,
        enum: ['Channel', 'Direct'],
        default: "Channel"
    },
    description: {
        type: String,
        required: false
    },
    creator: {
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    date_created: {
        type: Date,
        default: Date.now()
    },
    subscribers: [{
        type: Schema.Types.ObjectId, 
        ref: 'User'
    }],
    posts: [{
        content: {
            type: String,
            required: true //?
        },
        published: {
            type: Date,
            default: Date.now()
        },
        author: {
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true
        },
        required: false,

        replies: [{
            content: {
                type: String,
                required: true //?
            },
            published: {
                type: Date,
                default: Date.now()
            },
            author: {
                type: Schema.Types.ObjectId, 
                ref: 'User', 
                required: true
            },
            required: false
        }]
    }]
})


module.exports = mongoose.model('Channel', ChannelSchema)
