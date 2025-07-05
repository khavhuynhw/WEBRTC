//on connection get all available offers and call createOfferEls
socket.on('availableOffers',offers=>{
    console.log('Available offers:', offers)
    createOfferEls(offers)
})

//someone just made a new offer and we're already here - call createOfferEls
socket.on('newOfferAwaiting',offers=>{
    console.log('New offer awaiting:', offers)
    createOfferEls(offers)
})

socket.on('answerResponse',offerObj=>{
    console.log('Answer response received:', offerObj)
    addAnswer(offerObj)
})

socket.on('receivedIceCandidateFromServer',iceCandidate=>{
    console.log('Received ICE candidate from server:', iceCandidate)
    addNewIceCandidate(iceCandidate)
})

function createOfferEls(offers){
    const answerEl = document.querySelector('#answer');
    
    // Clear existing buttons
    answerEl.innerHTML = '';
    
    offers.forEach(o => {
        console.log('Creating answer button for offer:', o);
        
        const newOfferEl = document.createElement('div');
        newOfferEl.className = 'mb-2';
        newOfferEl.innerHTML = `
            <button class="btn btn-success">
                📞 Answer ${o.offererUserName}
            </button>
        `;
        
        newOfferEl.addEventListener('click', () => {
            // Disable button to prevent multiple clicks
            newOfferEl.querySelector('button').disabled = true;
            newOfferEl.querySelector('button').innerHTML = 'Connecting...';
            
            answerOffer(o).catch(err => {
                console.error('Error answering offer:', err);
                // Re-enable button on error
                newOfferEl.querySelector('button').disabled = false;
                newOfferEl.querySelector('button').innerHTML = `📞 Answer ${o.offererUserName}`;
            });
        });
        
        answerEl.appendChild(newOfferEl);
    });
}

// Error handling
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    document.querySelector('#user-name').innerHTML = `Your ID: ${userName} (Connection Error)`;
    alert('Cannot connect to signaling server. Please check your internet connection.');
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});