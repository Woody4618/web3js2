import {
  address,
  appendTransactionMessageInstructions,
  createSignerFromKeyPair,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getAddressFromPublicKey,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransaction,
  signTransactionMessageWithSigners,
  type Transaction,
} from "@solana/web3.js";
import { loadKeypairFromFile } from "./CreateKeypair";

async function callHelloWorldProgram() {
  let rpc = createSolanaRpc("https://api.devnet.solana.com");
  let rpcSubscriptions = createSolanaRpcSubscriptions(
    "ws://api.devnet.solana.com"
  );

  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  let keypair = await loadKeypairFromFile(
    "web3Qm5PuFapMJqe6PWRWfRBarkeqE2ZC8Eew3zwHH2.json"
  );
  let transactionConfig: any = {
    version: 0,
  };

  let transactionMessage = createTransactionMessage(transactionConfig);

  let latestBlockhash = await rpc.getLatestBlockhash().send();

  let blockHashConstraint = {
    blockhash: latestBlockhash.value.blockhash,
    lastValidBlockHeight: BigInt(latestBlockhash.value.lastValidBlockHeight),
  };

  let signer = await createSignerFromKeyPair(keypair);
  const transactionMessageWithFeePayer = setTransactionMessageFeePayerSigner(
    signer,
    transactionMessage
  );
  const transactionMessageWithFeePayerAndBlockhash =
    setTransactionMessageLifetimeUsingBlockhash(
      blockHashConstraint,
      transactionMessageWithFeePayer
    );
  const addedInstruction = await appendTransactionMessageInstructions(
    [
      {
        programAddress: address("kGYz2q2WUYCXhKpgUF4AMR3seDA9eg8sbirP5dhbyhy"),
        accounts: [],
        data: new Uint8Array(Buffer.from([0])),
      },
    ],
    transactionMessageWithFeePayerAndBlockhash
  );
  const signedTransaction = await signTransactionMessageWithSigners(
    addedInstruction
  );

  const signature = getSignatureFromTransaction(signedTransaction);
  console.log(
    "Sending transaction https://explorer.solana.com/tx/" +
      signature +
      "/?cluster=devnet"
  );

  var logs = await sendAndConfirmTransaction(signedTransaction, {
    commitment: "confirmed",
  });
  var transaction = await rpc
    .getTransaction(signature, {
      commitment: "confirmed",
      encoding: "jsonParsed",
      maxSupportedTransactionVersion: 0,
    })
    .send();

  console.log(transaction);
  //console.log(logs);

  transaction?.transaction.message.instructions.map((ix) => {
    console.log(ix);
  });

  //   let base64Encoded = await getBase64EncodedWireTransaction(signedTransaction);
  //   await rpc.sendTransaction(base64Encoded, { encoding: "base58" }).send();
}

callHelloWorldProgram();
