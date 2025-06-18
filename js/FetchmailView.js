Ext.define('pmg-fetchmail-users', {
    extend: 'Ext.data.Model',
    fields: [
        'id',
        'protocol',
        'port',
        'server',
        'user',
        'pass',
        'target',
        'ssl',
        'keep',
        { type: 'integer', name: 'interval' },
        { type: 'boolean', name: 'enable' },
    ],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/config/fetchmail',
    },
    idProperty: 'id',
});

Ext.define('PMG.FetchmailView', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'pmgFetchmailView',

    baseurl: '/api2/extjs/config/fetchmail',

    store: {
        autoDestroy: true,
        autoLoad: true,
        model: 'pmg-fetchmail-users',
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        init: function (view) {
            Proxmox.Utils.monStoreErrors(view, view.store, true);
        },

        onAdd: function () {
            var view = this.getView();

            var win = Ext.create('PMG.FetchmailEdit', {
                url: view.baseurl,
                method: 'POST',
            });
            win.on('destroy', function () {
                view.store.load();
            });
            win.show();
        },

        onEdit: function () {
            var view = this.getView();

            var rec = view.selModel.getSelection()[0];

            var win = Ext.create('PMG.FetchmailEdit', {
                userid: rec.data.id,
                url: view.baseurl + '/' + rec.data.id,
                method: 'PUT',
                autoLoad: true,
            });
            win.on('destroy', function () {
                view.store.load();
            });
            win.show();
        },

        onAfterRemove: function (btn, res) {
            var view = this.getView();
            view.store.load();
        },
    },

    tbar: [
        {
            text: gettext('Add'),
            reference: 'addBtn',
            handler: 'onAdd',
        },
        '-',
        {
            xtype: 'proxmoxButton',
            text: gettext('Edit'),
            disabled: true,
            handler: 'onEdit',
        },
        {
            xtype: 'proxmoxStdRemoveButton',
            baseurl: '/config/fetchmail',
            reference: 'removeBtn',
            callback: 'onAfterRemove',
            waitMsgTarget: true,
        },
    ],

    listeners: {
        //scope: 'controller',
        itemdblclick: 'onEdit',
    },

    columns: [
        {
            header: gettext('Server'),
            flex: 1,
            renderer: Ext.String.htmlEncode,
            dataIndex: 'server',
        },
        {
            header: gettext('Protocol'),
            dataIndex: 'protocol',
        },
        {
            header: gettext('User name'),
            flex: 1,
            renderer: Ext.String.htmlEncode,
            dataIndex: 'user',
        },
        {
            header: gettext('Deliver to'),
            flex: 1,
            renderer: Ext.String.htmlEncode,
            dataIndex: 'target',
        },
        {
            header: gettext('Enabled'),
            sortable: true,
            renderer: Proxmox.Utils.format_boolean,
            dataIndex: 'enable',
        },
        {
            header: gettext('Interval'),
            dataIndex: 'interval',
        },
    ],
});
