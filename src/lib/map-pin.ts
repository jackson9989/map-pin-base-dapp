import { parseAbi } from "viem";

export const mapPinAddress = process.env.NEXT_PUBLIC_MAP_PIN_CONTRACT_ADDRESS as
  | `0x${string}`
  | undefined;

export const hasMapPinAddress =
  Boolean(mapPinAddress) && !mapPinAddress?.includes("replace_with");

export const mapPinAbi = parseAbi([
  "event PinDropped(uint256 indexed pinId,address indexed maker,string place,string terrain)",
  "function nextPinId() view returns (uint256)",
  "function dropPin(string place,string terrain,string mood,string note) returns (uint256)",
  "function getPin(uint256 pinId) view returns (address maker,string place,string terrain,string mood,string note,uint256 createdAt)",
]);
