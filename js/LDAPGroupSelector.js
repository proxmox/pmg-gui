Ext.define('PMG.LDAPGroupSelector', {
    extend: 'Ext.form.ComboBox',
    alias: 'widget.pmgLDAPGroupSelector',

    profile: undefined,

    queryMode: 'local',

    store: {
        fields: ['dn'],
        filterOnLoad: true,
        sorters: [
            {
                property: 'dn',
                direction: 'ASC',
            },
        ],
    },

    valueField: 'dn',
    displayField: 'dn',

    allowBlank: false,

    setProfile: function (profile, force) {
        var me = this;

        if (!force && (profile === undefined || profile === null || me.profile === profile)) {
            return;
        }

        me.profile = profile;

        me.setValue('');

        me.store.setProxy({
            type: 'proxmox',
            url: '/api2/json/config/ldap/' + me.profile + '/groups',
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
