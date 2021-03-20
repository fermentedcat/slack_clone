
fetch('/users/api/online-status', {
    method: "GET"
})
.then(res => res.json())
.then(users => {
    if (users.length > 0) {
        const user_list = document.getElementById('user_list')
        for (user of users) {
            const div = document.createElement('div')
            div.innerHTML = `
            <div id="online_status_${user._id}" class="online_status ${user.online ? "online" : ""}"></div>
            <a href="/users/${user._id}">${user.username}</a>`
            user_list.appendChild(div)
        }
    }
})
document.addEventListener("DOMContentLoaded", e => {
})