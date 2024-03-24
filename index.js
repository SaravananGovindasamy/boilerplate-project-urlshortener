require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const shortid = require('shortid');
const { URL } = require('url');

const app = express();
const port = process.env.PORT || 3000;

// Storing URLs in memory for using shorturl
const urlDatabase = {};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Validate the URL format
function validateUrl(req, res, next) {
  let { url } = req.body; 

  // If url is empty, using default as per index.html
  if (!url || url.trim() === '') {
    url = 'https://www.freecodecamp.org/';
  }

  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    dns.lookup(urlObj.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid hostname' });
      }
      next();
    });
  } catch (err) {
    console.error(err);
    return res.json({ error: 'invalid url' });
  }
}

// Creating short URL
app.post('/api/shorturl', validateUrl, function(req, res) {
  let { url } = req.body;
  const short_url = shortid.generate();

  if (!url || url.trim() === '') {
    url = 'https://www.freecodecamp.org/';
  }

  urlDatabase[short_url] = url;

  res.json({ original_url: url, short_url: short_url });
});

// Check for redirecting to original url using shorturl
app.get('/api/shorturl/:short_url', function(req, res) {
  const { short_url } = req.params;

  if (short_url in urlDatabase) {
    res.redirect(urlDatabase[short_url]);
  } else {
    res.status(404).json({ error: 'URL not found' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
