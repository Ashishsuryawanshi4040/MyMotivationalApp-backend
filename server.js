// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const videoDir = path.join(__dirname, 'motivationalshorts');

// ✅ Allow cross-origin requests (important for Netlify ↔ Render)
app.use(cors());

// ✅ Ensure motivationalshorts folder exists
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

// ✅ Serve video files from /motivationalshorts
app.use('/motivationalshorts', express.static(videoDir));

// ✅ Accept JSON in DELETE requests
app.use(express.json());

// ✅ Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Find next available "video (X).mp4" filename
function getNextAvailableFilename() {
  const files = fs.readdirSync(videoDir);
  const usedNumbers = files
    .map(name => {
      const match = name.match(/video \((\d+)\)\.mp4/);
      return match ? parseInt(match[1]) : null;
    })
    .filter(n => n !== null)
    .sort((a, b) => a - b);

  let next = 1;
  for (const num of usedNumbers) {
    if (num !== next) break;
    next++;
  }
  return `video (${next}).mp4`;
}

// ✅ Upload route
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No video uploaded.');

  console.log('Received file:', req.file.originalname);
  const nextName = getNextAvailableFilename();
  const filePath = path.join(videoDir, nextName);

  fs.writeFile(filePath, req.file.buffer, err => {
    if (err) {
      console.error('Failed to save video:', err);
      return res.status(500).send('Failed to save video.');
    }
    console.log('Video saved as:', nextName);
    res.status(200).send('Uploaded as ' + nextName);
  });
});

// ✅ Delete by query param (GET-style DELETE)
app.delete('/delete', (req, res) => {
  const filename = req.query.filename;
  if (!filename) return res.status(400).send('No filename provided.');

  const filePath = path.join(videoDir, filename);
  fs.unlink(filePath, err => {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).send('Failed to delete file.');
    }
    console.log('Deleted file:', filename);
    res.sendStatus(200);
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
