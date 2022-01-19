const abletonlink = require('abletonlink');

// const link = new abletonlink(bpm = 120.0, quantum = 4.0, enable = true);
const link = new abletonlink(160.0, 4.0, false);



link.on('tempo', (tempo) => console.log("tempo", tempo));
link.on('numPeers', (numPeers) => console.log("numPeers", numPeers));
link.enable();

var fire = 1;
link.startUpdate(1, (beat, phase, bpm) => {
    var prec = 1000
    var pos = phase / link.quantum
    var relpos = Math.round(pos * prec) - 0;
    if (relpos % (prec / link.quantum) == 0) {
        if (fire == Math.round(phase)) {
            console.log("fire", beat, phase, bpm, phase / link.quantum, relpos, Math.round(phase))
            fire++
            if (fire > link.quantum) fire = 1
        }
    }
});

