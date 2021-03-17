const socket = io()

socket.on('new channel', channel => {
    addNewChannel(channel)
})

function createChannel() {
    const private = document.getElementById('private').checked
    

    const channel = {
                name: document.getElementById('channel_name').value,
                description: document.getElementById('channel_description').value,
                private: private
            }
    console.log(channel);

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
        window.location.href = '/dashboard'
    })
}

function addNewChannel(channel) {
    const ul = document.getElementById('channels')
    const li = document.createElement('li')
    li.innerHTML = `
    <a href="/channels/${channel._id}">${channel.name}</a>
    `
    ul.appendChild(li)
}