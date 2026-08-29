import { BLACK, WHITE } from "chess.js";
import { Server, Socket } from "socket.io";
import { chess } from "../app.ts";

interface users {
    white?:string;
    black?:string;
}

let players:users = {white:'',black:''};
let currentPlayer:"w"|"b" = WHITE;

export const userColor = (io:Server,socket:Socket)=>{
    if(!players.white){
        players.white= socket.id;
        socket.emit("playercolor",WHITE);
    }
    else if(!players.black){
        players.black = socket.id;
        socket.emit("playercolor",BLACK);
    }
    else{
        socket.emit("spectator","spectator");
    }
} 

export const userdisconnection = (io:Server,socket:Socket)=>{
    socket.on("disconnect",()=>{
        (socket.id === players.white)?(delete players.white):(socket.id === players.black)?(delete players.black):("Connection Error")
        console.log("disconnected");
    })
}

export const playermoves =(io:Server,socket:Socket)=>{
    socket.on("move",(move)=>{
        try {
        let res:boolean = (chess.turn()=== WHITE && socket.id !== players.white)?(false):(chess.turn()=== BLACK && socket.id !== players.black)?(false):(true);
        if(res===false) return;

        const result = chess.move(move);
        if(result){
            currentPlayer = (currentPlayer === WHITE)?(chess.turn()):(chess.turn());
            io.emit("move",move);
            io.emit("boardState",chess.fen()); 
        }
        else{
            console.log("invalid move : ",move);
            socket.emit("invalidMove",move);
        }

        } catch (error) {
            console.error(error);
            socket.emit("invalidMove",move);
        }
    })
}