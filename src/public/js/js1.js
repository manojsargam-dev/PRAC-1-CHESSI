const socket = io();


socket.emit("hello");
socket.on("hola",()=>{
    console.log("you said hola");
})