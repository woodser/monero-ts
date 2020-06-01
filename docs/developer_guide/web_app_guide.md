# Getting started part 2: creating a web application

_Note: Though it is not strictly necessary, we recommend reading [part 1 of the monero-javascript getting started guide](https://github.com/monero-ecosystem/monero-javascript/blob/master/docs/developer_guide/getting_started.md) before learning about monero-javascript web application development._

## Overview

This guide describes a convenient method for configuring and hosting a monero-javascript web application server using the monero-javascript web application starter script. The guide also explains how to convert the offline wallet generator from [part 1 of the getting started guide](https://moneroecosystem.org/monero-javascript/docs/developer-guide/getting_started.md) into a web browser application.

This guide is divided into three major sections:
1. [Generating a monero-javascript web application project](generating-a-monero-javascript-web-application-project): A walkthrough of how to download and run the monero-javascript web application starter script, which automatically builds a functioning monero-javascript web application template and server.
2. [Modifying the offline wallet generator to display in a browser](modifying_the_offline_wallet_generator_to_display_in_a_browser): Explains how to refactor the offline wallet generator to print wallet attributes to an html page rather than to the console. Experienced JavaScript web developers may be able to safely skip this section.
3. [Porting the application to a custom server](porting_the_application_to_a_custom_server): a brief guide to serving the application on a traditional server rather than the built-in Python server.

## Generating a monero-javascript web application project

### Required software

The web application starter script relies on two external programs:
* [Python (version 3)](https://github.com/monero-ecosystem/monero-javascript/blob/master/docs/developer_guide/installing_prerequisite_software.md#python)
* [Node.js and the node package manager (npm)](https://github.com/monero-ecosystem/monero-javascript/blob/master/docs/developer_guide/installing_prerequisite_software.md#nodejs-and-npm)

_If you followed the [getting started guide](https://github.com/monero-ecosystem/monero-javascript/blob/master/docs/developer_guide/getting_started.md), you should have already installed Node.js._

Click the links above for more information on installing and configuring Python, Node.js, and npm.

### Configuring the project directory

A script is available to automatically download and launch a functioning monero-javascript web app in an application server.  To download and run the script:

1. Create a new folder for the project:
`mkdir ~/monero-javascript_web_app`
2. Enter the new directory
`cd ~/monero-javascript_web_app`
3. Download and run the web app starter script:
`bash <(curl -sL https://raw.githubusercontent.com/woodser/xmr-sample-app/master/web_template_script.sh)`


Alternatively, you can [manually download](https://raw.githubusercontent.com/woodser/xmr-sample-app/master/web_template_script.sh) the script then run it.

The script configures a project folder and serves two example web applications on port 9100. Open a web browser and navigate to http://localhost:9100 for links to the applications:
* "Offline wallet generator" shows off the final result of following this guide. To view the complete offline wallet generator code as a functioning web application, see "src/offline_wallet_generator.html" and "src/offline_wallet_generator.js".
* "Sample code" demonstrates a handful of common monero-javascript operations. Open the developer console to see the application's output.

_Note_: In order for the server to reflect changes to source files, you need to stop it by pressing "ctrl-c" in the terminal where the server is running and then rebuild the application and restart the server by typing: `./bin/build_browser_app.sh`.

## Modifying the offline wallet generator to display in a browser

1. Navigate to the "./src/" directory.
2. Delete the files "offline_wallet_generator.html" and "offline_wallet_generator.js". We'll be rewriting them from scratch.
3. Create the file "offline_wallet_generator.html" and insert the following:
    ```
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <title>Offline Wallet Generator</title>
            <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height">
        </head>
        <body>
            <script type="text/javascript" src="offline_wallet_generator.dist.js"></script>
        </body>
    </html>
    ```
    Take note of the line with the `<script>` element:
    `<script type="text/javascript" src="offline_wallet_generator.js"></script>`
    This line will tell the browser to run your offline wallet generator javascript program.
4. Save the file.
5. While still in the "src" directory, create the file "offline_wallet_generator.js" and open it in a text editor.
6. Copy the code from the Node.js version of the offline wallet generator that was [produced in part 1 of this guide](https://github.com/monero-ecosystem/monero-javascript/blob/master/docs/developer_guide/getting_started.md):
    ```
    require("monero-javascript");
    
    mainFunction();
    async function mainFunction() {
      // create a random keys-only (offline) stagenet wallet
      let walletKeys = await MoneroWalletKeys.createWallet({networkType: MoneroNetworkType.STAGENET, language: "English"});
      console.log("Seed phrase: " + await walletKeys.getMnemonic());
      console.log("Address: " + await walletKeys.getAddress(0,0)); // MoneroWallet.getAddress(accountIndex, subAddress)
      console.log("Spend key: " + await walletKeys.getPrivateSpendKey());
      console.log("View key: " + await walletKeys.getPrivateViewKey());
    }
    ```
7. Paste the code into "offline_wallet_generator.js" and save the file.
8. Return to the project's root directory: `cd ..`
9. Run the build_browser_app.sh script to host the application on a server: `./bin/build_browser_app.sh`
    **Note:** _The starter web application includes a second script - "start_dev_server.sh" - in the "./bin/" folder. start_dev_server.sh hosts the existing browser build on a server without rebuilding the application from the source files. You can run this script instead of "build_browser_app.sh" if you have not modified any of the files in the "./src/" directory._
10. Point a browser to http://localhost:9100/offline_wallet_generator.html to view the application.

The browser displays a blank page, because index.html is empty, and because the index.js does not add any output to the browser display. You can verify that the program runs exactly as it did as a Node.js application at the command line, however, by opening your browser's developer console.

### Creating html elements to display the wallet attributes

The wallet generator is now _technically_ running on a server, but the typical end user should not have to open the developer console to see the result. Modify the application to print the wallet attributes to the browser window instead.

A javascript program cannot print directly to a browser window; instead, it must manipulate the html elements that _do_ display in the browser so that _they_ display the data. Therefore, we need to modify the offline_wallet_generator.html file in "./src/" so that the javascript program has a place to assign the wallet attributes to. Add "div" elements to contain each wallet attribute between the opening and closing "body" tags

```
    <div id="wallet_address"></div>
    <div id="wallet_seed_phrase"></div>
    <div id="wallet_spend_key"></div>
    <div id="wallet_view_key"></div>
```

### Assigning the wallet attributes to the html page

Open offline_wallet_generator.js and find the lines that the print the wallet attributes to the console:

```
console.log("Mnemonic seed phrase: " + await walletKeys.getMnemonic());
console.log("Address: " + await walletKeys.getAddress(0,0)); // get address of account 0, subaddress 0
console.log("Spend key: " + await walletKeys.getPrivateSpendKey());
console.log("View key: " + await walletKeys.getPrivateViewKey());
```

Modify these lines to assign each string to its corresponding div element in index.html instead:

```
// print the wallet's attributes in the browser window
document.getElementById("wallet_seed_phrase").innerHTML = "Mnemonic seed phrase: " + await walletKeys.getMnemonic();
document.getElementById("wallet_address").innerHTML = "Address: " + await walletKeys.getAddress(0, 0); // get address of account 0, subaddress 0
document.getElementById("wallet_spend_key").innerHTML = "Spend key: " + await walletKeys.getPrivateSpendKey();
document.getElementById("wallet_view_key").innerHTML = "View key: " + await walletKeys.getPrivateViewKey();
```

The final html and javascript files should match the following:

### offline_wallet_generator.html

```
<!DOCTYPE html>
<html>
	<head>
	<meta charset="UTF-8">
	<title>Offline Wallet Generator</title>
	<meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height">
	</head>
  <body>
    <div id="wallet_address"></div>
    <div id="wallet_seed_phrase"></div>
    <div id="wallet_spend_key"></div>
    <div id="wallet_view_key"></div>
    <script type="text/javascript" src="xmr-sample-app.js"></script>
  </body>
</html>
```

### offline_wallet_generator.js

```
require("monero-javascript");

mainFunction();
async function mainFunction() {
  // create a random keys-only (offline) stagenet wallet
  let walletKeys = await MoneroWalletKeys.createWallet({networkType: MoneroNetworkType.STAGENET, language: "English"});

  // print the wallet's attributes in the browser window
  document.getElementById("wallet_seed_phrase").innerHTML = "Mnemonic seed phrase: " + await walletKeys.getMnemonic();
  document.getElementById("wallet_address").innerHTML = "Address: " + await walletKeys.getAddress(0, 0); // get address at account 0, subaddress 0
  document.getElementById("wallet_spend_key").innerHTML = "Spend key: " + await walletKeys.getPrivateSpendKey();
  document.getElementById("wallet_view_key").innerHTML = "View key: " + await walletKeys.getPrivateViewKey();
}
```

Run `./bin/build_browser_app.sh` to rebuild the application and launch the server, then point your browser to http://localhost:9100/offline_wallet_generator.html. You should see the wallet's address, mnemonic phrase, spend key, and view key displayed in the browser window.

## Porting the application to a custom server

The xmr-sample-app project that the web application starter script downloads is designed to provide a quick and hassle-free way to set up a working monero-javascript web application project base. To build a new project on top of xmr-sample-app:
1. Follow all of the steps in the [Generating a monero-javascript web application project section of this guide](#generating-a-monero-javascript-web-application-project) to set up a working project folder
2. Change the name of the "xmr-sample-app-master" directory to the name of your application:
`mv xmr-sample-app-master [application_name]`
3. Delete all of the .html and .js files from the "[application_name]/src" directory:
`rm [application_name]src/*.html [application_name]/src/*.js`
4. Create a new "index.html" file in the [application_name/src] directory to serve as your application's main landing page.
5. Place all of your application's JavaScript files in the [application_name/src] directory along with any additional .html files. _Remember to use `<script>` tags in your html files to invoke your JavaScript files!_
6. Run the "build_browser_app.sh" script to assemble the application in the "[application_name]/browser_build" folder:
`./bin/build_browser_app.sh`

To host the application on your own server, copy the contents of the "[application_name]/browser_build" folder to the root directory of your server. For example, to host the application on a standard apache server:
`cp [application_name]/browser_build/* /var/www/html`

## Additional resources

Read through the rest of the guides to learn more about using monero-javascript:

* [Creating wallets](./creating_wallets.md)
* [The data model: blocks, transactions, transfers, and outputs](./data_model.md)
* [Getting transactions, transfers, and outputs](./query_data_model.md)
* [Sending funds](./sending_funds.md)
* [Multisig wallets](./multisig_wallets.md)
* [View-only and offline wallets](./view_only_offline.md)
* [HTTPS and self-signed certificates](./https_and_self_signed_certificates.md)
