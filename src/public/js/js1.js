const socket = io();


socket.on("playercolor",(color)=>{
    console.log(color);
})