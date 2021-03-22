const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DirectMessageSchema = new Schema({
    private: {
        type: Boolean,
        default: true
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

module.exports = mongoose.model('DirectMessage', DirectMessageSchema)
