Ext.define('PMG.LDAPUserSelector', {
    extend: 'Proxmox.form.ComboGrid',
    alias: 'widget.pmgLDAPUserSelector',

    profile: undefined,

    store: {
        fields: ['account', 'pmail', 'dn'],
        filterOnLoad: true,
        sorters: [
            {
                property: 'account',
                direction: 'ASC',
            },
        ],
    },

    valueField: 'account',
    displayField: 'account',

    allowBlank: false,

    listConfig: {
        columns: [
            {
                header: gettext('Account'),
                dataIndex: 'account',
                hideable: false,
                width: 100,
            },
            {
                header: gettext('E-Mail'),
                dataIndex: 'pmail',
                width: 150,
            },
            {
                header: 'DN',
                dataIndex: 'dn',
                width: 200,
            },
        ],
    },

    setProfile: function (profile, force) {
        var me = this;

        if (!force && (profile === undefined || profile === null || me.profile === profile)) {
            return;
        }

        me.profile = profile;

        me.setValue('');

        me.store.setProxy({
            type: 'proxmox',
            url: '/api2/json/config/ldap/' + me.profile + '/users',
        });

        me.store.load();
    },

    initComponent: function () {
        var me = this;

        me.callParent();

        if (me.profile !== undefined) {
            me.setProfile(me.profile, true);
        }
    },
});
