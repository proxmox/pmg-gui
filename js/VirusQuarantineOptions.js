Ext.define('PMG.VirusQuarantineOptions', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.pmgVirusQuarantineOptions'],

    monStoreErrors: true,

    initComponent: function () {
        var me = this;

        me.add_integer_row('lifetime', gettext('Lifetime (days)'), {
            minValue: 1,
            defaultValue: 7,
            deleteEmpty: true,
        });

        me.add_boolean_row('viewimages', gettext('View images'), {
            defaultValue: 1,
        });

        me.add_boolean_row('allowhrefs', gettext('Allow HREFs'), {
            defaultValue: 1,
        });

        var baseurl = '/config/virusquar';

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
                onlineHelp: 'pmgconfig_clamav_quarantine',
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
