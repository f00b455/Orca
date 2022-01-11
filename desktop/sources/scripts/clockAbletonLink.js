'use strict'

/* global Blob */

const sourceClock = 1
const sourceLink = 2

function ClockAbletonLink(client) {
  const workerScript = 'onmessage = (e) => { setInterval(() => { postMessage(true) }, e.data)}'
  const worker = window.URL.createObjectURL(new Blob([workerScript], { type: 'text/javascript' }))

  this.isPaused = true
  this.timer = null
  this.isPuppet = true
  this.puppetSource = 2

  this.speed = { value: 120, target: 120 }

  this.start = function () {
    const memory = parseInt(window.localStorage.getItem('bpm'))
    const target = memory >= 60 ? memory : 120
    this.setSpeed(target, target, true)
    this.play()
  }

  this.touch = function () {
  }

  this.run = function () {
    if (this.speed.target === this.speed.value) { return }
    this.setSpeed(this.speed.value + (this.speed.value < this.speed.target ? 1 : -1), null, true)
  }

  this.isLinkEnabled = function () {
    return true
  }

  this.isExternalClockActive = function () {
    return false
  }

  this.setSpeed = (value, target = null, setTimer = false) => {
    if (this.speed.value === value && this.speed.target === target && this.timer) { return }
    if (value) { this.speed.value = clamp(value, 60, 300) }
    if (target) { this.speed.target = clamp(target, 60, 300) }
    if (setTimer === true) { this.setTimer(this.speed.value) }
    this.setFrame(0)
  }

  this.setSpeedLink = (value) => {
    client.link.setTempo(value)
    if (!client.link.isPlaying()) {
      this.setFrame(0)
      client.update()
    }
  }

  this.modSpeed = function (mod = 0, animate = false) {
    if (animate === true) {
      this.setSpeed(null, this.speed.target + mod)
    } else {
      this.setSpeed(this.speed.value + mod, this.speed.value + mod, true)
      client.update()
    }
  }

  // Controls

  this.togglePlay = function (msg = false) {
    if (this.isPaused === true) {
      this.play(msg)
    } else {
      this.stop(msg)
    }
    client.update()
  }

  this.play = function (msg = false, midiStart = false, linkStart = false) {
    this.isPaused = false
    this.setSpeed(this.speed.target, this.speed.target, true)
  }

  this.stop = function (msg = false) {
    console.log('Clock', 'Stop')
    if (this.isPaused === true) { return }
    this.isPaused = true
    console.warn('Clock', 'Ableton Link')
    this.clearTimer()
    client.link.stop()
    client.io.midi.allNotesOff()
    client.io.midi.silence()
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

  // Timer

  this.setTimer = function (bpm) {
    if (bpm < 60) { console.warn('Clock', 'Error ' + bpm); return }
    this.clearTimer()
    window.localStorage.setItem('bpm', bpm)
    this.timer = new Worker(worker)
    this.timer.postMessage((60000 / parseInt(bpm)) / 4)
    this.timer.onmessage = (event) => {
      //client.io.midi.sendClock()
      client.run()
    }
  }

  this.clearTimer = function () {
    if (this.timer) {
      this.timer.terminate()
    }
    this.timer = null
  }

  this.setFrame = function (f) {
    if (isNaN(f)) { return }
    client.orca.f = clamp(f, 0, 9999999)
  }

  // UI

  this.getUIMessage = function (offset) {
    if (this.isLinkEnabled()) {
      return `link${this.speed.value}`
    } else {
      return this.isExternalClockActive() ? 'midi' : `${this.speed.value}${offset}`
    }
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
