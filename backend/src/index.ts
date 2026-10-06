import "dotenv/config";
import http from "http";
import app from "./app.js";
import { initSocketServer } from "../lib/socket.js";
import { scheduleReservationReminders } from "./jobs/reservationReminders.js";
import { scheduleReservationHoldExpiry } from "./jobs/reservationHolds.js";

const PORT = process.env.BACKEND_PORT || 3000;

const server = http.createServer(app);
initSocketServer(server);
scheduleReservationReminders();
scheduleReservationHoldExpiry();

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
  console.log(`Socket.IO ready`);
});
