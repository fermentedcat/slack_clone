require('dotenv').config()

const express = require('express')
const app = express()
const router = express.Router()

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/slack_clone')
    .then(() => { console.log('connected to db')})
    .catch(error => console.log("error"))

const path = require('path')
const flash = require('connect-flash')
const session = require('express-session')
const expressEjsLayouts = require('express-ejs-layouts')
//// passport
const passport = require('passport')
require('./config/passport')(passport)




app.set('view engine', 'ejs')
app.use(expressEjsLayouts)
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())


//// SESSIONS
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
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


// routes
app.use('/users', require('./routes/users'))
app.use('/channels', require('./routes/channels'))
app.use('/', require('./routes/index'))






app.listen(3000)