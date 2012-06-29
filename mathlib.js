/**
 * Math Library Helper
 *
 * Server-side Math Library. Only functions/variables with the exports. prefix are exported for use.
 * Copyright (C) Daniel Leng JianJun
 */

var DEG = 180.0/Math.PI;
var MAXDEG = 360.0;
var RAD = Math.PI/180.0;
var MAXRAD = 360.0*RAD;
var PI = Math.PI;
var TWOPI = Math.PI*2;
var ONEOPI = 1.0 / Math.PI;
var PIO2 = Math.PI/2;
var PIO4 = Math.PI/4;
var PIO8 = Math.PI/8;
var PIO16 = Math.PI/16;
var PIO32 = Math.PI/32;

var Rnd = Math.random;
var Sin = Math.sin;
var ASin = Math.asin;
var Cos = Math.cos;
var ACos = Math.acos;
var Sqrt = Math.sqrt;
var Pow = Math.pow;
var Floor = Math.floor;
var Atan2 = Math.atan2;
var Ceil = Math.ceil;
var Round = Math.round;
var Min = Math.min;
var Max = Math.max;

exports.DEG = DEG;
exports.MAXDEG = MAXDEG;
exports.RAD = RAD;
exports.MAXRAD = MAXRAD;
exports.PI = PI;
exports.TWOPI = TWOPI;
exports.ONEOPI = ONEOPI;
exports.PIO2 = PIO2;
exports.PIO4 = PIO4;
exports.PIO8 = PIO8;
exports.PIO16 = PIO16;
exports.PIO32 = PIO32;

exports.Rnd = Rnd;
exports.Sin = Sin;
exports.ASin = ASin;
exports.Cos = Cos;
exports.ACos = ACos;
exports.Sqrt = Sqrt;
exports.Pow = Pow;
exports.Floor = Floor;
exports.Atan2 = Atan2;
exports.Ceil = Ceil;
exports.Round = Round;

/**
 * Vector
 * @class Vector
 */
var Vector = function(_x, _y){
    var x = _x,
        y = _y;

    var getX = function(){
        return x;
    };

    var getY = function(){
        return y;
    };

    var clone = function()
    {
        return new Vector(x, y);
    };

    var norm = function()
    {
        var len = length();
        if (len === 0){
            x = 0;
            y = 0;
        }else{
            x /= len;
            y /= len;
        }

        return this;
    };

    var set = function(v)
    {
        x = v.getX();
        y = v.getY();
        return this;
    };

    var add = function(v)
    {
        x += v.getX();
        y += v.getY();
        return this;
    };

    var sub = function(v)
    {
        x -= v.getX();
        y -= v.getY();
        return this;
    };

    var dot = function(v)
    {
        return x * v.getX() + y * v.getY();
    };
    
    var scalePercent = function(v)
    {
    	x *= v.getX();
    	y *= v.getY();
        return this;
    };

    var length = function()
    {
        return Sqrt(x * x + y * y);
    };

    // Angle of the vector
    var theta = function()
    {
        return Atan2(y, x);
    };

    var thetaTo = function(vec)
    {
        // calc angle between the two vectors
        var v = clone().norm(),
            w = vec.clone().norm();
        return ACos(v.dot(w));
    };

    var thetaTo2 = function(vec)
    {
        return Atan2(vec.y, vec.x) - Atan2(y, x);
    };

    var rotate = function(a)
    {
        var ca = Cos(a),
            sa = Sin(a);
        with (this)
        {
            var rx = x*ca - y*sa,
                ry = x*sa + y*ca;
            x = rx;
            y = ry;
        }
        return this;
    };

    var invert = function()
    {
        x = -x;
        y = -y;
        return this;
    };

    var scale = function(s)
    {
        x *= s;
        y *= s;
        return this;
    };

    return{
        getX: getX,
        getY: getY,
        clone: clone,
        norm: norm,
        set: set,
        add: add,
        sub: sub,
        dot: dot,
        scalePercent: scalePercent,
        length: length,
        theta:theta,
        thetaTo: thetaTo,
        thetaTo2: thetaTo2,
        rotate: rotate,
        invert: invert,
        scale: scale
    }
};
exports.Vector = Vector;

exports.randomInt = function(low, high)
{
   return ~~(Rnd() * (high - low + 1) + low);
};

exports.weightedRandom = function(weight)
{
   var input = Rnd();
   if (input < 0.5) return 1 - Pow(1 - input, weight !== undefined ? weight : 2) / 2;
   return 0.5 + Pow((input - 0.5) * 2, weight !== undefined ? weight : 2) / 2;
};

exports.laserCollision = function(playerX, playerY, playerRadius, laserX, laserY)
{
	var square_dist = Pow((playerX - laserX), 2) + Pow((playerY - laserY), 2);
	var square_rad = Pow(playerRadius, 2);
	
	if (square_dist <= square_rad){
		return true;
	}else{
		return false;
	}
};

var clampVal = function(value, min, max) {
  	return Min(Max(value, min), max);
};

exports.envCollision = function(obstacle, playerX, playerY, playerRadius)
{
	// clamp(value, min, max) - limits value to the range min..max
	
	// Find the closest point to the circle within the rectangle
	var closestX = clampVal(playerX, obstacle.x, obstacle.right);
	var closestY = clampVal(playerY, obstacle.y, obstacle.bottom);
	
	// Calculate the distance between the circle's center and this closest point
	var distanceX = playerX - closestX;
	var distanceY = playerY - closestY;
	
	// If the distance is less than the circle's radius, an intersection occurs
	var distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
	return distanceSquared < (playerRadius * playerRadius);
};
