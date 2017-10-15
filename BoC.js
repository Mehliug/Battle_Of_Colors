const LATENCE = 100; //Latence en ms
const FREQUENCE_OBJ = 5; //fréquence d'actualisation de l'objet
const FREQUENCE_MISSILE = 90; //fréquence d'apparition des missiles
const FREQUENCE_VERIF_MISSILE = 20;
const DECALAGE_SOURIS_X = 4;
const DECALAGE_SOURIS_Y = 81;

var SPEED_OBJ = 0.5; //vitesse en px par FREQUENCE_OBJ
var SPEED_MISSILE = 0.3; //vitesse du missile en px par FREQUENCE_MISSILE

SPEED_OBJ *= FREQUENCE_OBJ;
SPEED_MISSILE *= FREQUENCE_MISSILE;

var ws = new WebSocket("ws://" + window.location.hostname + ":8080");
//var ws = new WebSocket("ws://localhost:8080");
var PosX = 50;
var PosY = 50;
var ownMissileID = 0;
var enemyMissileID = 0;

var ownMissiles = {};
var enemiesMissiles = {};
var ownPosition = {}; //Unused
var enemiesPosition = {};

var myScore = 0;
var enemyScore = 0;

var newMissile = false;
var intervalObject;


/***************************** KEYBOARD CONTROLE *****************************/
var topPressed = false;
var bottomPressed = false;
var rightPressed = false;
var leftPressed = false;
var nbPressed = 0;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {
	if (nbPressed == 0)
	{
		if(e.keyCode==90 || e.keyCode==83 || e.keyCode==81 || e.keyCode==68)
			intervalObject = setInterval(moveObject, FREQUENCE_OBJ);
		else
			return;
	} else if(nbPressed < 0 || nbPressed > 4) //--> Pas normale, mais ca arrive :)
	{
		nbPressed = 0;
		topPressed = false;
		bottomPressed = false;
		leftPressed = false;
		rightPressed = false;
		clearInterval(intervalObject);
	}

    switch(e.keyCode)
    {
	case 90: //HAUT -> touche z
		if (topPressed == false)
			nbPressed++;
		topPressed = true;
		break;
	case 83: //BAS -> touche s
		if (bottomPressed == false)
			nbPressed++;
		bottomPressed = true;
		break;
	case 81: //GAUCHE -> touche q
		if(leftPressed == false)
			nbPressed++;
		leftPressed = true;
		break;
	case 68: //DROITE -> touche d
		if(rightPressed == false)
			nbPressed++;
		rightPressed = true;
		break;
	}
}

function keyUpHandler(e) {
    switch(e.keyCode)
    {
	case 90: //HAUT -> touche z
		topPressed = false;
		nbPressed--;
		break;
	case 83: //BAS -> touche s
		bottomPressed = false;
		nbPressed--;
		break;
	case 81: //GAUCHE -> touche q
		leftPressed = false;
		nbPressed--;
		break;
	case 68: //DROITE -> touche d
		rightPressed = false;
		nbPressed--;
		break;
	}

	if (nbPressed == 0)
		clearInterval(intervalObject);
	else if(nbPressed < 0 || nbPressed > 4) //--> Pas normale, mais ca arrive :)
	{
		nbPressed = 0;
		topPressed = false;
		bottomPressed = false;
		leftPressed = false;
		rightPressed = false;
		clearInterval(intervalObject);
	}
}
/*****************************************************************************/


ws.onopen = function(event) {
	console.log("Connexion : OK !");

	//setInterval(moveObject, FREQUENCE_OBJ);
	setInterval(function () {
		for(let i in enemiesMissiles)
			verifMissile(enemiesMissiles, i, false);
	}, FREQUENCE_VERIF_MISSILE);

	setInterval(onclick, FREQUENCE_MISSILE);
	setInterval(sendToServer, LATENCE);
};

function moveObject()
{
	var rect = document.getElementById('rect');
	var myScorePosition = document.getElementById("My_Score_Static");

	//onclick();
	//sendToServer();

	if(topPressed && PosY-SPEED_OBJ>0)
		PosY -= SPEED_OBJ;
	
	if(bottomPressed && PosY+ SPEED_OBJ<document.getElementById("div").offsetHeight-5)
		PosY += SPEED_OBJ;

	if(leftPressed && PosX - SPEED_OBJ>0)
		PosX -= SPEED_OBJ;

	if(rightPressed && PosX + SPEED_OBJ<document.getElementById("div").offsetWidth)
		PosX += SPEED_OBJ;

	rect.style.transform = "translate(" + PosX + "px, " + PosY + "px)";
	myScorePosition.style.left = PosX-28 + "px";
	myScorePosition.style.top = PosY+30 + "px";
}

function verifMissile(tabMissiles, id_missile, a) 
{
	var missilePosX = tabMissiles[id_missile].PosXDepart + tabMissiles[id_missile].x;
	var missilePosY = tabMissiles[id_missile].PosYDepart + tabMissiles[id_missile].y;
	var distance;
	var missileSvgFill;

	if(a == false)
	{
		distance = Math.pow(Math.pow(missilePosX-PosX,2)+Math.pow(missilePosY-PosY,2),1/2); //----> A CHANGER (changer PosX et PosY en ownPosition...)
		if(distance < 26)
		{
			missileSvgFill = document.getElementById("rect");
			enemyScore++;
			document.getElementById("Score_Dynamic_enemy").textContent = enemyScore;

			missileSvgFill.style.fill = "orange";
			setTimeout(function (){
				missileSvgFill.style.fill = "blue";
			},100);

			setTimeout(function () {
				delElem('missile_group', ''+id_missile);
				delete tabMissiles[id_missile];
			}, FREQUENCE_OBJ-10);
		}
	} else {
		distance = Math.pow(Math.pow(missilePosX-enemiesPosition.PosX,2)+Math.pow(missilePosY-enemiesPosition.PosY,2),1/2); //----> A CHANGER (changer PosX et PosY en ownPosition...)
		if(distance < 26)
		{
			missileSvgFill = document.getElementById("rect2");

			missileSvgFill.style.fill = "orange";
			setTimeout(function (){
				missileSvgFill.style.fill = "red";
			},100);

			setTimeout(function () {
				delElem('missile_group', ''+id_missile);
				delete tabMissiles[id_missile];
			}, FREQUENCE_OBJ-10);
		}
	}
}

function onclick()
{
	var zone_jeux = document.getElementById('zone_jeux');
	zone_jeux.addEventListener("click", inter);
	
	for(let i in ownMissiles)
		moveMissile(ownMissiles, i, true);

	for(let i in enemiesMissiles)
		moveMissile(enemiesMissiles, i, false);
}

function inter(event) {
	createMissile(event, 0, 0, ownMissiles);
}

function createMissile(event, P_clientX, P_clientY, tabMissiles, PosXDepart, PosYDepart)
{
	var a;
	var PosX_;
	var PosY_;
	var Xm;
	var Ym;
	var missileID;
	var color;
	var Norme;
	var clientX;
	var	clientY;

	if(event != 0)
	{
		clientX = event.clientX - DECALAGE_SOURIS_X;
		clientY = event.clientY - DECALAGE_SOURIS_Y;
		Norme = Math.pow(Math.pow(clientX - PosX,2) + Math.pow(clientY - PosY,2), 1/2);

		PosX_ = PosX;
		PosY_ = PosY;
		
		Xm = (clientX - PosX) / Norme;
		Ym = (clientY - PosY) / Norme;

		if (ownMissileID<200)
			ownMissileID++;
		else {
			ownMissileID = 1;
			if(typeof(tabMissiles[ownMissileID]) != 'undefined')
			{
				delElem('missile_group', ''+ownMissileID);
				delete tabMissiles[ownMissileID];
			}
		}

		newMissile = true;
		missileID = 'own_missile_'+ownMissileID;
		color = '#75A0E9';
		a = true;
	} else {
		clientX = P_clientX;
		clientY = P_clientY;
		Norme = Math.pow(Math.pow(clientX - PosXDepart,2) + Math.pow(clientY - PosYDepart,2), 1/2);

		PosX_ = PosXDepart;
		PosY_ = PosYDepart;

		Xm = (clientX - PosXDepart) / Norme;
		Ym = (clientY - PosYDepart) / Norme;

		if (enemyMissileID<200)
			enemyMissileID++;
		else {
			enemyMissileID = 1;
			if(typeof(tabMissiles[enemyMissileID]) != 'undefined')
			{
				delElem('missile_group', ''+enemyMissileID);
				delete tabMissiles[enemyMissileID];
			}
		}

		missileID = 'enemy_missile_'+enemyMissileID;
		color = '#F67272';
		a = false;
	}

	tabMissiles[missileID] = {};	
	tabMissiles[missileID].x = Xm * SPEED_MISSILE;
	tabMissiles[missileID].y = Ym * SPEED_MISSILE;
	tabMissiles[missileID].Xm = Xm;
	tabMissiles[missileID].Ym = Ym;
	tabMissiles[missileID].PosXDepart = PosX_;
	tabMissiles[missileID].PosYDepart = PosY_;
	tabMissiles[missileID].clientX = clientX;
	tabMissiles[missileID].clientY = clientY;
	
	var missile = {
		cx: PosX_,
		cy: PosY_,
		r: 5,
		fill: color,
		id: missileID,
		class: 'missile',
		style: "transition: transform " + FREQUENCE_MISSILE + "ms linear;"
	};

	createElement(missile, 'circle', 'svg');
		
	moveMissile(tabMissiles, missileID, a);
	zone_jeux.removeEventListener("click", inter);
}

function moveMissile(tabMissiles, id_missile, a)
{
	var missilePosX;
	var missilePosY;

	missilePosX = tabMissiles[id_missile].PosXDepart + tabMissiles[id_missile].x;
	missilePosY = tabMissiles[id_missile].PosYDepart + tabMissiles[id_missile].y;

	if (missilePosX > 0 && missilePosX < document.getElementById("div").offsetWidth && missilePosY > 0 && missilePosY < document.getElementById("div").offsetHeight)
	{	
		var missile = document.getElementById(id_missile);
		missile.style.transform = "translate(" + tabMissiles[id_missile].x + "px, " + tabMissiles[id_missile].y + "px)";

		if (a) {
			verifMissile(tabMissiles, id_missile, a);
		}

		tabMissiles[id_missile].x = tabMissiles[id_missile].x + tabMissiles[id_missile].Xm * SPEED_MISSILE;
		tabMissiles[id_missile].y = tabMissiles[id_missile].y + tabMissiles[id_missile].Ym * SPEED_MISSILE;

	} else {
		delElem('missile_group', ''+id_missile);
		delete tabMissiles[id_missile];
	}				
}

/******** ENVOIS DU MESSAGE ********/
function sendToServer() {
	var size = Object.keys(ownMissiles).length;

	if(size > 0 && newMissile)
	{
		var tab = Object.keys(ownMissiles)[size-1];
		var msg = [PosX, PosY, ownMissiles[tab].clientX, ownMissiles[tab].clientY, enemyScore, ownMissiles[tab].PosXDepart, ownMissiles[tab].PosYDepart];
		ws.send(JSON.stringify(msg));
	}
	else {
		var msg = [PosX, PosY, 'Ndef', 'Ndef', enemyScore, 'Ndef', 'Ndef'];
		ws.send(JSON.stringify(msg));
	}
	newMissile = false;
}

/******** RECOIS DU MESSAGE ********/
ws.onmessage = function message(event) {
	var msg = JSON.parse(event.data);
	var rect2 = document.getElementById('rect2');
	var enemyScorePosition = document.getElementById("Score_Static_enemy");
	
	rect2.style.transform = "translate(" + msg[0] + "px, " + msg[1] + "px)";
	myScore = msg[4];
	document.getElementById("My_Score_Dynamic").textContent = myScore;
	
	enemyScorePosition.style.left = msg[0]-28 + "px";
	enemyScorePosition.style.top = msg[1]+30 + "px";

	enemiesPosition.PosX = msg[0];
	enemiesPosition.PosY = msg[1];

	if(msg[2] != 'Ndef')
		createMissile(0, msg[2], msg[3], enemiesMissiles, msg[5], msg[6]);
}

function createElement(el, balise_name, svg)
{
	var zone_jeux = document.getElementById("missile_group");
	var balise;

	if(svg == 'svg')
		balise = document.createElementNS("http://www.w3.org/2000/svg", ''+balise_name);
	else
		balise = document.createElement(''+balise_name);
		
	for (var i in el) {
		if (el.hasOwnProperty(i)) {
			if(i == 'strokeWidth')
				balise.setAttribute('stroke-width', ''+ el[i]);
			else 
				balise.setAttribute(''+ i, ''+ el[i]);
		}
	}
	zone_jeux.appendChild(balise);		
}

function getComputedTranslateY(obj)
{
	if(!window.getComputedStyle) 
		return;

	var style = getComputedStyle(obj),
	transform = style.transform || style.webkitTransform || style.mozTransform;

	var mat = transform.match(/^matrix\((.+)\)$/);

	return mat ? parseFloat(mat[1].split(', ')[5]) : 0;
}

function getComputedTranslateX(obj)
{
	if(!window.getComputedStyle) 
		return;
	
	var style = getComputedStyle(obj),
	transform = style.transform || style.webkitTransform || style.mozTransform;

	var mat = transform.match(/^matrix\((.+)\)$/);

	return mat ? parseFloat(mat[1].split(', ')[4]) : 0;
}

function delElem(parent, child)
{
	var obj = document.getElementById(parent);
	var old = document.getElementById(child);

	obj.removeChild(old);
}