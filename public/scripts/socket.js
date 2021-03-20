const socket = io()
// import { addPost, addReply, populateChat } from "/public/scripts/dashboard.js" //* funkar inte med moduler..?

let current_user = {}

//// Fetch current user
fetch('/users/current-user', {
    method: "GET"
})
.then(res => res.json())
.then(user => {
    // store current user with socket id in server
    current_user = user
    socket.emit("online", user)
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
    addReply(data.post_id, data.reply_data)
})




document.addEventListener('DOMContentLoaded', e => {

    //* check if inside channel
    var url_array = window.location.href.split("/")
    const path = url_array[url_array.length - 2]

    if (path == 'channels') {
        const channel_id = getChannelId()

        //// join user to current channel room
        socket.emit('joinRoom', channel_id)

        //// Populate DOM with existing chat messages
        fetch (`/channels/api/${channel_id}`, {
            method: "GET"
        })
        .then(res => res.json())
        .then(data => {
            populateChat(data.post_data, data.current_user)
        })
        
        const form = document.getElementById("chat_form")
    
        //// Send message event
        form.addEventListener('submit', function(e) {
            e.preventDefault()
            console.log("Submitting message form");
            sendMessage(channel_id) 
        })

       
    }
})

//!  CHANNEL FUNCTIONS  
//// Populate DOM with existing messages
function populateChat(post_data) {
        
    for (post of post_data) {
        addPost(post) 

        for (reply of post.replies) { 
            addReply(post._id, reply)
        }
    }
}
//// Add post to DOM
function addPost(post) {
    const messages_div = document.getElementById("messages")
    const post_div = document.createElement('div')
    post_div.id = `post_${post._id}`
    post_div.setAttribute('data-id', post._id)
    post_div.className = "post"
    post_div.innerHTML = `
        <div>
            <p>${post.username} <span>${post.date} ${post.time} </span></p>
            <div>
                <h4 id="content_${post._id}">${post.content}</h4>
            </div>
        </div>`
    
    messages_div.appendChild(post_div)

    //// Buttons
    const buttons_div = document.createElement('div') 
    buttons_div.id = `buttons_${post._id}`
    // buttons_div.setAttribute('data-id', post._id) //* används den? flyttat till reply_btn

    const reply_button = document.createElement("button")
    reply_button.addEventListener("click", (e) => {
        toggleReply(e)
    })
    reply_button.className = "btn btn-primary reply_btn"
    reply_button.innerHTML = "Reply"
    
    //// Add edit and delete buttons if user permitted
    if (post.author == current_user._id) {
        console.log(`author: ${post.author}, current_id: ${current_user._id}`);
        const edit_button = document.createElement("button")
        edit_button.className = "btn btn-warning"
        edit_button.innerHTML = "Edit"
        edit_button.addEventListener("click", (e) => editPost(e, post._id))
        buttons_div.appendChild(edit_button)
    }
    if (post.author == current_user._id || current_user.role == "Admin") {
        const delete_button = document.createElement("button")
        delete_button.className = "btn btn-danger"
        delete_button.innerHTML = "Delete"
        delete_button.addEventListener("click", (e) => deletePost(e, post._id))
        buttons_div.appendChild(delete_button)
    }
    const replies_div = document.createElement('div')
    replies_div.id = `replies_${post._id}`
    post_div.appendChild(buttons_div)
    post_div.appendChild(replies_div)
    post_div.appendChild(reply_button)
}
//// Add reply to DOM
function addReply(post_id, reply) { //* skickar med för mycket
    const replies_div = document.getElementById(`replies_${post_id}`)
    const reply_div = document.createElement('div')
    reply_div.id = `reply_${reply._id}`
    reply_div.className = "post_reply"
    reply_div.innerHTML = `
        <div class="post_reply">
            <p>${reply.username} <span>${post.date} ${reply.time}</span></p>
            <h6 id="content_${reply._id}">${reply.content}</h6>
        </div>`
    const buttons_div = document.createElement('div') //* lägg in knappar här
    buttons_div.id = `buttons_${reply._id}`
    reply_div.appendChild(buttons_div)
    //// Add edit and delete buttons if user permitted
    if (reply.author == current_user._id) {
        const edit_button = document.createElement("button")
        edit_button.className = "btn btn-warning"
        edit_button.innerHTML = "Edit"
        edit_button.addEventListener("click", (e) => editReply(e, post_id, reply._id))
        buttons_div.appendChild(edit_button)
    }
    if (reply.author == current_user._id || current_user.role == "Admin") {
        const delete_button = document.createElement("button")
        delete_button.className = "btn btn-danger"
        delete_button.innerHTML = "Delete"
        delete_button.addEventListener("click", () => deleteReply(post_id, reply._id))
        buttons_div.appendChild(delete_button)
    }
    replies_div.appendChild(reply_div)
}
//* redundant once made into class
function getChannelId() {
    const url = window.location.href
    const channel_id = url.split("/").pop()
    return channel_id
}

//// Edit post
function editPost(e, post_id) {
    console.log(e.target.parentNode);
    const buttons_div = document.getElementById(`buttons_${post_id}`)
    buttons_div.style.display = "none"
    const post_content = document.getElementById(`content_${post_id}`)
    const value = post_content.innerHTML
    const container = post_content.parentNode
    container.innerHTML = `
        <input 
            placeholder="${value}"
            value="${value}"
            autocomplete="off"
            required
            autofocus
            >`
    const undo_button = document.createElement('button')
    undo_button.className = "btn btn-primary"
    undo_button.innerHTML = "Undo"
    const save_button = document.createElement('button')
    save_button.className = "btn btn-warning"
    save_button.innerHTML = "Save"
    container.appendChild(save_button)
    container.appendChild(undo_button)
    undo_button.addEventListener("click", e => {
        restorePost()
    })
    save_button.addEventListener("click", e => {
        const channel_id = getChannelId()
        const new_value = container.firstElementChild.value
        if (new_value.trim().length > 0) {
            const data = {
                new_value,
                channel_id
            }
            console.log(data);
            fetch(`/posts/edit/${post_id}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(data => {
                socket.emit("update msg", ({msg_id: post_id, new_value}))
            })
        }
        restorePost()
    })
    function restorePost() {
        buttons_div.style.display = "unset"
        container.innerHTML = `
        <h4 id="content_${post_id}">${value}</h4>
        `
    }
}
//// Update deleted post OR reply
socket.on("update msg", data => {
    const content = document.getElementById(`content_${data.msg_id}`)
    content.innerHTML = data.new_value
})

//// Delete post
function deletePost(e, post_id) {
    const channel_id = getChannelId()
    if (confirm("Are you sure you want to delete this message?")) {
        fetch(`/posts/delete/${post_id}`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({channel_id})
        })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            socket.emit("delete msg", post_id)
        }) 
    } 
}

//// Remove deleted post OR reply
socket.on("delete msg", msg_id => {
    const msg_div = document.getElementById(`post_${msg_id}`) || document.getElementById(`reply_${msg_id}`)
    msg_div.remove()
})

//// Edit reply
function editReply(post_id, reply_id) {
    const buttons_div = document.getElementById(`buttons_${reply_id}`)
    console.log(buttons_div);
    buttons_div.style.display = "none"
    const reply_content = document.getElementById(`content_${reply_id}`)
    const value = reply_content.innerHTML
    const container = reply_content.parentNode
    container.innerHTML = `
        <input 
            placeholder="${value}"
            value="${value}"
            autocomplete="off"
            required
            >`
    const undo_button = document.createElement('button')
    undo_button.className = "btn btn-primary"
    undo_button.innerHTML = "Undo"
    const save_button = document.createElement('button')
    save_button.className = "btn btn-warning"
    save_button.innerHTML = "Save"
    container.appendChild(save_button)
    container.appendChild(undo_button)
    undo_button.addEventListener("click", e => {
        restoreReply()
    })
    save_button.addEventListener("click", e => {
        const channel_id = getChannelId()
        const new_value = container.firstElementChild.value
        if (new_value.trim().length > 0) {
            const data = {
                new_value,
                channel_id
            }
            console.log(data);
            fetch(`/posts/${post_id}/edit-reply/${reply_id}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(data => {
                socket.emit("update msg", ({msg_id: reply_id, new_value}))
            })
        }
        restoreReply()
    })
    function restoreReply() {
        buttons_div.style.display = "unset"
        container.innerHTML = `
        <h6 id="content_${reply_id}">${value}</h6>
        `
    }
}
//// Delete reply
function deleteReply(post_id, reply_id) {
    const channel_id = getChannelId()
    console.log(post_id + " " + reply_id);
    if (confirm("Are you sure you want to delete this message?")) {
        fetch(`/posts/${post_id}/delete-reply/${reply_id}`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({channel_id})
        })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            socket.emit("delete msg", reply_id)
        }) 
    }
}
function sendMessage(channel_id) {
    console.log("Attempting to send message");
    const input = document.getElementById('msg')
    if (input.value.trim().length > 0) {            
        //// Add message to channel in db
        const content = input.value
        fetch(`/posts/add-to-channel/${channel_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({content})
        })
        .then(res => res.json())
        //* handle error?
        .then(message => {
            socket.emit('chat message', message)
        })
    }
    input.value = ''
}
/* module.exports = {
    editPost,
    deletePost,
    editReply,
    deleteReply
} */

//// Toggle reply input field on DOM
const toggleReply = (e) => {
    // Remove previous reply input
    const prev_reply_form = document.getElementById('reply_form')
        if (prev_reply_form) {
            prev_reply_form.previousSibling.style.display = "block"
            prev_reply_form.remove()
        }

        e = e || window.event
        e.target.style.display = "none"
        console.log(e.target.parentNode);
        const post_id = e.target.parentNode.getAttribute('data-id')

        const reply_form = document.createElement('form')
        reply_form.id = "reply_form"
        reply_form.innerHTML = `
            <input 
                type="text"
                id="reply_msg"
                placeholder="Reply"
                autocomplete="off"
                required
                autofocus
                >
            <button class="btn btn-primary">Send</button>
            <input type="hidden" value="${post_id}" id="post">
        `
        e.target.parentNode.appendChild(reply_form)

        //// Handle reply message
        reply_form.addEventListener('submit', e => {
        e.preventDefault()
        const reply_input = reply_form.elements.reply_msg
        console.log(reply_input);

        if (reply_input.value.trim().length > 0) {
            
            // Add reply to post in db
            const data = {
                channel_id: getChannelId(),
                content: reply_input.value
            }
            fetch(`/posts/${post_id}/add-reply`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(res => res.json())
            .then(data => {
                socket.emit('reply message', ({message: data, post_id: post_id}))
            })
        }
        reply_input.value = ''
    })
}