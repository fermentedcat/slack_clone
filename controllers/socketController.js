const { loginUser,
        logoutUser,
        getCurrentUser,
        getSocketIdById } = require('../config/onlineStatus.js')
const { formatMessage }   = require('../config/format.js')

exports = module.exports = (io) => {
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
    
        //// Disconnect
        socket.on('disconnect', () => {
            const current_user = getCurrentUser(socket.id)
            socket.broadcast.emit("offline", current_user)
            logoutUser(socket.id)
        })
    
    
        // ========== Messages =========== //
        //// new message
        socket.on('chat message', message => { //* döp om till new post
            const current_user = getCurrentUser(socket.id)
            const data = formatMessage(message, current_user)
            io.to(room).emit('chat message', data)
        })
    
        //// new reply
        socket.on('reply message', new_data => { //* döp om till new reply
            const current_user = getCurrentUser(socket.id)
            const data = {
                reply_data: formatMessage(new_data.message, current_user),
                post_id: new_data.post_id
            }
            io.to(room).emit('reply message', data)
        })
    
        //// Remove deleted post OR reply
        socket.on("delete msg", msg_id => {
            io.to(room).emit("delete msg", msg_id)
        })
        
        //// Remove deleted post OR reply
        socket.on("update msg", data => {
            io.to(room).emit("update msg", data)
        })
    
    
        //======= channels /dms =======//
        //// New channel created
        socket.on('new channel', channel => {
            io.emit('new channel', channel)
        })
    
        //// New channel created
        socket.on('edit channel', channel => {
            io.to(room).emit('edit channel', channel)
        })
    
        //// New channel created
        socket.on('delete channel', channel_id => {
            io.emit('delete channel', channel_id)
        })
    
        //// New channel invite
        socket.on('new invite', (invitees) => {
            for (invitee of invitees) {
                const socket_id = getSocketIdById(invitee._id)
                //// if invited user is online
                if (socket_id) {
                    io.to(socket_id).emit('new invite', invitee);
                }
            }
        })
    
        //// Send new direct message room to user(s)
        socket.on('new dm', dm => {
            for (user of dm.subscribers) {
                const socket_id = getSocketIdById(user._id)
                //// if invited user is online and is not dm starter
                if (socket_id && socket_id != socket.id) {
                    io.to(socket_id).emit('new dm', (dm));
                }
            }
        })
    
    })
}