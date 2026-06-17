const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {};
let answers = [];

// Your specific admin credentials
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin12#$";

io.on('connection', (socket) => {
    
    // 1. Handle Login & Authorization
    socket.on('join', (data) => {
        if (data.username === ADMIN_USER && data.password !== ADMIN_PASS) {
            // Tried to log in as admin but wrong password
            socket.emit('login_error', "Incorrect Admin Password!");
            return;
        }

        if (data.username !== ADMIN_USER) {
            // Normal player login
            players[socket.id] = { username: data.username, score: 0 };
            io.emit('update_leaderboard', players);
        }
        
        // Tell the client if they are officially the admin
        socket.emit('login_success', { isAdmin: data.username === ADMIN_USER });
        socket.emit('update_answers', answers); 
    });

    // 2. Handle Answers
    socket.on('submit_answer', (answer) => {
        if (players[socket.id]) {
            const time = new Date().toLocaleTimeString();
            answers.unshift({ username: players[socket.id].username, answer: answer, time: time });
            io.emit('update_answers', answers); 
        }
    });

    // 3. Handle ALL Admin Actions Securely
    socket.on('admin_action', (data) => {
        // Double check password on the server side
        if (data.password === ADMIN_PASS) {
            if (data.type === 'add_point' && players[data.playerId]) {
                players[data.playerId].score += 1;
                io.emit('update_leaderboard', players);
            }
            if (data.type === 'sub_point' && players[data.playerId]) {
                players[data.playerId].score -= 1;
                io.emit('update_leaderboard', players);
            }
            if (data.type === 'clear_answers') {
                answers = [];
                io.emit('update_answers', answers);
            }
        }
    });

    // 4. Handle Disconnect
    socket.on('disconnect', () => {
        if (players[socket.id]) {
            delete players[socket.id];
            io.emit('update_leaderboard', players);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});