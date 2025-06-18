Ext.define('PMG.LDAPProfileSelector', {
    extend: 'Proxmox.form.ComboGrid',
    alias: 'widget.pmgLDAPProfileSelector',

    store: {
        fields: ['profile', 'disable', 'comment'],
        proxy: {
            type: 'proxmox',
            url: '/api2/json/config/ldap',
        },
        filterOnLoad: true,
        sorters: [
            {
                property: 'profile',
                direction: 'ASC',
            },
        ],
    },

    valueField: 'profile',
    displayField: 'profile',

    allowBlank: false,

    listConfig: {
        columns: [
            {
                header: gettext('Profile'),
                dataIndex: 'profile',
                hideable: false,
                width: 100,
            },
            {
                header: gettext('Enabled'),
                width: 80,
                sortable: true,
                dataIndex: 'disable',
                renderer: Proxmox.Utils.format_neg_boolean,
            },
            {
                header: gettext('Comment'),
                sortable: false,
                renderer: Ext.String.htmlEncode,
                dataIndex: 'comment',
                flex: 1,
            },
        ],
    },

    initComponent: function () {
        var me = this;

        me.callParent();

        me.store.load();
    },
});
