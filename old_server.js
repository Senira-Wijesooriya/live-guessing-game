const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the frontend files
app.use(express.static('public'));

// In-memory data storage (resets when server restarts)
let players = {};
let answers = [];
const ADMIN_PASSWORD = "admin"; // Change this!

io.on('connection', (socket) => {
    
    // Handle user login
    socket.on('join', (data) => {
        if (!data.isAdmin) {
            players[socket.id] = { username: data.username, score: 0 };
            io.emit('update_leaderboard', players);
        }
        socket.emit('update_answers', answers); // Send current answers to the new user
    });

    // Handle answer submission
    socket.on('submit_answer', (answer) => {
        if (players[socket.id]) {
            const time = new Date().toLocaleTimeString();
            answers.unshift({ 
                username: players[socket.id].username, 
                answer: answer, 
                time: time 
            });
            io.emit('update_answers', answers); // Broadcast to everyone
        }
    });

    // ADMIN ACTIONS
    socket.on('admin_add_point', (data) => {
        if (data.password === ADMIN_PASSWORD && players[data.playerId]) {
            players[data.playerId].score += 1;
            io.emit('update_leaderboard', players);
        }
    });

    socket.on('admin_clear', (data) => {
        if (data.password === ADMIN_PASSWORD) {
            answers = [];
            io.emit('update_answers', answers);
        }
    });

    // Handle disconnect
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