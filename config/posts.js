const { formatDate } = require('../config/format.js')

async function getPostData(channel) {
    try {
        let post_data = []
        for (let post of channel.posts) {
            try {
                // const username = await getUserName(post.author)
                const replies = await getReplyData(post.replies)
                formatDate(post.published)
                post_data.push({
                    _id: post.id,
                    author: post.author,
                    username: post.author.username,
                    date: formatDate(post.published).date,
                    time: formatDate(post.published).time,
                    content: post.content,
                    replies: replies
                })
            } catch (error) {
                console.log(error);
            }
        }
        return post_data
    } catch (error) {
        return post_data;
    }
}

async function getReplyData(replies) {
    try {
        let reply_data = []
        for (let reply of replies) {
            try {
                // const username = await getUserName(reply.author)
                reply_data.push({
                    _id: reply.id,
                    author: reply.author,
                    username: reply.author.username,
                    date: formatDate(reply.published).date,
                    time: formatDate(reply.published).time,
                    content: reply.content
                })
            } catch (error) {
                console.log(error);
            }
        }
        return reply_data
    } catch (error) {
        return reply_data;
    }
}

module.exports = {
    getPostData,
    getReplyData
}