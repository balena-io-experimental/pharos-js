'use strict';

const
	_     = require('lodash'),
  sense = require('node-sense-hat')

module.exports = class Buffer {
  constructor() {
    const buffer = []

    for (let x= 0; x < 8; x++) {
      buffer[x] = []

      for (let y = 0; y < 8; y++) {
        buffer[x][y] = [0, 0, 0]
      }
    }

    this.pixels = buffer
  }

  setPixel(x, y, value) {
    this.pixels[y][x] = value
  }

  write() {
    sense.Leds.setPixels(_.reverse(_.flatten(_.map(this.pixels, (row) => {
      return _.reverse(row)
    }))))
  }
}

