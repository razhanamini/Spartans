import express from "express";
import authRoutes from "./routes/auth.routes";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());


app.use("/api/auth", authRoutes);
app.use("/api/test", authRoutes);

app.listen(3000, () => console.log("Server running"));
