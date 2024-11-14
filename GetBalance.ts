import { address, createSolanaRpc } from "@solana/web3.js";
const LAMPORTS_PER_SOL = 1000000000;

async function getBalance() {
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  const addressToRequest = address(
    "web3Qm5PuFapMJqe6PWRWfRBarkeqE2ZC8Eew3zwHH2"
  );

  try {
    const result = await rpc.getBalance(addressToRequest).send();
    console.log(`Balance: ${Number(result.value) / LAMPORTS_PER_SOL} lamports`);
  } catch (err) {
    console.error("Error fetching balance:", err);
  }
}

getBalance();
