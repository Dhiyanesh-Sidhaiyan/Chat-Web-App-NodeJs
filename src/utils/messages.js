const generateMessages = (message,text) => {
    return {
        message,
        text,
        "createdAT": new Date().getTime()
    }
}

const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        "createdAT": new Date().getTime()
    }
}

module.exports = {
    generateMessages,
    generateLocationMessage
}