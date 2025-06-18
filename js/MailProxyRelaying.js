Ext.define('PMG.MailProxyRelaying', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.pmgMailProxyRelaying'],

    monStoreErrors: true,

    initComponent: function () {
        var me = this;

        me.add_text_row('relay', gettext('Default Relay'), {
            deleteEmpty: true,
            defaultValue: Proxmox.Utils.noneText,
            renderer: Ext.htmlEncode,
            onlineHelp: 'pmgconfig_mailproxy_relaying',
        });

        me.add_integer_row('relayport', gettext('Relay Port'), {
            defaultValue: 25,
            deleteEmpty: true,
            minValue: 1,
            maxValue: 65535,
            onlineHelp: 'pmgconfig_mailproxy_relaying',
        });

        me.add_combobox_row('relayprotocol', gettext('Relay Protocol'), {
            defaultValue: 'smtp',
            comboItems: [
                ['smtp', 'SMTP'],
                ['lmtp', 'LMTP'],
            ],
            onlineHelp: 'pmgconfig_mailproxy_relaying',
        });

        me.add_boolean_row('relaynomx', gettext('Disable MX lookup (SMTP)'), {
            onlineHelp: 'pmgconfig_mailproxy_relaying',
        });

        me.rows.smarthost = {
            required: true,
            multiKey: ['smarthost', 'smarthostport'],
            header: gettext('Smarthost'),
            renderer: function () {
                var host = me.getObjectValue('smarthost', undefined);
                var port = me.getObjectValue('smarthostport', undefined);
                var result = '';
                if (host) {
                    if (port) {
                        if (host.match(Proxmox.Utils.IP6_match)) {
                            result = '[' + host + ']:' + port;
                        } else {
                            result = host + ':' + port;
                        }
                    } else {
                        result = host;
                    }
                }
                if (result === '') {
                    result = Proxmox.Utils.noneText;
                }
                return result;
            },
            editor: {
                xtype: 'proxmoxWindowEdit',
                onlineHelp: 'pmgconfig_mailproxy_relaying',
                subject: gettext('Smarthost'),
                fieldDefaults: {
                    labelWidth: 100,
                },
                items: [
                    {
                        xtype: 'proxmoxtextfield',
                        name: 'smarthost',
                        deleteEmpty: true,
                        emptyText: Proxmox.Utils.noneText,
                        fieldLabel: gettext('Smarthost'),
                    },
                    {
                        xtype: 'proxmoxintegerfield',
                        name: 'smarthostport',
                        deleteEmpty: true,
                        minValue: 1,
                        maxValue: 65535,
                        emptyText: Proxmox.Utils.defaultText,
                        fieldLabel: gettext('Port'),
                    },
                ],
            },
            onlineHelp: 'pmgconfig_mailproxy_relaying',
        };

        me.rows.smarthostport = { visible: false };

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
                onlineHelp: 'pmgconfig_mailproxy_relaying',
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
