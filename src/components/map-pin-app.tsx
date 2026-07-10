"use client";

import { Check, Compass, Loader2, MapPinned, Mountain, Search, Send, Sparkles, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { hasMapPinAddress, mapPinAbi, mapPinAddress } from "@/lib/map-pin";

const TERRAINS = ["Street", "Coast", "Hill", "Studio", "Transit"] as const;
const MOODS = ["Found", "Calm", "Bright", "Hidden"] as const;
const MAX_PLACE_LENGTH = 48;
const MAX_NOTE_LENGTH = 140;

const PRESETS = [
  {
    place: "North Market Corner",
    terrain: "Street",
    mood: "Found",
    note: "A tiny marker for the corner where the next useful route became obvious.",
  },
  {
    place: "Blue Coast Table",
    terrain: "Coast",
    mood: "Calm",
    note: "A quiet place pin for work that needs more horizon and less noise.",
  },
  {
    place: "Studio Stair Light",
    terrain: "Studio",
    mood: "Bright",
    note: "The spot where a small draft turned into a clean direction.",
  },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid place")) return "Place needs 1 to 48 characters.";
  if (error.message.includes("Invalid terrain")) return "Choose a terrain.";
  if (error.message.includes("Invalid mood")) return "Choose a mood.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 140 characters.";
  return error.message;
}

function PinPreview({
  place,
  terrain,
  mood,
  note,
  maker,
  createdAt,
}: {
  place: string;
  terrain: string;
  mood: string;
  note: string;
  maker?: Address;
  createdAt?: bigint;
}) {
  return (
    <article className={`map-card terrain-${terrain.toLowerCase()}`}>
      <div className="map-lines" />
      <div className="pin-dot"><MapPinned /></div>
      <div className="map-label">
        <span>{terrain || "Terrain"} / {mood || "Mood"}</span>
        <h2>{place || "Unnamed place"}</h2>
        <p>{note || "Drop a small place marker on Base."}</p>
      </div>
      <footer>
        <div><span>Maker</span><strong>{shortAddress(maker)}</strong></div>
        <div><span>Dropped</span><strong>{formatDate(createdAt)}</strong></div>
      </footer>
    </article>
  );
}

export function MapPinApp() {
  const [pinIdInput, setPinIdInput] = useState("1");
  const [place, setPlace] = useState<string>(PRESETS[0].place);
  const [terrain, setTerrain] = useState<string>(PRESETS[0].terrain);
  const [mood, setMood] = useState<string>(PRESETS[0].mood);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [message, setMessage] = useState("Drop a tiny place marker on Base.");
  const [lastAction, setLastAction] = useState<"drop" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedPinId = BigInt(Math.max(1, Number(pinIdInput || "1")));

  const pinQuery = useReadContract({
    abi: mapPinAbi,
    address: mapPinAddress,
    functionName: "getPin",
    args: [parsedPinId],
    query: { enabled: hasMapPinAddress, refetchInterval: 12000 },
  });
  const totalQuery = useReadContract({
    abi: mapPinAbi,
    address: mapPinAddress,
    functionName: "nextPinId",
    query: { enabled: hasMapPinAddress, refetchInterval: 12000 },
  });

  const tuple = pinQuery.data as readonly [Address, string, string, string, string, bigint] | undefined;
  const livePin = useMemo(
    () =>
      tuple
        ? {
            maker: tuple[0],
            place: tuple[1],
            terrain: tuple[2],
            mood: tuple[3],
            note: tuple[4],
            createdAt: tuple[5],
          }
        : undefined,
    [tuple],
  );

  const totalPins = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    place.trim().length > 0 &&
    place.trim().length <= MAX_PLACE_LENGTH &&
    terrain.trim().length > 0 &&
    mood.trim().length > 0 &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;
  const dropBlocker = !hasMapPinAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_MAP_PIN_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill place, terrain, mood, and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "drop") return;
    void totalQuery.refetch();
    void pinQuery.refetch();
    const logs = parseEventLogs({ abi: mapPinAbi, logs: receipt.logs, eventName: "PinDropped" });
    const pinId = logs[0]?.args.pinId;
    window.setTimeout(() => {
      if (pinId) setPinIdInput(pinId.toString());
      setMessage(pinId ? `Map pin #${pinId.toString()} dropped on Base.` : "Map pin dropped on Base.");
    }, 0);
  }, [lastAction, pinQuery, receipt, totalQuery]);

  async function connectWallet() {
    const queue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, list) => list.findIndex((item) => item.id === connector.id) === index);
    if (!queue.length) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }
    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of queue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Drop the pin when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function dropPin() {
    const contractAddress = mapPinAddress;
    if (dropBlocker) {
      setMessage(dropBlocker);
      return;
    }
    if (!contractAddress) return;
    try {
      setLastAction("drop");
      setMessage("Confirm the map pin in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: mapPinAbi,
        functionName: "dropPin",
        args: [place.trim(), terrain.trim(), mood.trim(), note.trim()],
        chainId: base.id,
      });
      setMessage("Map pin sent to Base. Waiting for confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setPlace(preset.place);
    setTerrain(preset.terrain);
    setMood(preset.mood);
    setNote(preset.note);
  }

  return (
    <main className="map-shell">
      <section className="map-hero">
        <div>
          <span>Map Pin</span>
          <h1>Drop a place marker on Base.</h1>
          <p>A tiny map record with terrain, mood, wallet, and time.</p>
        </div>
        <aside>
          <Compass />
          <strong>{totalPins}</strong>
          <span>pins</span>
        </aside>
      </section>

      <section className="map-grid">
        <div className="map-controls">
          <div className="map-head">
            <Mountain />
            <div><span>Map desk</span><strong>{isConnected ? shortAddress(address) : "Connect to pin"}</strong></div>
          </div>

          <div className="preset-strip">
            {PRESETS.map((preset, index) => (
              <button key={preset.place} type="button" onClick={() => applyPreset(index)}>{preset.place}</button>
            ))}
          </div>

          <label><span>Place</span><input value={place} maxLength={MAX_PLACE_LENGTH} onChange={(event) => setPlace(event.target.value)} /></label>
          <label><span>Note</span><textarea value={note} maxLength={MAX_NOTE_LENGTH} onChange={(event) => setNote(event.target.value)} /></label>

          <div className="choice-row terrain-row">
            {TERRAINS.map((item) => (
              <button key={item} className={terrain === item ? "active" : ""} type="button" onClick={() => setTerrain(item)}>
                {terrain === item ? <Check /> : null}{item}
              </button>
            ))}
          </div>
          <div className="choice-row mood-row">
            {MOODS.map((item) => (
              <button key={item} className={mood === item ? "active" : ""} type="button" onClick={() => setMood(item)}>{item}</button>
            ))}
          </div>

          <div className="map-actions">
            {!isConnected ? (
              <button className="connect" disabled={connecting} onClick={connectWallet}>{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Connect wallet</button>
            ) : chainId !== base.id ? (
              <button className="connect" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>{switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Switch to Base</button>
            ) : (
              <button className="disconnect" onClick={disconnectWallet}>{shortAddress(address)}</button>
            )}
            <button className="drop" disabled={writing || confirming} onClick={dropPin}>{writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Drop pin</button>
          </div>
          <p className="message">{message}</p>
        </div>

        <div className="map-output">
          <PinPreview
            place={livePin?.place || place}
            terrain={livePin?.terrain || terrain}
            mood={livePin?.mood || mood}
            note={livePin?.note || note}
            maker={livePin?.maker}
            createdAt={livePin?.createdAt}
          />
          <section className="lookup">
            <div><Search /><h2>Load pin</h2></div>
            <label><span>Pin ID</span><input value={pinIdInput} onChange={(event) => setPinIdInput(event.target.value.replace(/\D/g, ""))} /></label>
          </section>
          <section className="about"><Sparkles /><strong>Map Pin drops a tiny place marker on Base with terrain, mood, wallet, and time.</strong></section>
        </div>
      </section>
    </main>
  );
}
