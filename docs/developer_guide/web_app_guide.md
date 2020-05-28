# Getting Started with Monero Javascript part 2: Creating a Web Application

_Note: Though it is not strictly necessary, we recommend reading [part 1 of the monero-javascript getting started guide](https://github.com/monero-ecosystem/monero-javascript/blob/master/docs/developer_guide/getting_started.md) before learning about monero-javascript web application development._

## Overview

This guide describes a quick and convenient method for configuring and hosting a monero-javascript web application server using the monero-javascript web application starter script. The guide also demonstrates a practical use case by converting the offline wallet generator from [part 1 the getting started guide](https://moneroecosystem.org/monero-javascript/docs/developer-guide/getting_started.md)) into a web application.

## Generating a monero-javascript web application project

### Required software

The web application starter script relies on two external programs:
* [Python (version 3)](https://github.com/timetherewere/monero-javascript/blob/master/docs/developer_guide/prerequisite_installation_guides#python)
* [Node.js and the node package manager (npm)](https://github.com/timetherewere/monero-javascript/blob/master/docs/developer_guide/prerequisite_installation_guides#node.js_and_npm)
  _If you followed the [getting started guide](https://moneroecosystem.org/monero-javascript/docs/developer-guide/getting_started.md), you should already have installed node.js._

Click the links above for more information on installing and configuring Python, node.js, and npm.

### Configuring the project directory

Monero-javascript provides a script that automatically downloads the files and configures the directories you need to host a functioning monero-javascript web application server. To automatically download and run the script:

1. Create a new folder for the project (e.g. `mkdir ~/monero-javascript_web_app`)
2. Enter the new directory (`cd ~/monero-javascript_web_app`)
3. Download and run the script:

`bash <(curl -sL https://raw.githubusercontent.com/woodser/xmr-sample-app/master/web_template_script.sh)`

Alternately, you can manually download and run the shell scripts.
[Linux/Mac](https://github.com/timetherewere/monero-javascript/raw/include_compressed_template/web_template_script)

The script will configure the project folder and serve the starter web application on port 9100. Open a web browser and type "localhost:9100" in the URL bar to view the application.

_Note_:
* In order for the server to reflect changes to source files, you need to stop it by pressing "ctrl-c" in the terminal where the server is running and and restart the server by typing
`./bin/build_browser_app`.

## Modifying the offline wallet generator to display in a browser

* Navigate to the "./src/" directory.
* Add the following line between the <html> tags of the index.html file:

`<script type="text/javascript" src="xmr-sample-app.js"></script>`

_Note that index.html references a javascript file called "xmr-sample-app.js" rather than index.js._ This is due to the fact that the build_browser_app shell script assembles the final web application image in the "browser_build" folder, where it saves the working copy of index.js under the file name "xmr-sample-app.js".

* Return to the project's root directory
`cd ..`
* Run the build_browser_app script to host the application on a server:
./bin/build_browser_app.sh

**Note:** _The starter web application includes a second script - "start_dev_server" - in the "./bin/" folder. start-dev-server will host the existing browser build on a server without rebuilding the application from the source files. You can run this script instead of "build_browser_app" if you have not modified any of the files in the "./src/" directory._

Point a browser to localhost:9100 to view the application. The browser displays a blank page, because index.html is empty, and because the index.js does not send any output to the browser display. You can verify that the program runs exactly as it did as a node.js application at the command line, however, by opening your browser's developer console.

## Displaying the offline wallet details in the browser Window

The wallet generator is now _technically_ running on a server, but the typical end user should not have to open the developer console to see the result. Modify the application to print the wallet attributes to the browser window instead.

### Creating html elements to display the wallet attributes

A javascript program cannot print directly to a browser window; instead, it must manipulate the html elements that _do_ display in the browser so that _they_ display the data. Therefore, you need to modify the index.html file in "./src/" so that the javascript has a place to put the wallet attributes. Add "div" elements to contain each wallet attribute between the opening and closing "body" tags

```
    <div id="wallet_address"></div>
    <div id="wallet_seed_phrase"></div>
    <div id="wallet_spend_key"></div>
    <div id="wallet_view_key"></div>
```

### Sending the wallet attributes to the html page

Open index.js and find the lines that the print the wallet attributes to the console:

```
console.log("Seed phrase: " + await(walletKeys.getMnemonic()));
console.log("Address: " + await(walletKeys.getAddress(0,0))); // get address of account 0, subaddress 0
console.log("Spend key: " + await(walletKeys.getPrivateSpendKey()));
console.log("View key: " + await(walletKeys.getPrivateViewKey()));
```

Note that the program passes a display string with the format '"Wallet attribute: " + await(walletKeys.getWalletAttribute())'to each console.log() function call. Modify these lines to send each display string to its corresponding div element in index.html instead:

```
// Print the wallet's attributes in the browser Window
document.getElementById("wallet_seed_phrase").innerHTML = "Seed phrase: " + await(walletKeys.getMnemonic());
document.getElementById("wallet_address").innerHTML = "Address: " + await(walletKeys.getAddress(0, 0)); // MoneroWalletKeys.getAddress(accountId, subAddressId)
document.getElementById("wallet_spend_key").innerHTML = "Spend key: " + await(walletKeys.getPrivateSpendKey());
document.getElementById("wallet_view_key").innerHTML = "View key: " + await(walletKeys.getPrivateViewKey());
```

The final html and javascript files should match the following:

### index.html

```
<!DOCTYPE html>
<html>
  <body>
    <div id="wallet_address"></div>
    <div id="wallet_seed_phrase"></div>
    <div id="wallet_spend_key"></div>
    <div id="wallet_view_key"></div>
    <script type="text/javascript" src="xmr-sample-app.js"></script>
  </body>
</html>
```

### index.js

```
require("monero-javascript");

console.log("console log test");

mainFunction();

async function mainFunction() {
  // create a random keys-only (offline) stagenet wallet
  var walletKeys = await MoneroWalletKeys.createWallet({networkType: MoneroNetworkType.STAGENET, language: "English"});

  // Print the wallet's attributes in the browser Window
  document.getElementById("wallet_seed_phrase").innerHTML = "Seed phrase: " + await(walletKeys.getMnemonic());
  document.getElementById("wallet_address").innerHTML = "Address: " + await(walletKeys.getAddress(0, 0)); // MoneroWalletKeys.getAddress(accountId, subAddressId)
  document.getElementById("wallet_spend_key").innerHTML = "Spend key: " + await(walletKeys.getPrivateSpendKey());
  document.getElementById("wallet_view_key").innerHTML = "View key: " + await(walletKeys.getPrivateViewKey());

}
```

Run the build_browser_app script in the "./bin/" directory to rebuild the application, then point your browser to localhost:9100. You should see the wallet's address, seed phrase, spend key, and view key displayed in the browser window.

## Additional resources

See the instructional monero-javascript code examples to learn more about implementing monero-javascript in your projects.

* [Creating wallets](docs/developer_guide/creating_wallets.md)
* [Transactions, transfers, and outputs](docs/developer_guide/data_model.md)
* [Getting transactions, transfers, and outputs](docs/developer_guide/query_data_model.md)
* [Sending funds](docs/developer_guide/sending_funds.md)
* [Multisig wallets](docs/developer_guide/multisig_wallets.md)
* [View-only and offline wallets](docs/developer_guide/view_only_offline.md)
* Getting started with monero-javascript web browser applications
* Connecting to Monero nodes and RPC wallet servers
* Analyzing the blockchain
