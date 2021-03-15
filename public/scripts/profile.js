document.addEventListener('DOMContentLoaded', e => {
    const profile_pic = document.getElementById('profile_pic')
    const image_btn = document.getElementById('profile_pic')
    const user_id = profile_pic.getAttribute('data-id')

    // Check for uploaded profile pic
    const fs = require('fs')
    let image = "/public/images/profile/default.png"
    const dir = `/public/images/profile/${user_id}`
    fs.readFile(dir, (err, file) => {
        if (file) {
            image = `/public/images/profile/${user_id}`
        }
    })

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
    })
})