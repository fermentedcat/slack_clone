const express   = require('express')
const path      = require('path')
const http      = require('http')
const socketio  = require('socket.io')
const app       = express()
const server    = http.createServer(app)
const io        = socketio(server)
require('./controllers/socketController')(io)

const session    = require('express-session')
const passport   = require('passport')
const flash      = require('connect-flash')
const fileUpload = require('express-fileupload')
const expressEjsLayouts = require('express-ejs-layouts')

require('./config/passport')(passport)
require('dotenv').config()

app.use('/public', express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(expressEjsLayouts)
app.set('view engine', 'ejs')


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

//// fileupload
app.use(fileUpload({ 
    createParentPath: true,
    limits: {
        fileSize: 3 * 1024 * 1024
    },
    abortOnLimit: true, 
    limitHandler: function (req, res, next) {
        req.flash('error_msg', 'File size too large.')
        next()
    }
}))

//// DB connection
const mongoose = require('mongoose')
mongoose.connect(process.env.DB_URI, {
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});


//// routes
app.use('/users', require('./routes/usersRoute'))
app.use('/channels', require('./routes/channelsRoute'))
app.use('/posts', require('./routes/postsRoute'))
app.use('/direct-messages', require('./routes/directMessagesRoute'))
app.use('/', require('./routes/indexRoute'))
app.use('*', (req, res) => {
    req.flash('error_msg', 'Page not found')
    res.redirect('/dashboard')
})


const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))