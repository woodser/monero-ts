# Installing prerequisites

## Node.js and npm

JavaScript is designed to run client-side in web browsers, so JavaScript programs cannot run as standalone or server-side applications out of the box. Node.js solves this limitation by providing a runtime environment, allowing JavaScript programs to execute outside of a web browser.

[Part 1 of the monero-javascript "getting started" guide](getting_started_p1.md) illustrates the use of Node.js to run a monero-javascript program in a unix terminal, so you need to install it to follow the guide.

In addition, Node.js includes the Node Package Manger (npm). npm installs Node modules including the monero-javascript module, which is required to use the monero-javascript library.

To install Node.js and npm:
### Debian/Ubuntu:

1. Install node.js by typing `$ sudo apt-get install nodejs`.
2. Install npm by typing `$ sudo apt-get install npm`.

### Fedora:

1. Install node.js:
  `$ sudo dnf install nodejs`
2. Install npm:
  `$ sudo dnf install npm`

## Monero CLI tools

Download and install for your platform: https://web.getmonero.org/downloads/

## Python

The starter web application uses a Python command to run its server, so you need to install Python before running the application.

To install Python:

1. Open a terminal.
2. Use a package manager to download and install Python 3:
### Debian/Ubuntu:

  `$ sudo apt-get install python3`
### Fedora:

  `$ sudo dnf install python3`
