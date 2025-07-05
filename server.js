// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const videoDir = path.join(__dirname, 'motivationalshorts');

// Serve frontend and videos
app.use(express.static(__dirname));

// ✅ Serve video files from /motivationalshorts
app.use('/motivationalshorts', express.static(path.join(__dirname, 'motivationalshorts')));

// Multer config (store in memory first to rename later)
const storage = multer.memoryStorage();
const upload = multer({ storage });

function getNextAvailableFilename() {
  const files = fs.readdirSync(videoDir);
  const usedNumbers = files
    .map(name => {
      const match = name.match(/video \((\d+)\)\.mp4/);
      return match ? parseInt(match[1]) : null;
    })
    .filter(n => n !== null)
    .sort((a, b) => a - b);

  let nextNumber = 1;
  for (const num of usedNumbers) {
    if (num !== nextNumber) break;
    nextNumber++;
  }
  return `video (${nextNumber}).mp4`;
}

app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No video uploaded.');

  // 👇 Add this line here
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

app.use(express.json());

app.post('/delete', (req, res) => {
  const fileName = req.body.fileName;
  if (!fileName) return res.status(400).send('No filename provided.');

  const filePath = path.join(videoDir, fileName);

  fs.unlink(filePath, err => {
    if (err) {
      console.error('Failed to delete file:', err);
      return res.status(500).send('Failed to delete file.');
    }
    console.log('Deleted:', fileName);
    res.sendStatus(200);
  });
});

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
  console.log(`Server running at http://localhost:${PORT}`);
});
