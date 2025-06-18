Ext.define('PMG.SenderDetails', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'pmgSenderDetails',

    dockedItems: [
        {
            dock: 'top',
            xtype: 'panel',
            itemId: 'info',
            bodyPadding: 10,
            html: gettext('Please select a sender.'),
        },
    ],

    disableSelection: true,

    plugins: 'gridfilters',

    setUrl: function (url, extraparam, title) {
        var me = this;

        me.store.setUrl(url, extraparam);
        me.store.setRemoteFilter(url !== undefined);
        Proxmox.Utils.setErrorMask(me, false);
        me.store.reload();

        var infopanel = me.getComponent('info');
        if (title) {
            infopanel.update(title);
        } else {
            infopanel.update(gettext('Please select a sender.'));
        }
    },

    store: {
        type: 'pmgStatStore',
        autoReload: false,
        remoteSort: true,
        remoteFilter: false, // enabled dynamically
        fields: [
            'receiver',
            'virusinfo',
            { type: 'integer', name: 'bytes' },
            { type: 'boolean', name: 'blocked' },
            { type: 'integer', name: 'spamlevel' },
            { type: 'date', dateFormat: 'timestamp', name: 'time' },
        ],
        proxy: {
            type: 'pmgfilterproxy',
            filterId: 'x-gridfilter-receiver',
            sortParam: 'orderby',
        },
        sorters: [
            {
                property: 'time',
                direction: 'ASC',
            },
        ],
    },

    columns: [
        {
            text: gettext('Receiver'),
            renderer: Ext.htmlEncode,
            flex: 1,
            filter: { type: 'string' },
            dataIndex: 'receiver',
        },
        {
            header: gettext('Size') + ' (KB)',
            renderer: function (v) {
                return Ext.Number.toFixed(v / 1024, 0);
            },
            dataIndex: 'bytes',
        },
        {
            xtype: 'datecolumn',
            header: gettext('Date'),
            format: 'Y-m-d',
            dataIndex: 'time',
        },
        {
            xtype: 'datecolumn',
            header: gettext('Time'),
            format: 'H:i:s',
            dataIndex: 'time',
        },
    ],

    initComponent: function () {
        var me = this;
        me.callParent();

        Proxmox.Utils.monStoreErrors(me, me.store, true);
    },
});

Ext.define('PMG.SenderList', {
    extend: 'Ext.grid.GridPanel',
    alias: 'widget.pmgSenderList',

    title: gettext('Statistics') + ': ' + gettext('Sender') + ' (' + gettext('Outgoing') + ')',

    multiColumnSort: true,
    plugins: 'gridfilters',

    emptyText: gettext('No data in database'),
    viewConfig: {
        deferEmptyText: false,
    },

    tbar: [{ xtype: 'pmgStatTimeSelector' }],

    store: {
        type: 'pmgStatStore',
        staturl: '/api2/json/statistics/sender',
        remoteSort: true,
        remoteFilter: true,
        fields: [
            'sender',
            { type: 'integer', name: 'count' },
            { type: 'integer', name: 'bytes' },
            { type: 'integer', name: 'viruscount' },
        ],
        proxy: {
            type: 'pmgfilterproxy',
            sortParam: 'orderby',
            filterId: 'x-gridfilter-sender',
        },
        sorters: [
            {
                property: 'count',
                direction: 'DESC',
            },
            {
                property: 'bytes',
                direction: 'DESC',
            },
            {
                property: 'sender',
                direction: 'ASC',
            },
        ],
    },

    columns: [
        {
            text: gettext('Sender'),
            flex: 1,
            renderer: Ext.htmlEncode,
            dataIndex: 'sender',
            filter: {
                type: 'string',
                itemDefaults: {
                    // any Ext.form.field.Text configs accepted
                },
            },
        },
        {
            text: gettext('Count'),
            columns: [
                {
                    text: gettext('Mail'),
                    dataIndex: 'count',
                },
                {
                    header: gettext('Virus'),
                    dataIndex: 'viruscount',
                },
            ],
        },
        {
            text: gettext('Size') + ' (KB)',
            dataIndex: 'bytes',
            renderer: function (v) {
                return Ext.Number.toFixed(v / 1024, 0);
            },
        },
    ],

    initComponent: function () {
        var me = this;
        me.callParent();

        Proxmox.Utils.monStoreErrors(me, me.store, true);
    },
});

Ext.define('PMG.SenderStatistics', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgSenderStatistics',

    layout: 'border',
    border: false,
    defaults: {
        border: false,
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        selectionChange: function (grid, selected, eOpts) {
            var details = this.lookupReference('details');
            if (selected.length > 0) {
                var sender = selected[0].data.sender;
                var extraparam = { address: sender, type: 'sender' };
                var url = '/api2/json/statistics/detail';
                details.setUrl(
                    url,
                    extraparam,
                    '<b>' + gettext('Sender') + ':</b> ' + Ext.htmlEncode(sender),
                );
            } else {
                details.setUrl();
            }
        },
    },

    items: [
        {
            xtype: 'pmgSenderList',
            multiColumnSort: true,
            region: 'center',
            layout: 'fit',
            flex: 1,

            listeners: { selectionchange: 'selectionChange' },
        },
        {
            xtype: 'pmgSenderDetails',
            region: 'east',
            reference: 'details',
            split: true,
            flex: 1,
        },
    ],
});
