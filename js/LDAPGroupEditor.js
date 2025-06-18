Ext.define('PMG.LDAPGroupInputPanel', {
    extend: 'Proxmox.panel.InputPanel',
    alias: 'widget.pmgLDAPGroupInputPanel',

    onGetValues: function (values) {
        if (values.mode === 'profile-any') {
            values.mode = 'any';
        } else if (values.mode === 'profile-none') {
            values.mode = 'none';
        }

        return values;
    },

    setValues: function (values) {
        let me = this;

        if (values.profile !== undefined) {
            if (values.mode === 'any') {
                values.mode = 'profile-any';
            } else if (values.mode === 'none') {
                values.mode = 'profile-none';
            }
        }

        if (values.profile !== undefined) {
            let groupField = this.lookupReference('groupField');
            groupField.setProfile(values.profile);
        }

        me.callParent([values]);
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        changeMode: function (f, value) {
            let groupField = this.lookupReference('groupField');
            groupField.setDisabled(value !== 'group');
            groupField.setVisible(value === 'group');
            let profileField = this.lookupReference('profileField');
            let enabled = value !== 'any' && value !== 'none';
            profileField.setDisabled(!enabled);
            profileField.setVisible(enabled);
        },

        changeProfile: function (f, value) {
            let groupField = this.lookupReference('groupField');
            groupField.setProfile(value);
        },

        control: {
            'field[name=mode]': {
                change: 'changeMode',
            },
            'field[name=profile]': {
                change: 'changeProfile',
            },
        },
    },

    items: [
        {
            xtype: 'proxmoxKVComboBox',
            name: 'mode',
            value: 'group',
            comboItems: [
                ['group', gettext('Group member')],
                ['profile-any', gettext('Existing LDAP address')],
                ['any', gettext('Existing LDAP address') + ', any profile'],
                ['profile-none', gettext('Unknown LDAP address')],
                ['none', gettext('Unknown LDAP address') + ', any profile'],
            ],
            fieldLabel: gettext('Match'),
        },
        {
            xtype: 'pmgLDAPProfileSelector',
            name: 'profile',
            reference: 'profileField',
            fieldLabel: gettext('Profile'),
        },
        {
            xtype: 'pmgLDAPGroupSelector',
            name: 'group',
            reference: 'groupField',
            fieldLabel: gettext('Group'),
        },
    ],
});

Ext.define('PMG.LDAPGroupEditor', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmgLDAPGroupEditor',
    onlineHelp: 'pmgconfig_ldap',

    width: 500,

    items: [{ xtype: 'pmgLDAPGroupInputPanel' }],
});
