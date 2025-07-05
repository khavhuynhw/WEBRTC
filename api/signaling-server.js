const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: "*", // Trong production, bạn nên chỉ định domain cụ thể
  methods: ["GET", "POST"]
}));

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store offers and connected users
const offers = [];
const connectedSockets = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  const userName = socket.handshake.auth.userName;
  const password = socket.handshake.auth.password;

  // Simple authentication (trong production nên dùng JWT)
  if (password !== "x") {
    socket.disconnect(true);
    return;
  }

  connectedSockets.push({
    socketId: socket.id,
    userName
  });

  console.log(`${userName} connected`);

  // Send available offers to new client
  if (offers.length) {
    socket.emit('availableOffers', offers);
  }

  // Handle new offer
  socket.on('newOffer', (newOffer) => {
    offers.push({
      offererUserName: userName,
      offer: newOffer,
      offerIceCandidates: [],
      answererUserName: null,
      answer: null,
      answererIceCandidates: []
    });
    
    console.log(`New offer from ${userName}`);
    socket.broadcast.emit('newOfferAwaiting', offers.slice(-1));
  });

  // Handle new answer
  socket.on('newAnswer', (offerObj, ackFunction) => {
    console.log(`Answer from ${userName} for ${offerObj.offererUserName}`);
    
    const socketToAnswer = connectedSockets.find(s => s.userName === offerObj.offererUserName);
    if (!socketToAnswer) {
      console.log("No matching socket found");
      return;
    }

    const socketIdToAnswer = socketToAnswer.socketId;
    const offerToUpdate = offers.find(o => o.offererUserName === offerObj.offererUserName);
    
    if (!offerToUpdate) {
      console.log("No offer to update found");
      return;
    }

    // Send back collected ICE candidates
    ackFunction(offerToUpdate.offerIceCandidates);
    
    offerToUpdate.answer = offerObj.answer;
    offerToUpdate.answererUserName = userName;
    
    socket.to(socketIdToAnswer).emit('answerResponse', offerToUpdate);
  });

  // Handle ICE candidates
  socket.on('sendIceCandidateToSignalingServer', (iceCandidateObj) => {
    const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;
    
    if (didIOffer) {
      // ICE from offerer, send to answerer
      const offerInOffers = offers.find(o => o.offererUserName === iceUserName);
      if (offerInOffers) {
        offerInOffers.offerIceCandidates.push(iceCandidate);
        
        if (offerInOffers.answererUserName) {
          const socketToSendTo = connectedSockets.find(s => s.userName === offerInOffers.answererUserName);
          if (socketToSendTo) {
            socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
          }
        }
      }
    } else {
      // ICE from answerer, send to offerer
      const offerInOffers = offers.find(o => o.answererUserName === iceUserName);
      if (offerInOffers) {
        const socketToSendTo = connectedSockets.find(s => s.userName === offerInOffers.offererUserName);
        if (socketToSendTo) {
          socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
        }
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from connected sockets
    const index = connectedSockets.findIndex(s => s.socketId === socket.id);
    if (index > -1) {
      const disconnectedUser = connectedSockets[index];
      console.log(`${disconnectedUser.userName} disconnected`);
      connectedSockets.splice(index, 1);
    }
    
    // Clean up offers for disconnected user
    const offersToRemove = offers.filter(o => 
      o.offererUserName === userName || o.answererUserName === userName
    );
    offersToRemove.forEach(offer => {
      const index = offers.indexOf(offer);
      if (index > -1) {
        offers.splice(index, 1);
      }
    });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connectedUsers: connectedSockets.length,
    activeOffers: offers.length
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 