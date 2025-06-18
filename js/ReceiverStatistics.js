Ext.define('PMG.ReceiverDetails', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'pmgReceiverDetails',

    dockedItems: [
        {
            dock: 'top',
            xtype: 'panel',
            itemId: 'info',
            bodyPadding: 10,
            html: gettext('Please select a receiver.'),
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
            'sender',
            'virusinfo',
            { type: 'integer', name: 'bytes' },
            { type: 'boolean', name: 'blocked' },
            { type: 'integer', name: 'spamlevel' },
            { type: 'date', dateFormat: 'timestamp', name: 'time' },
        ],
        proxy: {
            type: 'pmgfilterproxy',
            filterId: 'x-gridfilter-sender',
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
            text: gettext('Sender'),
            renderer: Ext.htmlEncode,
            flex: 1,
            filter: { type: 'string' },
            dataIndex: 'sender',
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
        {
            header: gettext('Virus info'),
            dataIndex: 'virusinfo',
        },
        {
            header: gettext('Score'),
            dataIndex: 'spamlevel',
        },
    ],

    initComponent: function () {
        var me = this;
        me.callParent();

        Proxmox.Utils.monStoreErrors(me, me.store, true);
    },
});

Ext.define('PMG.ReceiverList', {
    extend: 'Ext.grid.GridPanel',
    alias: 'widget.pmgReceiverList',

    title: gettext('Statistics') + ': ' + gettext('Receiver') + ' (' + gettext('Incoming') + ')',

    multiColumnSort: true,
    plugins: 'gridfilters',

    emptyText: gettext('No data in database'),
    viewConfig: {
        deferEmptyText: false,
    },

    tbar: [{ xtype: 'pmgStatTimeSelector' }],

    store: {
        type: 'pmgStatStore',
        staturl: '/api2/json/statistics/receiver',
        remoteSort: true,
        remoteFilter: true,
        fields: [
            'receiver',
            { type: 'integer', name: 'count' },
            { type: 'integer', name: 'bytes' },
            { type: 'integer', name: 'viruscount' },
        ],
        proxy: {
            type: 'pmgfilterproxy',
            sortParam: 'orderby',
            filterId: 'x-gridfilter-receiver',
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
                property: 'receiver',
                direction: 'ASC',
            },
        ],
    },

    columns: [
        {
            text: gettext('Receiver'),
            flex: 1,
            renderer: Ext.htmlEncode,
            dataIndex: 'receiver',
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
                {
                    header: gettext('Spam'),
                    dataIndex: 'spamcount',
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

Ext.define('PMG.ReceiverStatistics', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgReceiverStatistics',

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
                var url = '/api2/json/statistics/detail';
                var receiver = selected[0].data.receiver;
                var extraparam = { address: receiver, type: 'receiver' };
                details.setUrl(
                    url,
                    extraparam,
                    '<b>' + gettext('Receiver') + ':</b> ' + Ext.htmlEncode(receiver),
                );
            } else {
                details.setUrl();
            }
        },
    },

    items: [
        {
            xtype: 'pmgReceiverList',
            multiColumnSort: true,
            region: 'center',
            layout: 'fit',
            flex: 1,

            listeners: { selectionchange: 'selectionChange' },
        },
        {
            xtype: 'pmgReceiverDetails',
            region: 'east',
            reference: 'details',
            split: true,
            flex: 1,
        },
    ],
});
