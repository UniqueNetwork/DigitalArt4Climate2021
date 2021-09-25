const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const config = require('./config');
const fs = require('fs');

function submitTransaction(sender, transaction) {
  return new Promise(async function(resolve, reject) {
    try {
      const unsub = await transaction
      .signAndSend(sender, (result) => {
        console.log(`Current tx status is ${result.status}`);
    
        if (result.status.isInBlock) {
          console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
        } else if (result.status.isFinalized) {
          console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
          resolve();
          unsub();
        }
      });
    }
    catch (e) {
      reject(e.toString());
    }
  });
}

async function createItemAsync(api, signer) {
  const createData = {
    NFT: { const_data: [], variable_data: [] },
  };

  const tx = api.tx.nft.createItem(config.collectionId, signer.address, createData);
  return await submitTransaction(signer, tx);
}

async function main() {
  // Initialise the provider to connect to the node
  const wsProvider = new WsProvider(config.wsEndpoint);
  const rtt = JSON.parse(fs.readFileSync("./runtime_types.json"));

  // Create the API and wait until ready
  const api = await ApiPromise.create({ 
    provider: wsProvider,
    types: rtt
  });

  // Owners's keypair
  const keyring = new Keyring({ type: 'sr25519' });
  const owner = keyring.addFromUri(config.ownerSeed);
  console.log("Collection owner address: ", owner.address);

  // Create items
  const startItem = 1;
  for (let i=startItem; i<=500; i++) {
    console.log(`=================================================\nCreating item ${i}`);

    await createItemAsync(api, owner);
    console.log("Item created");
  }

}

main().catch(console.error).finally(() => process.exit());
