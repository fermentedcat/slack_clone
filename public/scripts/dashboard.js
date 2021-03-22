
socket.on('new channel', channel => { //* kolla om den här måste flyttas / göras om
    addNewChannel(channel)
})

socket.on('delete channel', channel_id => {
    const channel_li = document.getElementById(`channel_li_${channel_id}`)
    if (channel_li) {
        channel_li.remove()
    }
})

socket.on('new dm', dm => { 
    addDirectMessage(dm)
})


function createChannel() {
    const private = document.getElementById('private').checked
    

    const channel = {
                name: document.getElementById('channel_name').value,
                description: document.getElementById('channel_description').value,
                private: private
            }

    fetch(`/channels/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(channel)
    })
    .then(res => res.json())
    .then(channel => {
        if (!private) {
            socket.emit('new channel', channel)
        } 
        window.location.href = `/channels/${channel._id}`
    })
}

//// Start direct message with selected user(s)
function startDirectMessage() {
    const checkboxes = document.querySelectorAll('input[name="dm_user"]:checked')

    let invites = []
    checkboxes.forEach((checkbox) => {
        invites.push(checkbox.value)
    })

    fetch('/direct-messages/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({invites})
    })
    .then(res => res.json())
    .then(dm => {
        console.log(dm);
        socket.emit('new dm', dm)
        window.location.href = `/direct-messages/${dm._id}`
    })
}

//// Triggered by socket.io
function addNewChannel(channel) {
    const ul = document.getElementById('channels')
    const li = document.createElement('li')
    li.id = `channel_li_${channel._id}`
    li.innerHTML = `<a class="btn btn-secondary" href="/channels/${channel._id}">${channel.name}</a>`
    ul.appendChild(li)
}


//// Triggered by socket.io
function addDirectMessage(dm) {
    const current_user = document.getElementById('user_title').getAttribute('data-id')
    const ul = document.getElementById('direct_messages')
    const li = document.createElement('li')
    li.id = `dm_li_${dm._id}`
    const a = document.createElement('a')
    a.href = `/direct-messages/${dm._id}`
    a.className = "btn btn-secondary"
    li.appendChild(a)
    for (user of dm.subscribers) {
        if (user._id != current_user) {
            const span = document.createElement('span')
            span.className = "dm_username"
            span.innerHTML = user.username
            a.appendChild(span)
        }
    }
    ul.appendChild(li)
}