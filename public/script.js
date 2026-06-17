const socket = io();

let currentUsername = "";
let adminPass = "";
let isUserAdmin = false; // We store this to know if we should draw the +1/-1 buttons

function login() {
    currentUsername = document.getElementById('username').value.trim();
    adminPass = document.getElementById('admin-pass').value;

    if (!currentUsername) return alert("Enter a username!");

    // Send login info to server
    socket.emit('join', { username: currentUsername, password: adminPass });
}

// If password is wrong
socket.on('login_error', (msg) => {
    alert(msg);
});

// If login is successful
socket.on('login_success', (data) => {
    isUserAdmin = data.isAdmin;
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    if (isUserAdmin) {
        document.getElementById('welcome-text').innerText = "Admin Dashboard";
        document.getElementById('admin-controls').style.display = 'block';
        document.getElementById('player-controls').style.display = 'none'; // Admin doesn't submit answers
    } else {
        document.getElementById('welcome-text').innerText = `Welcome, ${currentUsername}!`;
    }
});

function submitAnswer() {
    const input = document.getElementById('guess-input');
    const answer = input.value.trim();
    if (answer) {
        socket.emit('submit_answer', answer);
        input.value = '';
    }
}

// ADMIN FUNCTIONS
function clearAnswers() {
    socket.emit('admin_action', { type: 'clear_answers', password: adminPass });
}

function addPoint(playerId) {
    socket.emit('admin_action', { type: 'add_point', playerId: playerId, password: adminPass });
}

function subPoint(playerId) {
    socket.emit('admin_action', { type: 'sub_point', playerId: playerId, password: adminPass });
}

// LIVE UPDATES FROM SERVER
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
    
    // Draw the leaderboard. If user is admin, add the +1 and -1 buttons.
    board.innerHTML = Object.entries(players).map(([id, player]) => `
        <div class="player-score">
            <span>${player.username}: <strong>${player.score} pts</strong></span>
            ${isUserAdmin ? `
                <div class="admin-btns">
                    <button onclick="addPoint('${id}')" class="point-btn">+1</button>
                    <button onclick="subPoint('${id}')" class="danger-btn">-1</button>
                </div>
            ` : ''}
        </div>
    `).join('');
});