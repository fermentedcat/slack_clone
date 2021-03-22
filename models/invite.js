const mongoose = require('mongoose')
const Schema = mongoose.Schema

const InviteSchema = new Schema ({
    invited_by: {
        type: Schema.Types.ObjectId, 
        ref: 'User'
    },
    channel: {
        type: Schema.Types.ObjectId, 
        ref: 'Channel'
    }
})

module.exports = mongoose.model('Invite', InviteSchema)