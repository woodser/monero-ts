## External Software

### Python
The starter web application uses a Python command to run its server, so Python must be installed before you attempt to run the sample application.

To install Python:
#### Windows
##### Download and install
1. Go to the [Python Downloads page](https://www.python.org/downloads/) and click the button under "Download the latest version of Python".
2. Scroll down to find the [Windows x86-64 executable installer](https://www.python.org/ftp/python/3.8.3/python-3.8.3-amd64.exe).
3. Click "Install now".
4. When the install finishes, click the "close" button.

##### Add Python to the Path environment variable
The scripts that configure and initiate the web server do not know where to find the Python executable file in Windows. In order to allow them to start Python without specifying the exectable location, you need to add the location to Windows' "Path" environment variable.
1. Click the start menu button.
2. type "env".
3. Click "Edit the system environment variables".
4. In the advanced tab, click the "Environment Variables..." button at the bottom of the window.
5. In the "System variables" section, find and click "Path", then click "Edit...".
6. Click "New".
7. Type in the path to the Python executable. The default Python installation location is `C:\Users\[username]\AppData\Local\Programs\Python3X` **Where "X" is the 2nd digit in the three-part version number.** At the time writing, Python is version 3.8.3, so the last part of the directory would be "\Python38".
8. Click "Okay".
9. In the "Environment Variables" window, click "Okay".
10. In the "System Properties" window, click "Okay".

#### Linux
1. Open a terminal.
2. Use a package manager to download and install Python 3:
##### For Debian/Ubuntu:
  `$ sudo apt-get install python3`
##### For Fedora:
  `$ sudo dnf install python3`

### Node.js and npm
_explanation of necessity here_

To install Node.js and npm:
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
  ##### Debian/Ubuntu:
  1. Install node.js by typing `$ sudo apt-get install nodejs`.
  2. Install npm by typing `$ sudo apt-get install npm`.

  ##### Fedora:
  1. Install node.js:
    `$ sudo dnf install nodejs`
  2. Install npm:
    `$ sudo dnf install npm`
    
 ### Monero CLI tools
 _Coming soon..._
