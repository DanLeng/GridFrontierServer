var http = require('http');
var url = require('url');
var fs = require('fs');
var util = require('util');
//var io = require('C:/Program Files/nodejs/node_modules/socket.io');
var io = require('socket.io');
var MathHelper = require('./mathlib');
var Player = require('./server_player').Player;
var Laser = require('./server_weapon').Laser;
var Powerup = require('./server_powerup').Powerup;

var serverPort;
var server;				// Node.js Server object
var socket;				// Socket.io object

var clients;			// Array of Socket.io objects for connected clients
var players;			// List of all players in the game
var idleTime;			// Time allowed for players to be idle

var powerups;			// Powerups spawned in the game
var lasers;				// Lasers fired by players
var laserId;			// Laser ID (incremented with each new laser created)
var obstacles;			// In-game obstacles for collision-checking

// var usedColors;			// Array of colors that have already been used

// AlienGreen, MistyRose,  
// Cyan, Yellow, Red, 
// Light Steel Blue, Peru, 
// Medium Aquamarine, Gold
// Light Coral, Orchid
var COLORS = ['#7fff00', "#ffe4e1", 
				"#00ffff", "#ffff00", "#ff0000", 
				"#b0c4de", "#cd853f", 
				"#66cdaa", "#ffd700", 
				"#f08080", "#da70d6"];

var tickRate = 16.6; 			// Server update heartbeat rate
var snapShotInterval = 6;		// 6 = every 6 server ticks ( 6 x 16.6ms = 99.6 ms per snapshot)
var currentTick;				// Current server tick

// Viewport Dimensions
var screenX = 1200,
	screenY = 600,
	distanceX = screenX/2,
	distanceY = screenY/2;

function init(){
	serverPort = 8080;
	
	players = [];
	clients = [];
	usedColors = [];
	lasers = [];
	laserId = 0;
	obstacles = [];
	currentTick = 0;
	idleTime = 120;
	
	// Create the server
	server = http.createServer(function(request, response){
		// server code (Callback)
		var path = url.parse(request.url).pathname;
		
		//__dirname + '/
		fs.readFile('../../index.html', function(error, data){
			if (error){
				//return send404(response);
				response.writeHead(404);
				response.write('404');
				response.end();
			}
			
			response.writeHead(200,{
				'Content-Type' : path == 'json.js' ? 
				'text/javascript' : 'text/html'});
			
			response.write(data, 'utf8');
			response.end();
		});
	});
	
	server.listen(serverPort);
	socket = io.listen(server);
	
	socket.configure(function(){
	    socket.set("transports", ["websocket"]);
	    socket.set("log level", 2);
	});
	
	setObstacles();
	setEventHandlers();
	tickServer();
	checkActivity();
};

function setObstacles(){
	// The obstacles here correspond to the design of the level on the client-side
	var obstc1 = {
		x: 200,			// X and Y coordinates of rectangle
		y: 500,
		right: 300,		// Right side of rectangle
		bottom: 700		// Bottom of rectangle
	},obstc2 = {
		x: 500,
		y: 200,
		right: 700,
		bottom: 300
	},obstc3 = {
		x: 900,
		y: 500,
		right: 1000,
		bottom: 700
	},obstc4 = {
		x: 500,
		y: 900,
		right: 700,
		bottom: 1000
	};
	obstacles.push(obstc1);
	obstacles.push(obstc2);
	obstacles.push(obstc3);
	obstacles.push(obstc4);
};

function checkActivity(){
	// Check for player activity every 10 seconds
	// Force disconnect inactive players
	setInterval(function(){
		for (var i = 0, l = players.length; i < l; i++){
			if (typeof players[i] != "undefined"){
				if (players[i].getTime() > idleTime){
					clients[players[i].id].emit("disconnect_idle");
				}else{
					players[i].addTime();
				}
			}
		}
	}, 10000);
}

// Tick is the server's heartbeat. During each tick, lasers are updated, and snapshots are sent to clients.
function tickServer(){
    setInterval(function(){
    	currentTick+=1;
    	var tickTimeStamp = new Date();
    	
    	if (currentTick % snapShotInterval == 0){
    		// Send snapshots to all clients
       		sendSnapShots();
       	}
       	
       	// Move lasers
    	moveLasers();
   		
   		// Check collisions
   		var contCheck = true;
   		
   		if (players.length > 0) {
   			for (var j = 0, k = players.length; j < k; j++){
				if (players[j].getAlive()){
					
					// Check collision with obstacles
					for (var i = 0, l = obstacles.length; i < l; i++){
						if (MathHelper.envCollision(obstacles[i], players[j].getX(), players[j].getY(), players[j].getRadius())){
							contCheck = false;
							
							players[j].kill();
							socket.sockets.emit("kill player",{
	   							type: "suicide",
	   							killed_id: players[j].id,
	   							killer_id: "-"
	   						});
	   						break;
						}
					}
					
					// Check collision with edge of map
					if (contCheck){
						if(players[j].getX() < 0 || players[j].getX() > 1200 
							|| players[j].getY() < 0 || players[j].getY() > 1200){
							// Do not check for other collisions
							contCheck = false;
	   						
	   						// Then kill the player
	   						players[j].kill();
	   						
	   						// Broadcast kill message to all clients
	   						socket.sockets.emit("kill player",{
	   							type: "suicide",
	   							killed_id: players[j].id,
	   							killer_id: "-"
	   						});
						}
					}
					
					// LASER Collisions
					// If the above laser collision check returns false, continue checking
					if (contCheck){
						if (lasers.length > 0){
							for (var i = 0, l = lasers.length; i < l; i++){
								if(typeof lasers[i] != "undefined"){
									if (MathHelper.laserCollision(players[j].getX(), players[j].getY(), players[j].getRadius(), 
			       						lasers[i].getX(), lasers[i].getY())){
		       							
			       						// Make sure the laser colliding is not our own!
			       						if (lasers[i].getOwner() != players[j].id){
			       							contCheck = false;
				       						lasers[i].setAlive(false);
				       						players[j].kill();
				       						
				       						// Add score
				       						var killer = playerById(lasers[i].getOwner());
				       						killer.addScore(1);
				       						
				       						socket.sockets.emit("kill player",{
				       							type: "kill",
				       							killed_id: players[j].id,
				       							killer_id: killer.id
				       						});
				       						break;
			       						}
			       					}else{
			       						continue;
			       					}
								}
							}
						}
					}
					
					// PLAYER TO PLAYER Collisions
					if (contCheck){
						for (var i = 0, l = players.length; i < l; i++){
							if (players[i].id != players[j].id){
								if (players[i].getAlive()){
									if (MathHelper.laserCollision(players[j].getX(), players[j].getY(), players[j].getRadius(), 
		       							players[i].getX(), players[i].getY())){
		       							contCheck = false;
			       						players[i].kill();
			       						players[j].kill();
			       						socket.sockets.emit("kill player",{
			       							type: "double suicide",
			       							killed_id: players[j].id,
			       							killer_id: players[i].id
			       						});
		       						}
								}
							}
						}
					}
				
				}else{
					// Monitor Dead player respawn time
					if (players[j].checkRespawnTime()){
		   				// If player has respawned, notify all clients
		   				socket.sockets.emit("revive player",{
							id: players[j].id,
							x: players[j].getX(),
							y: players[j].getY()
						});
		   			}
				}
			}
   		}
    }, tickRate);
};

function sendSnapShots(){
	if (players.length > 0){
		// Loop through each player
		for (var i = 0, l = players.length; i < l; i++){
			var playerData = [];
			for (var j = 0, k = players.length; j < k; j++){
				if (players[j].id != players[i].id){
					playerData.push({
						id: players[j].id,
						x: players[j].getX(),
						y: players[j].getY(),
						rot: players[j].getRotation(),
						thrusting: players[j].getThrusting()
					});
				}
			}
			if (playerData.length > 0){
				// Send world snapshot updates to the player
				clients[players[i].id].volatile.emit("snapshot", {
					players: playerData
				});
			}else{
				// Send empty world snapshot to player (no updates detected)
				clients[players[i].id].volatile.emit("snapshot", {
					
				});
			}
   		}
	}
};

function moveLasers(){
	if (lasers.length > 0){
		var lasersToRemove = [];
		for (var i = 0, l = lasers.length; i < l; i++){
			if (lasers[i].getAlive()){		// If laser is alive
				lasers[i].move();
			}else{
   				lasersToRemove.push(i);
   			}
		}
		if (lasersToRemove.length > 0){
   			for (var j = 0, k = lasersToRemove.length; j < k; j++){
   				// Remove dead lasers from the lasers array
   				lasers.splice(lasersToRemove[j], 1);
   			}
   		}
	}
};

var setEventHandlers = function(){
    socket.sockets.on("connection", onSocketConnection);
};

function onSocketConnection(client){
	util.log("New player has connected: "+client.id);
	clients[client.id] = client;
	
	var timeStamp = new Date();
	
	// Wait for client response
	client.on("ping", onPing);
    client.on("disconnect", onClientDisconnect);
    client.on("new player", onNewPlayer);
    client.on("input", onInput);
    client.on("stop thrust player", onStopThrustPlayer);
    client.on("chat", onChat);
}

function onInput(data){
	var timeStamp = new Date();
	var player = playerById(this.id);

    if (!player){
        util.log("Player not found: "+this.id);
        return;
    }
    // Player has made a move, no longer inactive.
    player.reduceTime();
    
    if (data.up){			// If "up arrow" input is detected
    	player.thrust();
    	player.updatePlayerPos();
    }
    
    if (data.left){			// "left arrow"
    	player.rotate("left");
    }
    
    if (data.right){		// "right arrow"
    	player.rotate("right");
    }
    
    if (data.space){
    	var laser = player.fire(timeStamp.valueOf());
    	if (typeof laser != "undefined"){
    		// If we successfully fired a laser, push it into the array of lasers
    		laser.setId(laserId++);
    		lasers.push(laser);
    		
    		// Broadcast laser vector and laser firing position to all clients
    		socket.sockets.emit("fire",{
	    		time: timeStamp.valueOf(),
	    		pid: player.id,
	    		lid: laser.getId(),
	    		x: player.getX(),
	    		y: player.getY(),
	    		rot: laser.getRotation(),
	    		vx: laser.getVector().getX(),
	    		vy: laser.getVector().getY()
	    	});
	    	// util.log("Emitting Firing data to all clients...");
    	}
    };
    
    this.emit("new position",{		// Send back to client the new position
    	time: data.time,
    	x: player.getX(),
    	y: player.getY(),
    	rot: player.getRotation()
    });
}

function onPing(data){
	this.emit("pong", {
		client: data.ping
	});
}

function onClientDisconnect(){
    util.log("Player has disconnected: "+this.id);
   	var player = playerById(this.id);

	if (!player){
	    util.log("Player not found: "+this.id);
	    return;
	};
	
	usedColors.splice(usedColors.indexOf(player.getColor()), 1);
	players.splice(players.indexOf(player), 1);
	//clients.splice(this.id, 1);
	this.broadcast.emit("remove player", {id: this.id});
}

function onNewPlayer(data){
	var randX = MathHelper.randomInt(350, 850);
	var randY = MathHelper.randomInt(350, 850);
	var playerColor = randomizeColor();
	
	var newPlayer = new Player(randX, randY, playerColor, data.name);
	newPlayer.id = this.id;		// this refers to the interacting client
	
	// Send the new Player's data to all clients. (Including the interacting client)
	socket.sockets.emit("new player",{
		id: newPlayer.id, 
		name: newPlayer.getName(),
		x: newPlayer.getX(), 
		y: newPlayer.getY(),
		color: newPlayer.getColor(),
		rot: newPlayer.getRotation(),
		score: 0
	})
    	
	// Send ALL OTHER EXISTING players data to the interacting client
	if (players.length > 0){
		var i, existingPlayer;
		for (i = 0, l = players.length; i < l; i++){
			if (typeof players[i] != "undefined" && players[i] != null){
				existingPlayer = players[i];
		    	this.emit("new player", 
		    	{
		    		id: existingPlayer.id, 
		    		name: existingPlayer.getName(),
		    		x: existingPlayer.getX(), 
		    		y: existingPlayer.getY(),
		    		vx: existingPlayer.getVector().getX(),
					vy: existingPlayer.getVector().getY(),
					color: existingPlayer.getColor(),
					rot: existingPlayer.getRotation(),
					score: existingPlayer.getScore()
		    	});
			}
		}
    }
    // Push the new player into the list of players
    players.push(newPlayer);
}

function onStopThrustPlayer(data){
    var player = playerById(this.id);
	
    if (!player){
        util.log("Player not found: "+this.id);
        return;
    }
    player.stopThrust(data.x, data.y);
}

function onChat(data){
	var player = playerById(this.id);
	
    if (!player){
        util.log("Player not found: "+this.id);
        return;
    }
    // Player is no longer inactive
    player.reduceTime();
    
    // Broadcast chat msg to all clients
    socket.sockets.emit("chat",{
		msg: data.msg,
		name: player.getName()
	});
    
};

function randomizeColor(){
	//var chosen = false;
	var randomNumber;
	var numOfColors = COLORS.length - 1;
	
	randomNumber = MathHelper.randomInt(0, numOfColors);
	return COLORS[randomNumber];
	
	// While we have not chosen a color
	/*while(chosen === false){
		randomNumber = MathHelper.randomInt(0, numOfColors);
		//var taken = false;
		
		return COLORS[randomNumber];	
		
		if (usedColors.length != 0){
			if (usedColors.indexOf(COLORS[randomNumber]) === -1){ 	// Check if the color is already used.
				// Color not found. Can be used.
				usedColors.push(COLORS[randomNumber]);
				chosen = true;
				return COLORS[randomNumber];
			}
			
		}else{
			usedColors.push(COLORS[randomNumber]);
			chosen = true;
			//console.log(colors[randomNumber]);
			return COLORS[randomNumber];
		}
	}*/
	
	//return colors[randomNumber];
}

function playerById(id){
    var i;
    for (i = 0; i < players.length; i++) {
        if (players[i].id == id)
            return players[i];
    };
    return false;
}

init();