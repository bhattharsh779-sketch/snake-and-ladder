"use strict";

/* =========================================================
   SNAKE & LADDER
   Pure HTML + CSS + JavaScript
========================================================= */


/* =========================================================
   DOM ELEMENTS
========================================================= */

const board = document.getElementById("gameBoard");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

const modeButtons = document.querySelectorAll(".mode-button");

const rollButton = document.getElementById("rollButton");
const rollText = document.getElementById("rollText");

const newGameButton = document.getElementById("newGameButton");
const playAgainButton = document.getElementById("playAgainButton");

const dice = document.getElementById("dice");
const diceValue = document.getElementById("diceValue");
const diceLabel = document.getElementById("diceLabel");

const turnText = document.getElementById("turnText");

const player1Card = document.getElementById("player1Card");
const player2Card = document.getElementById("player2Card");

const player1Name = document.getElementById("player1Name");
const player2Name = document.getElementById("player2Name");

const player1Position = document.getElementById("player1Position");
const player2Position = document.getElementById("player2Position");

const gameStatus = document.getElementById("gameStatus");

const boardMessage = document.getElementById("boardMessage");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");

const confettiContainer =
    document.getElementById("confettiContainer");


/* =========================================================
   GAME CONFIGURATION
========================================================= */

const GAME_MODE = {
    COMPUTER: "computer",
    LOCAL: "local"
};

let gameMode = GAME_MODE.COMPUTER;


/* =========================================================
   SNAKES
========================================================= */

const snakes = {
    98: 78,
    95: 75,
    92: 88,
    89: 68,
    74: 53,
    64: 44,
    62: 22,
    48: 26,
    49: 11,
    16: 6
};


/* =========================================================
   LADDERS
========================================================= */

const ladders = {
    2: 38,
    7: 14,
    8: 31,
    15: 26,
    21: 42,
    28: 84,
    36: 44,
    51: 67,
    71: 91,
    78: 98
};


/* =========================================================
   GAME STATE
========================================================= */

let players = [
    {
        id: 1,
        name: "You",
        position: 1,
        token: null
    },
    {
        id: 2,
        name: "Computer",
        position: 1,
        token: null
    }
];

let currentPlayer = 0;

let gameOver = false;
let isRolling = false;


/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;


/**
 * Creates the audio context after the user interacts
 * with the page.
 */
function initAudio() {

    if (!audioContext) {
        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (AudioContext) {
            audioContext = new AudioContext();
        }
    }

    if (
        audioContext &&
        audioContext.state === "suspended"
    ) {
        audioContext.resume();
    }
}


/**
 * Small synthesized sound.
 */
function playSound(
    frequency = 440,
    duration = 0.08,
    type = "sine",
    volume = 0.04
) {

    if (!audioContext) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = type;

    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + duration
    );
}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const savedTheme =
        localStorage.getItem("snakeLadderTheme");

    if (savedTheme === "dark") {

        document.documentElement
            .setAttribute("data-theme", "dark");

        themeIcon.textContent = "☀️";
        themeText.textContent = "Light";

    } else {

        document.documentElement
            .removeAttribute("data-theme");

        themeIcon.textContent = "🌙";
        themeText.textContent = "Dark";
    }
}


function toggleTheme() {

    initAudio();

    const isDark =
        document.documentElement
            .getAttribute("data-theme") === "dark";

    if (isDark) {

        document.documentElement
            .removeAttribute("data-theme");

        themeIcon.textContent = "🌙";
        themeText.textContent = "Dark";

        localStorage.setItem(
            "snakeLadderTheme",
            "light"
        );

    } else {

        document.documentElement
            .setAttribute("data-theme", "dark");

        themeIcon.textContent = "☀️";
        themeText.textContent = "Light";

        localStorage.setItem(
            "snakeLadderTheme",
            "dark"
        );
    }

    playSound(620, 0.08, "sine", 0.03);
}


/* =========================================================
   BOARD CREATION
========================================================= */

/**
 * Converts a normal board number into
 * the visual row/column position.
 *
 * Snake & Ladder boards alternate direction
 * on every row.
 */
function getCellCoordinates(position) {

    const zeroBased = position - 1;

    const rowFromBottom =
        Math.floor(zeroBased / 10);

    const positionInRow =
        zeroBased % 10;

    let column;

    if (rowFromBottom % 2 === 0) {
        column = positionInRow;
    } else {
        column = 9 - positionInRow;
    }

    const row =
        9 - rowFromBottom;

    return {
        row,
        column
    };
}


/**
 * Creates all 100 cells.
 */
function createBoard() {
    board.innerHTML = "";

    /*
     * Create the board visually from TOP (100) to BOTTOM (1).
     *
     * Snake & Ladder numbering:
     *
     * 100 99 98 97 96 95 94 93 92 91
     * 81  82 83 84 85 86 87 88 89 90
     * 80  79 78 77 76 75 74 73 72 71
     * 61  62 63 64 65 66 67 68 69 70
     * 60  59 58 57 56 55 54 53 52 51
     * 41  42 43 44 45 46 47 48 49 50
     * 40  39 38 37 36 35 34 33 32 31
     * 21  22 23 24 25 26 27 28 29 30
     * 20  19 18 17 16 15 14 13 12 11
     * 1   2  3  4  5  6  7  8  9  10
     */

    for (let row = 9; row >= 0; row--) {

        const rowStart = row * 10 + 1;
        const rowEnd = rowStart + 9;

        /*
         * Bottom row (1-10) goes left → right.
         * Next row (11-20) goes right → left.
         * This alternates for every row.
         */
        const numbers = [];

        if (row % 2 === 0) {

            // Left → Right
            for (
                let number = rowStart;
                number <= rowEnd;
                number++
            ) {
                numbers.push(number);
            }

        } else {

            // Right → Left
            for (
                let number = rowEnd;
                number >= rowStart;
                number--
            ) {
                numbers.push(number);
            }
        }

        numbers.forEach(position => {

            const cell =
                document.createElement("div");

            cell.className = "cell";

            cell.dataset.position = position;

            const number =
                document.createElement("span");

            number.className = "cell-number";

            number.textContent = position;

            cell.appendChild(number);


            /* Ladder */
            if (
                Object.prototype.hasOwnProperty.call(
                    ladders,
                    position
                )
            ) {

                cell.classList.add(
                    "ladder-start"
                );

                const marker =
                    document.createElement("span");

                marker.className =
                    "special-marker";

                marker.textContent = "🪜";

                marker.title =
                    `Ladder to ${ladders[position]}`;

                cell.appendChild(marker);
            }


            /* Snake */
            if (
                Object.prototype.hasOwnProperty.call(
                    snakes,
                    position
                )
            ) {

                cell.classList.add(
                    "snake-start"
                );

                const marker =
                    document.createElement("span");

                marker.className =
                    "special-marker";

                marker.textContent = "🐍";

                marker.title =
                    `Snake to ${snakes[position]}`;

                cell.appendChild(marker);
            }


            board.appendChild(cell);
        });
    }


    /*
     * Tokens are created after all 100 cells.
     * Movement logic remains unchanged.
     */
    createPlayerTokens();

    updateTokens();
}


/* =========================================================
   PLAYER TOKENS
========================================================= */

function createPlayerTokens() {

    players.forEach((player, index) => {

        const token =
            document.createElement("div");

        token.className =
            `player-token ${
                index === 0
                    ? "player-one-token"
                    : "player-two-token"
            }`;

        token.textContent =
            index === 0 ? "1" : "2";

        token.title =
            player.name;

        player.token = token;

        board.appendChild(token);
    });
}


/**
 * Moves a token to a board cell.
 */
function updateToken(playerIndex) {

    const player =
        players[playerIndex];

    const coordinates =
        getCellCoordinates(player.position);

    /*
     * CSS grid uses percentage positioning.
     */
    const left =
        ((coordinates.column + 0.5) * 10);

    const top =
        ((coordinates.row + 0.58) * 10);

    player.token.style.left =
        `${left}%`;

    player.token.style.top =
        `${top}%`;

    /*
     * If both players are on the same cell,
     * offset them slightly.
     */
    const otherIndex =
        playerIndex === 0 ? 1 : 0;

    if (
        players[otherIndex].position ===
        player.position
    ) {

        if (playerIndex === 0) {
            player.token.style.transform =
                "translate(-68%, -50%)";
        } else {
            player.token.style.transform =
                "translate(-32%, -50%)";
        }

    } else {

        player.token.style.transform =
            "translate(-50%, -50%)";
    }
}


function updateTokens() {

    updateToken(0);
    updateToken(1);
}


/* =========================================================
   PLAYER UI
========================================================= */

function updatePlayerUI() {

    player1Position.textContent =
        `Position: ${players[0].position}`;

    player2Position.textContent =
        `Position: ${players[1].position}`;

    player1Card.classList.toggle(
        "active",
        currentPlayer === 0 &&
        !gameOver
    );

    player2Card.classList.toggle(
        "active",
        currentPlayer === 1 &&
        !gameOver
    );

    if (!gameOver) {

        turnText.textContent =
            currentPlayer === 0
                ? "Your Turn"
                : `${players[1].name}'s Turn`;
    }
}


/* =========================================================
   MODE
========================================================= */

function setGameMode(mode) {

    gameMode = mode;

    modeButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.mode === mode
        );
    });

    if (mode === GAME_MODE.COMPUTER) {

        players[0].name = "You";
        players[1].name = "Computer";

        player1Name.textContent = "You";
        player2Name.textContent = "Computer";

    } else {

        players[0].name = "Player 1";
        players[1].name = "Player 2";

        player1Name.textContent = "Player 1";
        player2Name.textContent = "Player 2";
    }

    resetGame();
}


/* =========================================================
   RANDOM DICE
========================================================= */

function rollDiceValue() {

    return Math.floor(
        Math.random() * 6
    ) + 1;
}


/* =========================================================
   DICE DISPLAY
========================================================= */

function setDice(value) {

    dice.dataset.value = value;

    diceValue.textContent = value;
}


/* =========================================================
   DICE ANIMATION
========================================================= */

function animateDice(finalValue) {

    return new Promise(resolve => {

        dice.classList.remove("rolling");

        /*
         * Force browser reflow so animation
         * can be restarted every time.
         */
        void dice.offsetWidth;

        dice.classList.add("rolling");

        let count = 0;

        const interval =
            setInterval(() => {

                const temporaryValue =
                    rollDiceValue();

                setDice(temporaryValue);

                playSound(
                    220 + temporaryValue * 40,
                    0.04,
                    "square",
                    0.015
                );

                count++;

                if (count >= 8) {

                    clearInterval(interval);

                    setDice(finalValue);

                    dice.classList.remove(
                        "rolling"
                    );

                    playSound(
                        650,
                        0.12,
                        "sine",
                        0.04
                    );

                    resolve();
                }

            }, 85);
    });
}


/* =========================================================
   MOVEMENT
========================================================= */

function sleep(ms) {

    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}


/**
 * Moves a player one square at a time.
 */
async function movePlayer(
    playerIndex,
    amount
) {

    const player =
        players[playerIndex];

    for (
        let step = 0;
        step < amount;
        step++
    ) {

        /*
         * Exact 100 rule:
         * If moving further than 100,
         * don't move.
         */
        if (player.position >= 100) {
            break;
        }

        player.position++;

        updateToken(playerIndex);
        updatePlayerUI();

        player.token.classList.add("moving");

        playSound(
            300 + player.position * 2,
            0.045,
            "triangle",
            0.025
        );

        await sleep(180);

        player.token.classList.remove(
            "moving"
        );
    }
}


/* =========================================================
   SNAKE / LADDER
========================================================= */

async function checkSnakeOrLadder(
    playerIndex
) {

    const player =
        players[playerIndex];

    const currentPosition =
        player.position;


    /* Ladder */
    if (
        Object.prototype.hasOwnProperty.call(
            ladders,
            currentPosition
        )
    ) {

        const destination =
            ladders[currentPosition];

        diceLabel.textContent =
            "🪜 Ladder!";

        playSound(
            700,
            0.12,
            "sine",
            0.04
        );

        await sleep(450);

        player.position =
            destination;

        updateToken(playerIndex);
        updatePlayerUI();

        player.token.classList.add(
            "moving"
        );

        await sleep(350);

        player.token.classList.remove(
            "moving"
        );

        playSound(
            900,
            0.18,
            "sine",
            0.05
        );

        return;
    }


    /* Snake */
    if (
        Object.prototype.hasOwnProperty.call(
            snakes,
            currentPosition
        )
    ) {

        const destination =
            snakes[currentPosition];

        diceLabel.textContent =
            "🐍 Snake!";

        playSound(
            180,
            0.18,
            "sawtooth",
            0.035
        );

        await sleep(450);

        player.position =
            destination;

        updateToken(playerIndex);
        updatePlayerUI();

        player.token.classList.add(
            "moving"
        );

        await sleep(350);

        player.token.classList.remove(
            "moving"
        );

        playSound(
            130,
            0.15,
            "sawtooth",
            0.03
        );
    }
}


/* =========================================================
   WIN CHECK
========================================================= */

function checkWin(playerIndex) {

    const player =
        players[playerIndex];

    if (player.position !== 100) {
        return false;
    }

    gameOver = true;

    gameStatus.textContent =
        "Finished";

    rollButton.disabled = true;

    if (gameMode === GAME_MODE.COMPUTER) {

        if (playerIndex === 0) {

            messageTitle.textContent =
                "🎉 You Win!";

            messageText.textContent =
                "Amazing! You reached 100 before the computer.";

        } else {

            messageTitle.textContent =
                "🤖 Computer Wins!";

            messageText.textContent =
                "The computer reached 100 first. Try again!";
        }

    } else {

        messageTitle.textContent =
            `🎉 ${player.name} Wins!`;

        messageText.textContent =
            `${player.name} reached 100 first!`;
    }

    boardMessage.classList.remove(
        "hidden"
    );

    turnText.textContent =
        `${player.name} Wins!`;

    updatePlayerUI();

    playWinSound();

    createConfetti();

    return true;
}


/* =========================================================
   WIN SOUND
========================================================= */

async function playWinSound() {

    if (!audioContext) {
        return;
    }

    const notes = [
        523,
        659,
        784,
        1046
    ];

    for (const note of notes) {

        playSound(
            note,
            0.16,
            "sine",
            0.055
        );

        await sleep(130);
    }
}


/* =========================================================
   CONFETTI
========================================================= */

function createConfetti() {

    confettiContainer.innerHTML = "";

    const pieces = 100;

    for (
        let i = 0;
        i < pieces;
        i++
    ) {

        const piece =
            document.createElement("span");

        piece.className = "confetti";

        piece.style.left =
            `${Math.random() * 100}%`;

        piece.style.animationDuration =
            `${2.5 + Math.random() * 2.5}s`;

        piece.style.animationDelay =
            `${Math.random() * 0.6}s`;

        piece.style.transform =
            `rotate(${Math.random() * 360}deg)`;

        /*
         * Browser default color is used here
         * through randomly selected CSS hues.
         */
        piece.style.background =
            `hsl(${Math.random() * 360}, 85%, 60%)`;

        piece.style.width =
            `${6 + Math.random() * 6}px`;

        piece.style.height =
            `${8 + Math.random() * 10}px`;

        confettiContainer.appendChild(
            piece
        );
    }

    setTimeout(() => {

        confettiContainer.innerHTML = "";

    }, 6000);
}


/* =========================================================
   MAIN TURN
========================================================= */

async function playTurn() {

    if (
        gameOver ||
        isRolling
    ) {
        return;
    }

    /*
     * Computer turns should not be manually
     * triggered.
     */
    if (
        gameMode === GAME_MODE.COMPUTER &&
        currentPlayer === 1
    ) {
        return;
    }

    initAudio();

    isRolling = true;

    rollButton.disabled = true;

    rollText.textContent =
        "Rolling...";

    diceLabel.textContent =
        "Rolling dice...";


    const playerIndex =
        currentPlayer;


    const result =
        rollDiceValue();


    await animateDice(result);


    diceLabel.textContent =
        `${players[playerIndex].name} rolled`;


    await sleep(250);


    const currentPosition =
        players[playerIndex].position;


    /*
     * Exact 100 rule.
     */
    if (
        currentPosition + result <= 100
    ) {

        await movePlayer(
            playerIndex,
            result
        );

    } else {

        diceLabel.textContent =
            "Need exact number";

        await sleep(700);
    }


    /*
     * Snake / ladder.
     */
    if (
        players[playerIndex].position <
        100
    ) {

        await checkSnakeOrLadder(
            playerIndex
        );
    }


    /*
     * Win.
     */
    if (
        checkWin(playerIndex)
    ) {

        isRolling = false;

        return;
    }


    /*
     * Switch player.
     */
    currentPlayer =
        currentPlayer === 0 ? 1 : 0;

    updatePlayerUI();


    isRolling = false;

    rollButton.disabled = false;

    rollText.textContent =
        "Roll Dice";


    /*
     * Computer automatically plays.
     */
    if (
        gameMode === GAME_MODE.COMPUTER &&
        currentPlayer === 1 &&
        !gameOver
    ) {

        await sleep(850);

        await computerTurn();
    }
}


/* =========================================================
   COMPUTER TURN
========================================================= */

async function computerTurn() {

    if (
        gameOver ||
        isRolling ||
        currentPlayer !== 1
    ) {
        return;
    }

    isRolling = true;

    rollButton.disabled = true;

    rollText.textContent =
        "Computer is thinking...";

    turnText.textContent =
        "Computer is thinking...";

    diceLabel.textContent =
        "Computer is rolling";


    await sleep(
        500 + Math.random() * 600
    );


    const result =
        rollDiceValue();


    await animateDice(result);


    diceLabel.textContent =
        "Computer rolled";


    await sleep(250);


    const playerIndex = 1;

    const currentPosition =
        players[playerIndex].position;


    if (
        currentPosition + result <= 100
    ) {

        await movePlayer(
            playerIndex,
            result
        );

    } else {

        diceLabel.textContent =
            "Computer needs exact number";

        await sleep(650);
    }


    if (
        players[playerIndex].position <
        100
    ) {

        await checkSnakeOrLadder(
            playerIndex
        );
    }


    if (
        checkWin(playerIndex)
    ) {

        isRolling = false;

        return;
    }


    currentPlayer = 0;

    updatePlayerUI();

    isRolling = false;

    rollButton.disabled = false;

    rollText.textContent =
        "Roll Dice";

    diceLabel.textContent =
        "Your turn";
}


/* =========================================================
   NEW GAME
========================================================= */

function resetGame() {

    gameOver = false;

    isRolling = false;

    currentPlayer = 0;

    players[0].position = 1;
    players[1].position = 1;

    boardMessage.classList.add(
        "hidden"
    );

    gameStatus.textContent =
        "Playing";

    diceLabel.textContent =
        "Roll the dice";

    setDice(1);

    rollButton.disabled = false;

    rollText.textContent =
        "Roll Dice";

    confettiContainer.innerHTML = "";

    updateTokens();

    updatePlayerUI();
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

themeToggle.addEventListener(
    "click",
    toggleTheme
);


modeButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            initAudio();

            setGameMode(
                button.dataset.mode
            );

            playSound(
                500,
                0.07,
                "sine",
                0.025
            );
        }
    );
});


rollButton.addEventListener(
    "click",
    playTurn
);


newGameButton.addEventListener(
    "click",
    () => {

        initAudio();

        resetGame();

        playSound(
            500,
            0.08,
            "sine",
            0.03
        );
    }
);


playAgainButton.addEventListener(
    "click",
    () => {

        initAudio();

        resetGame();

        playSound(
            650,
            0.08,
            "sine",
            0.03
        );
    }
);


/* =========================================================
   KEYBOARD SUPPORT
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.code === "Space" &&
            document.activeElement.tagName !== "BUTTON"
        ) {

            event.preventDefault();

            if (
                !rollButton.disabled
            ) {
                playTurn();
            }
        }

        if (
            event.key.toLowerCase() === "n"
        ) {

            resetGame();
        }
    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

function initGame() {

    loadTheme();

    createBoard();

    resetGame();
}


/* Start game */
initGame();