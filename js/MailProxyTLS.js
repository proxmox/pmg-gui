Ext.define('PMG.MailProxyTLS', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.pmgMailProxyTLS'],

    monStoreErrors: true,

    initComponent: function () {
        var me = this;

        me.add_boolean_row('tls', gettext('Enable TLS'));

        me.add_boolean_row('tlslog', gettext('Enable TLS Logging'));

        me.add_boolean_row('tlsheader', gettext('Add TLS received header'));

        var baseurl = '/config/mail';

        me.selModel = Ext.create('Ext.selection.RowModel', {});

        Ext.apply(me, {
            tbar: [
                {
                    text: gettext('Edit'),
                    xtype: 'proxmoxButton',
                    disabled: true,
                    handler: function () {
                        me.run_editor();
                    },
                    selModel: me.selModel,
                },
            ],
            url: '/api2/json' + baseurl,
            editorConfig: {
                url: '/api2/extjs' + baseurl,
                onlineHelp: 'pmgconfig_mailproxy_tls',
            },
            interval: 5000,
            cwidth1: 200,
            listeners: {
                itemdblclick: me.run_editor,
            },
        });

        me.callParent();

        me.on('activate', me.rstore.startUpdate);
        me.on('destroy', me.rstore.stopUpdate);
        me.on('deactivate', me.rstore.stopUpdate);
    },
});
