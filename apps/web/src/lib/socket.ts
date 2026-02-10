import { io, Socket } from "socket.io-client";

let socket: Socket;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
      auth: {
        token,
      },
      autoConnect: false,
    });
  }
  return socket;
};
