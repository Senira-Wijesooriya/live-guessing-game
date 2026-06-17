const socket = io();

let currentUsername = "";
let isAdmin = false;
let adminPass = "";

// Show/Hide admin password field on login
document.getElementById('is-admin').addEventListener('change', function() {
    document.getElementById('admin-pass').style.display = this.checked ? 'block' : 'none';
});

function login() {
    currentUsername = document.getElementById('username').value.trim();
    isAdmin = document.getElementById('is-admin').checked;
    adminPass = document.getElementById('admin-pass').value;

    if (!currentUsername && !isAdmin) return alert("Enter a username!");

    socket.emit('join', { username: currentUsername, isAdmin: isAdmin });

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    if (isAdmin) {
        document.getElementById('welcome-text').innerText = "Admin Dashboard";
        document.getElementById('admin-controls').style.display = 'block';
        document.getElementById('player-controls').style.display = 'none'; // Admin doesn't play
    } else {
        document.getElementById('welcome-text').innerText = `Welcome, ${currentUsername}!`;
    }
}

function submitAnswer() {
    const input = document.getElementById('guess-input');
    const answer = input.value.trim();
    if (answer) {
        socket.emit('submit_answer', answer);
        input.value = ''; // Clear input after submit
    }
}

function clearAnswers() {
    socket.emit('admin_clear', { password: adminPass });
}

function addPoint(playerId) {
    socket.emit('admin_add_point', { playerId: playerId, password: adminPass });
}

// Listen for updates from server
socket.on('update_answers', (answers) => {
    const list = document.getElementById('answers-list');
    list.innerHTML = answers.map(a => 
        `<div class="answer-item">
            <strong>${a.username}</strong>: ${a.answer} <span class="time">[${a.time}]</span>
        </div>`
    ).join('');
});

socket.on('update_leaderboard', (players) => {
    const board = document.getElementById('leaderboard');
    board.innerHTML = Object.entries(players).map(([id, player]) => `
        <div class="player-score">
            <span>${player.username}: <strong>${player.score} pts</strong></span>
            ${isAdmin ? `<button onclick="addPoint('${id}')" class="point-btn">+1</button>` : ''}
        </div>
    `).join('');
});