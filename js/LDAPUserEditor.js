Ext.define('PMG.LDAPUserInputPanel', {
    extend: 'Proxmox.panel.InputPanel',
    alias: 'widget.pmgLDAPUserInputPanel',

    setValues: function (values) {
        var me = this;

        if (values.profile !== undefined) {
            var accountField = this.lookupReference('accountField');
            accountField.setProfile(values.profile);
        }

        me.callParent([values]);
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        changeProfile: function (f, value) {
            var accountField = this.lookupReference('accountField');
            accountField.setProfile(value);
        },

        control: {
            'field[name=profile]': {
                change: 'changeProfile',
            },
        },
    },

    items: [
        {
            xtype: 'pmgLDAPProfileSelector',
            name: 'profile',
            reference: 'profileField',
            fieldLabel: gettext('Profile'),
        },
        {
            xtype: 'pmgLDAPUserSelector',
            name: 'account',
            reference: 'accountField',
            fieldLabel: gettext('Account'),
        },
    ],
});

Ext.define('PMG.LDAPUserEditor', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmgLDAPUserEditor',
    onlineHelp: 'pmgconfig_ldap',

    width: 500,

    items: [{ xtype: 'pmgLDAPUserInputPanel' }],
});
