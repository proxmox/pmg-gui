// Needs to be its own xtype for `path` to work in `NavigationTree`
Ext.define('PMG.QuarantineAboutPage', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgQuarantineAbout',

    bodyPadding: 10,
    title: 'Proxmox Mail Gateway Quarantine Help',

    html: Proxmox.Markdown.parse(
`# About
This is the email quarantine interface for end-users provided by your email provider.

Proxmox Mail Gateway is Software used to scan emails for threats like spam or viruses.

Usually emails that contain viruses or are detected as being certain spam are blocked by your
provider.
Emails that are not classified as certain spam may be put into quarantine, where the recipient can
decide if they want to receive or delete them. In most setups you will receive a Spam Report email
to notify you, if your address has mail put in its quarantine.

Additionally you have the option to block or welcome certain addresses in general.
* Welcoming, in the Whitelist menu, results in the mails being directly delivered,
instead of being stored in quarantine.
* Blocking, in the Blacklist menu, results in the mails being directly deleted,
instead of being stored in quarantine.


**Note:** The sending of Spam Report emails and this Webpage are controlled by your email provider.

Proxmox Server Solutions GmbH develops the software and is not running mail services for users.

## Shortcuts

When you have selected an entry in your quarantine you can use the following keyboard short-cuts
in place of the buttons on top:

* **D:** Deliver the mail
* **Delete:** Delete the mail
* **B:** Add the sender to the Blocklist/Blacklist
* **W:** Add the sender to the Welcomelist/Whitelist
`),

});

