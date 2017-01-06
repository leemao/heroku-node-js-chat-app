"use strict"
var socket = io();

socket.on('updatechat', function (username, data) {
	results.innerHTML += '<b>'+username + ':</b> ' + data + '<br>';
});

socket.on('updaterooms', function(_rooms, currentRoom) {
	rooms.innerHTML = '';
	for (var i = 0, length = _rooms.length; i !== length; i++) {
		if(_rooms[i] === currentRoom){
			rooms.innerHTML += '<div>'+_rooms[i]+'</div>';
		}else{
			rooms.innerHTML += '<div><a href="#" onclick="switchRoom(\''+_rooms[i]+'\',\''+document.getElementById("un").innerHTML+'\')">' + _rooms[i] + '</a></div>';
		}
	}
});


function switchRoom(room, usern){
	socket.emit('switchRoom', room, usern);
}

// Envoi de message
socket.on('newMessage', function (string) {
    results.innerHTML += string + '<br>';
});



// id_button on ajoute un evenement 'click' 
tchat.addEventListener('click', function () {
	// On va chercher le socket.on decrit dans server.js
    //socket.emit('newMessage',document.getElementById("champs1").value, document.getElementById("un").innerHTML);
	socket.emit('sendchat', document.getElementById("champs1").value, document.getElementById("un").innerHTML);
}, false);



logout.addEventListener('click', function () {
    window.location.href = '/logout';
}, false);
