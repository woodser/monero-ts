# External Software

## Installing Python
The sample app uses a Python command to run a server that hosts the monero-javascript sample web application, so you need to make sure Python is installed before you proceed.
### Windows
1. [Download the latest version of the Python installer from the Python website](https://www.python.org/downloads/).
2. Run the installer.
3. Create a bash alias to the Windows Python executable:
  3a. Open Git Bash.
  3b. Create and edit a .bashrc file in nano:
  `$ nano .bashrc`
  3c. Add the following line to the file:
  > alias python='winpty python.exe'
  3d. Press Ctrl-X followed by 'Y' to save the file and exit nano.
4. Close Git Bash (the alias will not be applied until the next time Bash starts)
### Linux
1. Open a terminal.
2. Use a package manager to download and install Python 3:
  For Debian/Ubuntu:
  `$ sudo apt-get install python3`
  For Fedora:
  `$ sudo dnf install python3`

## Installing node.js and npm
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
  For Debian/Ubuntu:
  1. Install node.js:
    `$ sudo apt-get install nodejs`
  2. Install npm:
    `$ sudo apt-get install npm`
  For Fedora:
  1. Install node.js:
    `$ sudo dnf install nodejs`
  2. Install npm:
    `$ sudo dnf install npm`
