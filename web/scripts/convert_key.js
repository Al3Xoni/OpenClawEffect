const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

const keyPath = path.resolve(__dirname, "../../treasury_key.json");
const keyArr = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
const secretKey = Uint8Array.from(keyArr);

// Handle different bs58 versions
const encode = bs58.encode || bs58.default?.encode;

if (!encode) {
    console.error("Could not find encode function on bs58:", bs58);
} else {
    console.log(encode(secretKey));
}
