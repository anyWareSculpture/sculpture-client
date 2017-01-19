# sculpture-client
The embedded system code for the sculpture itself. This will run as a chrome app.

## Getting started

Dependencies: node.js, npm, Google Chrome

   npm install
   npm run dev

## Building, Packaging, & Launching the app

Build the app into the build/ directory:

    npm run build

Package as a Chrome packaged app (dist/anyware-sculpture.zip)

    npm run package

Other targets:

* Launch without rebuild: `npm run launch`


## Publish Chrome App

* Make sure manifest.json has a bumped version number
* ```gulp build```
* ```gulp package```
* Login to https://chrome.google.com/webstore/developer/dashboard
* ..using anyware.sculpture@gmail.com
* anyWare Sculpture -> edit -> Upload Updated package
* Choose file: dist/anyware-sculpture.zip -> Upload
* Click "Publish Changes"

## Using Chrome App

* Click on Apps -> "anyWare Sculpture"
* To update fast:
    * chrome://extensions/
    * -> Update extensions now
    * Wait & verify that version number increased
