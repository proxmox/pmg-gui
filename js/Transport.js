Ext.define('pmg-transport', {
    extend: 'Ext.data.Model',
    fields: [
        'domain',
        'host',
        'protocol',
        { name: 'port', type: 'integer' },
        { name: 'use_mx', type: 'boolean' },
        'comment',
    ],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/config/transport',
    },
    idProperty: 'domain',
});

Ext.define('PMG.Transport', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.pmgTransport'],

    initComponent: function () {
        let me = this;

        let store = new Ext.data.Store({
            model: 'pmg-transport',
            sorters: {
                property: 'domain',
                direction: 'ASC',
            },
        });
        Proxmox.Utils.monStoreErrors(me, store, true);
        let reload = () => store.load();

        me.selModel = Ext.create('Ext.selection.RowModel', {});

        let run_editor = function () {
            let rec = me.selModel.getSelection()[0];
            if (!rec) {
                return;
            }

            let win = Ext.createWidget('pmgTransportEditor', {
                url: '/api2/extjs/config/transport/' + rec.data.domain,
                method: 'PUT',
            });
            win.load();
            win.on('destroy', reload);
            win.show();
        };

        Ext.apply(me, {
            store: store,
            tbar: [
                {
                    text: gettext('Create'),
                    handler: () =>
                        Ext.createWidget('pmgTransportEditor', {
                            autoShow: true,
                            method: 'POST',
                            url: '/api2/extjs/config/transport',
                            isCreate: true,
                            listeners: {
                                destroy: () => reload(),
                            },
                        }),
                },
                '-',
                {
                    xtype: 'proxmoxButton',
                    text: gettext('Edit'),
                    disabled: true,
                    selModel: me.selModel,
                    handler: run_editor,
                },
                {
                    xtype: 'proxmoxStdRemoveButton',
                    selModel: me.selModel,
                    baseurl: '/config/transport',
                    callback: reload,
                    waitMsgTarget: me,
                },
                '->',
                {
                    xtype: 'pmgFilterField',
                    filteredFields: ['domain', 'host', 'port', 'protocol', 'comment'],
                },
            ],
            viewConfig: {
                trackOver: false,
            },
            columns: [
                {
                    header: gettext('Relay Domain'),
                    width: 200,
                    dataIndex: 'domain',
                },
                {
                    header: gettext('Host'),
                    width: 200,
                    dataIndex: 'host',
                },
                {
                    header: gettext('Protocol'),
                    width: 200,
                    dataIndex: 'protocol',
                },
                {
                    header: gettext('Port'),
                    width: 80,
                    dataIndex: 'port',
                },
                {
                    header: gettext('Use MX'),
                    width: 80,
                    renderer: Proxmox.Utils.format_boolean,
                    dataIndex: 'use_mx',
                },
                {
                    header: gettext('Comment'),
                    renderer: Ext.String.htmlEncode,
                    dataIndex: 'comment',
                    flex: 1,
                },
            ],
            listeners: {
                itemdblclick: run_editor,
                activate: reload,
            },
        });

        me.callParent();
    },
});

Ext.define('PMG.TransportEditor', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmgTransportEditor',
    mixins: ['Proxmox.Mixin.CBind'],

    cbindData: (cfg) => ({
        domainXType: cfg.method === 'POST' ? 'proxmoxtextfield' : 'displayfield',
    }),

    viewModel: {
        data: {
            proto: 'smtp',
        },
        formulas: {
            protoIsSMTP: (get) => get('proto') === 'smtp',
        },
    },
    onlineHelp: 'pmgconfig_mailproxy_transports',
    subject: gettext('Transport'),

    items: [
        {
            xtype: 'displayfield',
            cbind: {
                xtype: '{domainXType}',
            },
            name: 'domain',
            fieldLabel: gettext('Relay Domain'),
        },
        {
            xtype: 'textfield',
            name: 'host',
            fieldLabel: gettext('Host'),
        },
        {
            xtype: 'proxmoxKVComboBox',
            name: 'protocol',
            fieldLabel: gettext('Protocol'),
            deleteEmpty: false,
            comboItems: [
                ['smtp', 'SMTP'],
                ['lmtp', 'LMTP'],
            ],
            allowBlank: true,
            value: 'smtp',
            bind: {
                value: '{proto}',
            },
        },
        {
            xtype: 'proxmoxintegerfield',
            name: 'port',
            value: 25,
            minValue: 1,
            maxValue: 65535,
            fieldLabel: gettext('Port'),
        },
        {
            xtype: 'proxmoxcheckbox',
            name: 'use_mx',
            checked: true,
            bind: {
                disabled: '{!protoIsSMTP}',
                hidden: '{!protoIsSMTP}',
            },
            uncheckedValue: 0,
            fieldLabel: gettext('Use MX'),
        },
        {
            xtype: 'textfield',
            name: 'comment',
            fieldLabel: gettext('Comment'),
        },
    ],
});
