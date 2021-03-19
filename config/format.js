function formatMessage(message, current_user) {
    console.log("message:");
    console.log(message);
    const message_data = {
        _id: message._id,
        author: current_user._id,
        username: current_user.username,
        published: message.published,
        date: formatDate(message.published).date,
        time: formatDate(message.published).time,
        content: message.content
    }
    return message_data
}

function formatDate(date) {
    /* const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      }).replace(/ /g, ' ');
    const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})

    return { date: formattedDate, time: formattedTime } */
    return {time: Date.now(), date: Date.now()}
}

module.exports = {
    formatMessage,
    formatDate
}