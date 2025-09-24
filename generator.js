// generator.js
const { Midi } = require('@tonejs/midi');
const fs = require('fs');
const path = require('path');

// Simple chord bank
const chordProgressions = [
  [["C4","E4","G4"], ["A3","C4","E4"], ["F3","A3","C4"], ["G3","B3","D4"]],
  [["A3","C4","E4"], ["F3","A3","C4"], ["G3","B3","D4"], ["E3","G3","B3"]],
  [["D3","F3","A3"], ["G3","B3","D4"], ["C3","E3","G3"], ["A3","C4","E4"]],
];

function generateIdea() {
  const midi = new Midi();

  const track = midi.addTrack();
  const progression = chordProgressions[Math.floor(Math.random() * chordProgressions.length)];

  let time = 0;
  progression.forEach(chord => {
    track.addChord({ notes: chord, duration: '2', time });
    time += 2; // move forward 2 beats
  });

  // Save file
  const filePath = path.join(__dirname, `idea_${Date.now()}.mid`);
  fs.writeFileSync(filePath, Buffer.from(midi.toArray()));

  console.log(`🎹 Generated idea saved at: ${filePath}`);
  return filePath;
}

module.exports = { generateIdea };
