Ext.define('PMG.Dashboard', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgDashboard',

    controller: {
        xclass: 'Ext.app.ViewController',

        openDashboardOptions: function () {
            var me = this;
            var viewModel = me.getViewModel();
            Ext.create('Ext.window.Window', {
                modal: true,
                width: 300,
                title: gettext('Dashboard Options'),
                layout: {
                    type: 'auto',
                },
                items: [
                    {
                        xtype: 'form',
                        bodyPadding: '10 10 10 10',
                        defaultButton: 'savebutton',
                        items: [
                            {
                                xtype: 'proxmoxintegerfield',
                                itemId: 'hours',
                                labelWidth: 100,
                                anchor: '100%',
                                allowBlank: false,
                                minValue: 1,
                                maxValue: 24,
                                value: viewModel.get('hours'),
                                fieldLabel: gettext('Hours to show'),
                            },
                        ],
                        buttons: [
                            {
                                text: gettext('Save'),
                                reference: 'loginButton',
                                formBind: true,
                                handler: function () {
                                    var win = this.up('window');
                                    var hours = win.down('#hours').getValue();
                                    me.setHours(hours, true);
                                    win.close();
                                },
                            },
                        ],
                    },
                ],
            }).show();
        },

        setHours: function (hours, setState) {
            var me = this;
            var viewModel = me.getViewModel();
            viewModel.set('hours', hours);
            viewModel.notify();

            Ext.Array.forEach(['recentmails', 'receivers'], function (item) {
                viewModel.getStore(item).reload();
            });

            if (setState) {
                let sp = Ext.state.Manager.getProvider();
                sp.set('dashboard-hours', hours);
            }
        },

        updateMailStats: function (store, records, success) {
            if (!success) {
                return;
            }
            var me = this;
            var viewModel = me.getViewModel();

            var count = 0;
            var bytes_in = 0;
            var bytes_out = 0;
            var ptime = 0;
            var avg_ptime = 'N/A';

            records.forEach(function (item) {
                bytes_in += item.data.bytes_in;
                bytes_out += item.data.bytes_out;
                // unnormalize
                count += (item.data.count * item.data.timespan) / 60;
                ptime += item.data.ptimesum;
            });

            if (count) {
                avg_ptime = (ptime / count).toFixed(2) + ' s';
            }

            viewModel.set('bytes_in', Proxmox.Utils.format_size(bytes_in));
            viewModel.set('bytes_out', Proxmox.Utils.format_size(bytes_out));
            viewModel.set('avg_ptime', avg_ptime);
        },

        updateClusterStats: function (store, records, success) {
            if (!success) {
                return;
            }
            var me = this;
            var viewmodel = me.getViewModel();

            var subStatus = 2; // 2 = all good, 1 = different leves, 0 = none
            var subLevel = '';

            var cpu = 0;
            var mem = 0;
            var hd = 0;
            var count = records.length;
            var errors = [];

            records.forEach(function (item) {
                // subscription level check
                if (subStatus && item.data.level) {
                    if (subLevel !== '' && subLevel !== item.data.level) {
                        subStatus = 1;
                    } else if (subLevel === '') {
                        subLevel = item.data.level;
                    }
                } else {
                    subStatus = 0;
                }

                if (item.data.name === Proxmox.NodeName) {
                    let repoStatus = me.lookup('nodeInfo').down('#repositoryStatus');
                    repoStatus.setSubscriptionStatus(!!item.data.level);
                }

                // resources count
                cpu += item.data.cpu || 0;

                var memory = item.data.memory || { used: 0, total: 1 };
                mem += memory.used / memory.total;

                var rootfs = item.data.rootfs || { used: 0, total: 1 };
                hd += rootfs.used / rootfs.total;

                if (item.data.conn_error && count > 1) {
                    count--;
                    errors.push({
                        name: item.data.name,
                        msg: item.data.conn_error,
                    });
                }
            });

            var subscriptionPanel = me.lookup('subscription');
            subscriptionPanel.setSubStatus(subStatus);

            // the node info already displays this information in case there is no cluster
            me.lookup('clusterResources').setHidden(records.length === 1);

            cpu = cpu / count;
            mem = mem / count;
            hd = hd / count;

            var cpuPanel = me.lookup('cpu');
            cpuPanel.updateValue(cpu);

            var memPanel = me.lookup('mem');
            memPanel.updateValue(mem);

            var hdPanel = me.lookup('hd');
            hdPanel.updateValue(hd);

            if (errors.length && !viewmodel.get('error_shown')) {
                let text = '';
                errors.forEach(function (error) {
                    text += error.name + ':<br>' + error.msg + '<br>';
                });
                Ext.Msg.alert(gettext('Error'), text);
                viewmodel.set('error_shown', true);
            }
        },

        updateRepositoryStatus: function (store, records, success) {
            if (!success) {
                return;
            }

            let me = this;
            let repoStatus = me.lookup('nodeInfo').down('#repositoryStatus');
            repoStatus.setRepositoryInfo(records[0].data['standard-repos']);
        },

        init: function (view) {
            var me = this;
            var sp = Ext.state.Manager.getProvider();
            var hours = sp.get('dashboard-hours') || 12;
            me.setHours(hours, false);

            view.mon(sp, 'statechange', function (provider, key, value) {
                if (key !== 'summarycolumns') {
                    return;
                }
                Proxmox.Utils.updateColumnWidth(view);
            });
        },
    },

    listeners: {
        resize: (panel) => Proxmox.Utils.updateColumnWidth(panel),
    },

    viewModel: {
        data: {
            timespan: 300, // in seconds
            hours: 12, // in hours
            error_shown: false,
            bytes_in: 0,
            bytes_out: 0,
            avg_ptime: 0.0,
        },

        stores: {
            cluster: {
                storeid: 'dash-cluster',
                type: 'update',
                interval: 5000,
                autoStart: true,
                autoDestroy: true,
                proxy: {
                    extraParams: { list_single_node: 1 },
                    type: 'proxmox',
                    url: '/api2/json/config/cluster/status',
                },
                listeners: {
                    load: 'updateClusterStats',
                },
            },
            recentmails: {
                storeid: 'dash-recent',
                interval: 5000,
                type: 'update',
                autoStart: true,
                autoDestroy: true,
                proxy: {
                    type: 'proxmox',
                    url: '/api2/json/statistics/recent',
                    extraParams: {
                        hours: '{hours}',
                        timespan: '{timespan}',
                    },
                },
                fields: [
                    {
                        type: 'number',
                        name: 'count',
                        convert: PMG.Utils.convert_field_to_per_min,
                    },
                    {
                        type: 'number',
                        name: 'count_in',
                        convert: PMG.Utils.convert_field_to_per_min,
                    },
                    {
                        type: 'number',
                        name: 'count_out',
                        convert: PMG.Utils.convert_field_to_per_min,
                    },
                    {
                        type: 'number',
                        name: 'spam',
                        convert: PMG.Utils.convert_field_to_per_min,
                    },
                    {
                        type: 'number',
                        name: 'spam_in',
                        convert: PMG.Utils.convert_field_to_per_min,
                    },
                    {
                        type: 'number',
                        name: 'spam_out',
                        convert: PMG.Utils.convert_field_to_per_min,
                    },
                    {
                        type: 'number',
                        name: 'virus',
                        convert: PMG.Utils.convert_field_to_per_min,
                    },
                    {
                        type: 'number',
                        name: 'virus_in',
                        convert: PMG.Utils.convert_field_to_per_min,
                    },
                    { type: 'integer', name: 'virus_out' },
                    { type: 'integer', name: 'bytes_in' },
                    { type: 'integer', name: 'bytes_out' },
                    { type: 'number', name: 'ptimesum' },
                    { type: 'date', dateFormat: 'timestamp', name: 'time' },
                ],
                listeners: {
                    load: 'updateMailStats',
                },
            },
            receivers: {
                storeid: 'dash-receivers',
                interval: 10000,
                type: 'update',
                autoStart: true,
                autoDestroy: true,
                proxy: {
                    type: 'proxmox',
                    url: '/api2/json/statistics/recentreceivers',
                    extraParams: {
                        hours: '{hours}',
                        limit: 10, // make this also configurable?
                    },
                },
                fields: [
                    { type: 'integer', name: 'count' },
                    { type: 'string', name: 'receiver' },
                ],
            },
            repositories: {
                storeid: 'dash-repositories',
                type: 'update',
                interval: 15000,
                autoStart: true,
                autoLoad: true,
                autoDestroy: true,
                proxy: {
                    type: 'proxmox',
                    url: '/api2/json/nodes/localhost/apt/repositories',
                },
                listeners: {
                    load: 'updateRepositoryStatus',
                },
            },
        },
    },

    bind: {
        title:
            gettext('Dashboard') + ' (' + Ext.String.format(gettext('{0} hours'), '{hours}') + ')',
    },

    layout: {
        type: 'column',
    },
    border: false,

    bodyPadding: '20 0 0 20',

    defaults: {
        columnWidth: 1,
        xtype: 'panel',
        margin: '0 20 20 0',
    },

    tools: [
        {
            type: 'gear',
            handler: 'openDashboardOptions',
        },
    ],

    scrollable: true,

    items: [
        {
            height: 300,
            flex: 1,
            iconCls: 'fa fa-tachometer',
            title: gettext('E-Mail Volume'),
            layout: {
                type: 'vbox',
                align: 'stretch',
            },
            defaults: {
                xtype: 'pmgMiniGraph',
                bind: {
                    store: '{recentmails}',
                },
            },
            items: [
                {
                    fields: ['count'],
                    fieldTitles: [gettext('Mails / min')],
                    seriesConfig: {
                        colors: ['#00617F'],
                        style: {
                            opacity: 0.6,
                            lineWidth: 1,
                        },
                        highlightCfg: {
                            opacity: 1,
                            scaling: 1,
                        },
                    },
                },
                {
                    fields: ['spam'],
                    fieldTitles: [gettext('Spam / min')],
                    seriesConfig: {
                        colors: ['#E67300'],
                        style: {
                            opacity: 0.6,
                            lineWidth: 1,
                        },
                        highlightCfg: {
                            opacity: 1,
                            scaling: 1,
                        },
                    },
                },
            ],
        },
        {
            xtype: 'container',
            height: 300,
            layout: {
                type: 'vbox',
                align: 'stretch',
            },
            items: [
                {
                    xtype: 'pmgMailProcessing',
                    title: gettext('E-Mail Processing'),
                    iconCls: 'fa fa-hourglass-half',
                    height: 180,
                    bind: {
                        data: {
                            bytes_in: '{bytes_in}',
                            bytes_out: '{bytes_out}',
                            avg_ptime: '{avg_ptime}',
                        },
                    },
                },
                {
                    iconCls: 'fa fa-ticket',
                    title: gettext('Subscription'),
                    reference: 'subscription',
                    xtype: 'pmgSubscriptionInfo',
                    margin: '10 0 0 0',
                    height: 110,
                },
            ],
        },
        {
            xtype: 'pmgNodeInfoPanel',
            reference: 'nodeInfo',
            height: 300,
            bodyPadding: '15 5 15 5',
            iconCls: 'fa fa-tasks',
        },
        {
            height: 300,
            iconCls: 'fa fa-list',
            title: gettext('Top Receivers'),

            bodyPadding: '10 10 10 10',
            layout: {
                type: 'vbox',
                pack: 'center',
                align: 'stretch',
            },
            items: [
                {
                    xtype: 'grid',
                    bind: {
                        store: '{receivers}',
                    },
                    emptyText: gettext('No data in database'),
                    // remove all borders/lines/headers
                    border: false,
                    bodyBorder: false,
                    hideHeaders: true,
                    header: false,
                    columnLines: false,
                    rowLines: false,
                    viewConfig: {
                        stripeRows: false,
                    },
                    columns: [
                        {
                            dataIndex: 'receiver',
                            flex: 1,
                            text: gettext('Receiver'),
                        },
                        {
                            dataIndex: 'count',
                            align: 'right',
                            text: gettext('Count'),
                        },
                    ],
                },
            ],
        },
        {
            height: 250,
            iconCls: 'fa fa-tasks',
            title: gettext('Cluster Resources (average)'),
            reference: 'clusterResources',
            hidden: true,
            bodyPadding: '0 20 0 20',
            layout: {
                type: 'hbox',
                align: 'center',
            },
            defaults: {
                xtype: 'proxmoxGauge',
                spriteFontSize: '20px',
                flex: 1,
            },
            items: [
                {
                    title: gettext('CPU'),
                    reference: 'cpu',
                },
                {
                    title: gettext('Memory'),
                    reference: 'mem',
                },
                {
                    title: gettext('Storage'),
                    reference: 'hd',
                },
            ],
        },
    ],
});
