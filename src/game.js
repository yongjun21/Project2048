'use strict';

var speed = 120;

var grid = document.getElementById('grid');
var gridState = [];

class Tile {
  constructor (left, top) {
    this.div = null;
    this.gc = null;
    this.value = 0;
    this.left = left;
    this.top = top;
  }

  update (origin) {
    if (this.value) this.gc = this.div;
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
        self.value += 1;
        self.div.textContent = Math.pow(2, self.value);
      }
    };
    this.div.addEventListener('transitionend', listener);
    this.div.style.transitionDuration = duration * speed + 'ms';
    this.div.style.left = this.left + 'px';
    this.div.style.top = this.top + 'px';
  }
}

// Initialization
for (var y = 15; y <= 510; y += 165) {
  for (var x = 15; x <= 510; x += 165) {
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
  div.classList.add('two');
  div.textContent = '2';
  div.style.left = gridState[pos].left + 'px';
  div.style.top = gridState[pos].top + 'px';
  grid.appendChild(div);
  gridState[pos].div = div;
  gridState[pos].value = 1;
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
        if (duration) gridState[target].update(current).slide(duration);
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
  window.setTimeout(function () {
    if (delay) generateTile();
    document.addEventListener('keydown', listener);
  }, (delay + 1) * speed);
};

generateTile();
generateTile();
document.addEventListener('keydown', listener);
