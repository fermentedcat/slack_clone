require('dotenv').config()

const express = require('express')
const app = express()

const path = require('path')
const expressEjsLayouts = require('express-ejs-layouts')


app.set('view engine', 'ejs')
app.use(expressEjsLayouts)
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: false }))



app.get('/users/login', (req, res) => {
    res.render('login')
})

app.get('/users/register', (req, res) => {
    res.render('register')
})

app.listen(3000)