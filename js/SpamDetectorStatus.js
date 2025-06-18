Ext.define('pmg-spamassassin-database', {
    extend: 'Ext.data.Model',
    fields: [
        'channel',
        'version',
        'update_version',
        { name: 'update_avail', type: 'boolean' },
        { name: 'last_updated', type: 'date', dateFormat: 'timestamp' },
    ],
    idProperty: 'channel',
});

Ext.define('PMG.SpamDetectorStatusGrid', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'pmgSpamDetectorStatus',

    title: gettext('Status'),

    viewConfig: {
        trackOver: false,
    },
    columns: [
        {
            header: gettext('Channel'),
            sortable: true,
            flex: 1,
            dataIndex: 'channel',
        },
        {
            header: gettext('Last Update'),
            sortable: true,
            flex: 2,
            dataIndex: 'last_updated',
        },
        {
            header: gettext('Version'),
            flex: 1,
            sortable: true,
            dataIndex: 'version',
        },
        {
            header: gettext('Update Available'),
            flex: 1,
            sortable: true,
            dataIndex: 'update_avail',
            renderer: function (value, metaData, record) {
                if (!value) {
                    return Proxmox.Utils.noText;
                } else {
                    return Proxmox.Utils.yesText + ' (' + record.data.update_version + ')';
                }
            },
        },
    ],

    listeners: {
        activate: function () {
            var me = this;
            me.store.load();
        },
    },

    tbar: [
        {
            text: gettext('Update Now'),
            handler: function () {
                let view = this.up('grid');
                Proxmox.Utils.API2Request({
                    url: '/nodes/' + Proxmox.NodeName + '/spamassassin/rules',
                    method: 'POST',
                    failure: function (response) {
                        Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                    },
                    success: function (response) {
                        const upid = response.result.data;

                        let win = Ext.create('Proxmox.window.TaskViewer', {
                            upid: upid,
                            autoShow: true,
                        });
                        view.mon(win, 'close', () => view.store.load());
                    },
                });
            },
        },
    ],

    initComponent: function () {
        var me = this;

        me.store = Ext.create('Ext.data.Store', {
            model: 'pmg-spamassassin-database',
            proxy: {
                type: 'proxmox',
                url: '/api2/json/nodes/' + Proxmox.NodeName + '/spamassassin/rules',
            },
            sorters: {
                property: 'name',
                direction: 'ASC',
            },
        });

        me.callParent();

        Proxmox.Utils.monStoreErrors(me.getView(), me.store, true);
    },
});
