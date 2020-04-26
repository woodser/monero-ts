# 1. The monero-javascript library
The monero-javascript library enables web developers to implement Monero functionality in javascript browser and node.js applications, such as interacting with Monero wallets, nodes, and RPC servers.

The library’s object and method hierarchy is derived from [The Hidden Model](https://moneroecosystem.org/monero-java/monero-spec.pdf), a concise, self-consistent, and intuitive representation of the underlying structure of the Monero software and the basis for the [monero-cpp](https://github.com/woodser/monero-cpp-library) and [monero-java](https://monero-ecosystem/monero-java) libraries.

Monero-javascript features a web assembly (WASM)-based wallet implementation. The WASM wallet acts as a direct bridge to the native Monero wallet code, eliminating the need to connect to an external - and potentially malicious - RPC wallet server in order to manage a wallet. In other words, monero-javascript makes fully client-side wallet operations possible. Monero-javascript also also allows traditional wallet management via RPC wallet queries as well.

(software architecture diagram)[./img/monero-javascript-diagram.png] caption:  Monero-javascript can interact with monero both via connection to RPC-servers and daemons and a direct bridge to the native wallet code via the monero c++ wallet implementation
# 2. Initial setup
## 2.1: Required software
In order to obtain and use the monero-javascript starter project, you need to have the following software installed on your computer:
* [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Python](https://www.python.org/downloads/)
* [node.js and the node package manager (npm)](https://nodejs.org/en/)
* [the Monero command line tools](https://web.getmonero.org/downloads/#cli)

Each item in the list above links to the corresponding software download page.

---
**NOTE**
  
## Installing required software

Follow the instructions in this quick guide if you need assistance installing any of the software.

### Installing Git
#### Windows
1. [Download the Git for Windows installer](https://git-scm.com/download/win) from the git website.
2. Open the installer and click “I agree” when prompted with the license agreement.
#### Linux
1. Open a terminal.
2. Use the package manager to install git:
  For Debian/Ubuntu:
  `$ sudo apt-get install git-all`
  For Fedora:
  `$ sudo dnf install git-all`

### Installing Python
#### Windows
1. [Download the latest version of the Python installer](https://www.python.org/downloads/) from the Python website.
2. Run the installer.
3. Create a bash alias to the Windows Python executable:
  3a. Open Git Bash.
  3b. Create and edit a .bashrc file in nano:
  `$ nano .bashrc`
  3c. Add the following line to the file:
  > alias python='winpty python.exe'
  3d. Press Ctrl-X followed by 'Y' to save the file and exit nano.
4. Close Git Bash (the alias will not be applied until the next time Bash starts)
#### Linux
1. Open a terminal.
2. Use a package manager to download and install Python 3:
  For Debian/Ubuntu:
  `$ sudo apt-get install python3`
  For Fedora:
  `$ sudo dnf install python3`
  
### Installing node.js and npm
#### Windows
1. [Download the node.js Windows installer](https://nodejs.org/en/download/) from the node.js website.
2. Open the installer.
3. Click “next”.
4. Click the checkbox next to “I accept the terms in this license agreement.” and click “next”.
5. Click “next” to install node.js to the default directory.
6. Make sure that npm is listed as one of the installation packages, then click “next”.
7. Click “next”.
8. Click “Install”.
9. Click “Finish” after the installation process completes.
#### Linux
  ##### Debian (Ubuntu, etc.)
  1. Install node.js:
    `$ sudo apt-get install nodejs`
  2. Install npm:
    `$ sudo apt-get install npm`
  ##### Fedora
  1. Install node.js:
    `$ sudo dnf install nodejs`
  2. Install npm:
    `$ sudo dnf install npm`
    
### Installing the Monero Command Line Tools

---

##  2.2 Downloading and running the template project
### Download the files
Create a new directory for the application.
Open a terminal (Linux) or run Git Bash (Windows).
Clone the template project repository:
`$ git clone https://www.github.com/monero-ecosystem/monero-javascript/tempate-project`
Navigate to the repository directory:
`cd template-project`
### Install and run the app
Type “npm install” to configure the project for execution.
Host the application on a local server:
#### Windows
\bin\start_dev_browser
#### Linux/Mac
./bin/start_dev_browser

Open a web browser and navigate to https://localhost:9100 to view the app. If you see a mostly blank page with the message “Success!” printed in the top right corner, then the application is installed and running successfully.
# 3. Write a simple monero-javascript program
## 3.1: Understanding the template
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
