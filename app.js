require('dotenv').config()

const express = require('express')
const app = express()
const router = express.Router()

const path = require('path')
const flash = require('connect-flash')
const session = require('express-session')
const expressEjsLayouts = require('express-ejs-layouts')
const passport = require('passport')
require('./config/passport')(passport)

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/slack_clone')
    .then(() => { console.log('connected to db')})
    .catch(error => console.log("error"))



app.set('view engine', 'ejs')
app.use(expressEjsLayouts)
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: false }))



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

app.get('/dashboard', (req, res) => {
    console.log("dashboard")
    res.render('dashboard')
})

app.get('/', (req, res) => {
    // kolla om inloggad (api token?), skicka till startsida eller login
    // res.render('dashboard')
    res.render('login')
})



app.listen(3000)