// generate_icons.js
// Creates simple PNG icons for the extension using a raw PNG builder
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, r, g, b) {
  // Minimal PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // color type 6: RGBA
  ihdr.writeUInt8(0, 10); // compression 0
  ihdr.writeUInt8(0, 11); // filter 0
  ihdr.writeUInt8(0, 12); // interlace 0

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  // Raw image data with filter byte 0 at start of each scanline
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  const radius = width / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded badge icon
      if (dist <= radius - 1) {
        // Vibrant modern teal/blue badge with inner symbol
        const isBorder = dist > radius - 2.5;
        if (isBorder) {
          rawData[offset++] = 15;
          rawData[offset++] = 118;
          rawData[offset++] = 110;
          rawData[offset++] = 255;
        } else {
          // Inside: Card shape or key
          const inCard = (Math.abs(dx) < radius * 0.6) && (Math.abs(dy) < radius * 0.45);
          if (inCard && Math.abs(dy) < 2) {
            // white line
            rawData[offset++] = 255;
            rawData[offset++] = 255;
            rawData[offset++] = 255;
            rawData[offset++] = 255;
          } else {
            rawData[offset++] = r;
            rawData[offset++] = g;
            rawData[offset++] = b;
            rawData[offset++] = 255;
          }
        }
      } else {
        // Transparent
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Basic CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ (-1);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const png = createPng(size, size, 20, 140, 120);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png`);
});
