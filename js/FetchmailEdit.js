Ext.define('PMG.FetchmailEdit', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmgFetchmailEdit',
    onlineHelp: 'pmgconfig_fetchmail',

    userid: undefined,

    isAdd: true,

    subject: 'Fetchmail',

    fieldDefaults: { labelWidth: 120 },

    controller: {
        xclass: 'Ext.app.ViewController',

        onProtocolChange: function () {
            var protocol = this.lookupReference('protocol').getValue();
            var ssl = this.lookupReference('ssl').getValue();

            var port_field = this.lookupReference('port');
            if (protocol === 'pop3') {
                port_field.setValue(ssl ? 995 : 110);
            } else if (protocol === 'imap') {
                port_field.setValue(ssl ? 993 : 143);
            }
        },
    },

    items: {
        xtype: 'inputpanel',
        column1: [
            {
                xtype: 'textfield',
                name: 'server',
                fieldLabel: gettext('Server'),
                allowBlank: false,
            },
            {
                xtype: 'proxmoxKVComboBox',
                fieldLabel: gettext('Protocol'),
                name: 'protocol',
                reference: 'protocol',
                value: 'pop3',
                listeners: { change: 'onProtocolChange' },
                comboItems: [
                    ['pop3', 'pop3'],
                    ['imap', 'imap'],
                ],
            },
            {
                xtype: 'proxmoxintegerfield',
                name: 'port',
                reference: 'port',
                fieldLabel: gettext('Port'),
                value: 110,
                minValue: 1,
                maxValue: 65535,
                allowBlank: false,
            },
            {
                xtype: 'textfield',
                name: 'user',
                fieldLabel: gettext('Username'),
                allowBlank: false,
            },
            {
                xtype: 'textfield',
                name: 'pass',
                inputType: 'password',
                fieldLabel: gettext('Password'),
                allowBlank: false,
            },
            {
                xtype: 'textfield',
                name: 'target',
                fieldLabel: gettext('Deliver to'),
                allowBlank: false,
            },
        ],
        column2: [
            {
                xtype: 'proxmoxcheckbox',
                fieldLabel: gettext('Enabled'),
                name: 'enable',
                uncheckedValue: 0,
                checked: true,
            },
            {
                xtype: 'proxmoxintegerfield',
                name: 'interval',
                fieldLabel: gettext('Interval'),
                value: 1,
                minValue: 1,
                maxValue: 24 * 12 * 7,
                allowBlank: false,
            },
            {
                xtype: 'proxmoxcheckbox',
                fieldLabel: gettext('Use SSL'),
                listeners: { change: 'onProtocolChange' },
                name: 'ssl',
                reference: 'ssl',
                uncheckedValue: 0,
                checked: false,
            },
            {
                xtype: 'proxmoxcheckbox',
                fieldLabel: gettext('Keep old mails'),
                name: 'keep',
                uncheckedValue: 0,
                checked: false,
            },
        ],
    },
});
