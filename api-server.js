const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002; // Use environment PORT or default to 3002
const DATA_FILE = path.join(__dirname, 'data', 'early-access.json');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (index.html, product.html, assets, etc.)
app.use(express.static(__dirname));

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read existing submissions
async function readSubmissions() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, return empty array
    return [];
  }
}

// Write submissions to file
async function writeSubmissions(submissions) {
  await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), 'utf8');
}

// API endpoint for early access submissions
app.post('/api/early-access', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address',
      });
    }

    // Ensure data directory exists
    await ensureDataDirectory();

    // Read existing submissions
    const submissions = await readSubmissions();

    // Check if email already exists
    const existingSubmission = submissions.find(sub => sub.email === email);
    if (existingSubmission) {
      return res.status(200).json({
        success: true,
        message: 'Email already registered',
        duplicate: true,
      });
    }

    // Add new submission
    const newSubmission = {
      email,
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    };

    submissions.push(newSubmission);

    // Write to file
    await writeSubmissions(submissions);

    console.log(`New early access request: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Successfully registered for early access',
      data: newSubmission,
    });
  } catch (error) {
    console.error('Error processing early access request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// API endpoint to get all submissions (admin use)
app.get('/api/early-access', async (req, res) => {
  try {
    const submissions = await readSubmissions();
    res.json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error('Error reading submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html at root
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Raincoat Labs website running on http://localhost:${PORT}`);
  console.log(`Early access data stored in: ${DATA_FILE}`);
  console.log(`Serving static files from: ${__dirname}`);
  console.log(`\nAccess the site at: http://localhost:${PORT}`);
});
