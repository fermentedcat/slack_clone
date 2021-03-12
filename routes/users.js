const express = require('express')
const router = express.Router()

const User = require('../models/user')
const bcrypt = require('bcrypt')
const passport = require('passport')

router.post('/login', (req, res, next) => {
    console.log("log in");
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next)
})

router.get('/register', (req, res) => {
    res.render('register')
})

router.get('/login', (req, res) => {
    res.render('login')
})

router.post('/register', (req, res) => {
    let errors = []

    const {
        first_name,
        last_name,
        email,
        password,
        username
    } = req.body

    console.log(req.body)

    if (!first_name || !last_name || !email || !password) {
        errors.push({ message: 'Please fill out all fields.'})
    }
    if (password.length < 6) {
        errors.push({ message: 'Password needs to be at least 6 characters long.'})
    }

    if (errors.length > 0) {
        res.render('register', {
            errors, first_name, last_name, email, username
        })
    } else {
        const new_user = new User({
            first_name, last_name, email, username, password
        })

        bcrypt.hash(password, 10, function (error, hash) {
            if (error) {
                console.log(error)
            }
            new_user.password = hash

            new_user
                .save()
                .then(value => {
                    req.flash('success_msg', 'Registration succesful!')
                    res.redirect('/users/login')
                })
                .catch(error => console.log(error))
        })
    }
})

module.exports = router;