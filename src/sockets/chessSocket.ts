import { BLACK, WHITE, Chess } from "chess.js";
import { Server, Socket } from "socket.io";

interface Room {
    chess: Chess;
    white: string | undefined;
    black: string | undefined;
}

const rooms = new Map<string, Room>();

function createRoomId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let roomId = "";

    for (let i = 0; i < 6; i++) {
        roomId += chars[Math.floor(Math.random() * chars.length)];
    }

    return roomId;
}

function sendGameState(io: Server, roomId: string) {
    const room = rooms.get(roomId);

    if (!room) return;

    io.to(roomId).emit("gameStatus", {
        turn: room.chess.turn(),
        white: !!room.white,
        black: !!room.black,
        check: room.chess.isCheck(),
        checkmate: room.chess.isCheckmate(),
        draw: room.chess.isDraw(),
        gameOver: room.chess.isGameOver()
    });
}

function sendBoardState(io: Server, roomId: string) {
    const room = rooms.get(roomId);

    if (!room) return;

    io.to(roomId).emit("boardState", room.chess.fen());
}

export const createRoom = (io: Server, socket: Socket) => {
    let roomId = createRoomId();

    while (rooms.has(roomId)) {
        roomId = createRoomId();
    }

    const room: Room = {
        chess: new Chess(),
        white: socket.id,
        black: undefined
    };

    rooms.set(roomId, room);

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.color = WHITE;

    socket.emit("roomCreated", roomId);
    socket.emit("playerColor", WHITE);
    socket.emit("boardState", room.chess.fen());

    sendGameState(io, roomId);

    console.log(`ROOM CREATED: ${roomId}`);
    console.log(`WHITE PLAYER: ${socket.id}`);
};

export const joinRoom = (io: Server, socket: Socket) => {
    socket.on("joinRoom", (roomId: string) => {
        const id = roomId.trim().toUpperCase();
        const room = rooms.get(id);

        if (!room) {
            socket.emit("roomError", "Room not found.");
            return;
        }

        if (room.black) {
            socket.emit("roomError", "Room is full.");
            return;
        }

        if (socket.data.roomId) {
            socket.emit("roomError", "You are already in a room.");
            return;
        }

        room.black = socket.id;

        socket.join(id);
        socket.data.roomId = id;
        socket.data.color = BLACK;

        socket.emit("roomJoined", id);
        socket.emit("playerColor", BLACK);
        socket.emit("boardState", room.chess.fen());

        sendGameState(io, id);

        console.log(`BLACK PLAYER: ${socket.id}`);
        console.log(`JOINED ROOM: ${id}`);
    });
};

export const playermoves = (io: Server, socket: Socket) => {
    socket.on("move", (move) => {
        try {
            const roomId = socket.data.roomId;
            const color = socket.data.color;

            if (!roomId || !color) {
                socket.emit("invalidMove", {
                    message: "You are not in a game."
                });
                return;
            }

            const room = rooms.get(roomId);

            if (!room) {
                socket.emit("invalidMove", {
                    message: "Room not found."
                });
                return;
            }

            if (room.chess.isGameOver()) {
                socket.emit("invalidMove", {
                    message: "Game is already over."
                });
                return;
            }

            if (room.chess.turn() !== color) {
                socket.emit("invalidMove", {
                    message: "It is not your turn."
                });
                return;
            }

            const result = room.chess.move({
                from: move.from,
                to: move.to,
                promotion: move.promotion || "q"
            });

            if (!result) {
                socket.emit("invalidMove", {
                    message: "Invalid chess move."
                });
                return;
            }

            console.log(
                `${result.color === WHITE ? "WHITE" : "BLACK"}:`,
                `${result.from} -> ${result.to}`,
                result.san
            );

            io.to(roomId).emit("move", {
                from: result.from,
                to: result.to,
                san: result.san,
                color: result.color,
                captured: result.captured || null,
                promotion: result.promotion || null
            });

            sendBoardState(io, roomId);
            sendGameState(io, roomId);
        } catch (error) {
            console.error("MOVE ERROR:", error);

            socket.emit("invalidMove", {
                message: "Invalid move."
            });
        }
    });
};

export const newGame = (io: Server, socket: Socket) => {
    socket.on("newGame", () => {
        const roomId = socket.data.roomId;

        if (!roomId) return;

        const room = rooms.get(roomId);

        if (!room) return;

        if (
            socket.id !== room.white &&
            socket.id !== room.black
        ) {
            return;
        }

        room.chess.reset();

        console.log(`GAME RESET: ${roomId}`);

        io.to(roomId).emit("boardState", room.chess.fen());
        io.to(roomId).emit("gameReset");

        sendGameState(io, roomId);
    });
};

export const userdisconnection = (io: Server, socket: Socket) => {
    socket.on("disconnect", () => {
        const roomId = socket.data.roomId;

        if (!roomId) return;

        const room = rooms.get(roomId);

        if (!room) return;

        if (socket.id === room.white) {
            room.white = undefined;
            console.log(`WHITE DISCONNECTED: ${roomId}`);
        }

        if (socket.id === room.black) {
            room.black = undefined;
            console.log(`BLACK DISCONNECTED: ${roomId}`);
        }

        socket.leave(roomId);

        if (!room.white && !room.black) {
            rooms.delete(roomId);
            console.log(`ROOM DELETED: ${roomId}`);
        } else {
            sendGameState(io, roomId);
        }
    });
};