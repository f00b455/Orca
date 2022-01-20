'use strict'

const sourceClock = 1
const sourceLink = 2

function ClockAbletonLink(client) {


  this.isPaused = false
  this.timer = null
  this.isPuppet = true
  this.puppetSource = 2
  this.fire = 1
  this.latency = 0.22
  this.latencyStep = 0.01

  this.speed = { value: 120, target: 120 }

  const abletonlink = require('abletonlink');
  this.link = new abletonlink();


  this.start = function () {
    console.log("clock start")
    const memory = parseInt(window.localStorage.getItem('bpm'))
    const target = memory >= 60 ? memory : 120
    this.setSpeed(target, target, true)
    this.play()
  }

  this.touch = function () {
  }

  this.run = function () {

  }

  this.isLinkEnabled = function () {
    return true
  }

  this.isExternalClockActive = function () {
    return false
  }

  this.setSpeed = (value, target = null, setTimer = false) => {
    console.log("clock setSpeed")
    if (this.speed.value === value && this.speed.target === target && this.timer) { return }
    if (value) { this.speed.value = clamp(value, 60, 300) }
    if (target) { this.speed.target = clamp(target, 60, 300) }
    if (setTimer === true) { this.setTimer(this.speed.value) }
    this.setTimer(this.speed.value)
    this.setFrame(0)
  }

  this.setSpeedLink = (value) => {
    console.log("clock setSpeedLink")
    this.link.setTempo(value)
    if (!this.link.isPlaying()) {
      this.setFrame(0)
      client.update()
    }
  }

  this.modSpeed = function (mod = 0, animate = false) {
    console.log("clock modSpeed")

    if (mod === 1) this.latency = this.latency + this.latencyStep;
    if (mod === -1) this.latency = this.latency - this.latencyStep;

    console.log(this.latency)
  }

  // Controls

  this.togglePlay = function (msg = false) {
    console.log("clock togglePlay")
    this.play(msg)
    if (this.isPaused === true) {
      this.play(msg)
    } else {
      this.stop(msg)
    }
    client.update()
  }

  this.play = function (msg = false, midiStart = false, linkStart = false) {
    this.isPaused = false
    this.setTimer(120)
  }

  this.stop = function (msg = false) {
    console.log('Clock', 'Stop')
  }

  // External Clock

  const pulse = {
    count: 0,
    last: null,
    timer: null,
    frame: 0  // paused frame counter
  }

  this.tap = function () {
  }

  this.untap = function () {
  }

  // LinkTimer

  this.setTimer = function (bpm) {
    console.log("setTimer")
    this.link.startUpdate(2, (beat, phase, bpm) => {
      var max = this.link.quantum * 4 // 16
      var pos = Math.floor(phase * 4 + 1 + this.latency)
      if (this.fire === pos) {
        client.io.midi.sendClock()
        client.run()
        this.fire++
        if (this.fire > max) this.fire = 1
      }
    });
  }

  this.clearTimer = function () {
  }

  this.setFrame = function (f) {
    if (isNaN(f)) { return }
    client.orca.f = clamp(f, 0, 9999999)
  }

  // UI

  this.getUIMessage = function (offset) {
    return `link ${this.speed.value}`
  }

  this.toString = function () {
    const diff = this.speed.target - this.speed.value
    const _offset = Math.abs(diff) > 5 ? (diff > 0 ? `+${diff}` : diff) : ''
    const _message = this.getUIMessage(_offset)
    const _beat = diff === 0 && client.orca.f % 4 === 0 ? '*' : ''
    return `${_message}${_beat}`
  }

  function clamp(v, min, max) { return v < min ? min : v > max ? max : v }
}
/*
................................
..........1Cg...................
...........0gT..*.*..*...*.**...
..............:02C..............
................................
................................
.............D4.................
.............*:01C..............
................................
................................


*/
