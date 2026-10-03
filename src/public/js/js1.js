const socket = io();
const chess = new Chess();

const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const capturedWhiteElement = document.getElementById("capturedWhiteElement");
const capturedBlackElement = document.getElementById("capturedBlackElement");
const createRoomButton = document.getElementById("createRoom");
const joinRoomButton = document.getElementById("joinRoom");
const roomInput = document.getElementById("roomInput");
const roomStatus = document.getElementById("roomStatus");
const newGameButton = document.getElementById("newGame");

let playerRole = null;
let roomId = null;
let selectedSquare = null;
let lastMove = null;
let gameOver = false;
let capturedWhitePieces = [];
let capturedBlackPieces = [];

const PIECE_DIR = "/assets/";

const pieceImages = {
    wp: "wP.svg",
    wr: "wR.svg",
    wn: "wN.svg",
    wb: "wB.svg",
    wq: "wQ.svg",
    wk: "wK.svg",
    bp: "bP.svg",
    br: "bR.svg",
    bn: "bN.svg",
    bb: "bB.svg",
    bq: "bQ.svg",
    bk: "bK.svg"
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

function createBoard() {
    if (!boardElement) return;

    boardElement.innerHTML = "";
    const board = chess.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const rank = 8 - row;
            const file = files[col];
            const squareName = `${file}${rank}`;
            const square = document.createElement("div");

            square.classList.add("square");
            square.classList.add((row + col) % 2 === 0 ? "light" : "dark");
            square.dataset.square = squareName;

            const piece = board[row][col];

            if (piece) {
                const pieceCode = piece.color + piece.type;
                createPiece(square, pieceCode);
            }

            if (lastMove && (lastMove.from === squareName || lastMove.to === squareName)) {
                square.classList.add("last-move");
            }

            if (selectedSquare === squareName) {
                square.classList.add("selected");
            }

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            boardElement.appendChild(square);
        }
    }
}

function createPiece(square, piece) {
    const img = document.createElement("img");

    img.classList.add("piece");
    img.src = PIECE_DIR + pieceImages[piece];
    img.draggable = false;
    img.alt = getPieceName(piece);
    img.dataset.piece = piece;

    square.appendChild(img);
}

function getPieceName(piece) {
    const color = piece[0] === "w" ? "White" : "Black";

    const type = {
        p: "Pawn",
        r: "Rook",
        n: "Knight",
        b: "Bishop",
        q: "Queen",
        k: "King"
    }[piece[1]];

    return `${color} ${type}`;
}

function canPlayerMove() {
    if (!roomId || !playerRole || gameOver) return false;
    return chess.turn() === playerRole;
}

function handleSquareClick(squareName) {
    if (!canPlayerMove()) return;

    const piece = chess.get(squareName);

    if (!selectedSquare) {
        if (!piece || piece.color !== playerRole) return;

        selectedSquare = squareName;
        createBoard();
        showLegalMoves(squareName);
        return;
    }

    if (selectedSquare === squareName) {
        selectedSquare = null;
        createBoard();
        return;
    }

    if (piece && piece.color === playerRole) {
        selectedSquare = squareName;
        createBoard();
        showLegalMoves(squareName);
        return;
    }

    sendMove(selectedSquare, squareName);
}

function sendMove(from, to) {
    if (!canPlayerMove()) return;

    socket.emit("move", {
        from,
        to,
        promotion: "q"
    });

    selectedSquare = null;
    removeMoveHighlights();
}

function showLegalMoves(squareName) {
    removeMoveHighlights();

    let moves = [];

    try {
        moves = chess.moves({
            square: squareName,
            verbose: true
        });
    } catch (error) {
        console.error("Move error:", error);
        return;
    }

    moves.forEach(move => {
        const target = boardElement.querySelector(`[data-square="${move.to}"]`);

        if (!target) return;

        if (move.captured) {
            target.classList.add("capture");
        } else {
            target.classList.add("legal");
        }
    });
}

function removeMoveHighlights() {
    if (!boardElement) return;

    const squares = boardElement.querySelectorAll(".square");

    squares.forEach(square => {
        square.classList.remove("legal", "capture");
    });
}

function addCapturedPiece(move) {
    if (!move.captured) return;

    const capturedColor = move.color === "w" ? "b" : "w";
    const capturedPiece = capturedColor + move.captured;

    if (capturedColor === "b") {
        capturedBlackPieces.push(capturedPiece);
    } else {
        capturedWhitePieces.push(capturedPiece);
    }

    renderCapturedPieces();
}

function renderCapturedPieces() {
    if (capturedBlackElement) {
        capturedBlackElement.innerHTML = "";
    }

    if (capturedWhiteElement) {
        capturedWhiteElement.innerHTML = "";
    }

    capturedBlackPieces.forEach(piece => {
        const img = document.createElement("img");

        img.src = PIECE_DIR + pieceImages[piece];
        img.alt = getPieceName(piece);

        if (capturedBlackElement) {
            capturedBlackElement.appendChild(img);
        }
    });

    capturedWhitePieces.forEach(piece => {
        const img = document.createElement("img");

        img.src = PIECE_DIR + pieceImages[piece];
        img.alt = getPieceName(piece);

        if (capturedWhiteElement) {
            capturedWhiteElement.appendChild(img);
        }
    });
}

function clearCapturedPieces() {
    capturedWhitePieces = [];
    capturedBlackPieces = [];
    renderCapturedPieces();
}

function updateStatus(gameStatus) {
    if (!statusElement) return;

    if (gameStatus.checkmate) {
        gameOver = true;

        const winner = gameStatus.turn === "w" ? "Black" : "White";
        statusElement.textContent = `Checkmate — ${winner} wins!`;
        return;
    }

    if (gameStatus.draw) {
        gameOver = true;
        statusElement.textContent = "Draw";
        return;
    }

    if (gameStatus.gameOver) {
        gameOver = true;
        statusElement.textContent = "Game Over";
        return;
    }

    gameOver = false;

    if (gameStatus.check) {
        const checkingColor = gameStatus.turn === "w" ? "White" : "Black";
        statusElement.textContent = `${checkingColor} is in check`;
        return;
    }

    if (!playerRole) {
        statusElement.textContent = "Waiting for player";
        return;
    }

    if (gameStatus.turn === playerRole) {
        statusElement.textContent = "Your turn";
    } else {
        statusElement.textContent = "Opponent's turn";
    }
}

if (createRoomButton) {
    createRoomButton.addEventListener("click", () => {
        socket.emit("createRoom");
    });
}

if (joinRoomButton) {
    joinRoomButton.addEventListener("click", () => {
        const id = roomInput.value.trim().toUpperCase();

        if (!id) {
            roomStatus.textContent = "Enter a room code";
            return;
        }

        socket.emit("joinRoom", id);
    });
}

if (roomInput) {
    roomInput.addEventListener("input", () => {
        roomInput.value = roomInput.value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");
    });

    roomInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            joinRoomButton.click();
        }
    });
}

if (newGameButton) {
    newGameButton.addEventListener("click", () => {
        if (!roomId) {
            if (roomStatus) {
                roomStatus.textContent = "Join a room first";
            }
            return;
        }

        socket.emit("newGame");
    });
}

socket.on("roomCreated", id => {
    roomId = id;

    if (roomStatus) {
        roomStatus.textContent = `Room Code: ${id}`;
    }

    if (roomInput) {
        roomInput.value = id;
    }

    console.log("ROOM CREATED:", id);
});

socket.on("roomJoined", id => {
    roomId = id;

    if (roomStatus) {
        roomStatus.textContent = `Room Code: ${id}`;
    }

    console.log("ROOM JOINED:", id);
});

socket.on("roomError", message => {
    if (roomStatus) {
        roomStatus.textContent = message;
    }

    console.log("ROOM ERROR:", message);
});

socket.on("playerColor", color => {
    playerRole = color;

    console.log(
        "PLAYER COLOR:",
        color === "w" ? "WHITE" : "BLACK"
    );

    if (statusElement) {
        statusElement.textContent =
            color === "w" ? "You are White" : "You are Black";
    }

    createBoard();
});

socket.on("boardState", fen => {
    try {
        chess.load(fen);
        selectedSquare = null;
        createBoard();

        console.log("BOARD UPDATED");
    } catch (error) {
        console.error("FEN ERROR:", error);
    }
});

socket.on("move", move => {
    console.log("MOVE RECEIVED:", move);

    lastMove = {
        from: move.from,
        to: move.to
    };

    addCapturedPiece(move);

    selectedSquare = null;
    createBoard();
});

socket.on("invalidMove", data => {
    console.log("INVALID MOVE:", data);

    selectedSquare = null;
    removeMoveHighlights();
    createBoard();
});

socket.on("gameStatus", gameStatus => {
    console.log("GAME STATUS:", gameStatus);
    updateStatus(gameStatus);
});

socket.on("gameReset", () => {
    lastMove = null;
    selectedSquare = null;
    gameOver = false;

    clearCapturedPieces();
    createBoard();

    if (statusElement) {
        statusElement.textContent = "New game";
    }
});

createBoard();