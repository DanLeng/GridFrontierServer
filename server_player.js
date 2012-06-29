/**
 * Server-side Player class
 * @class Player
 */

var MathHelper = require('./mathlib');
var Weapon = require('./server_weapon');

var Player = function(startX, startY, playerColor, playerName){
    // Attributes
    var x = startX,				// Current x and y positions
        y = startY,
        color = playerColor,
        name = playerName,
        
        id,							// Player ID
        
        score = 0,					// number of kills
        
        vector = new MathHelper.Vector(0, 0),
        rotation = 0.0,
        
        timeLastFired = 0,		// The time since we last fired our weapons
        
        alive = true,
        spawnTimer = 0.0,		// Player dies and awaits respawn
        
        thrusting = false,		// Thrusting currently?
        
        inactiveTime = 0,		// Amount of seconds player has been inactive
        
        THRUST_SPEED = 0.03,
        WEAPON_DELAY = 400,
        MAX_PLAYER_VELOCITY = 1.5,
        ROTATION_SPEED = MathHelper.MAXRAD/120,
        PLAYER_RADIUS = 11.0,
        DEATH_TIME = 4000;		// Time taken in miliseconds for players to respawn
    
    // Getters and Setters
    var getX = function(){
        return x;
    };
    var getY = function(){
        return y;
    };
    var getColor = function(){
    	return color;
    };
    var getName = function(){
    	return name;
    };
    var getVector = function(){
    	return vector;
    };
    var getRotation = function(){
    	return rotation;
    };
    var getRadius = function(){
    	return PLAYER_RADIUS;
    };
    var getAlive = function(){
    	return alive;
    };
    var getThrusting = function(){
    	return thrusting;
    };
    
    var setX = function(newX) {
        x = newX;
    };
    var setY = function(newY) {
        y = newY;
    };
    var setVector = function(newVector){
    	vector = newVector;
    };
    var setRotation = function(newRotation){
    	rotation = newRotation;
    };
    var setThrusting = function(flag){
    	thrusting = flag;
    };
    
    
    var thrust = function(){
		// Create a new vector
        var thrustVector = new MathHelper.Vector(THRUST_SPEED, 0.0);

        // Rotate the vector to face current Player's rotation
        thrustVector.rotate(rotation);

        // Finally add the vector to the player
        vector.add(thrustVector);

        // Player should not exceed MAX VELOCITY. If over max velocity, scale the
        // vector down. (Rather than not adding, or else player can't change directions
        //	at max velocity)
        if (vector.length() > MAX_PLAYER_VELOCITY)
        {
            vector.scale(MAX_PLAYER_VELOCITY / vector.length());
        }
        thrusting = true;
    };
    
    var stopThrust = function(x, y){
    	thrusting = false;
    	setVector(new MathHelper.Vector(0, 0));
    	
    	// Set the x and y positions to the last thrust-stop position from the client
    	setX(x);
    	setY(y);
    }
    
    var updatePlayerPos = function(){
        if (vector.length() > 0){
        	x += vector.getX();		// x and y position update
        	y += vector.getY();
    	}
    };
	
    var rotate = function(direction){
        if (direction === "left"){
            rotation -= ROTATION_SPEED;
            
        }else if (direction === "right"){
            rotation += ROTATION_SPEED;
        }
        
        normalizeRotation();
    };
     
    function normalizeRotation(){
    	// Normalizes the rotation value of the player
		if (rotation > MathHelper.MAXRAD){
			rotation -= (MathHelper.MAXRAD);
		
		}else if (rotation < -MathHelper.MAXRAD){
			rotation += (MathHelper.MAXRAD);
		
		}else if (rotation === MathHelper.MAXRAD || rotation === -MathHelper.MAXRAD){
			rotation = 0;
		}
	};

	var fire = function(time){
		// Check if we did not fire lasers too recently
		if (timeLastFired < (time - WEAPON_DELAY)){
			var laserVector = new MathHelper.Vector(8, 0);
			laserVector.rotate(rotation);
			var laser = new Weapon.Laser(this.id, rotation, laserVector, getX(), getY());
          	
          	// Reset the time last fired
          	timeLastFired = time;
          	
          	return laser;
		}
	};
	
	var kill = function(){
		thrusting = false;
		alive = false;
		setVector(new MathHelper.Vector (0,0));
		spawnTimer = new Date().valueOf() + DEATH_TIME;
	};
	
	var checkRespawnTime = function(){
		var now = new Date().valueOf();
		
		if (now < spawnTimer){
			return false;
		}else{
			alive = true;
			setVector(new MathHelper.Vector (0,0));
			setX(MathHelper.randomInt(350, 850));
			setY(MathHelper.randomInt(350, 850));
			spawnTimer = 0;
			
			return true;
		}
	};
	
	var addScore = function(add){
		score += add;
	};
	
	var getScore = function(){
		return score;
	};
	
	var getTime = function(){
		return inactiveTime;
	};
	
	var addTime = function(){
		// Add 10 seconds to the inactive timer counter
		inactiveTime += 10;
	};
	
	var reduceTime = function(){
		inactiveTime = 0;
	};

    return{
    	id: id,
    	
        getX: getX,
        getY: getY,
        getColor: getColor,
        getName: getName,
        getVector: getVector,
        getRotation: getRotation,
        getRadius: getRadius,
        getAlive: getAlive,
        getThrusting: getThrusting,
        
        setX: setX,
        setY: setY,
        setVector: setVector,
        setRotation: setRotation,
        
        setThrusting: setThrusting,
        thrust: thrust,
        stopThrust: stopThrust,
        
        rotate: rotate,
        updatePlayerPos: updatePlayerPos,
        fire: fire,
        kill: kill,
        checkRespawnTime: checkRespawnTime,
        
        addScore: addScore,
        getScore: getScore,
        
        getTime: getTime,
        addTime: addTime,
        reduceTime: reduceTime
    }
};

exports.Player = Player;