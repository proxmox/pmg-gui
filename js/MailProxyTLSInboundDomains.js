Ext.define('pmg-tls-inbound-domains', {
    extend: 'Ext.data.Model',
    fields: ['domain'],
    idProperty: 'domain',
    proxy: {
        type: 'proxmox',
        url: '/api2/json/config/tls-inbound-domains',
    },
    sorters: {
        property: 'domain',
        direction: 'ASC',
    },
});

Ext.define('PMG.TLSInboundDomainsEdit', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmgTLSInboundDomainsEdit',
    onlineHelp: 'pmgconfig_mailproxy_tls',

    subject: gettext('TLS Inbound domains'),
    url: '/api2/extjs/config/tls-inbound-domains',
    method: 'POST',

    items: [
        {
            xtype: 'proxmoxtextfield',
            name: 'domain',
            fieldLabel: gettext('Domain'),
        },
    ],
});

Ext.define('PMG.MailProxyTLSInboundDomains', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.pmgMailProxyTLSInboundDomains'],

    viewConfig: {
        trackOver: false,
    },

    columns: [
        {
            header: gettext('Domain'),
            flex: 1,
            sortable: true,
            dataIndex: 'domain',
        },
    ],

    initComponent: function () {
        const me = this;

        const rstore = Ext.create('Proxmox.data.UpdateStore', {
            model: 'pmg-tls-inbound-domains',
            storeid: 'pmg-mailproxy-tls-inbound-domains-store-' + ++Ext.idSeed,
        });

        const store = Ext.create('Proxmox.data.DiffStore', { rstore: rstore });
        const reload = () => rstore.load();
        me.selModel = Ext.create('Ext.selection.RowModel', {});
        Proxmox.Utils.monStoreErrors(me, store, true);

        Ext.apply(me, {
            store,
            tbar: [
                {
                    text: gettext('Create'),
                    handler: () => {
                        Ext.createWidget('pmgTLSInboundDomainsEdit', {
                            autoShow: true,
                            listeners: {
                                destroy: reload,
                            },
                        });
                    },
                },
                {
                    xtype: 'proxmoxStdRemoveButton',
                    baseurl: '/config/tls-inbound-domains',
                    callback: reload,
                    waitMsgTarget: me,
                },
            ],
            listeners: {
                activate: rstore.startUpdate,
                destroy: rstore.stopUpdate,
                deactivate: rstore.stopUpdate,
            },
        });

        me.callParent();
    },
});
