/**
 * Minimal JPEG/PNG/WebP/GIF dimension reader.
 *
 * The gallery only needs width and height to reserve layout space, so
 * parsing a few header bytes beats pulling in an image library.
 */

export type Dimensions = { width: number; height: number };

const FALLBACK: Dimensions = { width: 1200, height: 900 };

export function imageSize(buffer: Buffer): Dimensions {
  return png(buffer) ?? gif(buffer) ?? webp(buffer) ?? jpeg(buffer) ?? FALLBACK;
}

function png(b: Buffer): Dimensions | null {
  if (b.length < 24) return null;
  // \x89PNG\r\n\x1a\n
  if (b.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function gif(b: Buffer): Dimensions | null {
  if (b.length < 10) return null;
  if (b.toString("ascii", 0, 3) !== "GIF") return null;
  return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
}

function webp(b: Buffer): Dimensions | null {
  if (b.length < 30) return null;
  if (b.toString("ascii", 0, 4) !== "RIFF") return null;
  if (b.toString("ascii", 8, 12) !== "WEBP") return null;

  const format = b.toString("ascii", 12, 16);

  if (format === "VP8 ") {
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (format === "VP8L") {
    const bits = b.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (format === "VP8X") {
    return {
      width: 1 + b.readUIntLE(24, 3),
      height: 1 + b.readUIntLE(27, 3),
    };
  }
  return null;
}

function jpeg(b: Buffer): Dimensions | null {
  if (b.length < 4 || b.readUInt16BE(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset < b.length - 9) {
    if (b[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = b[offset + 1];

    // SOF0–SOF15, excluding the non-frame markers DHT/JPG/DAC.
    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isFrame) {
      return { width: b.readUInt16BE(offset + 7), height: b.readUInt16BE(offset + 5) };
    }

    // Standalone markers carry no length field.
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }

    offset += 2 + b.readUInt16BE(offset + 2);
  }

  return null;
}
