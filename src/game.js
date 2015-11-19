'use strict';

var speed = 120;

var grid = document.getElementById('grid');
var elapsedP = document.getElementById('elapsed');
var movesP = document.getElementById('moves');
var scoreP = document.getElementById('score');
var gridState = [];
var elapsed = 0;
var moves = 0;
var score = 0;

var tileColor = ['#EEE6DB', '#ECE0C8', '#EFB27C', '#F39768',
                 '#F37D63', '#F46042', '#EACF76', '#EDCB67',
                 '#ECC85A', '#E7C257', '#E8BE4E', '#EF676B',
                 '#EE4D59', '#E14239', '#72B3D5', '#5C9FDF',
                 '#007CBD'];

class Tile {
  constructor (left, top) {
    this.div = null;
    this.gc = null;
    this.value = 0;
    this.left = left;
    this.top = top;
  }

  increment () {
    this.value++;
    if (this.value > 2) this.div.classList.add('white-font');
    if (this.value > 6) this.div.classList.add('small-font');
    if (this.value > 9) this.div.classList.add('smaller-font');
    if (this.value > 16) this.div.classList.add('smallest-font');
    this.div.style.backgroundColor = tileColor[this.value - 1];
    this.div.textContent = Math.pow(2, this.value);
  }

  substitute (origin) {
    if (this.value) {
      this.gc = this.div;
    }
    this.div = gridState[origin].div;
    this.value = gridState[origin].value;
    gridState[origin].div = null;
    gridState[origin].value = 0;
    return this;
  }

  slide (duration) {
    var self = this;
    var listener = function (event) {
      self.div.removeEventListener('transitionend', listener);
      if (self.gc && self.gc !== event.target) {
        grid.removeChild(self.gc);
        self.gc = null;
        self.increment();
        score += Math.pow(2, self.value);
        scoreP.textContent = score;
      }
    };
    this.div.addEventListener('transitionend', listener);
    this.div.style.transitionDuration = duration * speed + 'ms';
    this.div.style.left = this.left + 'px';
    this.div.style.top = this.top + 'px';
  }
}

// Initialization
for (var y = 0; y <= 330; y += 110) {
  for (var x = 0; x <= 330; x += 110) {
    gridState.push(new Tile(x, y));
  }
}

function generateTile (pos) {
  var emptySlot = gridState.reduce(function (acc, val, idx) {
    if (!val.value) acc.push(idx);
    return acc;
  }, []);
  if (!emptySlot) return;
  if (!(pos + 1)) pos = emptySlot[Math.floor(Math.random() * emptySlot.length)];
  var div = document.createElement('div');
  div.classList.add('tile');
  div.classList.add('new');
  div.style.left = gridState[pos].left + 'px';
  div.style.top = gridState[pos].top + 'px';
  grid.appendChild(div);
  gridState[pos].div = div;
  gridState[pos].value = Math.random() < 0.1 ? 1 : 0;
  gridState[pos].increment();
  div.style.transitionDuration = speed + 'ms';
  setTimeout(function () {
    div.classList.remove('new');
  }, 20);
}

function slideTiles (smallStep, bigStep) {
  var delay = 0;
  var duration = 0;
  var current = smallStep > 0 ? 0 : 15;
  var outerLoop, innerLoop;
  var prev, target;
  outerLoop = 0;
  while (outerLoop++ < 4) {
    prev = 0;
    target = current - smallStep;
    innerLoop = 0;
    while (innerLoop++ < 4) {
      if (gridState[current].value) {
        if (gridState[current].value === prev) {
          prev = 0;
        } else {
          prev = gridState[current].value;
          target += smallStep;
        }
        duration = (current - target) / smallStep;
        if (duration) gridState[target].substitute(current).slide(duration);
        delay = Math.max(delay, duration);
      }
      current += smallStep;
    }
    current += bigStep;
  }
  return delay;
}

var listener = function (event) {
  document.removeEventListener('keydown', listener);
  var delay =
    event.keyCode === 37 ? slideTiles(1, 0)
    : event.keyCode === 38 ? slideTiles(4, -15)
    : event.keyCode === 39 ? slideTiles(-1, 0)
    : event.keyCode === 40 ? slideTiles(-4, 15) : 0;
  setTimeout(function () {
    if (delay) {
      moves++;
      movesP.textContent = moves;
      generateTile();
    }
    document.addEventListener('keydown', listener);
  }, delay * speed);
};

setInterval(function () {
  elapsed++;
  var second = elapsed % 60;
  var minute = (elapsed - second) % 3600 / 60;
  var hour = Math.floor((elapsed - 60 * minute - second) / 3600);
  elapsedP.textContent = hour
    ? hour + ':' + (minute < 10 ? '0' + minute : minute) + 'h'
    : minute + ':' + (second < 10 ? '0' + second : second);
}, 1000);

generateTile();
generateTile();
document.addEventListener('keydown', listener);
