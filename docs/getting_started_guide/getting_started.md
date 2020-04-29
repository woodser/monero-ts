# Introduction to the monero-javascript library
The monero-javascript library enables web developers to implement Monero functionality in javascript browser and node.js applications, such as interacting with Monero wallets, nodes, and RPC servers.

The library’s object and method hierarchy is derived from [The Hidden Model](https://moneroecosystem.org/monero-java/monero-spec.pdf), a concise, self-consistent, and intuitive representation of the underlying structure of the Monero software and the basis for the [monero-cpp](https://github.com/woodser/monero-cpp-library) and [monero-java](https://monero-ecosystem/monero-java) libraries.

Monero-javascript features a web assembly (WASM)-based wallet implementation, which acts as a direct bridge to the native Monero wallet code and eliminates the need to connect to an external - and potentially malicious - RPC wallet server in order to manage a wallet. In other words, monero-javascript makes fully client-side wallet operations possible. In addition, monero-javascript allows traditional wallet management via RPC wallet queries as well.

![Monero-javascript hierarchy](img/paste.png?raw=true)*In addition to the traditional method of managing wallets through an RPC wallet server, monero-javascript allows developers to communicate with the core Monero wallet software via a javascript wrapper for the monero-cpp Wasm library.*  

# Initial Setup

## Installing node.js and npm
In order to install and use the monero-javascript library, you need to download and install node.js and the node package manager (npm). 

### Windows
1. [Download the node.js Windows installer](https://nodejs.org/en/download/) from the node.js website.
2. Open the installer.
3. Click “next”.
4. Click the checkbox next to “I accept the terms in this license agreement.” and click “next”.
5. Click “next” to install node.js to the default directory.
6. Make sure that npm is listed as one of the installation packages, then click “next”.
7. Click “next”.
8. Click “Install”.
9. Click “Finish” after the installation process completes.

### Linux
  #### Debian (Ubuntu, etc.)
  1. Install node.js:
    `$ sudo apt-get install nodejs`
  2. Install npm:
    `$ sudo apt-get install npm`
  #### Fedora
  1. Install node.js:
    `$ sudo dnf install nodejs`
  2. Install npm:
    `$ sudo dnf install npm`

## Installing the monero-javascript libary

To install the libary, open the command prompt (Windows) or a terminal (linux) and enter the command `npm install monero-javascript`.

# Write a monero-javascript program

## The essential monero-javascript program template

Most monero-javascript programs need to have two essential components:
1. A "require" statement to import the monero-javascript library:
```require("monero-javascript");```
2. An asynchronous "main" function to handle all monero-javascript operations
```async mainFunction() {}```

Note that the asynchronous "main" function may be uncecessary and undesireble in a few rare cases. However, for the purposes of this guide and under the majority of circumstances, monero-javascript code should run in an asynchronous function, because all of the monero-javascript methods run asynchronously.

Create and save a copy of this template program:
1. Open the text editor or IDE of your choice and create a new, blank file.
2. Type the following code into the file:
```
require("monero-javascript");

mainFunction();

async mainFunction() {
}
```
Save the file under the name "monero-javascript-template.js".

---
### Why do monero-javascript methods need to run in an asynchronous function?
(You can skip ahead to the [next section](creating-an-offline-wallet) if you are already familiar with asynchronous javascript methods)

---

## Creating an offline wallet generator

An offline Monero wallet generator is a simple program that generates and displays a new wallet address along with that address's associated view and spend keys and mnemonic seed phrase. Offline wallet generators do not need to communicate with a Monero network to accomplish this task. transfer XMR or track a wallet's balance or outputs.  

Monero-javascript provides a minimal, stripped-down implementation of its WebAssembly (Wasm) wallet called a keys-only wallet. Keys-only wallets can not initiate transfers, report their balances, or perform any other tasks that require communication with a Monero network. The trade off for these limitations is a small file size - just under 1/5 that of a standard Wasm wallet. This makes it the ideal basis for an offline wallet generator.

### Creating a random keys-only wallet

You can create a random keys-only wallet by calling the MoneroWalletKeys class's `createWalletRandom()` method as follows:
```
var keysOnlyWallet = await MoneroWalletKeys.createWalletRandom(MoneroNetworkType.STAGENET, "English");
```

The createWalletRandom method accepts two arguments: the network type and the seed phrase language.

---
**NOTE**
There are three Monero networks:
* mainnet
* stagenet
* testnet

*mainnet* is the "real" Monero network. XMR transferred on mainnet has actual monetary value.
*stagenet* is designed for learning how to use Monero and interact with the blockchain. Use this network for learning, experimentation, and application testing.
*testnet* is like stagenet for the Monero development team. It is meant for testing updates and addtions to the Monero source code. If you are not a member of the Monero developent team then you probably have no need to use testnet.

---

Your javascript program should now look like this:

```
require("monero-javascript");

mainFunction();

function mainFunction() {
  // create a random keys-only (offline) stagenet wallet
  var walletKeys = await MoneroWalletKeys.createWalletRandom(MoneroNetworkType.STAGENET, "English");
}
```
Save the file as "offline_wallet_generator.js".

---
## Keys-only wallet limitations
Keys-only wallets have the following limitations:
* They do not store and can not import transaction or output data
* They can not connect to nodes or RPC wallet servers - this means they can not interact with any of the Monero networks.
* They can not send XMR
* They can not report their balances

The tradeoff for these limitations is the keys-only wallet’s small memory footprint, which allows it to load much faster than a full WASM wallet. Use keys-only wallets when your application does not require of any of these missing features. One such case is an offline wallet generator, because it does not need to communicate with the blockchain. 

---

### Reporting the wallet's attributes

```
// Create a JSON object to hold select wallet attributes
  let walletInfoJson = {
    mnemonic: await(walletKeys.getMnemonic()),
    viewkey: await(walletKeys.getPrivateViewKey()),
    spendkey: await(walletKeys.getPrivateSpendKey()),
    // MoneroWalletKeys.getAddress(address index, subaddress index)
    address: await(walletKeys.getAddress(0,0))
  };

  // Convert walletInfoJson object to a string formatted to display
  // in an easy-to-read format
  let walletAttributesString = JSON.stringify(walletInfoJson, undefined, "\n");

  // Print the wallet attributes to the console
  console.log(walletAttributesString);
```

Run the application:
```
node offline_wallet_generator.js
```

You should see the following output:
```
{

"mnemonic": "darted oatmeal toenail launching frown empty agenda apply unnoticed blip waist ashtray threaten deftly sawmill rotate skirting origin ahead obtains makeup bakery bounced dagger apply",

"viewkey": "b4e167b76888bf6ad4c1ab23b4d1bb2e57e7c082ac96478bcda4a9af7fd19507",

"spendkey": "7bf64c44ecb5ecf02261e6d721d6201d138d0891f0fcf4d613dc27ec84bc070e",

"address": "5ATdKTGQpETCHbBHgDhwd1Wi7oo52PVZYjk2ucf5fnkn9T5yKau2UXkbm7Mo23SAx4MRdyvAaVq75LY9EjSPQnorCGebFqg"
}
```
