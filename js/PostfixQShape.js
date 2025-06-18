Ext.define('pmg-qshape', {
    extend: 'Ext.data.Model',
    fields: [
        'domain',
        { type: 'integer', name: 'total' },
        { type: 'integer', name: '5m' },
        { type: 'integer', name: '10m' },
        { type: 'integer', name: '20m' },
        { type: 'integer', name: '40m' },
        { type: 'integer', name: '80m' },
        { type: 'integer', name: '160m' },
        { type: 'integer', name: '320m' },
        { type: 'integer', name: '640m' },
        { type: 'integer', name: '1280m' },
        { type: 'integer', name: '1280m+' },
    ],
    idProperty: 'domain',
});

Ext.define('PMG.Postfix.QShape', {
    extend: 'Ext.grid.GridPanel',
    alias: 'widget.pmgPostfixQShape',

    nodename: undefined,

    store: {
        autoLoad: true,
        model: 'pmg-qshape',
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        init: function (view) {
            if (view.nodename) {
                view.setNodename(view.nodename);
            }
        },

        onFlush: function () {
            var view = this.getView();

            Proxmox.Utils.API2Request({
                url: '/api2/extjs/nodes/' + view.nodename + '/postfix/flush_queues',
                method: 'POST',
                waitMsgTarget: view,
                success: function (response, opts) {
                    view.store.load();
                },
                failure: function (response, opts) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
            });
        },

        onDeleteAll: function () {
            var view = this.getView();

            Proxmox.Utils.API2Request({
                url: '/api2/extjs/nodes/' + view.nodename + '/postfix/queue/deferred',
                method: 'DELETE',
                waitMsgTarget: view,
                success: function (response, opts) {
                    view.store.load();
                },
                failure: function (response, opts) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
            });
        },

        onDiscardVerifyDatabase: function () {
            var view = this.getView();

            Proxmox.Utils.API2Request({
                url: '/api2/extjs/nodes/' + view.nodename + '/postfix/discard_verify_cache',
                method: 'POST',
                waitMsgTarget: view,
                failure: function (response, opts) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
            });
        },

        control: {
            '#': {
                activate: function () {
                    this.view.store.load(); // reload
                },
            },
        },
    },

    tbar: [
        {
            text: gettext('Flush Queue'),
            handler: 'onFlush',
        },
        {
            xtype: 'proxmoxButton',
            text: gettext('Delete all Messages'),
            dangerous: true,
            confirmMsg: 'Are you sure you want to delete all deferred mails?',
            selModel: null,
            handler: 'onDeleteAll',
        },
        {
            text: gettext('Discard address verification database'),
            handler: 'onDiscardVerifyDatabase',
        },
    ],

    columns: [
        {
            header: gettext('Domain'),
            width: 200,
            dataIndex: 'domain',
        },
        {
            header: gettext('Total'),
            width: 80,
            dataIndex: 'total',
        },
        {
            header: '5m',
            width: 80,
            dataIndex: '5m',
        },
        {
            header: '10m',
            width: 80,
            dataIndex: '10m',
        },
        {
            header: '20m',
            width: 80,
            dataIndex: '20m',
        },
        {
            header: '40m',
            width: 80,
            dataIndex: '40m',
        },
        {
            header: '80m',
            width: 80,
            dataIndex: '80m',
        },
        {
            header: '160m',
            width: 80,
            dataIndex: '160m',
        },
        {
            header: '320m',
            width: 80,
            dataIndex: '320m',
        },
        {
            header: '640m',
            width: 80,
            dataIndex: '640m',
        },
        {
            header: '1280m',
            width: 80,
            dataIndex: '1280m',
        },
        {
            header: '1280m+',
            width: 80,
            dataIndex: '1280m+',
        },
    ],

    setNodename: function (nodename) {
        var me = this;

        me.nodename = nodename;

        me.store.setProxy({
            type: 'proxmox',
            url: '/api2/json/nodes/' + me.nodename + '/postfix/qshape',
        });

        me.store.load();
    },
});
