 let gameState = {
    night: 1,
    time: 0,
    power: 100,
    maxPower: 100,
    leftDoorClosed: false,
    rightDoorClosed: false,
    gameRunning: false,
    gameLost: false,
    currentCamera: 0,
    nightsSurvived: 0
};

const animatronics = [
    { name: 'Freddy', emoji: '🤖', location: 0, aggression: 1, baseSpeed: 2, speed: 2 },
    { name: 'Bonnie', emoji: '🐰', location: 1, aggression: 1.5, baseSpeed: 2.5, speed: 2.5 },
    { name: 'Chica', emoji: '🐥', location: 2, aggression: 1.2, baseSpeed: 2, speed: 2 },
    { name: 'Foxy', emoji: '🦊', location: 3, aggression: 2, baseSpeed: 3, speed: 3 }
];

const locations = ['Dining Hall', 'Kitchen', 'West Hallway', 'East Hallway', 'Office'];

let gameLoop;

function showMenu(menuId) {
    document.querySelectorAll('.menu').forEach(m => m.classList.remove('active'));
    document.getElementById(menuId).classList.add('active');
}

function startGame() {
    gameState = {
        night: 1,
        time: 0,
        power: 100,
        maxPower: 100,
        leftDoorClosed: false,
        rightDoorClosed: false,
        gameRunning: true,
        gameLost: false,
        currentCamera: 0,
        nightsSurvived: 0
    };

    animatronics.forEach((anim, i) => {
        anim.location = i;
        anim.speed = anim.baseSpeed + (gameState.night * 0.3);
    });

    document.querySelectorAll('.menu').forEach(m => m.classList.remove('active'));
    document.getElementById('gameScreen').classList.add('active');

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(updateGame, 100);

    updateUI();
}

function showInstructions() {
    showMenu('instructionsMenu');
}

function backToMenu() {
    showMenu('mainMenu');
}

function returnToMenu() {
    if (gameLoop) clearInterval(gameLoop);
    showMenu('mainMenu');
}

function switchCamera(camIndex) {
    gameState.currentCamera = camIndex;
    document.querySelectorAll('.cam-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    updateCameraDisplay();
    usePower(0.5);
}

function toggleDoor(side) {
    if (!gameState.gameRunning || gameState.gameLost) return;

    let cost = gameState[side + 'DoorClosed'] ? 1 : 2;

    if (gameState.power >= cost) {
        gameState[side + 'DoorClosed'] = !gameState[side + 'DoorClosed'];
        usePower(cost);
        updateDoorDisplay();
    }
}

function updateGame() {
    if (!gameState.gameRunning || gameState.gameLost) return;

    gameState.time += 6;

    if (gameState.time >= 480) {
        nightComplete();
        return;
    }

    if (!gameState.leftDoorClosed && !gameState.rightDoorClosed) {
        gameState.power = Math.min(gameState.power + 0.1, gameState.maxPower);
    }

    updateAnimatronics();
    checkGameOver();
    updateUI();
    updateCameraDisplay();
}

function updateAnimatronics() {
    animatronics.forEach((anim, index) => {
        let timeMultiplier = gameState.time / 480;
        anim.speed = anim.baseSpeed + (gameState.night * 0.3) + (timeMultiplier * anim.aggression);

        if (Math.random() < anim.speed * 0.02) {
            if (anim.location < 4) {
                anim.location += 1;
            } else {
                let canEnter = true;

                if (anim.location === 2 && gameState.leftDoorClosed) {
                    canEnter = false;
                    anim.location = 2;
                }
                if (anim.location === 3 && gameState.rightDoorClosed) {
                    canEnter = false;
                    anim.location = 3;
                }

                if (canEnter && anim.location === 4) {
                    endGame(false, anim.name);
                }
            }
        }

        if (Math.random() < 0.01) {
            anim.location = Math.max(0, anim.location - 1);
        }
    });
}

function checkGameOver() {
    animatronics.forEach(anim => {
        if (anim.location === 4) {
            endGame(false, anim.name);
        }
    });
}

function usePower(amount) {
    gameState.power = Math.max(0, gameState.power - amount);

    if (gameState.power === 0) {
        endGame(false, 'Power Failure');
    }
}

function nightComplete() {
    gameState.nightsSurvived++;
    gameState.night++;

    if (gameState.night > 5) {
        endGame(true);
    } else {
        gameState.time = 0;
        gameState.power = 100;
        gameState.leftDoorClosed = false;
        gameState.rightDoorClosed = false;

        animatronics.forEach((anim, i) => {
            anim.location = i;
            anim.speed = anim.baseSpeed + (gameState.night * 0.3);
        });

        updateUI();
    }
}

function endGame(won, reason = '') {
    gameState.gameRunning = false;
    gameState.gameLost = !won;

    if (gameLoop) clearInterval(gameLoop);

    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const gameOverStats = document.getElementById('gameOverStats');

    if (won) {
        gameOverTitle.textContent = '🎉 YOU SURVIVED! 🎉';
        gameOverTitle.style.color = '#00ff00';
        gameOverMessage.textContent = 'You made it through all 5 nights!';
    } else {
        gameOverTitle.textContent = '💀 GAME OVER 💀';
        gameOverTitle.style.color = '#ff0000';
        gameOverMessage.textContent = `You were caught by ${reason}!`;
    }

    gameOverStats.innerHTML = `
        <p><strong>Nights Survived:</strong> ${gameState.nightsSurvived}/5</p>
        <p><strong>Time Reached:</strong> ${formatTime(gameState.time)}</p>
    `;

    document.getElementById('gameScreen').classList.remove('active');
    showMenu('gameOver');
}

function updateUI() {
    document.getElementById('nightDisplay').textContent = gameState.night;
    document.getElementById('timeDisplay').textContent = formatTime(gameState.time);

    const powerPercent = Math.round((gameState.power / gameState.maxPower) * 100);
    document.getElementById('powerDisplay').textContent = powerPercent + '%';

    const powerBar = document.getElementById('powerBar');
    powerBar.style.width = powerPercent + '%';

    if (powerPercent < 30) {
        powerBar.classList.add('low');
    } else {
        powerBar.classList.remove('low');
    }

    updateDoorDisplay();
    updateAnimatronicStatus();
}

function updateDoorDisplay() {
    const leftBtn = document.getElementById('leftDoorBtn');
    const leftStatus = document.getElementById('leftDoorStatus');
    const rightBtn = document.getElementById('rightDoorBtn');
    const rightStatus = document.getElementById('rightDoorStatus');

    if (gameState.leftDoorClosed) {
        leftBtn.classList.add('closed');
        leftStatus.textContent = '🔒 LOCKED';
    } else {
        leftBtn.classList.remove('closed');
        leftStatus.textContent = '🔓 OPEN';
    }

    if (gameState.rightDoorClosed) {
        rightBtn.classList.add('closed');
        rightStatus.textContent = '🔒 LOCKED';
    } else {
        rightBtn.classList.remove('closed');
        rightStatus.textContent = '🔓 OPEN';
    }
}

function updateAnimatronicStatus() {
    const list = document.getElementById('animatronicsList');
    list.innerHTML = '';

    animatronics.forEach(anim => {
        const item = document.createElement('div');
        item.className = 'animatronic-item';

        if (anim.location === 4) {
            item.classList.add('active');
            item.innerHTML = `<strong>${anim.emoji} ${anim.name}</strong><br>⚠️ IN OFFICE!`;
        } else {
            item.innerHTML = `<strong>${anim.emoji} ${anim.name}</strong><br>📍 ${locations[anim.location]}`;
        }

        list.appendChild(item);
    });
}

function updateCameraDisplay() {
    const anim = animatronics[gameState.currentCamera];
    const display = document.getElementById('animatronicDisplay');

    if (anim.location === gameState.currentCamera) {
        display.textContent = anim.emoji;
    } else {
        display.textContent = '[ EMPTY ]';
    }
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
}
