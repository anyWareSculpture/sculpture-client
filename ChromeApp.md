# Notes

## Chrome storage API:

chrome.storage.sync: Chrome Account == Google Account

chrome.storage.managed: Need some sort of Google Apps license -> too complex.

## Remote Desktop

Remote desktop is currently not available for unattended chrome boxes.
We need to use the remote assistance feature, requiring us to read off
a string of numbers from the Chrome OS screen in order to connect to
the session.


## Auto-update

o Checks for updates every "several hours"
"you can force an update using the Extensions page's Update extensions now button."

manifest: "update_url" key


## Chrome Developer Dashboard

https://chrome.google.com/webstore/developer/dashboard

## Hosting

Self-hosting: https://developer.chrome.com/extensions/hosting

## Private Publishing

* Add tester account in the Developer Dashboard
* Share direct link with testers:
https://chrome.google.com/webstore/detail/anyware-sculpture/dojbbdfnddgofmdbonbkpjdcfbohklhc

## Kiosk Apps

NB! Kiosk Apps cannot be privately published (since Kiosk sessions don't have a login to verify against). It's possible to publish unlisted instead.


Ctrl-Alt-K
Ctrl-Alt-S


* chrome://extensions
* Manage kiosk applications -> Add kiosk application -> paste application ID -> Add -> Done

## Kiosk Mode

* To set up Kiosk Mode, we need to wipe the Chromebox/Chromebit: Recovery button + Ctrl-D * 2:
  https://support.google.com/chrome/a/answer/1360642
* On reboot: space+Enter, select network
* At login screen: Ctrl-Alt-K
* Sign in as usual
* When setting up a Kiosk App, we can now make it auto-start. On the first subsequent reboot we need to confirm this.

# Questions

* How to allow quit/restart from within Chrome app (without having to power toggle)
