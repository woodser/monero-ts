import ChildProcess from "child_process";
import { createWalletFull, MoneroNetworkType } from "../../dist/index.js"

// Mocha global hooks
export const getInfo = async () => {
  const result = ChildProcess.spawnSync("curl", `http://localhost:28081/json_rpc -d {"jsonrpc":"2.0","id":"0","method":"get_info"} -H 'Content-Type:application/json' -s`.split(" "), {});
  if (result.status) {
    throw "Docker containers not running, starting"
  }
  return JSON.parse(result.stdout.toString());
}

export const mine = async (address, blocks = 100) => {
  while (true) {
    const response = ChildProcess.spawnSync("curl", `http://localhost:28081/json_rpc -d {"jsonrpc":"2.0","id":"0","method":"generateblocks","params":{"amount_of_blocks":${blocks},"wallet_address":"${address}","starting_nonce":1}}`.split(" "), {});
    const result = JSON.parse(response.stdout.toString());
    if (result?.result?.status === "OK") {
      return response.status;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

if (!!process.env.USE_DOCKER) {
  // setup
  before(async () => {
    try {
      console.log(await getInfo());
    } catch (e) {
      console.log(e);
      ChildProcess.spawnSync("docker-compose", "up -d".split(" "), {});
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Mining to primary address")
      // mine to primary account and some subaccounts
      await mine("A1y9sbVt8nqhZAVm3me1U18rUVXcjeNKuBd1oE2cTs8biA9cozPMeyYLhe77nPv12JA3ejJN3qprmREriit2fi6tJDi99RR", 161);

      const wallet = await createWalletFull({
        seed: "silk mocked cucumber lettuce hope adrenalin aching lush roles fuel revamp baptism wrist long tender teardrop midst pastry pigment equip frying inbound pinched ravine frying",
        networkType: MoneroNetworkType.TESTNET,
        server: "http://localhost:28081",
      });
      await wallet.sync();

      console.log("Funding accounts");
      await wallet.createTx({
        destinations: [{
          address: "BdR4NZNGJAQFpZWYizuZEXRZMqzGtH4wz8N3Rdw1z65u775N6TkGmriTtViijkVhqpBe8j3jj5E6yPJFgDTQ8yy1A4pZjHb",
          amount: BigInt(5e12),
        },{
          address: "BeyNcPKiA6Bb41KSUhUj3GagaCuKYuNQGQUmScmYHnS18ryBHJ9czifaNTYtkYWzZQ63bcEd6ztaLG5FofQtL9ATA5bebak",
          amount: BigInt(5e12),
        },{
          address: "BZgn6mza3NsgJcYoM2pW5f4vgncbWmmW7epwYzoGycuaLptYwAgWaUTbyJumw9umMCRMuWSv5ijL3YVxM3K8Gjiu9sYzd73",
          amount: BigInt(5e12),
        },{
          address: "BcbyyQarpXNMg4eGKbConJchTjbEEYejnZv8u1MMriuzdNGseYHaKDMTGmmqdXUKPLLhtFQQMseK8SBwZqfDs2PwMZRRYZL",
          amount: BigInt(5e12),
        }],
        relay: true,
        accountIndex: 0,
      });

      // make some transactions
      for (let i = 0; i < 10; i++) {
        await wallet.createTx({
          destinations: [{
            address: "A1y9sbVt8nqhZAVm3me1U18rUVXcjeNKuBd1oE2cTs8biA9cozPMeyYLhe77nPv12JA3ejJN3qprmREriit2fi6tJDi99RR",
            amount: BigInt(1e12),
          }],
          relay: true,
          accountIndex: 0,
        });
      }

      // unlock all balances
      console.log("Unlocking balances")
      await mine("A1y9sbVt8nqhZAVm3me1U18rUVXcjeNKuBd1oE2cTs8biA9cozPMeyYLhe77nPv12JA3ejJN3qprmREriit2fi6tJDi99RR", 41);

      await wallet.close();
    }
  });

  // teardown
  after(async () => {
    ChildProcess.spawnSync("docker-compose", `down -v --remove-orphans`.split(" "), {});
  });
}