// reminder.js
const db = require('./database.js');
const { exec } = require('child_process');

function checkReminders() {
  const incomplete = db.prepare(`
    SELECT t.filename,
           COALESCE(ts.mixed,0) as mixed,
           COALESCE(ts.mastered,0) as mastered,
           COALESCE(ts.tagged,0) as tagged,
           COALESCE(ts.registered,0) as registered
    FROM tracks t
    LEFT JOIN tasks ts ON t.id = ts.track_id
  `).all();

  let messages = [];

  incomplete.forEach(track => {
    let pending = [];
    if (!track.mixed) pending.push("not mixed");
    if (!track.mastered) pending.push("not mastered");
    if (!track.tagged) pending.push("not tagged");
    if (!track.registered) pending.push("not registered");

    if (pending.length > 0) {
      messages.push(`${track.filename} is ${pending.join(", ")}`);
    }
  });

  if (messages.length > 0) {
    const summary = `Reminder: ${messages.join(". ")}`;
    console.log("🔔 " + summary);

    // Speak reminder (macOS TTS)
    exec(`say "${summary}"`);
  } else {
    console.log("✅ All tasks complete!");
  }
}

// Run every specified interval
function startReminders(intervalMinutes = 60) {
  setInterval(checkReminders, intervalMinutes * 60000);
}

module.exports = { startReminders, checkReminders };
