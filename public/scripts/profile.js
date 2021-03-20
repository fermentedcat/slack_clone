document.addEventListener('DOMContentLoaded', e => {
    const image_btn = document.getElementById('image_btn')
    image_btn.addEventListener('click', e => {
        const div = document.createElement('div')
        console.log(e);
        div.innerHTML = `
        <form 
            action="/users/upload-profile-pic" 
            method="post" 
            enctype="multipart/form-data">
                <input type="file" name="profile_pic">
                <input type="submit" value="Save">
        </form>
        `
        image_btn.parentNode.appendChild(div)
    })

    if (document.getElementById("channel_invites") != undefined) {
        fetch(`/users/current-user`, {
            method: "GET"
        })
        .then(res => res.json())
        .then(user => {
            displayInvites(user.pending_invites)
        })
    }
})

function displayInvites(pending_invites) {
    const invite_div = document.getElementById("channel_invites")
    for (invite of pending_invites) {
        const div = document.createElement('div')
        div.innerHTML = `
            <div>
                <p>Channel: ${invite.channel.name}</p>
                <p>Invited by: ${invite.invited_by.username}</p>
            </div>`

        const accept_button = document.createElement('button')
        accept_button.innerHTML = "Accept"
        accept_button.className = "btn btn-primary"

        const decline_button = document.createElement('button')
        decline_button.innerHTML = "Decline"
        decline_button.className = "btn btn-danger"

        div.appendChild(accept_button)
        div.appendChild(decline_button)
        invite_div.appendChild(div)

        accept_button.addEventListener("click", e => {
            acceptInvite(invite)
        })

        decline_button.addEventListener("click", e => {
            removeInvite(invite)
        })
    }
}

function acceptInvite(invite) {
    const channel_id = invite.channel._id
    fetch(`/channels/add-subscriber/${channel_id}`, {
        method: "PUT"
    })
    .then(res => res.json())
    .then(data => {
        console.log(data.message)
        removeInvite(invite)
    })
}

function removeInvite(invite) {
    fetch(`/users/remove-channel-invite/${invite._id}`, {
        method: "PUT"
    })
    .then(res => res.json())
    .then(data => {
        console.log(data.message)
        location.reload();
    })
}

function editUserInfo() {
    const data = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        username: document.getElementById('username').value,
        phone: document.getElementById('phone').value,
        fav_pizza: document.getElementById('fav_pizza').value,
        occupation: document.getElementById('occupation').value,
    }
    fetch(`/users/edit`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(user => {
        console.log(user);
        window.location.href = `/users/${user._id}`
    })
}