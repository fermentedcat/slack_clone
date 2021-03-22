//// DM AND CHANNEL MESSAGES
function getChatId() {
    const url = window.location.href
    const chat_id = url.split("/").pop()
    return chat_id
}

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
            <p>${post.author.username} <span>${post.date} ${post.time} </span></p>
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
    if (post.author._id == current_user._id) {
        const edit_button = document.createElement("button")
        edit_button.className = "btn btn-warning"
        edit_button.innerHTML = "Edit"
        edit_button.addEventListener("click", (e) => editPost(e, post._id))
        buttons_div.appendChild(edit_button)
    }
    if (post.author._id == current_user._id || current_user.role == "Admin") {
        const delete_button = document.createElement("button")
        delete_button.className = "btn btn-danger"
        delete_button.innerHTML = "Delete"
        delete_button.addEventListener("click", (e) => deletePost(e, post._id))
        buttons_div.appendChild(delete_button)
    }
    const replies_div = document.createElement('div')
    replies_div.className = "replies"
    replies_div.id = `replies_${post._id}`
    post_div.appendChild(buttons_div)
    post_div.appendChild(replies_div)
    post_div.appendChild(reply_button)
}
//* Add reply to DOM
function addReply(post_id, reply) {
    const replies_div = document.getElementById(`replies_${post_id}`)
    const reply_div = document.createElement('div')
    reply_div.id = `reply_${reply._id}`
    reply_div.className = "post_reply"
    reply_div.innerHTML = `
        <div class="post_reply">
            <p>${reply.author.username} <span>${reply.date} ${reply.time}</span></p>
            <h6 id="content_${reply._id}">${reply.content}</h6>
        </div>`
    const buttons_div = document.createElement('div') 
    buttons_div.id = `buttons_${reply._id}`
    reply_div.appendChild(buttons_div)
    //// Add edit and delete buttons if user permitted
    if (reply.author._id == current_user._id) {
        const edit_button = document.createElement("button")
        edit_button.className = "btn btn-warning"
        edit_button.innerHTML = "Edit"
        edit_button.addEventListener("click", (e) => toggleEditReply(post_id, reply._id))
        buttons_div.appendChild(edit_button)
    }
    if (reply.author._id == current_user._id || current_user.role == "Admin") {
        const delete_button = document.createElement("button")
        delete_button.className = "btn btn-danger"
        delete_button.innerHTML = "Delete"
        delete_button.addEventListener("click", () => deleteReply(post_id, reply._id))
        buttons_div.appendChild(delete_button)
    }
    replies_div.appendChild(reply_div)
}


//* Edit post
function editPost(e, post_id) {
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
        const location = getLocation()
        const chat_id = getChatId()
        const new_value = container.firstElementChild.value
        if (new_value.trim().length > 0) {
            const data = {
                new_value,
                chat_id,
                location
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

//* Send new message
function sendPost(chat_id) {
    console.log("Attempting to send message");
    const location = getLocation()
    const input = document.getElementById('msg')
    if (input.value.trim().length > 0) {            
        //// Add message to channel in db
        const content = input.value
        fetch(`/posts/add-to-channel/${chat_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({content, location})
        })
        .then(res => res.json())
        //* handle error?
        .then(message => {
            socket.emit('chat message', message)
        })
    }
    input.value = ''
}

//* SEND new reply
function sendReply(reply, post_id) {
    console.log("post_id" + post_id);
    const location = getLocation()
    const data = {
        chat_id: getChatId(),
        content: reply,
        location: location
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

//* Delete post
function deletePost(e, post_id) {
    const chat_id = getChatId()
    const location = getLocation()
    if (confirm("Are you sure you want to delete this message?")) {
        fetch(`/posts/delete/${post_id}`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({chat_id, location})
        })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            socket.emit("delete msg", post_id)
        }) 
    } 
}


//* Edit reply
function toggleEditReply(post_id, reply_id) {
    const buttons_div = document.getElementById(`buttons_${reply_id}`)
    console.log(buttons_div);
    buttons_div.style.display = "none"
    const reply_content = document.getElementById(`content_${reply_id}`)
    const value = reply_content.innerHTML
    const container = reply_content.parentNode
    const original_innerHTML = container.innerHTML
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
        const chat_id = getChatId()
        const new_value = container.firstElementChild.value
        if (new_value.trim().length > 0) {
            editReply(new_value, chat_id, post_id, reply_id)
        }
        restoreReply()
    })
    function restoreReply() {
        buttons_div.style.display = "unset"
        container.innerHTML = original_innerHTML
    }
}

//* Edit reply
function editReply(new_value, chat_id, post_id, reply_id) {
    const location = getLocation()
    const data = {
        new_value,
        chat_id,
        location
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

//* Delete reply
function deleteReply(post_id, reply_id) {
    const chat_id = getChatId()
    const location = getLocation()

    console.log(post_id + " " + reply_id);
    if (confirm("Are you sure you want to delete this message?")) {
        fetch(`/posts/${post_id}/delete-reply/${reply_id}`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({chat_id, location})
        })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            socket.emit("delete msg", reply_id)
        }) 
    }
}


//* Toggle reply input field on DOM
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
        const reply = reply_input.value

        if (reply.trim().length > 0) {
            sendReply(reply, post_id)
        }
        reply_input.value = ''
    })
}

