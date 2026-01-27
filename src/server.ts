import 'dotenv/config';
import { Server } from './server/Server.ts';

const server = new Server();
server.listen();