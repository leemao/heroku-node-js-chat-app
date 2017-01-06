"use strict"
const port       = 'PORT' in process.env ? process.env.PORT : 3000;
const express    = require('express');
const bodyParser = require('body-parser');
const passport   = require('passport');
const bcrypt     = require('bcrypt-nodejs');
const fs         = require('fs');
var app          = express();
var server       = require('http').createServer(app);
var io           = require('socket.io')(server);
var users;
var rooms;
//var usernames = {};

app.use(require('cookie-parser')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(require('cookie-session')({ secret: 'secretkey' }));

// Chargement des donnees rooms et users
users = JSON.parse(fs.readFileSync('database.json', 'utf8')).users;
rooms = JSON.parse(fs.readFileSync('database.json', 'utf8')).rooms;
console.log('database: ok');

require('./config/passport.js')(passport, users, bcrypt);
app.use(passport.initialize());
app.use(passport.session());
app.use(require('connect-flash')());
require('./app/routes.js')(app, passport);
server.listen(port);
console.log('listening on port: ' + port);

//console.log(rooms);

// room CLIENT
io.on('connection', function (socket) {
    console.log('Client connected: ' + socket.id);
    //socket.emit('newSocket', 'Your Client ID: ' + socket.id, rooms);
    socket.broadcast.emit('newSocket', 'Client connected: ' + socket.id);
	
	// store the room name in the socket session for this client
	socket.room = 'Accueil';
	// send client to room 1
	socket.join('Accueil');
	//socket.emit('updaterooms', rooms, 'Accueil');
	socket.emit('updaterooms', staffRoom(), 'Accueil');
	

	/*socket.on('adduser', function(usern){
		socket.username = usern;
		socket.room = 'Accueil';
		usernames[usern] = usern;
		socket.join('Accueil');
		socket.emit('updatechat', 'SERVER', 'Vous êtes connecté au chat Accueil');
		socket.broadcast.to('Accueil').emit('updatechat', 'SERVER', usern + ' s\'est connecté à ce tchat.');
		socket.emit('updaterooms', rooms, 'Accueil');
	});*/
	
	// Partie concernant le tchat (envoi de message a tous les users)
    socket.on('newMessage', function (message,usern) {
        console.log('Message de ' + usern + " : " + message);
		socket.emit('newMessage', usern + " : " + message);
        socket.broadcast.emit('newMessage', usern + " : " + message);
		socket.broadcast.to(socket.room).emit('updatechat', usern, message);
    });	
	
	//send
	socket.on('sendchat', function (data, usern) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', /*socket.username*/ usern, data);
	});
	
	
	socket.on('switchRoom', function(newroom, usern){
		// leave the current room (stored in session)
		socket.leave(socket.room);
		// join new room, received as function parameter
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'Vous vous êtes connecté au tchat : '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', usern+' a quitté ce tchat.');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', usern+' a rejoins ce tchat.');
		socket.emit('updaterooms', staffRoom(), newroom);
	});
	
	// Logout des clients
    socket.on('disconnect', function () {
        console.log('Client disconnected: ' + socket.id);
        socket.broadcast.emit('newSocket', 'Client disconnected: ' + socket.id);
		
		/*
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' s\'est déconnecté.');
		socket.leave(socket.room);
		*/
    });
});



/**************
 * room ADMIN *
 **************/
var admins = io.of('/admins');

admins.on('connection', function (socket) {
    console.log('Admin connected: ' + socket.id);
    socket.emit('newSocketAdmin', 'Your Admin ID: ' + socket.id);
    socket.broadcast.emit('newSocketAdmin', 'Admin connected: ' + socket.id);
    io.emit('newSocket', 'An admin is here');
    socket.emit('usersAdmin', staffAdmin());
	socket.emit('roomsAdmin', staffRoom());

    socket.on('disconnect', function () {
        console.log('Admin disconnected: ' + socket.id);
        socket.broadcast.emit('newSocketAdmin', 'Admin disconnected: ' + socket.id);
    });
    socket.on('createUserAdmin', function (_username, _password) {
        users[_username] = bcrypt.hashSync(_password, bcrypt.genSaltSync(8), null);
        admins.emit('usersAdmin', staffAdmin());
        setDatabase();
    });
    socket.on('deleteUserAdmin', function (_username) {
        delete users[_username];
        admins.emit('usersAdmin', staffAdmin());
        setDatabase();
    });
	// rooms
	socket.on('createRoomAdmin', function (_roomname, _password) {
        rooms[_roomname] = _roomname;
        admins.emit('roomsAdmin', staffRoom());
        setDatabase();
    });
    socket.on('deleteRoomAdmin', function (_roomname) {
        delete rooms[_roomname];
        admins.emit('roomsAdmin', staffRoom());
        setDatabase();
    });
});

function staffAdmin() {
    let usersList = [];
    for (let username in users)
        usersList.push(username);
    return usersList;
}

//room
function staffRoom() {
	let roomsList = [];
    for (let roomname in rooms)
        roomsList.push(roomname);
    return roomsList;
}

function setDatabase() {
    fs.writeFileSync('database.json', JSON.stringify({ users: users, rooms: rooms }, null, 4), 'utf8');
}
