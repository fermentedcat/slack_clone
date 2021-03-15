const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        minlength: 6,
        required: true
    },
    role: {
        type: String,
        enum: ['User', 'Admin'], 
        default: 'User'
    },
    is_online: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        required: false
    },
    avatar: {
        type: String,
        default: './public/images/standard_avatar.jpg'
    },
    date_registered: {
        type: Date,
        default: Date.now()
    },
    pending_invites: [{
        invited_by: {
            type: Schema.Types.ObjectId, 
            ref: 'User'
        },
        channel_id: {
            type: Schema.Types.ObjectId, 
            ref: 'Channel'
        }
    }],
    profile_pic: {
        type: String,
        default: 'default.png'
    },
})

module.exports = mongoose.model('User', UserSchema)
