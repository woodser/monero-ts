# 1. The monero-javascript library
The monero-javascript library enables web developers to implement Monero functionality in javascript browser and node.js applications, such as interacting with Monero wallets, nodes, and RPC servers.

The library’s object and method hierarchy is derived from [The Hidden Model](https://moneroecosystem.org/monero-java/monero-spec.pdf), a concise, self-consistent, and intuitive representation of the underlying structure of the Monero software and the basis for the [monero-cpp](https://github.com/woodser/monero-cpp-library) and [monero-java](https://monero-ecosystem/monero-java) libraries.

Monero-javascript features a web assembly (WASM)-based wallet implementation. The WASM wallet acts as a direct bridge to the native Monero wallet code, eliminating the need to connect to an external - and potentially malicious - RPC wallet server in order to manage a wallet. In other words, monero-javascript makes fully client-side wallet operations possible. Monero-javascript also also allows traditional wallet management via RPC wallet queries as well.

(software architecture diagram)[./img/monero-javascript-diagram.png] caption:  Monero-javascript can interact with monero both via connection to RPC-servers and daemons and a direct bridge to the native wallet code via the monero c++ wallet implementation
# 2. Initial setup
## 2.1: Required software
In order to obtain and use the monero-javascript starter project, you need to have the following software installed on your computer:
* [Python](https://www.python.org/downloads/)
* [node.js and the node package manager (npm)](https://nodejs.org/en/)
* [the Monero command line tools](https://web.getmonero.org/downloads/#cli)
* [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

Each item in the list above links to the corresponding software download page.

<div style="width:30%; background-color: gray; padding: 10px;">
## Installing required software
Follow the instructions in this quick guide if you need assistance installing any of the software.

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
###Installing Git
####Windows
1. [Download the Git for Windows installer](https://git-scm.com/download/win) from the git website.
2. Open the installer and click “I agree” when prompted with the license agreement.
####Linux
1. Open a terminal.
2. Use the package manager to install git:
  For Debian/Ubuntu:
  `$ sudo apt-get install git-all`
  For Fedora:
  `$ sudo dnf install git-all`
  
###Installing node.js and npm
#### Windows
##### Install node.js and npm
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
  #####Debian (Ubuntu, etc.)
  1. Install node.js:
    `$ sudo apt-get install nodejs`
  2. Install npm:
    `$ sudo apt-get install npm`
  #####Fedora
  1. Install node.js:
    `$ sudo dnf install nodejs`
  2. Install npm:
    `$ sudo dnf install npm`
</div>

##  2.2 Downloading and running the template project
### Download the files
Create a new directory for the application.
Open a terminal (Linux) or run Git Bash (Windows).
Clone the template project repository:
`$ git clone https://www.github.com/monero-ecosystem/monero-javascript/tempate-project`
