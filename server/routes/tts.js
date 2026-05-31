// TTS route — Microsoft Edge TTS (free, British female voice)
const { Router } = require('express');
const WebSocket = require('ws');
const router = Router();

// Edge TTS config — token from environment or default (public Microsoft token)
const TOKEN = process.env.EDGE_TTS_TOKEN || '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TOKEN}`;

function uuid() { return crypto.randomUUID().replaceAll('-', ''); }

function synthesize(text, voice = 'en-GB-SoniaNeural') {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}&ConnectionId=${uuid()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      },
    });
    const chunks = [];
    ws.on('message', (data, isBinary) => {
      if (!isBinary) { if (data.toString().includes('turn.end')) { resolve(Buffer.concat(chunks)); ws.close(); } return; }
      const idx = data.indexOf('Path:audio\r\n');
      if (idx !== -1) chunks.push(data.subarray(idx + 'Path:audio\r\n'.length));
    });
    ws.on('error', (err) => reject(err));
    ws.on('unexpected-response', (_req, res) => reject(new Error(`Unexpected response: ${res.statusCode}`)));
    const config = JSON.stringify({ context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false }, outputFormat: 'audio-24khz-48kbitrate-mono-mp3' } } } });
    ws.on('open', () => {
      ws.send(`X-Timestamp:${Date()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${config}`);
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-GB'><voice name='${voice}'><prosody rate='-5%' pitch='+2Hz'>${escapeXml(text)}</prosody></voice></speak>`;
      ws.send(`X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${Date()}Z\r\nPath:ssml\r\n\r\n${ssml}`);
    });
    setTimeout(() => reject(new Error('TTS timeout')), 15000);
  });
}

function escapeXml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing text parameter' });
    const audioBuffer = await synthesize(text);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: 'Speech synthesis failed' });
  }
});

module.exports = router;
