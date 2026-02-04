import requests
import sys

# Contract details
CONTRACT_ADDRESS = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016'
API_URL = 'https://explorer.execution.mainnet.lukso.network/api'

# Read flattened source
with open('/root/.openclaw/workspace/flattened-LSP7Mintable.sol', 'r') as f:
    source_code = f.read()

print(f"Source code length: {len(source_code)} characters")
print(f"Lines: {len(source_code.splitlines())}")

# Prepare data
data = {
    'module': 'contract',
    'action': 'verify',
    'addressHash': CONTRACT_ADDRESS,
    'name': 'LSP7Mintable',
    'compilerVersion': 'v0.8.17+commit.8df45f5f',
    'optimization': 'true',
    'optimizationRuns': '200',
    'constructorArguments': '00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000293e96ebbf264ed7715cff2b67850517de70232a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4167656e7420506f7461746f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000074147454e54504f00000000000000000000000000000000000000000000000000',
    'evmVersion': 'london',
    'licenseType': '3'
}

files = {
    'contractSourceCode': ('flattened-LSP7Mintable.sol', source_code, 'text/plain')
}

print(f"\nSubmitting verification...")
print(f"Contract: {CONTRACT_ADDRESS}")

try:
    response = requests.post(API_URL, data=data, files=files, timeout=60)
    result = response.json()
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {result}")
    
    if result.get('status') == '1':
        print(f"\n✅ Verification successful!")
        print(f"Message: {result.get('message')}")
    else:
        print(f"\n❌ Verification failed")
        print(f"Message: {result.get('message')}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")