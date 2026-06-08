export function formatAddress(address: string | undefined, size = 4) {
  if (!address) return "not configured";
  if (address.length <= size * 2 + 5) return address;
  return `${address.slice(0, size + 2)}...${address.slice(-size)}`;
}

export function explorerAddressUrl(address: string) {
  return `https://explorer.execution.mainnet.lukso.network/address/${address}`;
}
