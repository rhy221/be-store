import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private auctionRooms = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Remove client from all auction rooms
    this.auctionRooms.forEach((clients, auctionId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.auctionRooms.delete(auctionId);
      }
    });
  }

  @SubscribeMessage('joinAuction')
  handleJoinAuction(client: Socket, auctionId: string) {
    client.join(`auction:${auctionId}`);
    
    if (!this.auctionRooms.has(auctionId)) {
      this.auctionRooms.set(auctionId, new Set());
    }
    this.auctionRooms.get(auctionId)?.add(client.id);

    const viewerCount = this.auctionRooms.get(auctionId)?.size;
    this.server.to(`auction:${auctionId}`).emit('viewerCount', viewerCount);
  }

  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(client: Socket, auctionId: string) {
    client.leave(`auction:${auctionId}`);
    
    const room = this.auctionRooms.get(auctionId);
    if (room) {
      room.delete(client.id);
      const viewerCount = room.size;
      this.server.to(`auction:${auctionId}`).emit('viewerCount', viewerCount);
    }
  }

  // Broadcast new bid to all clients watching the auction
  broadcastNewBid(auctionId: string, bid: any) {
    this.server.to(`auction:${auctionId}`).emit('newBid', bid);
  }

  // Broadcast auction end
  broadcastAuctionEnd(auctionId: string, winner: any) {
    this.server.to(`auction:${auctionId}`).emit('auctionEnded', winner);
  }

  // Broadcast price update
  broadcastPriceUpdate(auctionId: string, price: number) {
    this.server.to(`auction:${auctionId}`).emit('priceUpdate', { price });
  }
}