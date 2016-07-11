# Notes

## Enable debugging of packed apps

chrome://flags#debug-packed-apps

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

* chrome://extensions
* Manage kiosk applications -> Add kiosk application -> paste application ID -> Add -> Done

## Kiosk Mode

* To set up Kiosk Mode, we need to wipe the Chromebox/Chromebit: Recovery button + Ctrl-D * 2:
  https://support.google.com/chrome/a/answer/1360642
* On reboot: space+Enter, select network
* At login screen: Ctrl-Alt-K
* Sign in as usual
* When setting up a Kiosk App, we can now make it auto-start. On the first subsequent reboot we need to confirm this.
* It's possible to cancel auto-launch by pressing Ctrl-Alt-S on startup

## Developer Mode

NB! It's not possible to switch back from Developer Mode without wiping the Chrome Box

* Press Power while holding Recovery Button
* On boot screen, press Ctrl-D
* Press Recovery again
* Press Ctrl-D again
-> Will wipe local data

Notes:
* Ctrl-Alt-F2 : Switches to Terminal
* There is no default root password
* In an interactive session, Ctrl-Alt-t brings up a console
  * 'shell' opens a full bash shell 

## ssh server

Server keys:

    mkdir -m 0711 /mnt/stateful_partition/etc/ssh
    cd /mnt/stateful_partition/etc/ssh
    ssh-keygen -t rsa -f ssh_host_rsa_key
    ssh-keygen -t dsa -f ssh_host_dsa_key

Server:

    /usr/sbin/sshd
    iptables -I INPUT -p tcp --dport 22 -j ACCEPT

## Remote debugging





## Persisting data

* Data stored using chrome.storage.local will persist
* NB! After writing any data, it's important to perform a software reload using chrome.runtime.reload(), otherwise stored data will/may not persist.

## Recover a damaged Chrome OS

The "black-flicker" issue is a symptom

https://support.google.com/chromebook/answer/1080595?hl=en

NB! It's not always possible to wipe a damaged Chrome OS (Ctrl-D on the revovery screen just won't work)

# Questions

* How to allow quit/restart from within Chrome app (without having to power toggle)
  -> chrome.runtime.reload();
