let room_id = ""
let user_id = ""


document.addEventListener('DOMContentLoaded', e => {
    const socket = io()

    const form = document.getElementById('chat_form')
    const input = document.getElementById('msg')
    const messages = document.getElementById('messages')
    const reply_btns = Array.from(document.querySelectorAll('.reply_btn'))

    room_id = form.elements.channel.value
    user_id = form.elements.user.value
    const time = "13.35"

    socket.emit('joinRoom', { user_id, room_id })

    form.addEventListener('submit', e => {
        e.preventDefault()

        if (input.value.trim().length > 0) {
            socket.emit('chat message', input.value)
            
            // Add message to channel in db
            const post = {
                author: user_id,
                content: input.value
            }
            fetch(`/channels/${room_id}/add`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(post)
            })
        }

        input.value = ''
    })

    // Load new chat messages to DOM
    socket.on('chat message', message => {
        const new_message = document.createElement('div')
        new_message.className = "post"
        new_message.innerHTML = `
        <p>${user_id}<span>${time}</span></p>
        <h4>${message}</h4>
        <button class="button btn-primary">Reply</button>
        `
        messages.appendChild(new_message)
    })

    // Load new replies to DOM
    socket.on('reply message', message => {
        const post = document.getElementById(message.post_id)

        const new_message = document.createElement('div')
        new_message.className = "post_reply"
        new_message.innerHTML = `
        <p>${user_id}<span>${time}</span></p>
        <p>${message.message}</p>
        `
        post.lastChild.prepend(new_message)
    })


    // Toggle reply input field on DOM
    for (reply_btn of reply_btns) {
        reply_btn.addEventListener("click", e => {
            const prev_reply_form = document.getElementById('reply_form')
            if (prev_reply_form) {
                prev_reply_form.remove()
            }
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


            // Handle reply message
            reply_form.addEventListener('submit', e => {
                e.preventDefault()
                const reply_input = reply_form.elements.reply_msg

                if (reply_input.value.trim().length > 0) {
                    socket.emit('reply message', {message: reply_input.value, post_id})
                    
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
        })

    }

    
})

const inviteUsersToChannel = () => {
    console.log('invite team mates!');
    const checkboxes = document.querySelectorAll('input[name="non_subscriber"]:checked')
    
    let invites = []
    checkboxes.forEach((checkbox) => {
        invites.push(checkbox.value)
    })

    fetch(`/users/invite-to-channel/${room_id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(invites)
    })
    .then(res => {})
    .then(data => {
        window.location.href = `/channels/${room_id}`
    })
}