const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChannelSchema = new Schema({
    name: {
        type: String,
        required: true
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
    }
})

module.exports = mongoose.model('Channel', ChannelSchema)
