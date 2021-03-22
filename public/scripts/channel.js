function fetchChannelData() {
    const channel_id = getChatId()

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
            sendPost(channel_id) 
        })
}

//// Edit channel
function editChannelInfo() {
    const channel_id = getChatId()
    const data = {
        name: document.getElementById('channel_name_input').value,
        description: document.getElementById('channel_descr_input').value,
        private: document.getElementById('private').checked,
    }
    fetch(`/channels/edit/${channel_id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(channel => {
        socket.emit('edit channel', channel)
        window.location.href = `/channels/${channel_id}`
    })
}

//// Delete channel
function deleteChannel() {
    if (confirm("Are you sure you want to delete this channel? The messages will be lost forever.")) {
    
        const channel_id = getChatId()
        //// Delete channel
        fetch(`/channels/delete/${channel_id}`, {
            method: "DELETE"
        })
        //// Delete channel invites from users
        fetch('/users/remove-pending-invites', {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({channel_id})
        })
        .then(res => res.json())
        .then(data => {
            socket.emit('delete channel', channel_id)
            window.location.href = '/dashboard'
        })
    }
}

//// Send invites to channel
function inviteUsersToChannel() {
    const channel_id = getChatId()
    const checkboxes = document.querySelectorAll('input[name="non_subscriber"]:checked')
    
    let invitee_ids = []
    checkboxes.forEach((checkbox) => {
        invitee_ids.push(checkbox.value)
    })
    
    fetch(`/users/invite-to-channel/${channel_id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(invitee_ids)
    })
    .then(res => res.json())
    .then(invitees => {
        socket.emit('new invite', invitees)
        location.reload()
    })
}