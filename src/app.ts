import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import balanceRoutes from "./routes/balance.routes";

const app = express();

app.use(
  cors({
    origin: true, // allow all origins dynamically
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/balance", balanceRoutes);
app.use('/', (req, res) => {
    res.status(200).json({ status: "Server is running." });
});


export default app;