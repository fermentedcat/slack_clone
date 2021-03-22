//// used by socket for new messages
function formatMessage(message, current_user) {
    console.log("message:");
    const date = new Date()
    console.log(date);
    const message_data = {
        _id: message._id,
        author: message.author,
        date: formatDate(date).date,
        time: formatDate(date).time,
        content: message.content
    }
    console.log(message_data);
    return message_data
}

function formatDate(date) {
    const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      }).replace(/ /g, ' ');
    const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})

    return { date: formattedDate, time: formattedTime }
}

module.exports = {
    formatMessage,
    formatDate
}