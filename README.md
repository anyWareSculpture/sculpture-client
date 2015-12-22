# sculpture-client
The embedded system code for the sculpture itself. This will run as a chrome app.

## Building, Packaging, & Launching the app

    gulp build

Builds the app into the build/ directory

    gulp package

Compresses the contents of build/ into a single .zip file in the dist/ directory. This can be directly uploaded as the kiosk app.

    gulp launch

Launches google chrome (assuming your google chrome executable can be loaded using the `google-chrome` command) for development purposes. You must `build` first before launch (no need to fully `package` each time).

Linux systems use the `google-chrome` command to launch Google Chrome. On other systems, please alias your chrome executable to use that name. 

## Chrome Box Development HOWTO

* Dev computer
   * ```gulp build```
   * ```gulp package```
   * Put dist/anyware-sculpture.zip in Google Drive
* Chrome:
   * Google Drive -> Shared with me -> anyWare -> ChromeApp
   * Double-click to mount zip file
   * Delete all files from Downloads/anyware-sculpture
   * Select all -> Copy
   * Paste to Download/anyware-sculpture folder
   * Navigate to chrome://extensions
   * First install:
       * Make sure Developer Mode is checked
       * Click "Load unpacked extension" -> Select Downloads/anyware-sculpture -> Open
   * Update:
       * Reload
   * Launch

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

### ChromeOS Setup

* Login using anyware.sculpture@gmail.com
* Switch to Dev Channel: Settings->About->More Info->Change Channel
  This is necessary for Kiosk Mode

  
