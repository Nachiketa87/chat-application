import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';


const app = express();
const server = http.createServer(app);

//socket server
export const io = new Server(server, {
    cors: {origin: "*"}
})

export const userSocketMap = {};

//socket connection handle
io.on("connection",(socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers",Object.keys(userSocketMap));
    socket.on("disconnect",()=>{
        console.log("User Disconnected",userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap))
    })
}) 

//middlewaree
app.use(express.json({limit:"4mb"}));
app.use(cors());


//route
app.use("/api/status",(req,res)=>res.send("server is live"));
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter);

//mongodb
await connectDB();

if(process.env.NODE_ENV != "production"){
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, ()=>console.log("server is running on PORT: "+PORT));
}
//export to vercel
export default server;