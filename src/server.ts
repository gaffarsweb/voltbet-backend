import http from "http";
import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";
import { initSocket } from "./socket/socket";
import { setIO } from "./socket/socketInstance";
import { connectRedis } from "./config/redis";
import { startExchangeRateCron } from "./services/cron.service";
dotenv.config();

const startServer = async () => {
    await connectDB();

    const server = http.createServer(app);
    await  connectRedis();
    const io = await initSocket(server);
    setIO(io);
    
    // Start exchange rate cron job (updates every minute)
    startExchangeRateCron();
    
    server.listen(process.env.PORT, () => {
        console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
};

startServer();