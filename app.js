require('dotenv').config()

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/slack_clone')
    .then(() => { console.log('connected to db')})
    .catch(error => console.log("error"))

const path      = require('path')
const http      = require('http')
const express   = require('express')
const socketio  = require('socket.io')

const app       = express()
const server    = http.createServer(app)
const io        = socketio(server)

const router    = express.Router() //* behövs den?


const flash     = require('connect-flash')
const session   = require('express-session')
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
require('./config/passport')(passport)


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


//// routes
app.use('/users', require('./routes/users'))
app.use('/channels', require('./routes/channels'))
app.use('/posts', require('./routes/posts'))
app.use('/', require('./routes/index'))


io.on('connection', socket => {
    console.log("New WS Connection");
    let room = ""
    
    //// Store user info of online user
    socket.on("online", user => {
        loginUser(user, socket.id)
        io.emit("online", user)
    })

    //// join room
    socket.on('joinRoom', room_id => {
        room = room_id
        socket.join(room)
    })

    //// message
    socket.on('chat message', message => { //* döp om till new post
        const current_user = getCurrentUser(socket.id)
        const data = formatMessage(message, current_user)
        io.to(room).emit('chat message', data)
    })

    //// reply
    socket.on('reply message', reply_data => { //* döp om till new reply
        const current_user = getCurrentUser(socket.id)
        const data = {
            reply_data: formatMessage(reply_data.message, current_user),
            post_id: reply_data.post_id
        }
        console.log(data.reply_data);
        io.to(room).emit('reply message', data) //* lägg till koden från chat message?
    })

    //// Remove deleted post OR reply
    socket.on("delete msg", msg_id => {
        io.to(room).emit("delete msg", msg_id)
    })
    
    //// Remove deleted post OR reply
    socket.on("update msg", data => {
        io.to(room).emit("update msg", data)
    })

    //// New channel created
    socket.on('new channel', channel => {
        io.emit('new channel', channel)
    })

    socket.on('disconnect', () => {
        const current_user = getCurrentUser(socket.id)
        socket.broadcast.emit("offline", current_user)
        logoutUser(socket.id)
        // socket.removeAllListeners()
    })
})



const PORT = 3000 || process.env.PORT

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))