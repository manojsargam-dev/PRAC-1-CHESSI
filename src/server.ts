import dotenv from 'dotenv';
dotenv.config();
import server from './app.ts'
const PORT = process.env.PORT || 3000;


server.listen(PORT,()=>{
    console.log("SERVER IS RUNNING!!!")
})
