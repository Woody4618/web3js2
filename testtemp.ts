import {
    address,
    airdropFactory,
    createKeyPairFromBytes,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    devnet,
    generateKeyPair,
    getAddressFromPublicKey,
    lamports,
  } from "@solana/web3.js";
  
  async function createKeypair() {
    const newKeypair: CryptoKeyPair = await generateKeyPair();
    const publicAddress = await getAddressFromPublicKey(newKeypair.publicKey);

    console.log(`Public key: ${publicAddress}`);
    console.log(`Private key: ${newKeypair.privateKey.extractable}`);
  }
  
  createKeypair();
  