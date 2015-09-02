# sculpture-client
The embedded system code for the sculpture itself. This will run as a chrome app.

## Building, Packaging, & Launching the app

    gulp build

Builds the app into the build/ directory

    gulp package

Compresses the contents of build/ into a single .zip file for the dist/ directory. This can be directly uploaded as the kiosk app.

    gulp launch

Launches google chrome (assuming your google chrome executable can be loaded using the `google-chrome` command) for development purposes. You must `build` first before launch (no need to fully `package` each time).

Linux systems use the `google-chrome` command to launch Google Chrome. On other systems, please alias your chrome executable to use that name. 
