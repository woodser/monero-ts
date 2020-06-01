# Getting started with monero-javascript part 1: creating a Node.js application

## What is monero-javascript?

monero-javascript is a JavaScript library for producing Monero applications. The library is built on [a model and API specification](https://moneroecosystem.org/monero-java/monero-spec.pdf) which aims to be an intuitive and extensible interface to Monero Core.

In addition to standard RPC wallet and daemon server queries, monero-javascript is capable of performing native wallet operations through WebAssembly (Wasm). The Wasm wallet enables developers to build trustless, client-side applications by eliminating the need to communicate with an RPC wallet server intermediary.

<p align="center">
	<img width="80%" height="auto" src="../img/architecture.png"/><br>
	<i>monero-javascript uses Monero through three channels: RPC wallet servers, RPC daemon servers, and Wasm wallets.</i>
</p>

## Initial Setup

### Install Node.js and the Node package manager (npm)

Node.js and npm need to be installed before using the monero-javascript library. See the ["Node.js and npm"](https://github.com/monero-ecosystem/monero-javascript/blob/master/docs/developer_guide/installing_prerequisite_software.md#nodejs-and-npm) section of the prerequisite installation guide for instructions to download and install Node.js and npm.

### Create a new Node.js project

1. Create and enter a new directory to hold the project:
  ```
  mkdir ~/offline_wallet_generator
  cd ~/offline_wallet_generator
  ```
2. Create the new project:
  `npm init -y`
3. Add the monero-javascript library to the offline_wallet_generator package:
  `npm install --save monero-javascript`

## Write a monero-javascript program

### The offline wallet generator

An offline wallet generator creates and displays a new, random wallet address along with that address's associated view key, spend key, and mnemonic seed phrase. An offline wallet generator only needs to produce and display these wallet attributes; it does not need to communicate with a Monero network, transfer XMR, or track a wallet's balance or outputs.

monero-javascript's keys-only wallet meets these requirements and is the ideal basis for a monero-javascript-based offline wallet generator. The keys-only wallet is a minimal Wasm wallet implementation that only tracks a wallet's _permanent_ attributes. It cannot initiate transfers, report its balance, or communicate with a Monero network.

The keys-only wallet has a file size just under 1/5 that of a standard Wasm wallet. The smaller memory footprint allows programs to load and execute more efficiently, so you should use them whenever possible.

### Write the essential monero-javascript code

Open your preferred text editor or IDE and copy the following code to a new, blank file:

```
require("monero-javascript");

mainFunction();

async mainFunction() {
}
```

Note the program's two components:
1. A "require" statement to import the monero-javascript library:
`require("monero-javascript");`
2. An asynchronous "main" function so that "await" statements can precede calls to asynchronous monero-javascript methods:
`async mainFunction() {}`
The asynchronous function is not strictly necessary, but most applications need to call monero-javascript methods from an ayschnronous function so that code execution can pause while monero-javascript methods run. Otherwise, the app may try to manage a wallet or query an RPC server connection before loading completely.

### Building a keys-only wallet

monero-javscript implements keys-only wallets in the MoneroWalletKeys class. You can create a random keys-only wallet by calling the [MoneroWalletKeys](https://moneroecosystem.org/monero-javascript/MoneroWalletKeys.html) class's `createWallet()` method in mainFunction() as follows:
```
// create a random keys-only (offline) stagenet wallet
let keysOnlyWallet = await MoneroWalletKeys.createWallet({networkType: MoneroNetworkType.STAGENET, language: "English"});
```

The `createWallet()` method accepts a [MoneroWalletConfig](https://moneroecosystem.org/monero-javascript/MoneroWalletConfig) argument. A MoneroWalletConfig instance can contain any combination of wallet attributes, and the monero-javascript library will automatically determine how to create or restore the wallet based on the given attributes. For example, a MoneroWalletConfig that contains a view key but not a spend key will prompt the library to create a view-only wallet. The MoneroWalletConfig object in the offline wallet generator code above contains no identifying wallet information, so monero-javascript creates a new, random wallet rather than attempting to restore one from a mnemonic seed phrase or keys.

The offline wallet generator should display four basic wallet attritubes:
* The mnemonic seed phrase
* The address
* The spend key
* The view key

Use the wallet's getter methods to obtain the wallet's basic attributes and log them in the console.
```
console.log("Mnemonic seed phrase: " + await walletKeys.getMnemonic());
console.log("Address: " + await walletKeys.getAddress(0,0)); // get address of account 0, subaddress 0
console.log("Spend key: " + await walletKeys.getPrivateSpendKey());
console.log("View key: " + await walletKeys.getPrivateViewKey());
```

The finished program should match the following:

```
require("monero-javascript");

await mainFunction();

async function mainFunction() {
  // create a random keys-only (offline) stagenet wallet
  let walletKeys = await MoneroWalletKeys.createWallet({networkType: MoneroNetworkType.STAGENET, language: "English"});

  console.log("Mnemonic seed phrase: " + await walletKeys.getMnemonic());
  console.log("Address: " + await walletKeys.getAddress(0,0)); // get address of account 0, subaddress 0
  console.log("Spend key: " + await walletKeys.getPrivateSpendKey());
  console.log("View key: " + await walletKeys.getPrivateViewKey());
}
```
Save the file as "offline_wallet_generator.js" and run the program with Node.js:

`node offline_wallet_generator.js`

The output should look similar to the following:
```
Mnemonic seed phrase: darted oatmeal toenail launching frown empty agenda apply unnoticed blip waist ashtray threaten deftly sawmill rotate skirting origin ahead obtains makeup bakery bounced dagger apply
Address: 5ATdKTGQpETCHbBHgDhwd1Wi7oo52PVZYjk2ucf5fnkn9T5yKau2UXkbm7Mo23SAx4MRdyvAaVq75LY9EjSPQnorCGebFqg
Spend key: 7bf64c44ecb5ecf02261e6d721d6201d138d0891f0fcf4d613dc27ec84bc070e
View key: b4e167b76888bf6ad4c1ab23b4d1bb2e57e7c082ac96478bcda4a9af7fd19507
```

## The next step

Continue to [Getting Started with monero-javascript Part 2: Creating a Web Application](https://github.com/monero-ecosystem/monero-javascript/blob/master/docs/developer_guide/web_app_guide.md) to learn how to write client-side web browser applications with monero-javascript.
