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

    isCreate: true,
    submitText: gettext('Join'),
    showTaskViewer: true,

    defaultFocus: 'textarea[name=serializedinfo]',

    viewModel: {
        parent: null,
        data: {
            info: {
                fp: '',
                ip: '',
            },
            hasAssistedInfo: false,
            localRelease: undefined,
            versionNotice: '',
        },
        formulas: {
            showClusterFields: (get) => get('hasAssistedInfo') || !get('assistedEntry.checked'),
            showVersionNotice: (get) => !!get('versionNotice') && get('assistedEntry.checked'),
        },
    },

    controller: {
        xclass: 'Ext.app.ViewController',
        control: {
            '#': {
                close: function () {
                    delete PMG.Utils.silenceAuthFailures;
                },
            },
            'textarea[name=serializedinfo]': {
                change: 'recomputeSerializedInfo',
                enable: 'resetField',
            },
        },
        init: function () {
            let me = this;
            // remember our own release to warn about version differences with the cluster
            Proxmox.Utils.API2Request({
                url: '/version',
                method: 'GET',
                success: function (response) {
                    me.getViewModel().set('localRelease', response.result.data.release);
                },
                failure: function () {
                    // best-effort, just skip the version hint if we cannot read our own version
                },
            });
        },
        resetField: function (field) {
            field.reset();
        },
        checkVersion: function (remoteRelease) {
            let localRelease = this.getViewModel().get('localRelease');
            if (!remoteRelease || !localRelease || remoteRelease === localRelease) {
                return '';
            }
            let [remoteMajor] = remoteRelease.split('.');
            let [localMajor] = localRelease.split('.');
            if (remoteMajor !== localMajor) {
                return Ext.String.format(
                    gettext(
                        'Warning: the cluster runs Proxmox Mail Gateway {0}, but this node runs {1}. Joining across major versions is not supported.',
                    ),
                    remoteRelease,
                    localRelease,
                );
            }
            return Ext.String.format(
                gettext('Note: the cluster runs Proxmox Mail Gateway {0}, but this node runs {1}.'),
                remoteRelease,
                localRelease,
            );
        },
        recomputeSerializedInfo: function (field, value) {
            let vm = this.getViewModel();

            if (!this.lookup('assistedEntry').getValue()) {
                // not in assisted entry mode, nothing to do
                vm.set('hasAssistedInfo', false);
                return;
            }

            // Ext.JSON.decode with the 'safe' flag returns null instead of throwing
            let joinInfo = Ext.JSON.decode(Ext.util.Base64.decode(value), true);

            let info = { fp: '', ip: '' };
            let notice = '';
            field.validityHint = undefined;

            if (!joinInfo || !joinInfo.ip || !joinInfo.fingerprint) {
                field.valid = false;
            } else if (joinInfo.product !== 'pmg') {
                field.valid = false;
                field.validityHint = gettext(
                    'This is not the join information of a Proxmox Mail Gateway cluster.',
                );
            } else {
                info = {
                    ip: joinInfo.ip,
                    fp: joinInfo.fingerprint,
                };
                notice = this.checkVersion(joinInfo.version);
                field.valid = true;
            }

            vm.set('info', info);
            vm.set('hasAssistedInfo', field.valid);
            vm.set('versionNotice', notice);
        },
    },

    submit: function () {
        // joining temporarily produces auth failures, as the node syncs the master's auth key;
        // silence them while the task runs so the user is not logged out mid-join
        PMG.Utils.silenceAuthFailures = true;
        this.callParent();
    },

    taskDone: function (success) {
        delete PMG.Utils.silenceAuthFailures;
        if (!success) {
            return;
        }
        // the node synced the master's auth key, so the current ticket is now invalid:
        // reload to force a fresh login once the restarted services are back up
        Ext.defer(function () {
            window.location.reload(true);
        }, 5000);
        // the task viewer stays open above any body mask, so inform the user directly
        Ext.Msg.show({
            title: gettext('Join Task Finished'),
            icon: Ext.Msg.INFO,
            msg: gettext('Cluster join finished, you may need to log in again. Reloading GUI.'),
        });
    },

    items: [
        {
            xtype: 'proxmoxcheckbox',
            reference: 'assistedEntry',
            name: 'assistedEntry',
            itemId: 'assistedEntry',
            submitValue: false,
            value: true,
            autoEl: {
                tag: 'div',
                'data-qtip': gettext(
                    'Select if join information should be extracted from pasted cluster information, deselect for manual entering',
                ),
            },
            boxLabel: gettext(
                'Assisted join: Paste encoded cluster join information and enter password.',
            ),
        },
        {
            xtype: 'textarea',
            name: 'serializedinfo',
            submitValue: false,
            allowBlank: false,
            fieldLabel: gettext('Information'),
            emptyText: gettext('Paste encoded Cluster Information here'),
            validator: function (val) {
                if (val === '') {
                    return true;
                }
                return (
                    this.valid ||
                    this.validityHint ||
                    gettext('Does not seem like a valid encoded Cluster Information!')
                );
            },
            bind: {
                disabled: '{!assistedEntry.checked}',
                hidden: '{!assistedEntry.checked}',
            },
            value: '',
        },
        {
            xtype: 'displayfield',
            userCls: 'pmx-hint',
            hideLabel: true,
            bind: {
                value: '{versionNotice}',
                hidden: '{!showVersionNotice}',
            },
        },
        {
            xtype: 'textfield',
            fieldLabel: gettext('Peer Address'),
            allowBlank: false,
            bind: {
                value: '{info.ip}',
                readOnly: '{assistedEntry.checked}',
                hidden: '{!showClusterFields}',
            },
            name: 'master_ip',
        },
        {
            xtype: 'textfield',
            inputType: 'password',
            emptyText: gettext("Peer's root password"),
            fieldLabel: gettext('Password'),
            allowBlank: false,
            bind: {
                hidden: '{!showClusterFields}',
            },
            name: 'password',
        },
        {
            xtype: 'textfield',
            fieldLabel: gettext('Fingerprint'),
            allowBlank: false,
            bind: {
                value: '{info.fp}',
                readOnly: '{assistedEntry.checked}',
                hidden: '{!showClusterFields}',
            },
            name: 'fingerprint',
        },
    ],
});

Ext.define('PMG.ClusterInfoWindow', {
    extend: 'Ext.window.Window',
    xtype: 'pmgClusterInfoWindow',
    mixins: ['Proxmox.Mixin.CBind'],

    width: 800,
    modal: true,
    resizable: false,

    title: gettext('Cluster Join Information'),

    joinInfo: {
        ip: undefined,
        fingerprint: undefined,
    },

    items: [
        {
            xtype: 'component',
            border: false,
            padding: '10 10 10 10',
            html: gettext('Copy the Join Information here and use it on the node you want to add.'),
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
                    cbind: { value: '{joinInfo.ip}' },
                    editable: false,
                },
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('Fingerprint'),
                    cbind: { value: '{joinInfo.fingerprint}' },
                    editable: false,
                },
                {
                    xtype: 'textarea',
                    inputId: 'pmgSerializedClusterInfo',
                    fieldLabel: gettext('Join Information'),
                    grow: true,
                    cbind: { joinInfo: '{joinInfo}' },
                    editable: false,
                    listeners: {
                        afterrender: function (field) {
                            if (!field.joinInfo) {
                                return;
                            }
                            let json = Ext.JSON.encode(field.joinInfo);
                            field.setValue(Ext.util.Base64.encode(json));
                        },
                    },
                },
            ],
        },
    ],
    dockedItems: [
        {
            dock: 'bottom',
            xtype: 'toolbar',
            items: [
                {
                    xtype: 'button',
                    handler: function (b) {
                        let el = document.getElementById('pmgSerializedClusterInfo');
                        el.select();
                        document.execCommand('copy');
                    },
                    text: gettext('Copy Information'),
                    iconCls: 'fa fa-clipboard',
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
                    Ext.create('PMG.ClusterJoinNodeWindow', {}).show();
                },

                onClusterInfo: function () {
                    var view = this.getView();

                    Proxmox.Utils.API2Request({
                        url: '/config/cluster/join',
                        method: 'GET',
                        waitMsgTarget: view,
                        failure: function (response, opts) {
                            Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                        },
                        success: function (response, options) {
                            Ext.create('PMG.ClusterInfoWindow', {
                                joinInfo: response.result.data,
                            }).show();
                        },
                    });
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
                    text: gettext('Join Information'),
                    reference: 'clusterInfoButton',
                    handler: 'onClusterInfo',
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
