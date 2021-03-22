

function fetchDmData() {
    const dm_id = getChatId()

        //// join user to current channel room
        socket.emit('joinRoom', dm_id)

        //// Populate DOM with existing chat messages
        fetch (`/direct-messages/api/${dm_id}`, {
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
            sendPost(dm_id) 
        })
}
