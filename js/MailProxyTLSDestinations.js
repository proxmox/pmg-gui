Ext.define('pmg-tls-policy', {
    extend: 'Ext.data.Model',
    fields: ['destination', 'policy'],
    idProperty: 'destination',
    proxy: {
        type: 'proxmox',
        url: '/api2/json/config/tlspolicy',
    },
    sorters: {
        property: 'destination',
        direction: 'ASC',
    },
});

Ext.define('PMG.TLSDestinationEdit', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmgTLSDestinationEdit',
    onlineHelp: 'pmgconfig_mailproxy_tls',

    subject: gettext('TLS Policy'),
    initComponent: function () {
        var me = this;

        var isCreate = !Ext.isDefined(me.destination);

        var url = '/api2/extjs/config/tlspolicy' + (isCreate ? '' : '/' + me.destination);
        var method = isCreate ? 'POST' : 'PUT';
        var text = isCreate ? 'Create' : 'Edit';

        var items = [
            {
                xtype: isCreate ? 'proxmoxtextfield' : 'displayfield',
                name: 'destination',
                fieldLabel: gettext('Destination'),
            },
            {
                xtype: 'proxmoxKVComboBox',
                name: 'policy',
                fieldLabel: gettext('Policy'),
                deleteEmpty: false,
                comboItems: [
                    ['none', 'none'],
                    ['may', 'may'],
                    ['encrypt', 'encrypt'],
                    ['dane', 'dane'],
                    ['dane-only', 'dane-only'],
                    ['fingerprint', 'fingerprint'],
                    ['verify', 'verify'],
                    ['secure', 'secure'],
                ],
                allowBlank: true,
                value: 'encrypt',
            },
        ];

        Ext.apply(me, {
            url: url,
            method: method,
            items: items,
            text: text,
        });

        me.callParent();
    },
});

Ext.define('PMG.MailProxyTLSDestinations', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.pmgMailProxyTLSDestinations'],

    viewConfig: {
        trackOver: false,
    },
    columns: [
        {
            header: gettext('Destination'),
            width: 200,
            sortable: true,
            dataIndex: 'destination',
        },
        {
            header: gettext('Policy'),
            sortable: false,
            dataIndex: 'policy',
            flex: 1,
        },
    ],

    initComponent: function () {
        let me = this;

        let rstore = Ext.create('Proxmox.data.UpdateStore', {
            model: 'pmg-tls-policy',
            storeid: 'pmg-mailproxy-tls-store-' + ++Ext.idSeed,
        });

        let store = Ext.create('Proxmox.data.DiffStore', { rstore: rstore });

        let reload = () => rstore.load();

        me.selModel = Ext.create('Ext.selection.RowModel', {});

        var run_editor = function () {
            var rec = me.selModel.getSelection()[0];
            if (!rec) {
                return;
            }

            var win = Ext.createWidget('pmgTLSDestinationEdit', {
                destination: rec.data.destination,
            });

            win.load();
            win.on('destroy', reload);
            win.show();
        };

        let tbar = [
            {
                text: gettext('Create'),
                handler: () =>
                    Ext.createWidget('pmgTLSDestinationEdit', {
                        autoLoad: true,
                        autoShow: true,
                        listeners: {
                            destroy: () => reload(),
                        },
                    }),
            },
            '-',
            {
                xtype: 'proxmoxButton',
                disabled: true,
                text: gettext('Edit'),
                handler: run_editor,
            },
            {
                xtype: 'proxmoxStdRemoveButton',
                baseurl: '/config/tlspolicy',
                callback: reload,
                waitMsgTarget: me,
            },
        ];

        Proxmox.Utils.monStoreErrors(me, store, true);

        Ext.apply(me, {
            store: store,
            tbar: tbar,
            run_editor: run_editor,
            listeners: {
                itemdblclick: run_editor,
                activate: reload,
            },
        });

        me.on('activate', rstore.startUpdate);
        me.on('destroy', rstore.stopUpdate);
        me.on('deactivate', rstore.stopUpdate);
        me.callParent();
    },
});
