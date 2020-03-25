# cdp-forensic-frontend

The frontend for [cdp-forensic-webserver](https://github.com/meinlschmidt/cdp-forensic-webserver)
being used as a submodule in [sauvegardeEX](https://github.com/LudwigEnglbrecht/sauvegardeEX).
Developed and tested with Google Chrome on Ubuntu 18.04 LTS and Windows 10.

Feel free to contact us for improvements or questions.

## Installation

Install node.js.

Download the repository files manually or check them out with IntelliJ.

Install the dependencies in the project directory with
```
npm install
```

## Configuration

Set the ip address of your [cdp-forensic-webserver](https://github.com/meinlschmidt/cdp-forensic-webserver) in the file Config.js

## Run

Start the frontend with the local server of IntelliJ by clicking on the browser icon in top right corner when index.html is open or with the [npx http-server](https://www.npmjs.com/package/http-server):
```
npx http-server --cors -c-1
```

## Usage

Select the host for which you want to inspect files, optional you can add a filter, a start date and an end date to specify the query to the webserver.
As a result you can see all files which have been created and modified on the monitored directories of the host.
With the time slider you can retrace the creation and modification of the files.

If you click on a file you can see all the occurred versions of a file with a time stamp and you are able to download any version you want.
By clicking the restore icon, you can restore all file occurrences in a directory within the time range, which is at the moment selected by the time slider.
By clicking the entropy icon, you can calculate an entropy of all files from a directory.
 
![](images/screenshot.png?raw=true)
