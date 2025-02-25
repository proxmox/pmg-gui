// Needs to be its own xtype for `path` to work in `NavigationTree`
Ext.define('PMG.QuarantineAboutPage', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgQuarantineAbout',

    bodyPadding: 10,
    bodyStyle: {
	fontSize: '14px',
    },

    title: gettext('Proxmox Mail Gateway Quarantine Help'),

    html: Proxmox.Markdown.parse(
`# About
This is the end-user email quarantine interface provided by your email provider.

Proxmox Mail Gateway is software that scans email for threats such as spam or viruses.

Typically, emails that contain viruses or are identified as specific spam are blocked by your
provider.
Emails that are not classified as specific spam can be quarantined for the recipient to decide
whether to receive or delete. In most setups, you will receive a spam report email notifying you
when mail is quarantined for your address.

You also have the option to block or whitelist certain addresses:

* Allow, in the Whitelist menu, results in the mail being delivered directly instead of being
  quarantined.
* Blocking, in the Blacklist menu, causes the messages to be deleted directly instead of being
  quarantined.

**Note:** The sending of *Spam Report* emails and this web application is controlled by your email
provider.

Proxmox Server Solutions GmbH develops the software and does not operate email services for users.

## Keyboard Shortcuts

Once you have selected an item in Quarantine, you can either use the dedicated buttons to deliver or
delete the selected email, or use the following keyboard shortcuts instead:

* <kbd>D</kbd>: Deliver the mail.
* <kbd>Delete</kbd>: Delete the mail.
* <kbd>B</kbd>: Add the sender to the Blocklist/Blacklist.
* <kbd>W</kbd>: Add the sender to the Welcomelist/Whitelist.
`),
});
