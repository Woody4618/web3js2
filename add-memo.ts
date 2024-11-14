import {
  airdropFactory,
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  devnet,
  generateKeyPairSigner,
  getComputeUnitEstimateForTransactionMessageFactory,
  getSignatureFromTransaction,
  lamports,
  pipe,
  prependTransactionMessageInstructions,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Transaction,
} from "@solana/web3.js";
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";
import { getAddMemoInstruction } from "@solana-program/memo";

async function writeMemo(message: string) {
  // Create an RPC.
  const CLUSTER = "devnet";
  const rpc = createSolanaRpc(devnet(`https://api.${CLUSTER}.solana.com`));
  const rpcSubscriptions = createSolanaRpcSubscriptions(
    devnet(`wss://api.${CLUSTER}.solana.com`)
  );

  // Create an airdrop function.
  const airdrop = airdropFactory({ rpc, rpcSubscriptions });

  // Create a utility that estimates a transaction message's compute consumption.
  const getComputeUnitEstimate =
    getComputeUnitEstimateForTransactionMessageFactory({ rpc });

  // Create a transaction sending function.
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  // Create and fund an account.
  const keypairSigner = await generateKeyPairSigner();
  console.log("Created an account with address", keypairSigner.address);
  console.log("Requesting airdrop");
  await airdrop({
    commitment: "confirmed",
    lamports: lamports(1000_000n),
    recipientAddress: keypairSigner.address,
  });
  console.log("Airdrop confirmed");

  // Create a memo transaction.
  console.log("Creating a memo transaction");
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const transactionMessage = pipe(
    createTransactionMessage({ version: "legacy" }),
    (m) => setTransactionMessageFeePayerSigner(keypairSigner, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstructions(
        [
          getSetComputeUnitPriceInstruction({ microLamports: 5000n }),
          getAddMemoInstruction({ memo: message }),
        ],
        m
      )
  );

  // Figure out how many compute units to budget for this transaction
  // so that you can right-size the compute budget to maximize the
  // chance that it will be selected for inclusion into a block.
  console.log("Estimating the compute consumption of the transaction");
  const estimatedComputeUnits = await getComputeUnitEstimate(
    transactionMessage
  );
  console.log(
    `Transaction is estimated to consume ${estimatedComputeUnits} compute units`
  );
  const budgetedTransactionMessage = prependTransactionMessageInstructions(
    [getSetComputeUnitLimitInstruction({ units: estimatedComputeUnits })],
    transactionMessage
  );

  // Sign and send the transaction.
  console.log("Signing and sending the transaction");
  const signedTx = await signTransactionMessageWithSigners(
    budgetedTransactionMessage
  );
  const signature = getSignatureFromTransaction(signedTx);
  console.log(
    "Sending transaction https://explorer.solana.com/tx/" +
      signature +
      "/?cluster=" +
      CLUSTER
  );
  await sendAndConfirmTransaction(signedTx, { commitment: "confirmed" });
  console.log("Transaction confirmed");
}

writeMemo("Hello, Solana!");
