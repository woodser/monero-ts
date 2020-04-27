# 1. The monero-javascript library
The monero-javascript library enables web developers to implement Monero functionality in javascript browser and node.js applications, such as interacting with Monero wallets, nodes, and RPC servers.

The library’s object and method hierarchy is derived from [The Hidden Model](https://moneroecosystem.org/monero-java/monero-spec.pdf), a concise, self-consistent, and intuitive representation of the underlying structure of the Monero software and the basis for the [monero-cpp](https://github.com/woodser/monero-cpp-library) and [monero-java](https://monero-ecosystem/monero-java) libraries.

Monero-javascript features a web assembly (WASM)-based wallet implementation. The WASM wallet acts as a direct bridge to the native Monero wallet code, eliminating the need to connect to an external - and potentially malicious - RPC wallet server in order to manage a wallet. In other words, monero-javascript makes fully client-side wallet operations possible. Monero-javascript also also allows traditional wallet management via RPC wallet queries as well.

(software architecture diagram)[./img/monero-javascript-diagram.png] caption:  Monero-javascript can interact with monero both via connection to RPC-servers and daemons and a direct bridge to the native wallet code via the monero c++ wallet implementation

# 2. Initial Setup
## 2.1: Required software
In order to install and use the monero-javascript library, you need to download and install [node.js and the node package manager (npm)](https://nodejs.org/en/)
* [the Monero command line tools](https://web.getmonero.org/downloads/#cli). In addition, you need the [Monero command line interface tools](http://getmonero.org/downloads) to host RPC wallet and daemon servers. 
## 2.2: Installing the monero-javascript libary

# 3. Write a simple monero-javascript program
## 3.1: Building the monero-javascript template
1. 
Open the file “index.js” in your IDE or text editor of choice to edit the template application’s code. Note that the unmodified template script does not take advantage of any of monero-javascript’s functionality. The script only provides the basic boilerplate code needed by every program that uses the monero-javascript library. The template program carries out two essential tasks:

It imports the monero-javascript library.
`require(“monero-javascript”)`
It runs the monero-javascript program in an asynchronous function.
`async function runMain() {`

Most monero-javascript methods are asynchronous, so you should call them from an asynchronous function - in this case, “runMain()” is that function.

---
**NOTE**
### Asynchronous methods
In Javascript, asynchronous functions emulate multithreading. In other words, they act like they are running multiple blocks of code simultaneously. This behavior is useful when you need a script to perform some behavior in the background without forcing the main program to halt execution until the background code finishes.

However, you will encounter situations where the behavior of your program’s main thread depends on the result that an asynchronous function returns. Consider the following example:

```
number = 0;

async function getNumberSlowly() {
  for(var i = 0; i < 100000; i++) {
    console.log(“Wasting time!”);
  }
  return(5);
}

number = getNumberSlowly();
console.log(number);
```

You might expect this code to print the number “5” to the console, but it will actually print “0”. Because getNumberSlowly() is an asynchronous function, javascript will not wait for it to return before executing the next line of code. Thus, the “getNumberSlowly()” function will still be running through its 
Preceding a function definition with the “asynchronous” keyword tells Javascript to run this function concurrently with the main thread.

```
async function functionName() {}
```
---

3.2: Creating an offline wallet
Monero-javascript provides a minimal Monero wallet implementation called a keys-only wallet. We will use the keys-only wallet to program an offline wallet generator. 

---
**NOTE**

Keys-only wallets have the following limitations:
They do not store and can not import transaction or output data
They can not connect to nodes or RPC wallet servers
They can not send XMR
They can not report their balances

The tradeoff for these limitations is the keys-only wallet’s small memory footprint, which allows it to load much faster than a full WASM wallet. Use keys-only wallets when your application doesn’t need to make use of any of the aforementioned missing features. One such case is an offline wallet generator, because it does not need to communicate with the blockchain. 

---

There are two steps to create a view-only wallet:
Load the WASM module
`await MoneroUtils.loadKeysModule();`
Create the new, random, keys-only wallet
`let walletKeys = await MoneroWalletKeys.createWalletRandom(MoneroNetworkType.STAGENET, "English");`

It is good practice to error-check any monero-javascript constructor calls, so encase the call to MoneroWalletKeys.createWalletRandom in a try-catch block.

```
  // Create a string to print the status (success or failure) of the app
  let statusMessage = "";

  // load wasm module on main thread
  await MoneroUtils.loadKeysModule();

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
