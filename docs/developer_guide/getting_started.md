Monero-javascript is a Node.js-based Monero library for javascript.

The library derives its object and method hierarchy from [The Hidden Model](https://moneroecosystem.org/monero-java/monero-spec.pdf), a concise, uniform, and intuitive API specification that also serves as the foundation for [monero-cpp](https://github.com/woodser/monero-cpp-library) and [monero-java](https://github.com/monero-ecosystem/monero-java) libraries.

In addition to traditional RPC wallet management, monero-javascript can control wallets natively with WebAssembly (Wasm). Monero-javascript's Wasm wallet lets developers implement completely trustless, client-side wallet operations by eliminating the need for an intermediary wallet RPC server.

![Monero-javascript hierarchy](img/architecture.png?raw=true)*Monero-javascript can communicate through three channels: RPC wallet servers, RPC daemon servers, and Wasm wallets.*  

# Initial Setup

Skip ahead to [Create a new Node.js project](todo) if you already have Node.js and npm installed. 

## Install Node.js and npm
You need to install node.js and the node package manager (npm) to obtain and use the monero-javascript library. 

### Windows
1. [Download the Node.js Windows installer](https://nodejs.org/en/download/) from the Node.js website.
2. Open the installer.
3. Click “next”.
4. Click the checkbox next to “I accept the terms in this license agreement.” and click “next”.
5. Click “next” to install Node.js to the default directory.
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

## Create a new Node.js project

1. Create and enter a new directory to hold the project:
  ### Windows
  1. `mkdir C:\offline_wallet_generator`
  2. `cd C:\offline_wallet_generator`

  ### Linux
  1. `mkdir ~/offline_wallet_generator`
  2. `cd ~/offline_wallet_generator`
  
2. Create the new project:
  `npm init`
  npm will ask you to enter information into a number of fields. Press enter at each prompt to use the default (or empty) value.

3. Add the monero-javascript library to the offline_wallet_generator package:
  `npm install monero-javascript`

# Write a monero-javascript program
## Creating an offline wallet generator

An offline wallet generator creates and displays a new, random wallet address along with that address's associated view key, spend key, and mnemonic seed phrase. Offline wallet generators only need to generate and display these wallet attributes; they do not need to communicate with a Monero network, transfer XMR or track a wallet's balance or outputs.

Monero-javascript's keys-only wallet more than meets these requirements and is the ideal basis for a monero-javascript-based offline wallet generator. They keys-only wallet is a minimal Wasm wallet implementation that can not initiate transfers, report its balance, or communicate with a Monero network. The trade off for these limitations is a small file size - just under 1/5 that of a standard Wasm wallet. These characteristics make it the ideal basis for an offline wallet.

## Essential code

Open your preferred text editor or IDE and copy the following code to a new, blank file:

```
require("monero-javascript");

mainFunction();

async mainFunction() {
}
```

Note the program's two essential components:
1. A "require" statement to import the monero-javascript library:
`require("monero-javascript");`
2. An asynchronous "main" function so that "await" statements can precede calls to asynchronous monero-javascript methods:
`async mainFunction() {}` 
The asynchronous "main" function is not strictly necessary in all cases, but most applications will need to call monero-javascript methods from an ayschnronous function so that code execution can pause while monero-javascript methods run. 

### Building a keys-only wallet

Monero-javscript implements keys-only wallets in the MoneroWalletKeys class. You can create a random keys-only wallet by calling the [MoneroWalletKeys](monero-ecosystem.org/monero-javascript/MoneroWalletKeys.html) class's `createWallet()` method in mainFunction() as follows:
```
// create a random keys-only (offline) stagenet wallet
var keysOnlyWallet = await MoneroWalletKeys.createWallet({networkType: MoneroNetworkType.STAGENET, language: "English"});
```

The createWallet method accepts a [MoneroWalletConfig](monero-ecosystem.org/monero-javascript/MoneroWalletConfig.html) argument. MoneroWalletConfig is a generic class for passing wallet attributes to any monero-javascript wallet creation method. Each wallet class can determine how to create the new wallet by evaluating which MoneroWalletConfig fields are present and which are absent. If the MoneroWalletConfig does not specify any identifying attributes such as an address or seed phrase, the wallet class will generate a random wallet address.
<!--
---
### Why is it necessary to specify a network type for an offline wallet?

**The Three Monero Networks**
Each Monero network requires a slightly different wallet address format, so wallets are not compatible across the networks. Therefore, the Monero software needs to know which network to create a wallet _for_ in order to generate an address, a seed phrase, and private keys that are valid on that network.

There are three distinct Monero networks:
* mainnet
* stagenet
* testnet

*mainnet* is the main Monero network. XMR traded on mainnet has real-world monetary value.
*stagenet* is designed for learning how to use Monero and interact with the blockchain. Use this network for learning, experimentation, and application testing.
*testnet* is like stagenet for the Monero development team. It is meant for testing updates and additions to the Monero source code. If you are not a member of the Monero developent team then you probably have no need to use testnet.

---
-->

The monero-javascript wallet provides straightforward getter methods for obtaining wallet attributes. Use them to log the relevant attributes - the seed phrase, address, spend key, and view key - to the console:

```
console.log("Seed phrase: " + await(walletKeys.getMnemonic()));
console.log("Address: " + await(walletKeys.getAddress(0,0))); // MoneroWallet.getAddress(accountIndex, subAddress)
console.log("Spend key: " + await(walletKeys.getPrivateSpendKey()));
console.log("View key: " + await(walletKeys.getPrivateViewKey()));
```

The finished program should match the following:

```
require("monero-javascript");

await mainFunction();

async function mainFunction() {
  // create a random keys-only (offline) stagenet wallet
  var walletKeys = await MoneroWalletKeys.createWallet({networkType: MoneroNetworkType.STAGENET, language: "English"});
  
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
* [Connecting to Monero nodes and RPC wallet servers](dummy_link)
* [Initiating transfers](dummy_link)
* [Building client-side wallets with MoneroWalletWasm](dummy_link)
* [Managing view-only wallets](dummy_link)
* [Using multisig wallets](dummy_link)
* [Analyzing the blockchain](dummy_link)
