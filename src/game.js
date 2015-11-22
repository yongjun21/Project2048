'use strict';

var speed = 100;
var swipeThreshold = 80;

var grid = document.getElementById('grid');
var touchZone = document.getElementById('touchZone');
var elapsedP = document.getElementById('elapsed');
var movesP = document.getElementById('moves');
var scoreP = document.getElementById('score');
var gridState = [];
var animatingElem = 0;
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
    animatingElem++;
    var listener = this.gc ? function (event) {
      this.div.removeEventListener('transitionend', listener);
      grid.removeChild(this.gc);
      this.gc = null;
      this.increment();
      score += Math.pow(2, this.value);
      scoreP.textContent = score;
      animatingElem--;
    } : function (event) {
      this.div.removeEventListener('transitionend', listener);
      animatingElem--;
    };
    listener = listener.bind(this);
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
  div.style.left = gridState[pos].left + 'px';
  div.style.top = gridState[pos].top + 'px';
  gridState[pos].div = div;
  gridState[pos].value = Math.random() < 0.1 ? 1 : 0;
  gridState[pos].increment();
  grid.appendChild(div);
}

function slideTiles (smallStep, bigStep) {
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
  if (animatingElem) {
    movesP.textContent = ++moves;
    var completeSlide = function () {
      if (animatingElem) window.requestAnimationFrame(completeSlide);
      else {
        generateTile();
        slideLock = false;
      }
    };
    window.requestAnimationFrame(completeSlide);
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
