import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

export const initSocket = async (server: any) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  // 🔴 Create Redis Clients
  const pubClient = createClient({
    url: process.env.REDIS_URL,
  });

  const subClient = pubClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  // 🔥 Attach Redis Adapter
  io.adapter(createAdapter(pubClient, subClient));

  // 🔐 JWT Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Invalid Token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user.id;

    console.log("⚡ Connected:", userId);

    // Join private user room
    socket.join(userId);

    socket.on("disconnect", () => {
      console.log("Disconnected:", userId);
    });
  });

  return io;
};