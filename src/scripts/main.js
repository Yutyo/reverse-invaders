/*
██████--███████-██---██-███████-██████--███████-███████<br/>
██---██-██------██---██-██------██---██-██------██-----<br/>
██████--█████---██---██-█████---██████--███████-█████--<br/>
██---██-██-------██-██--██------██---██------██-██-----<br/>
██---██-███████---███---███████-██---██-███████-███████<br/>
<br/>
██-███----██-██---██--█████--██████--███████-██████--███████<br/>
██-████---██-██---██-██---██-██---██-██------██---██-██-----<br/>
██-██-██--██-██---██-███████-██---██-█████---██████--███████<br/>
██-██--██-██--██-██--██---██-██---██-██------██---██------██<br/>
██-██---████---███---██---██-██████--███████-██---██-███████<br/>
*/

import Aliens from './game/aliens';
import Player from './game/player';
import Audio from './util/audio';
import Events from './util/events';
import Navigation from './util/navigation';
import GameLoop from './util/gameLoop';
import { random } from './util/random';
import { colorYellow, colorGreen } from './game/colors';
import center from './util/center';
import './interface/ghosting';
import './interface/mobileCheck';
import './interface/scaling';
import isMonetized from './util/monetization';
import Storage from './util/storage';

let storage = new Storage();
let canvas = document.getElementById('mainCanvas');
let context = canvas.getContext('2d');

canvas.gutter = 10;

let aliens;
let player;
let loop;
let startTime;

let audio = new Audio();
let events = new Events();
let navigation = new Navigation();

const sparksLife = isMonetized() ? 160 : 80;

function newGame() {
	navigation.go('game');

	aliens = new Aliens(canvas, context, audio, events);
	player = new Player(canvas, context, audio, events, aliens);

	startTime = new Date();

	if (loop && loop.stop) {
		loop.stop();
	}

	loop = new GameLoop({
		update: function () {
			player.update();
			aliens.update();
		},
		render: function () {
			context.clearRect(0, 0, canvas.width, canvas.height);
			player.render();
			aliens.render();
		}
	});

	loop.start();
}

events.on('ALIENS_REACHED_BOTTOM', () => {
	events.emit('ALIENS_WIN');
});

events.on('ALL_ALIENS_DEAD', () => {
	events.emit('GAME_END', 'failure');
});

events.on('ALIEN_KILLED', (alien) => {
	alien.alive = false;

	audio.play('blow');

	createSparks(aliens, alien, colorYellow);
});

events.on('PLAYER_LOSE_LIFE', () => {
	player.lives -= 1;
	player.updateDisplay();

	audio.play('explosion');
	createSparks(player, player.sprite, colorGreen);

	if (player.lives <= 0) {
		events.emit('ALIENS_WIN');
	} else {
		player.respawn();
	}
});

events.on('ALIENS_WIN', () => {
	events.emit('GAME_END', 'success');
});

events.on('GAME_END', (result) => {
	loop.stop();
	navigation.go('results');
	document.getElementById('results').setAttribute('class', result);
	
	let finalScore = getFinalScore();
	let highScore = getHighScore(finalScore);
	document.getElementById('score').innerHTML = formatScore(finalScore);
	document.getElementById('highscore').innerHTML = formatScore(highScore);
});


// Navigate between screens
document.addEventListener('keydown', (event) => {
	if (event.keyCode === 13 || event.keyCode === 32) {
		handleNavigation();
	}
});
document.addEventListener('click', handleNavigation);

function handleNavigation() {
	switch (navigation.current) {
	case 'intro':
		newGame();
		break;
	case 'results':
		newGame();
		break;
	}
}

function getFinalScore() {
	let endTime = new Date();
	let seconds = (endTime - startTime) / 1000;
	const longestTime = (5 * 1000);

	let finalScore = longestTime - seconds;
	finalScore += (aliens.getAlive().length * 2000);
	finalScore = Math.round(finalScore);

	if (finalScore < 0) {
		finalScore = 0;
	}

	return finalScore;
}

function getHighScore(currentScore) {
	let highScore = parseInt(storage.get('highscore'));
	if (!highScore) {
		highScore = 0;
	}

	if (currentScore >= highScore) {
		highScore = currentScore;
		storage.set('highscore', highScore);
	}

	return highScore;
}

// Format scores with commas
function formatScore(score) {
	return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function createSparks(owner, source, color) {
	for (let x = 0; x < random(20, 40); x++) {
		let size = 5;

		owner.sparks.get({
			context: context,
			x: source.x + (source.width / 2),
			y: source.y + (source.height / 2),
			color: color,
			width: size,
			height: size,
			anchor: center,
			dx: random(-300, 300) / 100,
			dy: random(-300, 300) / 100,
			ttl: random(20, sparksLife)
		});
	}
}

navigation.go('intro');
