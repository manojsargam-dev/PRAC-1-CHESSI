import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import gameRoute from "./Routes/gameRoute.ts";

import {
   createRoom,
   joinRoom,
   userdisconnection,
   playermoves,
   newGame
} from "./sockets/chessSocket.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/chess", gameRoute);

io.on("connection", (socket) => {
   console.log("CONNECTED:", socket.id);

   socket.on("createRoom", () => {
      createRoom(io, socket);
   });

   joinRoom(io, socket);
   userdisconnection(io, socket);
   playermoves(io, socket);
   newGame(io, socket);
});

export default server;