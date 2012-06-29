var MathHelper = require('./mathlib');

var Powerup = function(theVector, theType, theX, theY)
{
	var vector = theVector,
		type = theType,
		x = theX,
		y = theY,
		
		alive = true,				// True to render, false to remove
		MAX_VELOCITY = 4.0;
	
	var getId = function(){
		return id;
	};
	
	return{
		getId: getId
	}
};

exports.Powerup = Powerup;