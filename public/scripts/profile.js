

function fetchUserData() {
    //// Check if current user's own profile
    if (document.getElementById("channel_invites") != undefined) {
    const image_btn = document.getElementById('image_btn')
    image_btn.addEventListener('click', e => {
        const div = document.createElement('div')
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

        fetch(`/users/current-user`, {
            method: "GET"
        })
        .then(res => res.json())
        .then(user => {
            for (invite of user.pending_invites) {
                displayInvites(invite)
            }
        })
    }
}


function displayInvites(invite) {
    const invite_div = document.getElementById("channel_invites")
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

function acceptInvite(invite) {
    const channel_id = invite.channel._id
    fetch(`/channels/add-subscriber/${channel_id}`, {
        method: "PUT"
    })
    .then(res => res.json())
    .then(data => {
        removeInvite(invite)
    })
}

function removeInvite(invite) {
    fetch(`/users/remove-channel-invite/${invite._id}`, {
        method: "DELETE"
    })
    .then(res => {})
    .then(() => {
        location.reload()
    })
}

function editUserInfo() {
    const username_input = document.getElementById('username')
    const data = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        username: username_input.value,
        phone: document.getElementById('phone').value,
        fav_pizza: document.getElementById('fav_pizza').value,
        occupation: document.getElementById('occupation').value,
    }
    //// Check if username is available
    fetch(`/users/username/${data.username}`, {
        method: "GET",
    })
    .then(res => res.json())
    .then(found_user => {
        if(found_user) {
            //// Display error
            username_input.classList.add("is-invalid")
            username_input.focus()
            const div = document.createElement('div')
            div.id = "usernameHelp"
            div.className = "form-text text-danger"
            div.innerHTML = "Username is already taken"
            username_input.after(div)
        } else {
            //// Update user
            fetch(`/users/edit`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(user => {
                window.location.href = `/users/${user._id}`
            })
        }
    })
}