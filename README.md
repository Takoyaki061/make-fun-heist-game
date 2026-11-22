[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Takoyaki061/make-fun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Takoyaki061/make-fun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# THAW — The Cold Vault Heist

You are **Moth**, thief of the frozen seed vault. The bankrupt biotech firm
Vireo Genomics keeps one last thing of value in the cold: the **Amber
Vial**, the last viable seed of an extinct wheat strain. Cross the vault,
steal it, and reach the **airlock** unseen.

## How it plays

- **Move** — WASD or arrow keys. **Shift** — sneak (slow, nearly silent).
  **Click** — toss a coin to lure a guard (3 coins). **1** — smoke pellet
  (2). **3** — freeze spray: stops every camera for 8s (2). **P** — pause.
  **M** — mute. **R** — restart the vault.
- **Guards** patrol loops you can learn: Vex sweeps the top, Ilya walks the
  long hall, Sable circles the pods. Each has a **vision cone** — step into
  it and your suspicion fills; a full meter means a chase.
- **Cameras** sweep the vault from the ceiling. Being seen by one raises
  the heat fast. Freeze spray stops them, but its thermal bloom costs heat.
- **Heat is the alarm.** Seen by a guard or a camera, sprinting past a
  patrol, the spray — everything warm raises it. Quiet and cold let it fall.
  At 75 the **lockdown** seals the airlock for 15s and every guard converges.
- **Three vaults**: the Seed Vault, the Cryo Hall, and the Core — more
  guards, more cameras, tighter lanes each time.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Plain static files, no build step, no network request.
