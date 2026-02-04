# LSP4 Metadata Encoding Guide

## Problem
Hand-encoding LSP4Metadata as VerifiableURI fails because the format is complex and requires specific byte structures.

## Solution
Use `@erc725/erc725.js` with proper `encodeData()` method.

## Code Example

```javascript
const { ERC725 } = require('@erc725/erc725.js');
const { ethers } = require('ethers');

// 1. Define LSP4 Schema
const LSP4Schema = [
  {
    name: 'LSP4Metadata',
    key: '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e',
    keyType: 'Singleton',
    valueType: 'VerifiableURI',
    valueContent: 'VerifiableURI'
  }
];

// 2. Create ERC725 instance
const erc725 = new ERC725(LSP4Schema, tokenAddress, RPC_URL);

// 3. Prepare metadata
const metadata = {
  LSP4Metadata: {
    description: "Token description here",
    links: [
      { title: "Twitter", url: "https://twitter.com/..." }
    ],
    icon: [
      {
        width: 256,
        height: 256,
        verification: {
          method: "keccak256(bytes)",
          data: "0x..."  // Will be auto-generated
        },
        url: "data:image/svg+xml;base64,BASE64_DATA_HERE"
      }
    ],
    images: [],
    assets: []
  }
};

// 4. Encode data properly
const encodedData = erc725.encodeData([
  {
    keyName: 'LSP4Metadata',
    value: {
      verification: {
        method: 'keccak256(bytes)',
        data: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadata)))
      },
      url: 'data:application/json;base64,' + Buffer.from(JSON.stringify(metadata)).toString('base64')
    }
  }
]);

// 5. Set via UP
const setDataCalldata = tokenContract.interface.encodeFunctionData("setData", [
  encodedData.keys[0],    // The LSP4Metadata key
  encodedData.values[0]   // The encoded VerifiableURI
]);
```

## Key Points

### VerifiableURI Structure (Correct)
```
0x00008019                - 6 bytes: verification method prefix
<32 bytes keccak256 hash> - JSON hash
<2 bytes length>           - URL length
<variable data>           - UTF-8 bytes of data URI
```

### What NOT to do
- Don't manually construct: `0x6f357c6a + hash + length + url`
- Don't use raw hex without proper length prefixes
- Don't forget the verification method byte prefix

### What TO do
- Use `erc725.encodeData()` for automatic encoding
- Use `data:image/svg+xml;base64,` for inline SVG icons
- Include proper JSON structure with LSP4Metadata wrapper

## Transaction Examples

### Successful Metadata Set
- **Tx:** `0xffda192794fd005025556d4c1c0d5975beb8bfb3bb042f864cc79979415859b4`
- **Token:** 0x47568bc4dc7fee1bb67f741ba927e2904b61f016 (AGENTPO)
- **Method:** setData via UP -> KeyManager

## Resources
- LSP4 Specs: https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-4-DigitalAsset-Metadata.md
- erc725.js docs: https://docs.lukso.tech/tools/dapps/erc725js/
