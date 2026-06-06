Ext.define('PMG.PBSConfig', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgPBSConfig',

    controller: {
        xclass: 'Ext.app.ViewController',

        callRestore: function (grid, record) {
            let remote = this.getViewModel().get('remote');
            Ext.create('PMG.RestoreWindow', {
                remote: remote,
                backup_id: record.data['backup-id'],
                backup_time: record.data['backup-time'],
            }).show();
        },

        restoreSnapshot: function (button) {
            let me = this;
            let view = me.lookup('snapshotsGrid');
            let record = view.getSelection()[0];
            me.callRestore(view, record);
        },

        runBackup: function (button) {
            let me = this;
            let remote = me.getViewModel().get('remote');
            Ext.create('PMG.BackupWindow', {
                url: `/nodes/${Proxmox.NodeName}/pbs/${remote}/snapshot`,
                taskDone: () => me.loadSnapshots(),
            }).show();
        },

        reload: function (grid) {
            let me = this;
            let selection = grid.getSelection();
            me.showInfo(grid, selection);
        },

        // (re)load the snapshot store, masking the grid on failure; a generation
        // guard prevents a superseded load from clobbering the current view
        loadSnapshots: function () {
            let me = this;
            let snapshotGrid = me.lookup('snapshotsGrid');
            let generation = (me.snapshotLoadGeneration ?? 0) + 1;
            me.snapshotLoadGeneration = generation;
            Proxmox.Utils.setErrorMask(snapshotGrid, true);
            snapshotGrid.getStore().load({
                callback: (records, operation, success) => {
                    if (generation !== me.snapshotLoadGeneration) {
                        return; // superseded by a newer load
                    }
                    if (success) {
                        Proxmox.Utils.setErrorMask(snapshotGrid, false);
                    } else {
                        let msg = Proxmox.Utils.getResponseErrorMessage(operation.getError());
                        Proxmox.Utils.setErrorMask(snapshotGrid, msg);
                    }
                },
            });
        },

        showInfo: function (grid, selected) {
            let me = this;
            let viewModel = me.getViewModel();
            if (selected[0]) {
                let remote = selected[0].data.remote;
                viewModel.set('selected', true);
                viewModel.set('remote', remote);

                // set the snapshot store URL and (re)load it
                me.lookup('snapshotsGrid')
                    .getStore()
                    .getProxy()
                    .setUrl(`/api2/json/nodes/${Proxmox.NodeName}/pbs/${remote}/snapshot`);
                me.loadSnapshots();

                let scheduleStore = me.lookup('schedulegrid').rstore;
                scheduleStore
                    .getProxy()
                    .setUrl(`/api2/json/nodes/${Proxmox.NodeName}/pbs/${remote}/timer`);
                scheduleStore.load();
            } else {
                viewModel.set('selected', false);
            }
        },
        reloadSnapshots: function () {
            let me = this;
            let grid = me.lookup('grid');
            let selection = grid.getSelection();
            me.showInfo(grid, selection);
        },
        init: function (view) {
            let me = this;
            me.lookup('grid').relayEvents(view, ['activate']);

            let remoteGrid = me.lookup('grid');
            view.mon(remoteGrid.store, 'load', function (store, r, success, o) {
                if (success) {
                    remoteGrid.getSelectionModel().select(0);
                }
            });

            // the snapshot grid's load is masked in showInfo() with a generation
            // guard, so it is intentionally not monitored here
            let schedulegrid = me.lookup('schedulegrid');
            Proxmox.Utils.monStoreErrors(schedulegrid, schedulegrid.getStore(), true);
        },

        control: {
            'grid[reference=grid]': {
                selectionchange: 'showInfo',
                load: 'reload',
            },
            'grid[reference=snapshotsGrid]': {
                itemdblclick: 'restoreSnapshot',
            },
        },
    },

    viewModel: {
        data: {
            remote: '',
            selected: false,
        },
    },

    layout: 'border',

    items: [
        {
            xtype: 'pmgPBSConfigGrid',
            reference: 'grid',
            title: gettext('Remote'),
            hidden: false,
            region: 'center',
            minHeight: 130,
            border: false,
        },
        {
            xtype: 'proxmoxObjectGrid',
            region: 'south',
            reference: 'schedulegrid',
            title: gettext('Schedule'),
            height: 155,
            border: false,
            hidden: true,
            emptyText: gettext('No schedule setup.'),
            tbar: [
                {
                    text: gettext('Set Schedule'),
                    handler: function () {
                        let me = this;
                        let remote = me.lookupViewModel().get('remote');
                        let win = Ext.createWidget('pmgPBSScheduleEdit', {
                            remote: remote,
                            autoShow: true,
                        });
                        win.on('destroy', () => me.up('grid').rstore.load());
                    },
                },
                {
                    xtype: 'proxmoxStdRemoveButton',
                    baseurl: `/nodes/${Proxmox.NodeName}/pbs/`,
                    callback: function () {
                        this.up('grid').rstore.load();
                    },
                    text: gettext('Remove Schedule'),
                    selModel: false,
                    confirmMsg: function (_rec) {
                        let me = this;
                        let remote = me.lookupViewModel().get('remote');
                        return Ext.String.format(
                            gettext('Are you sure you want to remove the schedule for {0}'),
                            `'${remote}'`,
                        );
                    },
                    getUrl: function (_rec) {
                        let remote = this.lookupViewModel().get('remote');
                        return `${this.baseurl}/${remote}/timer`;
                    },
                },
                '->',
                {
                    text: gettext('Reload'),
                    iconCls: 'fa fa-refresh',
                    handler: function () {
                        this.up('grid').rstore.load();
                    },
                },
            ],
            bind: {
                title: Ext.String.format(gettext("Schedule on '{0}'"), '{remote}'),
                hidden: '{!selected}',
            },
            url: '/', // hack, obj. grid is a bit dumb..
            rows: {
                schedule: {
                    text: gettext('Schedule'),
                    required: true,
                    defaultValue: gettext('None'),
                },
                delay: {
                    text: gettext('Delay'),
                },
                'next-run': {
                    text: gettext('Next Run'),
                },
            },
        },
        {
            xtype: 'grid',
            region: 'south',
            reference: 'snapshotsGrid',
            height: '50%',
            border: false,
            split: true,
            hidden: true,
            emptyText: gettext('No backups on remote'),
            tbar: [
                {
                    text: gettext('Backup Now'),
                    handler: 'runBackup',
                },
                '-',
                {
                    xtype: 'proxmoxButton',
                    text: gettext('Restore'),
                    handler: 'restoreSnapshot',
                    disabled: true,
                },
                {
                    xtype: 'proxmoxStdRemoveButton',
                    text: gettext('Forget Snapshot'),
                    disabled: true,
                    getUrl: function (rec) {
                        let me = this;
                        let remote = me.lookupViewModel().get('remote');
                        let snapshot = `${rec.data['backup-id']}/${rec.data['backup-time']}`;
                        return `/nodes/${Proxmox.NodeName}/pbs/${remote}/snapshot/${snapshot}`;
                    },
                    confirmMsg: function (rec) {
                        let _me = this;
                        let snapshot = `${rec.data['backup-id']}/${rec.data['backup-time']}`;
                        return Ext.String.format(
                            gettext('Are you sure you want to forget snapshot {0}'),
                            `'${snapshot}'`,
                        );
                    },
                    callback: 'reloadSnapshots',
                },
                '->',
                {
                    text: gettext('Reload'),
                    iconCls: 'fa fa-refresh',
                    handler: 'loadSnapshots',
                },
            ],
            store: {
                fields: ['backup-id', 'backup-time', 'size', 'ctime', 'encrypted', 'verification'],
                proxy: { type: 'proxmox' },
                sorters: [
                    {
                        property: 'backup-time',
                        direction: 'DESC',
                    },
                ],
            },
            bind: {
                title: Ext.String.format(gettext("Backup snapshots on '{0}'"), '{remote}'),
                hidden: '{!selected}',
            },
            columns: [
                {
                    text: gettext('Group ID'),
                    dataIndex: 'backup-id',
                    flex: 1,
                },
                {
                    text: gettext('Time'),
                    dataIndex: 'backup-time',
                    width: 180,
                },
                {
                    text: gettext('Size'),
                    dataIndex: 'size',
                    renderer: Proxmox.Utils.render_size,
                    flex: 1,
                },
                {
                    text: gettext('Encrypted'),
                    dataIndex: 'encrypted',
                    renderer: PMG.Utils.render_backup_encryption,
                    flex: 1,
                },
                {
                    text: gettext('Verify State'),
                    dataIndex: 'verification',
                    renderer: PMG.Utils.render_backup_verification,
                    sorter: {
                        property: 'verification',
                        transform: (value) => {
                            let state = value?.state ?? 'none';
                            let order = PMG.Utils.verificationStateOrder;
                            return order[state] ?? order.__default__;
                        },
                    },
                    flex: 1,
                },
            ],
        },
    ],
});
