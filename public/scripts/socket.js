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
    const user_link = document.getElementById(`online_status_${user._id}`)
    user_link.classList.add('online') //* kolla om det håller
}) 

socket.on("offline", (offline_user) => { //! gör om och skickas för mycket
    const user_link = document.getElementById(`online_status_${offline_user._id}`)
    user_link.classList.remove('online') //* kolla om det håller
}) 
// end SIDEBAR //



//// Load new chat messages to DOM
socket.on('chat message', data => {
    const { post_data } = data //* det skickas för mycket
    addPost(post_data)
})

//// Load new replies to DOM
//! Skriv om (skicka ta emot mer)
socket.on('reply message', message => {
    const post = document.getElementById(`post_${message.post_id}`)

    const new_message = document.createElement('div')
    new_message.className = "post_reply"
    new_message.innerHTML = `
    <p>${message.author}<span>${message.published}</span></p>
    <p>${message.message}</p>
    `
    post.lastChild.prepend(new_message)
})



document.addEventListener('DOMContentLoaded', e => {
    console.log("hello this is socket js");

    //// check if inside channel
    const url = window.location.href
    var url_array = url.split("/")
    const path = url_array[url_array.length - 2]
    console.log(path);

    if (path == 'channels') {
        var channel_id = url_array.pop()
        console.log(channel_id) //*

        //// join user to current channel room
        socket.emit('joinRoom', { user_id, channel_id })

        //// Populate DOM with existing chat messages
        fetch (`/channels/api/${channel_id}`, {
            method: "GET"
        })
        .then(res => res.json())
        .then(data => {
            populateChat(data.post_data, data.current_user)
        })
        
        const form = document.getElementById("chat_form")
/*         const reply_btns = Array.from(document.querySelectorAll('.reply_btn'))
    
        room_id = form.elements.channel.value //* behövs inte?
        user_id = form.elements.user.value */
    
        //// Send message event
        form.addEventListener('submit', e => {
            e.preventDefault()
            sendMessage(channel_id) 
        })

       
    }
})

//!  CHANNEL FUNCTIONS  
//// Populate DOM with existing messages
function populateChat(post_data, current_user) {
        
    for (post of post_data) {
        const post_div = addPost(post, current_user) //* varför funkar det inte utan const....?

        for (reply of post.replies) { //* lägga till if-sats? if (post.replies)
            addReply(post._id, reply, current_user, post_div)
        }
    }
}
//// Add post to DOM
function addPost(post) {
    const messages_div = document.getElementById("messages")
    const post_div = document.createElement('div')
    post_div.id = `post_${post._id}`
    post_div.innerHTML = `
        <div>
            <p>${post.username} <span> ${post.time} </span></p>
            <h4>${post.content}</h4>
        </div>`
    messages_div.appendChild(post_div)

    const reply_button = document.createElement("button")
    reply_button.addEventListener("click", (e) => {
        toggleReply(e)
    })
    reply_button.className = "btn btn-primary reply_btn"
    reply_button.innerHTML = "Reply"
    post_div.appendChild(reply_button)
    
    //// Add edit and delete buttons if user permitted
    if (post.author == current_user._id) {
        console.log(`author: ${post.author}, current_id: ${current_user._id}`);
        const edit_button = document.createElement("button")
        edit_button.className = "btn btn-warning"
        edit_button.innerHTML = "Edit"
        edit_button.addEventListener("click", (e) => editPost(post._id, channel._id))
        post_div.appendChild(edit_button)
    }
    if (post.author == current_user._id || current_user.role == "Admin") {
        const delete_button = document.createElement("button")
        delete_button.className = "btn btn-danger"
        delete_button.innerHTML = "Delete"
        delete_button.addEventListener("click", (e) => deletePost(post._id, channel._id))
        post_div.appendChild(delete_button)
    }
    return post_div
}
//// Add reply to DOM
function addReply(post_id, reply, current_user, postdiv = "") { //! kolla att "" funkar
    const post_div = document.getElementById(`post_${post_id}`) || postdiv
    const reply_div = document.createElement('div')
    reply_div.className = "post_reply"
    reply_div.innerHTML = `
    <div class="post_reply">
    <p>${reply.username}<span>${reply.time}</span></p>
    <p>${reply.content}</p>
    </div>`
    //// Add edit and delete buttons if user permitted
    if (reply.author == current_user._id) {
        const edit_button = document.createElement("button")
        edit_button.className = "btn btn-warning"
        edit_button.innerHTML = "Edit"
        edit_button.addEventListener("click", (e) => editReply(reply._id, channel._id))
        reply_div.appendChild(edit_button)
    }
    if (reply.author == current_user._id || current_user.role == "Admin") {
        const delete_button = document.createElement("button")
        delete_button.className = "btn btn-danger"
        delete_button.innerHTML = "Delete"
        delete_button.addEventListener("click", (e) => deleteReply(reply._id, channel._id))
        reply_div.appendChild(delete_button)
    }
    post_div.appendChild(reply_div)
}

//// Edit post
function editPost(post_id, channel_id) {
    console.log("edit post");
}
//// Delete post
function deletePost(post_id, channel_id) {
    console.log("remove post");
}
//// Edit reply
function editReply(reply_id, channel_id) {
    console.log("edit reply");
}
//// Delete reply
function deleteReply(reply_id, channel_id) {
    console.log("remove reply");
}
function sendMessage(channel_id) {
    const input = document.getElementById('msg')
    if (input.value.trim().length > 0) {            
        //// Add message to channel in db
        const content = input.value
        fetch(`/channels/${channel_id}/add`, {
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
                >
            <button class="btn btn-primary">Send</button>
            <input type="hidden" value="${post_id}" id="post">
        `
        e.target.parentNode.appendChild(reply_form)

        console.log(`post_id 66: ${post_id}`); //! vad var detta

         // Handle reply message
         reply_form.addEventListener('submit', e => {
            e.preventDefault()
            const reply_input = reply_form.elements.reply_msg

            if (reply_input.value.trim().length > 0) {
                socket.emit('reply message', {message: reply_input.value, post_id: post_id})
                
                // Add message to channel in db
                const reply = {
                    author: user_id,
                    content: reply_input.value
                }
                fetch(`/channels/${room_id}/${post_id}/add`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reply)
                })
            }
            reply_input.value = ''
        })
}