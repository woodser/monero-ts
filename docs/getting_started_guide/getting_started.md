<!--
consistent capitalization (wallet vs Daemon consistent, WASM, RPC, monero-javascript)
-->

# Introduction
Monero-javascript is a javascript library for implementing Monero cryptocurrency functionality in web browser and node.js applications. The library derives its object and method hierarchy from [The Hidden Model](https://moneroecosystem.org/monero-java/monero-spec.pdf), a concise, self-consistent, and intuitive representation of the underlying Monero software structure and the foundation of the [monero-cpp](https://github.com/woodser/monero-cpp-library) and [monero-java](https://monero-ecosystem/monero-java) libraries.

In addition to standard wallet manipulation through an RPC server, monero-javascript can manage wallets manage wallet natively via WebAssembly (Wasm). By eliminating the RPC intermediary, monero-javascript's Wasm wallet enables completely trustless, client-side wallet operations.

Monero-javascript can also communicate with the three Monero networks through an RPC daemon server (node).

![Monero-javascript hierarchy](img/paste.png?raw=true)*Monero-javascript can communicate through three channels: RPC wallet servers, RPC daemon servers, and Wasm wallets.*  

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
<!--
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
-->
## Creating an offline wallet generator

An offline wallet generator creates and displays a new wallet address along with that address's associated view key, spend key, and mnemonic seed phrase. Offline wallet generators do not need to communicate with a Monero network, transfer XMR or track a wallet's balance or outputs. This makes the keys-only wallet the ideal basis for an offline wallet generator in monero-javascript.

Monero-javascript provides a minimal Wasm wallet implementation called a keys-only wallet. Keys-only wallets can not initiate transfers, report their balances, or communication with a Monero network. The trade off for these limitations is a small file size - just under 1/5 that of a standard Wasm wallet. These characteristics make it the ideal basis for an offline wallet.

## Essential code

This program requires two essential components:
1. A "require" statement to import the monero-javascript library:
```require("monero-javascript");```
2. An asynchronous "main" function
```async mainFunction() {}```

The asynchronous "main" function allows the program to <u>await</u> the results of the monero-javascript methods that create keys-only wallets.

### Building a keys-only wallet

Monero-javscript implements keys-only wallets in the MoneroWalletKeys class. You can create a random keys-only wallet by calling the MoneroWalletKeys class's `createWalletRandom()` method as follows:
```
// create a random keys-only (offline) stagenet wallet
var keysOnlyWallet = await MoneroWalletKeys.createWallet({networkType: MoneroNetworkType.STAGENET, language: "English"});
```

The createWalletRandom method accepts two arguments: the network type and the seed phrase language. 

---
**The Three Monero Networks**
There are three distinct Monero networks:
* mainnet
* stagenet
* testnet

*mainnet* is the "real" Monero network. XMR transferred on mainnet has actual monetary value.
*stagenet* is designed for learning how to use Monero and interact with the blockchain. Use this network for learning, experimentation, and application testing.
*testnet* is like stagenet for the Monero development team. It is meant for testing updates and additions to the Monero source code. If you are not a member of the Monero developent team then you probably have no need to use testnet.

Note that wallets are not network cross-compatible. Each Monero network uses a unique wallet address format, so any attempt to restore a wallet created for one network on a different network will fail.

---

The monero-javascript wallet provides straightforward getter methods for obtaining wallet attributes. Log the relevant attributes - the seed phrase, address, spend key, and view key - to the console:

```
console.log("Seed phrase: " + await(walletKeys.getMnemonic()));
console.log("Address: " + await(walletKeys.getAddress(0,0))); // MoneroWallet.getAddress(accountIndex, subAddress)
console.log("Spend key: " + await(walletKeys.getPrivateSpendKey()));
console.log("View key: " + await(walletKeys.getPrivateViewKey()));
```

The final program:

```
require("monero-javascript");

mainFunction();

async mainFunction() {
  // create a random keys-only (offline) stagenet wallet
  var walletKeys = await MoneroWalletKeys.createWallet({networkType: MoneroNetworkType.STAGENET, language: "English"});;
  
  console.log("Seed phrase: " + await(walletKeys.getMnemonic()));
  console.log("Address: " + await(walletKeys.getAddress(0,0))); // MoneroWallet.getAddress(accountIndex, subAddress)
  console.log("Spend key: " + await(walletKeys.getPrivateSpendKey()));
  console.log("View key: " + await(walletKeys.getPrivateViewKey()));
}
```
Save the file as "offline_wallet_generator.js" and run the program with node:

```
node offline_wallet_generator.js
```

The output should look similar to the following:
```
Seed phrase: darted oatmeal toenail launching frown empty agenda apply unnoticed blip waist ashtray threaten deftly sawmill rotate skirting origin ahead obtains makeup bakery bounced dagger apply
Address: 5ATdKTGQpETCHbBHgDhwd1Wi7oo52PVZYjk2ucf5fnkn9T5yKau2UXkbm7Mo23SAx4MRdyvAaVq75LY9EjSPQnorCGebFqg
Spend key: 7bf64c44ecb5ecf02261e6d721d6201d138d0891f0fcf4d613dc27ec84bc070e
View key: b4e167b76888bf6ad4c1ab23b4d1bb2e57e7c082ac96478bcda4a9af7fd19507
```

# Next steps

Browse the specialized monero-javascript guides to learn how to perform more advanced tasks with the monero-javascript library.
* [Getting started with monero-javascript web browser applications](dummy_link)
* [Connecting to Monero nodes and RPC wallet servers with MoneroRpcConnection](dummy_link)
* [Initiating transfers](dummy_link)
* [Building client-side wallets with MoneroWalletWasm](dummy_link)
* [Managing view-only wallets](dummy_link)
* [Using multisig wallets](dummy_link)
* [Analyzing the blockchain](dummy_link)
