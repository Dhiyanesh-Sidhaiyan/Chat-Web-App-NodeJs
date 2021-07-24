const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessages, generateLocationMessage } = require('../src/utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);  // explicity created server for socket
const io = socketio(server);

const port = process.env.PORT || 3000;


//directory path
const publicDirectoryPath = path.join(__dirname, '../public');

//setup for static folder to serve
app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log("A user is connected");

    socket.on('join', ({ username, room }, callback) => {

        let { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error)
        }
        socket.join(user.room);
        socket.emit('message', generateMessages("Admin", "Welcome")); // only emit for particular user
        socket.broadcast.to(user.room).emit('message', generateMessages("Admin", `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUsersInRoom(user.room)
        }); 
    
    });

    socket.on('sendMessage', (msg, callback) => {

        let { username = {}, id = {}, room = {} } = getUser(socket.id);

        if (!username || !room) {
            return callback("Ooops, Try later")
        }

        const filter = new Filter();
        if (filter.isProfane(msg)) {
            return callback("Profanity words are not allowed");
        }

        io.to(room).emit('message', generateMessages(username, msg));
        callback();
    });

    socket.on("sendLocation", (geo, callback) => {
        let user = getUser(socket.id);
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${geo.latitude},${geo.longitude}`));
        callback();
    });

    socket.on('disconnect', (sockt) => {

        let user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessages("Admin", `${user.username} has left.`));
            io.to(user.room).emit('roomData', {
                room : user.room,
                users : getUsersInRoom(user.room)
            });
        }

    });

});

server.listen(port, () => console.log("Server is up on port %s", port));