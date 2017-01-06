var socketAdmin = io('/admins');

socketAdmin.on('newSocketAdmin', function (string) {
    results.innerHTML += string + '<br>';
});

socketAdmin.on('usersAdmin', function (_users) {
    users.innerHTML = '';
    var tr;
    for (var i = 0, length = _users.length; i !== length; i++) {
        tr = document.createElement('tr');
        if (_users[i] === 'Admin')
            tr.innerHTML = '<td>' + _users[i] + '</td><td><button>Editer</button></td>';
        else {
            tr.innerHTML = '<td>' + _users[i] + '</td><td><button>Editer</button><button>Supprimer</button></td>';
            tr.lastElementChild.lastElementChild.addEventListener('click', (function (_username) {
                return function () {
                    if (confirm('Supprimer l\'utilisateur "' + _username + '" ?'))
                        socketAdmin.emit('deleteUserAdmin', _username);
                };
            })(_users[i]), false);
        }
        tr.lastElementChild.firstElementChild.addEventListener('click', (function (_username) {
            return function () {
                username.value = _username;
            };
        })(_users[i]), false);
        users.appendChild(tr);
    }
    username.click();
    password.click();
});

socketAdmin.on('roomsAdmin', function (_rooms) {
    rooms.innerHTML = '';
    var tr;
    for (var i = 0, length = _rooms.length; i !== length; i++) {
        tr = document.createElement('tr');
        if (_rooms[i] === 'Accueil'){
			tr.innerHTML = '<td>' + _rooms[i] + '</td>';
		} else {
			tr.innerHTML = '<td>' + _rooms[i] + '</td><td><button>Supprimer</button></td>';
			tr.lastElementChild.lastElementChild.addEventListener('click', (function (_roomname) {
				return function () {
					if (confirm('Supprimer le tchat "' + _roomname + '" ?'))
						socketAdmin.emit('deleteRoomAdmin', _roomname);
				};
			})(_rooms[i]), false);
		}
        /*tr.lastElementChild.firstElementChild.addEventListener('click', (function (_roomname) {
            return function () {
                roomname.value = _roomname;
            };
        })(_rooms[i]), false);*/
        rooms.appendChild(tr);
    }
    roomname.click();
});

createuser.addEventListener('click', function (e) {
    if (username.checkValidity() && password.checkValidity()) {
        e.preventDefault();
        socketAdmin.emit('createUserAdmin', username.value.trim(), password.value);
        username.value = '';
        password.value = '';
    }
}, false);

//room
createroom.addEventListener('click', function (e) {
    e.preventDefault();
	socketAdmin.emit('createRoomAdmin', roomname.value.trim());
	roomname.value = '';
}, false);

logout.addEventListener('click', function () {
    window.location.href = '/logout';
}, false);
