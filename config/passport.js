const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const User = require('../models/user')

module.exports = function (passport) {
    passport.use(new LocalStrategy(
        {
            usernameField: 'email'
        },
        function (username, password, done) {
            //// check for matches on username or email
            User.findOne({$or:[{ email: username }, {username: username}]}, function (error, user) {
                if (error) {
                    return done(error)
                }

                if (!user) {
                    return done(null, false)
                }

                bcrypt.compare(password, user.password, (error, isMatch) => {
                    if (error) {
                        throw error
                    }
                    if (isMatch) {
                        return done(null, user)
                    } else {
                        return done(null, false)
                    }
                })
            })
                .catch(error => console.log(error))
        }
    ))

    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    passport.deserializeUser((id, done) => {
        User.findById(id, (error, user) => {
            done(error, user)
        })
    })
}