const mongoose = require('mongoose')
const Schema = mongoose.Schema

//// TODO
//// Not yet implemented

const TeamSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
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
    channels: [{
        type: Schema.Types.ObjectId, 
        ref: 'Channel'
    }],
    admins: [{
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }],
    members: [{
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }]
})

module.exports = mongoose.model('Team', TeamSchema)
