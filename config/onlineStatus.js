let online_users = [];

// Push user to array of online users
function loginUser(current_user, socket_id) {
    const user = current_user
    user.socket_id = socket_id
    
    const index = online_users.findIndex(online_user => online_user._id === current_user._id)
    if (index == -1) { 
        online_users.push(user)
        return user
    } else {
        online_users[index] = user
        return user
    }
}

// Remove user from array of online user
function logoutUser(socket_id) {
    online_users = online_users.filter(user => user.socket_id != socket_id)
    return online_users
}
//* Get current user ?
function getCurrentUser(id) {
    const user = online_users.find(user => user.socket_id == id)
    return user
}

//// Get online users current socket id
function getSocketIdById(id) {
    const user = online_users.filter(user => user._id == id)[0]
    if (user) {
        return user.socket_id
    } else {
        return false
    }
}

function getOnlineUsers() {
    return online_users;
}

module.exports = {
    loginUser,
    logoutUser,
    getCurrentUser,
    getOnlineUsers,
    getSocketIdById
}