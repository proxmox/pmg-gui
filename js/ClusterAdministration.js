Ext.define('pmg-cluster', {
    extend: 'Ext.data.Model',
    fields: [
        'type',
        'name',
        'ip',
        'hostrsapubkey',
        'rootrsapubkey',
        'fingerprint',
        { type: 'integer', name: 'cid' },
        { type: 'boolean', name: 'insync' },
        'memory',
        'loadavg',
        'uptime',
        'rootfs',
        'conn_error',
        'level',
        {
            type: 'number',
            name: 'memory_per',
            calculate: function (data) {
                var mem = data.memory;
                return Ext.isObject(mem) ? mem.used / mem.total : 0;
            },
        },
        {
            type: 'number',
            name: 'rootfs_per',
            calculate: function (data) {
                var du = data.rootfs;
                return Ext.isObject(du) ? du.used / du.total : 0;
            },
        },
    ],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/config/cluster/status',
    },
    idProperty: 'cid',
});

Ext.define('PMG.ClusterJoinNodeWindow', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmgClusterJoinNodeWindow',
    onlineHelp: 'pmgcm_join',

    title: gettext('Cluster Join'),

    width: 800,

    method: 'POST',

    url: '/config/cluster/join',

    items: [
        {
            xtype: 'textfield',
            fieldLabel: 'IP Address',
            name: 'master_ip',
        },
        {
            xtype: 'textfield',
            inputType: 'password',
            fieldLabel: gettext('Password'),
            name: 'password',
        },
        {
            xtype: 'textfield',
            fieldLabel: gettext('Fingerprint'),
            name: 'fingerprint',
        },
    ],
});

Ext.define('PMG.ClusterAddNodeWindow', {
    extend: 'Ext.window.Window',
    xtype: 'pmgClusterAddNodeWindow',
    mixins: ['Proxmox.Mixin.CBind'],

    width: 800,

    modal: true,

    title: gettext('Cluster Join') + ' : ' + gettext('Information'),

    ipAddress: undefined,

    fingerprint: undefined,

    items: [
        {
            xtype: 'component',
            border: false,
            padding: '10 10 10 10',
            html: gettext(
                "Please use the 'Join' button on the node you want to add, using the following IP address and fingerprint.",
            ),
        },
        {
            xtype: 'container',
            layout: 'form',
            border: false,
            padding: '0 10 10 10',
            items: [
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('IP Address'),
                    cbind: { value: '{ipAddress}' },
                    editable: false,
                },
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('Fingerprint'),
                    cbind: { value: '{fingerprint}' },
                    editable: false,
                },
            ],
        },
    ],
});

Ext.define('PMG.ClusterAdministration', {
    extend: 'Ext.tab.Panel',
    xtype: 'pmgClusterAdministration',

    title: gettext('Cluster Administration'),

    border: false,
    defaults: { border: false },

    viewModel: {
        parent: null,
        data: {
            nodecount: 0,
            master: null,
        },
    },

    items: [
        {
            xtype: 'grid',
            title: gettext('Nodes'),
            controller: {
                xclass: 'Ext.app.ViewController',

                init: function (view) {
                    view.store.on('load', this.onLoad, this);
                    Proxmox.Utils.monStoreErrors(view, view.getStore(), true);
                },

                onLoad: function (store, records, success) {
                    var vm = this.getViewModel();
                    if (!success || !records) {
                        return;
                    }
                    vm.set('nodecount', records.length);

                    var master = null;
                    Ext.Array.each(records, function (ni) {
                        if (ni.data.type === 'master') {
                            master = ni;
                        }
                    });
                    vm.set('master', master);
                },

                onCreate: function () {
                    var view = this.getView();

                    Proxmox.Utils.API2Request({
                        url: '/config/cluster/create',
                        method: 'POST',
                        waitMsgTarget: view,
                        failure: function (response, opts) {
                            Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                        },
                        success: function (response, options) {
                            var upid = response.result.data;
                            var win = Ext.create('Proxmox.window.TaskProgress', { upid: upid });
                            win.show();
                            win.on('destroy', function () {
                                view.store.load();
                            });
                        },
                    });
                },

                onJoin: function () {
                    var win = Ext.create('PMG.ClusterJoinNodeWindow', {});
                    win.show();
                    win.on('destroy', function () {
                        // fixme: logout
                    });
                },

                onAdd: function () {
                    var vm = this.getViewModel();

                    var win = Ext.create('PMG.ClusterAddNodeWindow', {
                        ipAddress: vm.get('master').get('ip'),
                        fingerprint: vm.get('master').get('fingerprint'),
                    });

                    win.show();
                },
            },
            store: {
                autoLoad: true,
                model: 'pmg-cluster',
                sorters: ['cid'],
            },
            tbar: [
                {
                    text: gettext('Create'),
                    reference: 'createButton',
                    handler: 'onCreate',
                    bind: {
                        disabled: '{nodecount}',
                    },
                },
                {
                    text: gettext('Add'),
                    reference: 'addButton',
                    handler: 'onAdd',
                    bind: {
                        disabled: '{!master}',
                    },
                },
                {
                    text: gettext('Join'),
                    reference: 'joinButton',
                    handler: 'onJoin',
                    bind: {
                        disabled: '{nodecount}',
                    },
                },
            ],
            columns: [
                {
                    header: gettext('Node'),
                    width: 150,
                    dataIndex: 'name',
                },
                {
                    header: gettext('Role'),
                    width: 100,
                    dataIndex: 'type',
                },
                {
                    header: gettext('ID'),
                    width: 80,
                    dataIndex: 'cid',
                },
                {
                    header: gettext('IP'),
                    width: 150,
                    dataIndex: 'ip',
                },
                {
                    header: gettext('State'),
                    width: 100,
                    renderer: function (value, metaData, record) {
                        var d = record.data;
                        var state = 'active';
                        if (!d.insync) {
                            state = 'syncing';
                        }
                        if (d.conn_error) {
                            metaData.tdCls = 'x-form-invalid-field';
                            let html = '<p>' + Ext.htmlEncode(d.conn_error) + '</p>';
                            html = html.replace(/\n/g, '<br>');
                            metaData.tdAttr =
                                'data-qwidth=600 data-qtitle="ERROR" data-qtip="' +
                                html.replace(/"/g, '&quot;') +
                                '"';
                            state = 'error';
                        }
                        return state;
                    },
                    dataIndex: 'insync',
                },
                {
                    header: gettext('Subscription'),
                    width: 120,
                    renderer: Proxmox.Utils.format_subscription_level,
                    dataIndex: 'level',
                },
                {
                    header: gettext('Uptime'),
                    width: 150,
                    renderer: Proxmox.Utils.render_uptime,
                    dataIndex: 'uptime',
                },
                {
                    header: gettext('Load average'),
                    renderer: function (value) {
                        if (Ext.isDefined(value)) {
                            if (Ext.isArray(value)) {
                                return value[0];
                            }
                            return value.toString();
                        }
                        return '';
                    },
                    dataIndex: 'loadavg',
                },
                {
                    xtype: 'widgetcolumn',
                    widget: {
                        xtype: 'progressbarwidget',
                        textTpl: '{value:percent}',
                    },
                    header: gettext('RAM usage'),
                    dataIndex: 'memory_per',
                },
                {
                    xtype: 'widgetcolumn',
                    widget: {
                        xtype: 'progressbarwidget',
                        textTpl: '{value:percent}',
                    },
                    header: gettext('HD space'),
                    dataIndex: 'rootfs_per',
                },
            ],
        },
    ],
});
