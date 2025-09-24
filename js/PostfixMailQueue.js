Ext.define('pmg-mailq', {
    extend: 'Ext.data.Model',
    fields: [
        'queue_id',
        'queue_name',
        { type: 'date', dateFormat: 'timestamp', name: 'arrival_time' },
        { type: 'integer', name: 'message_size' },
        'sender',
        'receiver',
        'reason',
    ],
    idProperty: 'queue_id',
});

Ext.define('PMG.Postfix.MailQueue', {
    extend: 'Ext.grid.GridPanel',
    alias: 'widget.pmgPostfixMailQueue',

    nodename: undefined,

    filter: undefined,

    queuename: 'deferred',

    selModel: {
        selType: 'checkboxmodel',
        mode: 'MULTI',
        showHeaderCheckbox: true,
    },

    store: {
        xclass: 'Ext.data.Store',
        model: 'pmg-mailq',
        remoteFilter: true,
        remoteSort: true,
        sorters: 'arrival_time',
        pageSize: 2000,
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        init: function (view) {
            if (view.nodename) {
                view.setNodename(view.nodename);
            }

            view.delayFilterTask = new Ext.util.DelayedTask(function () {
                var filter = view.lookupReference('filter').getValue();

                view.filter = filter;
                view.updateProxy();
            });
        },

        onChangeFilter: function (f, v) {
            var view = this.getView();
            view.delayFilterTask.delay(500);
        },

        onFlush: function (button, event, rec) {
            var view = this.getView();
            let sel = view.getSelectionModel().getSelection();
            let ids = sel.map((r) => r.get('queue_id'));

            let do_deliver = function () {
                Proxmox.Utils.API2Request({
                    url: `/api2/extjs/nodes/${view.nodename}/postfix/queue/${view.queuename}`,
                    method: 'POST',
                    params: { action: 'deliver', ids: ids.join(';') },
                    waitMsgTarget: view,
                    success: () => {
                        view.selModel.deselectAll();
                        view.store.load();
                    },
                    failure: (response) => Ext.Msg.alert(gettext('Error'), response.htmlStatus),
                });
            }

            if (sel.length === 1) {
                do_deliver();
            } else if (sel.length > 1) {
                Ext.Msg.show({
                    title: gettext('Confirm'),
                    message: Ext.String.format(gettext("Deliver {0} selected mails now?"), ids.length),
                    buttons: Ext.Msg.YESNO,
                    icon: Ext.Msg.INFO,
                    fn: function (btn) {
                        if (btn === 'yes') { do_deliver(); }
                    },
                });
            }
        },

        onRemove: function (button, event, rec) {
            var view = this.getView();
            let sel = view.getSelectionModel().getSelection();
            let ids = sel.map((r) => r.get('queue_id'));

            let do_delete = function () {
                Proxmox.Utils.API2Request({
                    url: `/api2/extjs/nodes/${view.nodename}/postfix/queue/${view.queuename}`,
                    method: 'POST',
                    params: { action: 'delete', ids: ids.join(';') },
                    waitMsgTarget: view,
                    success: () => {
                        view.selModel.deselectAll();
                        view.store.load();
                    },
                    failure: (response) => Ext.Msg.alert(gettext('Error'), response.htmlStatus),
                });
            }

            Ext.Msg.show({
                title: gettext('Confirm'),
                message: Ext.String.format(gettext("Delete {0} selected mails?"), ids.length),
                buttons: Ext.Msg.YESNO,
                icon: Ext.Msg.INFO,
                fn: function (btn) {
                    if (btn === 'yes') { do_delete(); }
                },
            });
        },

        onHeaders: function (button, event, rec) {
            var view = this.getView();

            var url =
                '/api2/extjs/nodes/' +
                view.nodename +
                '/postfix/queue/' +
                view.queuename +
                '/' +
                rec.data.queue_id;

            var win = Ext.create('PMG.ViewMailHeaders', {
                title: view.title + ' : ' + rec.data.queue_id,
                url: url,
            });
            win.show();
        },

        control: {
            '#': {
                activate: function () {
                    this.view.updateProxy(); // reload
                },
                itemdblclick: function (grid, rec, item, index, event) {
                    this.onHeaders(grid, event, rec);
                },
            },
            'field[reference=filter]': {
                change: 'onChangeFilter',
            },
        },
    },

    tbar: [
        {
            xtype: 'proxmoxButton',
            reference: 'headerBtn',
            enableFn: function (rec) {
                let grid = this.up('grid');
                if (!grid) { return false; }
                return grid.getSelectionModel().getCount() === 1;
            },
            disabled: true,
            text: gettext('Headers'),
            handler: 'onHeaders',
        },
        {
            xtype: 'proxmoxButton',
            disabled: true,
            text: gettext('Flush'),
            handler: 'onFlush',
        },
        {
            xtype: 'proxmoxButton',
            disabled: true,
            text: gettext('Remove'),
            handler: 'onRemove',
        },
        {
            xtype: 'label',
            html: gettext('Filter') + ':',
        },
        {
            xtype: 'textfield',
            width: 300,
            reference: 'filter',
        },
    ],

    columns: [
        {
            header: gettext('Time'),
            flex: 2,
            renderer: Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
            dataIndex: 'arrival_time',
        },
        {
            header: 'Size',
            renderer: Proxmox.Utils.render_size,
            flex: 1,
            dataIndex: 'message_size',
        },
        {
            header: gettext('Sender'),
            flex: 2,
            dataIndex: 'sender',
            renderer: Ext.htmlEncode,
        },
        {
            header: gettext('Receiver'),
            flex: 2,
            dataIndex: 'receiver',
            renderer: Ext.htmlEncode,
        },
        {
            header: gettext('Reason'),
            flex: 8,
            dataIndex: 'reason',
            renderer: Ext.htmlEncode,
        },
    ],

    pendingLoad: false,

    updateProxy: function () {
        let me = this;

        if (me.pendingLoad) {
            return;
        }

        let proxy = {
            type: 'proxmox',
            startParam: 'start',
            limitParam: 'limit',
            sortParam: 'sortfield',
            directionParam: 'sortdir',
            simpleSortMode: true,
            url: '/api2/json/nodes/' + me.nodename + '/postfix/queue/' + me.queuename,
        };

        let filter = me.filter;
        if (filter) {
            proxy.extraParams = { filter: filter };
        }

        me.store.setProxy(proxy);

        let nodename = me.nodename;
        let queuename = me.queuename;
        me.pendingLoad = true;
        me.store.load(function () {
            me.pendingLoad = false;
            if (me.nodename !== nodename || me.filter !== filter || me.queuename !== queuename) {
                setTimeout(function () {
                    me.updateProxy();
                }, 100);
            }
        });
    },

    setFilter: function (filter) {
        this.lookupReference('filter').setValue(filter);
    },

    setNodename: function (nodename) {
        let me = this;
        if (nodename === me.nodename) {
            return; // nothing to do
        }
        me.nodename = nodename;

        me.updateProxy();
    },

    setQueueName: function (queuename) {
        var me = this;

        me.queuename = queuename;

        me.updateProxy();
    },
});
