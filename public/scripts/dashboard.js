function createChannel() {

    const channel = {
                name: document.getElementById('channel_name').value,
                description: document.getElementById('channel_description').value,
            }
    console.log(channel);

    fetch(`/channels/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(channel)
    })
    .then(res => {})
    .then(data => {
        window.location.href = '/dashboard'
    })
}