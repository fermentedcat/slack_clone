document.addEventListener('DOMContentLoaded', e => {
    const profile_pic = document.getElementById('profile_pic')
    const image_btn = document.getElementById('image_btn')
    const user_id = profile_pic.getAttribute('data-id')

    // Check for uploaded profile pic
    

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
})

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