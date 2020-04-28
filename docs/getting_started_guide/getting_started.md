# Introduction to the monero-javascript library
The monero-javascript library enables web developers to implement Monero functionality in javascript browser and node.js applications, such as interacting with Monero wallets, nodes, and RPC servers.

The library’s object and method hierarchy is derived from [The Hidden Model](https://moneroecosystem.org/monero-java/monero-spec.pdf), a concise, self-consistent, and intuitive representation of the underlying structure of the Monero software and the basis for the [monero-cpp](https://github.com/woodser/monero-cpp-library) and [monero-java](https://monero-ecosystem/monero-java) libraries.

Monero-javascript features a web assembly (WASM)-based wallet implementation, which acts as a direct bridge to the native Monero wallet code and eliminates the need to connect to an external - and potentially malicious - RPC wallet server in order to manage a wallet. In other words, monero-javascript makes fully client-side wallet operations possible. In addition, monero-javascript allows traditional wallet management via RPC wallet queries as well.

(software architecture diagram)[./img/monero-javascript-diagram.png] caption:  Monero-javascript can interact with monero both via connection to RPC-servers and daemons and a direct bridge to the native wallet code via the monero c++ wallet implementation

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

Every monero-javascript program must have two essential components:
1. A "require" statement to import the monero-javascript library:
```require("monero-javascript");```
2. An asynchronous "main" function to handle all monero-javascript operations
```async mainFunction() {}```

These requirements inform the design of a basic script template that serves as the foundation of every monero-javascript program. You should create and save a copy of this template program:
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

## Creating an offline wallet
Monero-javascript provides a minimal Monero wallet implementation called a keys-only wallet. You will use the keys-only wallet to program an offline wallet generator. 

Open monero-javascript-template.js in a text editor or IDE and modify it to match the following program:

```
require("monero-javascript");

mainFunction();

function mainFunction() {
  let statusMessage = "";
  //use a try block to detect whether the keys-only wallet was able to be created without error
  try {
    // create a random keys-only (offline) stagenet wallet
    var walletKeys = await MoneroWalletKeys.createWalletRandom(MoneroNetworkType.STAGENET, "English");
    statusMessage = "Success!";
  } catch(e) {
    statusMessage = "Attempt to create keys-only wallet failed with the following error: " + e;
  }

  // Print the status message ("Success!" or the error) to the console
  console.log(statusMessage);
}
```

---
## Keys-only wallet limitations
Keys-only wallets have the following limitations:
* They do not store and can not import transaction or output data
* They can not connect to nodes or RPC wallet servers - this means they can not interact with any of the Monero networks.
* They can not send XMR
* They can not report their balances

The tradeoff for these limitations is the keys-only wallet’s small memory footprint, which allows it to load much faster than a full WASM wallet. Use keys-only wallets when your application does not require of any of these missing features. One such case is an offline wallet generator, because it does not need to communicate with the blockchain. 

---

There are two steps to create a keys-only wallet:
Load the WASM module
`await MoneroUtils.loadKeysModule();`
Create the new, random, keys-only wallet
`let walletKeys = await MoneroWalletKeys.createWalletRandom(MoneroNetworkType.STAGENET, "English");`

It is good practice to error-check any monero-javascript constructor calls, so encase the call to MoneroWalletKeys.createWalletRandom in a try-catch block.

```
  try {
    // create a random keys-only (offline) stagenet wallet
    var walletKeys = await MoneroWalletKeys.createWalletRandom(MoneroNetworkType.STAGENET, "English");
    statusMessage = "Success!";
  } catch(e) {
    statusMessage = "Attempt to create keys-only wallet failed with the following error: " + e;
  }

  // Print the status message to the console
  console.log(statusMessage);
```

Build the app with “npm install”, run start_dev_browser, and check the console. If you see the “Success!” message then the application successfully created an offline wallet. However, the wallet is useless until you print out it’s essential attributes, so you need to write the code to do so.
Build an object to store the wallet data
MoneroWallet implements getter methods for obtaining wallet attributes from a MoneroWallet instance. Use them to create a javascript object containing the attributes needed for an offline wallet, and print the object to the console.

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

Install and run the application. The output to the browser’s console should resemble the following:
```
Success!
{

"mnemonic": "darted oatmeal toenail launching frown empty agenda apply unnoticed blip waist ashtray threaten deftly sawmill rotate skirting origin ahead obtains makeup bakery bounced dagger apply",

"viewkey": "b4e167b76888bf6ad4c1ab23b4d1bb2e57e7c082ac96478bcda4a9af7fd19507",

"spendkey": "7bf64c44ecb5ecf02261e6d721d6201d138d0891f0fcf4d613dc27ec84bc070e",

"address": "5ATdKTGQpETCHbBHgDhwd1Wi7oo52PVZYjk2ucf5fnkn9T5yKau2UXkbm7Mo23SAx4MRdyvAaVq75LY9EjSPQnorCGebFqg"
}
```
