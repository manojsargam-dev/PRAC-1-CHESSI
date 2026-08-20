import express from 'express'
import http from 'http'
import {Server} from 'socket.io' 
import {Chess} from 'chess.js';
import path from 'path';
import { fileURLToPath } from "url";
import gameRoute from "./routes/gameRoute.ts"
import { basic } from './sockets/chessSocket.ts';

const __filename:string = fileURLToPath(import.meta.url);
const __dirname:string = path.dirname(__filename);


const app = express();
const server = http.createServer(app);
const io = new Server(server);
const chess = new Chess();

app.set("view engine","ejs");
app.set("views", path.join(__dirname, "./views"));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.use("/api/chess",gameRoute)


io.on("connection",(socket)=>{
    console.log("connected");
    basic(io,socket)
})

export default server;
