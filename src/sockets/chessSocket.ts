import { Server, Socket } from "socket.io";


export const basic = (io:Server,socket:Socket)=>{
    socket.on("hello",()=>{
        io.emit("hola");
    })
}