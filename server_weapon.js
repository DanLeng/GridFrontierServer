/**
 * Laser (Fired projectiles)
 * @class Laser
 * 
 */
var MathHelper = require('./mathlib');

var Laser = function(theOwner, theRotation, theVector, playerX, playerY)
{
	var vector = theVector,
		rotation = theRotation,
		owner = theOwner,			// Player ID who fired the Laser
		x = playerX,
		y = playerY,
		
		id = 0,
		
		range = 300.0,				// Flight range of laser
		
		alive = true,				// True to render, false to remove
		MAX_LASER_VELOCITY = 5.0,	// Captain Obvious?
		LASER_RADIUS = 1.5;
	
	var getId = function(){
		return id;
	};
		
	var getOwner = function(){
		return owner;
	};
	
	var getX = function(){
		return x;
	};
	
	var getY = function(){
		return y;
	};
	
	var getVector = function(){
		return vector;
	};
	
	var getRotation = function(){
		return rotation;
	};
	
	var getAlive = function(){
		return alive;
	};
	
	var setId = function(newId){
		id = newId;
	};
	
	var setAlive = function(status){
		alive = status;
	};
	
	var move = function(){
		// If we have not exceeded the laser's flight range
		if (range > 0){
			// Scale the Laser's vector to avoid going over the Max Velocity
			if (vector.length() > MAX_LASER_VELOCITY)
            {
               	vector.scale(MAX_LASER_VELOCITY / vector.length());
            }
            
            // Move the graphic!
			x += vector.getX();
			y += vector.getY();
			range -= vector.length();
		
		}else{
			// Set it as dead
			alive = false;
		}
	};
	
	return{
		getId: getId,
		getOwner: getOwner,
		getX: getX,
		getY: getY,
		getVector: getVector,
		getRotation: getRotation,
		getAlive: getAlive,
		setId: setId,
		setAlive: setAlive,
		move: move
	}
};

exports.Laser = Laser;