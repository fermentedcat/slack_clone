const express = require('express')
const router = express.Router()



const {ensureAuthenticated} = require('../config/auth.js')
const { renderDashboard } = require('../controllers/usersController')

////=== Index / dashboard ==== ////

// dashboard
//  index

//// Get all users, current user channels
router.get('/dashboard', ensureAuthenticated, renderDashboard)


////  Register
router.get('/register', (req, res) => {
    res.render('register', {layout: false})
})
////  Login
router.get('/login', (req, res) => {
    res.render('login', {layout: false})
})

//* TODO: make landing page
//// Redirect user to login or dashboard
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard')
    }
    res.redirect('/login')
})



module.exports = router