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
    phone: {
        type: String,
        required: false
    },
    date_registered: {
        type: Date,
        default: Date.now()
    },
    pending_invites: [{
        type: Schema.Types.ObjectId,
        ref: 'Invite'
    }],
    occupation: {
        type: String,
        required: false
    },
    fav_pizza: {
        type: String,
        required: false
    },
    birthday: {
        type: Date,
        required: false
    },
})

module.exports = mongoose.model('User', UserSchema)
