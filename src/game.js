'use strict';

var speed = 100;
var swipeThreshold = 80;

var async = require('async');
var grid = document.getElementById('grid');
var touchZone = document.getElementById('touchZone');
var elapsedP = document.getElementById('elapsed');
var movesP = document.getElementById('moves');
var scoreP = document.getElementById('score');
var gridState = [];
var animatingElem = [];
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
}

// Initialization
for (var y = 0; y < 4; y++) {
  for (var x = 0; x < 4; x++) {
    gridState.push(new Tile(x * 110, y * 110));
  }
}

function moveTile (origin, dest) {
  if (origin === dest) return;
  var duration = Math.abs(dest - origin);
  duration = duration > 3 ? duration / 4 : duration;
  gridState[origin].div.style.transitionDuration = duration * speed + 'ms';
  animatingElem.push({'div': gridState[origin].div,
                      'target': dest,
                      'increment': gridState[dest].div ? 1 : 0});
  if (gridState[dest].div) gridState[dest].gc = gridState[dest].div;
  gridState[dest].div = gridState[origin].div;
  gridState[dest].value = gridState[origin].value;
  gridState[origin].div = null;
  gridState[origin].value = 0;
}

function generateTile (pos) {
  var emptySlot = gridState.reduce(function (acc, val, idx) {
    if (!val.value) acc.push(idx);
    return acc;
  }, []);
  if (!emptySlot.length) return;
  if (!(pos + 1)) pos = emptySlot[Math.floor(Math.random() * emptySlot.length)];
  var div = document.createElement('div');
  div.classList.add('tile');
  div.style.left = gridState[pos].left + 'px';
  div.style.top = gridState[pos].top + 'px';
  gridState[pos].div = div;
  gridState[pos].value = Math.random() < 0.1 ? 1 : 0;
  gridState[pos].increment();
  grid.appendChild(div);
}

function slideTiles (smallStep, bigStep) {
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
        gridState[current].div.style.zIndex = innerLoop;
        if (gridState[current].value === prev) {
          prev = 0;
        } else {
          prev = gridState[current].value;
          target += smallStep;
        }
        moveTile(current, target);
      }
      current += smallStep;
    }
    current += bigStep;
  }
}

var slideLock = false;
var repeatCatcher = false;
var touchOrigin;
var swipeDirection = 0;

var triggerSlide = function (slideDirection) {
  if (slideLock) return;
  slideLock = true;
  repeatCatcher = true;
  if (slideDirection === 3) slideTiles(-1, 0);
  else if (slideDirection === 6) slideTiles(-4, 15);
  else if (slideDirection === 9) slideTiles(1, 0);
  else slideTiles(4, -15);
  if (animatingElem.length) {
    movesP.textContent = ++moves;
    async.forEach(animatingElem, function (elem, callback) {
      var listener = function (event) {
        elem.div.removeEventListener('transitionend', listener);
        if (elem.increment > 0) {
          gridState[elem.target].increment();
          score += Math.pow(2, gridState[elem.target].value);
          scoreP.textContent = score;
        }
        callback(null);
      };
      elem.div.addEventListener('transitionend', listener);
      elem.div.style.left = gridState[elem.target].left + 'px';
      elem.div.style.top = gridState[elem.target].top + 'px';
    }, function (err) {
      if (err) throw err;
      gridState.forEach(tile => {
        if (tile.gc) grid.removeChild(tile.gc);
        tile.gc = null;
      });
      animatingElem = [];
      generateTile();
      slideLock = false;
    });
  } else slideLock = false;
};

var resetEvent = function (event) {
  event.preventDefault();
  event.stopPropagation();
  swipeDirection = 0;
  repeatCatcher = false;
};

var keyPressHandler = function (event) {
  if (repeatCatcher) return;
  if (event.keyCode === 37) triggerSlide(9);
  else if (event.keyCode === 38) triggerSlide(12);
  else if (event.keyCode === 39) triggerSlide(3);
  else if (event.keyCode === 40) triggerSlide(6);
};

var swipeHandler = function (event) {
  if (repeatCatcher) return;
  event.preventDefault();
  event.stopPropagation();
  var touchObj = event.changedTouches[0];
  if (!touchOrigin) {
    touchOrigin = [touchObj.clientX, touchObj.clientY];
    swipeDirection = 0;
    return;
  }
  var deltaX = touchObj.clientX - touchOrigin[0];
  var deltaY = touchObj.clientY - touchOrigin[1];
  var angle = deltaY / deltaX;
  var calcDirection =
    Math.abs(angle) > 2
    ? (deltaY > 0 ? 6 : 12)
    : Math.abs(angle) < 0.5
    ? (deltaX > 0 ? 3 : 9) : 0;
  if (!calcDirection) {
    touchOrigin = [touchObj.clientX, touchObj.clientY];
    swipeDirection = 0;
    return;
  }
  if (swipeDirection !== calcDirection) {
    touchOrigin = [touchObj.clientX, touchObj.clientY];
    swipeDirection = calcDirection;
    return;
  }
  if (swipeDirection === 3 && deltaX > swipeThreshold) triggerSlide(3);
  else if (swipeDirection === 6 && deltaY > swipeThreshold) triggerSlide(6);
  else if (swipeDirection === 9 && deltaX < -swipeThreshold) triggerSlide(9);
  else if (swipeDirection === 12 && deltaY < -swipeThreshold) triggerSlide(12);
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

document.addEventListener('keyup', resetEvent);
document.addEventListener('keydown', keyPressHandler);
touchZone.addEventListener('touchstart', resetEvent);
touchZone.addEventListener('touchmove', swipeHandler);
touchZone.addEventListener('touchcancel', resetEvent);
touchZone.addEventListener('touchend', resetEvent);
