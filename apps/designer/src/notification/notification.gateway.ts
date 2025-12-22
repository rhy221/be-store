import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

   handleConnection(client: Socket) {
      console.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
      
    }

    @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, userId: string) {
    // Cho socket tham gia vào room có tên là userId
    client.join(userId);
    console.log(`Client ${client.id} joined room user:${userId}`);
  }
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(userId).emit('newNotification', notification);
  }
}