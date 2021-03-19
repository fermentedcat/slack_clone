require('dotenv').config()


const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/slack_clone')
    .then(() => { console.log('connected to db')})
    .catch(error => console.log("error"))

const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const router = express.Router()


const flash = require('connect-flash')
const session = require('express-session')
const expressEjsLayouts = require('express-ejs-layouts')
const fileUpload = require('express-fileupload')
const { loginUser,
    logoutUser,
    getCurrentUser,
    getOnlineUsers
} = require('./config/onlineStatus.js')
const { formatMessage } = require('./config/format.js')


//// passport
const passport = require('passport')
const User = require('./models/user')
require('./config/passport')(passport)
// const sharedsession = require('express-socket.io-session')


app.set('view engine', 'ejs')
app.use(expressEjsLayouts)
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(fileUpload({ createParentPath: true }))


//// SESSIONS
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, 
        sameSite: true,
        maxAge: 900000
    }
}))

/* io.use(
    sharedsession(session, {
        autoSave: true
    })
) */

//// PASSPORT
app.use(passport.initialize())
app.use(passport.session())



//// FLASH
app.use(flash())
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    next()
})


// routes
app.use('/users', require('./routes/users'))
app.use('/channels', require('./routes/channels'))
app.use('/', require('./routes/index'))


io.on('connection', socket => {
    console.log("New WS Connection");
    let room = ""
    let current_user = {}
    
    socket.on("online", user => {
        loginUser(user, socket.id)
        console.log(`socket id upon login: ${socket.id}`);
        io.emit("online", user)
    })

    //// join room
    socket.on('joinRoom', ({ user_id, room_id }) => {
        room = room_id
        socket.join(room)
    })

    //// message
    socket.on('chat message', message => {
        const current_user = getCurrentUser(socket.id)
        const online = getOnlineUsers()
        console.log(online);
        console.log(socket.id);
        const data = {
            post_data: formatMessage(message, current_user),
            current_user: current_user
        }
        io.to(room).emit('chat message', data)
    })

    //// reply
    socket.on('reply message', message => {
        io.to(room).emit('reply message', message)
    })

    // Welcome current user
    socket.emit('message', 'Welcome to s1ack!')
    /* socket.on('login', function(userdata) {
        socket.handshake.session.userdata = userdata
        socket.handshake.session.save()
        console.log(socket.handshake.session);
    }) */

    // Broadcast to other user that a new user has connected
    socket.broadcast.emit('message', 'A user has joined the chat.')

    socket.on('new channel', channel => {
        io.emit('new channel', channel)
    })

    socket.on('disconnect', () => {
        console.log("let's log out");
        // Emit to all users when someone leaves
        const current_user = getCurrentUser(socket.id)
        const online_users = logoutUser(socket.id)
        socket.broadcast.emit("offline", current_user)
        // socket.removeAllListeners()
    })

})



const PORT = 3000 || process.env.PORT

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))