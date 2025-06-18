Ext.define('PMG.DomainStatistics', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgDomainStatistics',

    title: gettext('Statistics') + ': ' + gettext('Domain'),

    tbar: [{ xtype: 'pmgStatTimeSelector' }],

    layout: 'fit',
    border: false,

    initComponent: function () {
        var me = this;

        var fields = [
            'domain',
            { type: 'integer', name: 'count_in' },
            { type: 'integer', name: 'count_out' },
            { type: 'integer', name: 'spamcount_in' },
            { type: 'integer', name: 'spamcount_out' },
            { type: 'integer', name: 'viruscount_in' },
            { type: 'integer', name: 'viruscount_out' },
            { type: 'number', name: 'bytes_in' },
            { type: 'number', name: 'bytes_out' },
        ];

        var store = Ext.create('PMG.data.StatStore', {
            staturl: '/api2/json/statistics/domains',
            fields: fields,
        });

        var store_in = Ext.create('Ext.data.ArrayStore', {
            fields: fields,
            filters: [
                function (item) {
                    return item.data.count_in > 0;
                },
            ],
        });

        var store_out = Ext.create('Ext.data.ArrayStore', {
            fields: fields,
            filters: [
                function (item) {
                    return item.data.count_out > 0;
                },
            ],
        });

        store.on('load', function (s, records, successful) {
            if (!successful) {
                store_in.setData([]);
                store_out.setData([]);
            } else {
                store_in.setData(records);
                store_out.setData(records);
            }
        });

        var render_domain = function (v) {
            return v === '' ? '--- EMPTY ADDRESS ---' : Ext.htmlEncode(v);
        };

        me.items = [
            {
                xtype: 'tabpanel',
                border: false,
                items: [
                    {
                        xtype: 'grid',
                        title: gettext('Incoming'),
                        border: false,
                        disableSelection: true,
                        store: store_in,
                        emptyText: gettext('No data in database'),
                        viewConfig: {
                            deferEmptyText: false,
                        },
                        columns: [
                            {
                                text: gettext('Domain') + ' (' + gettext('Receiver') + ')',
                                flex: 1,
                                renderer: render_domain,
                                dataIndex: 'domain',
                            },
                            {
                                text: gettext('Traffic') + ' (MB)',
                                dataIndex: 'bytes_in',
                                renderer: function (v) {
                                    return Ext.Number.toFixed(v / (1024 * 1024), 2);
                                },
                            },
                            {
                                text: gettext('Count'),
                                columns: [
                                    {
                                        text: gettext('Mail'),
                                        dataIndex: 'count_in',
                                    },
                                    {
                                        header: gettext('Virus'),
                                        dataIndex: 'viruscount_in',
                                    },
                                    {
                                        header: gettext('Spam'),
                                        dataIndex: 'spamcount_in',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        xtype: 'grid',
                        title: gettext('Outgoing'),
                        border: false,
                        disableSelection: true,
                        store: store_out,
                        emptyText: gettext('No data in database'),
                        viewConfig: {
                            deferEmptyText: false,
                        },
                        columns: [
                            {
                                text: gettext('Domain') + ' (' + gettext('Receiver') + ')',
                                flex: 1,
                                renderer: render_domain,
                                dataIndex: 'domain',
                            },
                            {
                                text: gettext('Traffic') + ' (MB)',
                                dataIndex: 'bytes_out',
                                renderer: function (v) {
                                    return Ext.Number.toFixed(v / (1024 * 1024), 2);
                                },
                            },
                            {
                                text: gettext('Count'),
                                columns: [
                                    {
                                        text: gettext('Mail'),
                                        dataIndex: 'count_out',
                                    },
                                    {
                                        header: gettext('Virus'),
                                        dataIndex: 'viruscount_out',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ];

        me.callParent();

        Proxmox.Utils.monStoreErrors(me, store);

        me.on('destroy', store.destroy, store);
    },
});
