let SoundFX = (function () {
	let soundContext = new (window.AudioContext || window.webkitAudioContext)();
	let oscTypes = ['square', 'sawtooth', 'triangle', 'sine'];
	let volume = 1;

	function makeDistortionCurve(amount) {
		let k = typeof amount === 'number' ? amount : 50,
			n_samples = 44100,
			curve = new Float32Array(n_samples),
			deg = Math.PI / 180,
			i = 0,
			x;
		for (; i < n_samples; ++i) {
			x = i * 2 / n_samples - 1;
			curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
		}
		return curve;
	}

	// start frequency HZ, frequency change, delay between changes, number of changes, volume, type (optional)
	function playSound(_freq, _incr, _delay, _times, _vol, _type) {
		let oscillator = soundContext.createOscillator(); // instantiate oscillator
		oscillator.frequency.value = _freq;
		oscillator.type = oscTypes[_type || 0];

		let modulationGain = soundContext.createGain(); // instantiate modulation for sound volume control
		modulationGain.gain.value = 0;

		let distortion = soundContext.createWaveShaper();
		distortion.curve = makeDistortionCurve(800);
		distortion.oversample = '8x';

		oscillator.connect(distortion);
		distortion.connect(modulationGain);
		modulationGain.connect(soundContext.destination);
		oscillator.start();

		let i = 0;
		let interval = setInterval(playTune, _delay);

		function playTune() {
			oscillator.frequency.value = _freq + _incr * i;
			modulationGain.gain.value = (1 - (i / _times)) * _vol * volume;
			i++;
			if (i > _times) {
				clearInterval(interval);
				setTimeout(stopTune, _delay + _times); // prevents the clicky-glitch sound when stopping the oscillator
			}
		}
		function stopTune() {
			oscillator.stop();
		}
	}
	return {
		playSound: playSound,
		getVolume: function () {
			return _volume;
		},
		setVolume: function (_volume) {
			volume = _volume;
		},
		jump: function () {
			playSound(150, 30, 15, 20, 0.5);
		},
		pew: function () {
			playSound(920, -80, 20, 15, 0.5);
		},
		zap: function () {
			playSound(500, -200, 40, 10, 0.25, 1);
		},
		bounce: function () {
			playSound(260, -60, 15, 15, 0.5, 2);
		},
		stuck: function () {
			playSound(100, -10, 15, 15, 1, 2);
		},
		explosion: function () {
			playSound(100, -10, 10, 25, 0.5);
			playSound(125, -5, 20, 45, 0.1, 1);
			playSound(40, 2, 20, 20, 1, 2);
			playSound(200, -4, 10, 100, 0.25, 2);
		},
		blow: function () {
			playSound(120, -6, 20, 15, 0.1, 1);
			playSound(40, -2, 20, 25, 1, 2);
			playSound(60, 10, 15, 15, 0.1, 1);
			playSound(160, -5, 20, 30, 0.1, 3);
		},
		shot: function () {
			playSound(160, 10, 15, 10, 0.1);
			playSound(250, -20, 30, 10, 0.1, 1);
			playSound(1500, -150, 30, 10, 0.1, 1);
		},
		coin: function () {
			playSound(510, 0, 15, 20, 0.1);
			setTimeout(function () { playSound(2600, 1, 10, 50, 0.2); }, 80);
		}
	};
})();

export default SoundFX;
