
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
