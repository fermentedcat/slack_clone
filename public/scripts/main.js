const socket = io()

let current_user = {}

function getLocation() {
    var url_array = window.location.href.split("/")
    const path = url_array[url_array.length - 2]
    return path
}

document.addEventListener('DOMContentLoaded', e => {
    //// Check what kind of data to load
    const path = getLocation()
    if (path == 'channels') {
       fetchChannelData()
    } else if (path == 'direct-messages') {
        fetchDmData() 
    } else if (path == 'users') {
        fetchUserData()
        setProfilePic()
    }

    //// Fetch current user
    fetch('/users/current-user', {
        method: "GET"
    })
    .then(res => res.json())
    .then(user => {
        const nav_links = document.getElementById('nav-links')
        const li = document.createElement('li')
        li.innerHTML = `<a href="/users/${user._id}" class="btn btn-secondary">Profile</a>`
        nav_links.appendChild(li)

        if (user.role == 'Admin') {
            const li = document.createElement('li')
            li.innerHTML = `<a href="/admin" class="btn btn-secondary">Admin</a>`
            nav_links.appendChild(li)
        }
        current_user = user
        // store current user with socket id in server & emit to others
        socket.emit("online", user)
    })
})



//// SIDEBAR ////
//// Display new online status
socket.on("online", user => {
    if (user) {
        const user_status = document.getElementById(`online_status_${user._id}`)
        user_status.classList.add('online')
    }
}) 

socket.on("offline", (offline_user) => {
    if (offline_user) {
        const user_status = document.getElementById(`online_status_${offline_user._id}`)
        user_status.classList.remove('online')
    }
}) 



//// Load new chat messages to DOM
socket.on('chat message', data => {
    addPost(data)
})

//// Load new replies to DOM
socket.on('reply message', data => {
    addReply(data.post_id, data.reply_data)// byt plats?
})

//// Display new invite to user
socket.on('new invite', invite => {
    const path = getLocation()
    if (path == 'users') {
        displayInvites(invite.pending_invites.slice(-1)[0])
    }
    //* lägg till display på nått annant sätt i dashboard
})


socket.on('edit channel', channel => {
    const name = document.getElementById('channel_name')
    const description = document.getElementById('channel_desc')
    name.innerHTML = channel.name
    if (description) {
        description.innerHTML = channel.description
    } else {
        const desc = document.createElement('h5')
        desc.id = "channel_desc"
        desc.innerHTML = channel.description
    }
})


//// Update deleted post OR reply
socket.on("update msg", data => {
    const content = document.getElementById(`content_${data.msg_id}`)
    content.innerHTML = data.new_value
})


//// Remove deleted post OR reply
socket.on("delete msg", msg_id => {
    const msg_div = document.getElementById(`post_${msg_id}`) || document.getElementById(`reply_${msg_id}`)
    msg_div.remove()
})


//// Throw users out if channel gets deleted
socket.on('delete channel', channel_id => {
    if (channel_id == getChatId()) {
        window.location.href = '/dashboard'
    }
})