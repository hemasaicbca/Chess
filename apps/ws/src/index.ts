import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import url from 'url';
import { extractAuthUser } from './auth';
import { connectDB } from '@repo/db';
import { setServers } from 'node:dns';

setServers(['8.8.8.8', '1.1.1.1']);

const PORT = Number(process.env.WS_PORT || 8080);
const wss = new WebSocketServer({ port: PORT });

const gameManager = new GameManager();

connectDB()
  .then(() => {
    wss.on('connection', function connection(ws, req) {
      //@ts-ignore
      const token: string = url.parse(req.url, true).query.token;
      const user = extractAuthUser(token, ws);
      gameManager.addUser(user);

      ws.on('close', () => {
        gameManager.removeUser(ws);
      });
    });

    console.log(`WebSocket server running on port ${PORT}`);
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB for WebSocket server:', error);
    process.exit(1);
  });
