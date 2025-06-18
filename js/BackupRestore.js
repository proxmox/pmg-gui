Ext.define('pmg-backup-list', {
    extend: 'Ext.data.Model',
    fields: [
        'filename',
        { type: 'integer', name: 'size' },
        { type: 'date', dateFormat: 'timestamp', name: 'timestamp' },
    ],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/nodes/' + Proxmox.NodeName + '/backup',
    },
    idProperty: 'filename',
});

Ext.define('PMG.RestoreWindow', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmgRestoreWindow',
    onlineHelp: 'chapter_pmgbackup',

    showProgress: true,
    title: gettext('Restore'),
    isCreate: true,
    method: 'POST',
    submitText: gettext('Restore'),
    fieldDefaults: {
        labelWidth: 150,
    },

    initComponent: function () {
        let me = this;

        me.items = [
            {
                xtype: 'proxmoxcheckbox',
                name: 'config',
                fieldLabel: gettext('System Configuration'),
            },
            {
                xtype: 'proxmoxcheckbox',
                name: 'database',
                value: 1,
                uncheckedValue: 0,
                fieldLabel: gettext('Rule Database'),
                listeners: {
                    change: function (field, value) {
                        field.nextSibling('field[name=statistic]').setDisabled(!value);
                    },
                },
            },
            {
                xtype: 'proxmoxcheckbox',
                name: 'statistic',
                fieldLabel: gettext('Statistic'),
            },
        ];

        let restorePath;
        if (me.filename) {
            restorePath = `backup/${encodeURIComponent(me.filename)}`;
        } else if (me.backup_time) {
            restorePath = `pbs/${me.remote}/snapshot/${me.backup_id}/${me.backup_time}`;
        } else {
            throw 'neither filename nor snapshot given';
        }
        me.url = `/nodes/${Proxmox.NodeName}/${restorePath}`;

        me.callParent();
    },
});

Ext.define('PMG.BackupWindow', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmgBackupWindow',
    onlineHelp: 'chapter_pmgbackup',

    showProgress: true,
    title: gettext('Backup'),
    isCreate: true,
    method: 'POST',
    submitText: gettext('Backup'),
    fieldDefaults: {
        labelWidth: 150,
    },
    showTaskViewer: true,
    items: [
        {
            xtype: 'proxmoxcheckbox',
            name: 'statistic',
            value: 1,
            uncheckedValue: 0,
            fieldLabel: gettext('Include Statistics'),
        },
    ],
});

Ext.define('PMG.BackupRestore', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'pmgBackupRestore',

    title: gettext('Backup') + '/' + gettext('Restore'),

    controller: {
        xclass: 'Ext.app.ViewController',

        createBackup: function () {
            let view = this.getView();
            Ext.create('PMG.BackupWindow', {
                url: '/nodes/' + Proxmox.NodeName + '/backup',
                taskDone: () => view.store.load(),
            }).show();
        },

        onRestore: function () {
            let view = this.getView();
            let rec = view.getSelection()[0];

            if (!(rec && rec.data && rec.data.filename)) {
                return;
            }

            Ext.create('PMG.RestoreWindow', {
                filename: rec.data.filename,
            }).show();
        },

        onAfterRemove: function (btn, res) {
            let view = this.getView();
            view.store.load();
        },
    },

    tbar: [
        {
            text: gettext('Backup Now'),
            handler: 'createBackup',
        },
        '-',
        {
            xtype: 'proxmoxButton',
            text: gettext('Restore'),
            handler: 'onRestore',
            disabled: true,
        },
        {
            xtype: 'proxmoxStdRemoveButton',
            baseurl: '/nodes/' + Proxmox.NodeName + '/backup',
            reference: 'removeBtn',
            callback: 'onAfterRemove',
            waitMsgTarget: true,
        },
    ],

    store: {
        autoLoad: true,
        model: 'pmg-backup-list',
        sorters: [
            {
                property: 'timestamp',
                direction: 'DESC',
            },
        ],
    },

    columns: [
        {
            header: gettext('Filename'),
            width: 300,
            sortable: true,
            renderer: Ext.htmlEncode,
            dataIndex: 'filename',
        },
        {
            xtype: 'datecolumn',
            header: gettext('Time'),
            width: 150,
            format: 'Y-m-d H:i',
            sortable: true,
            dataIndex: 'timestamp',
        },
        {
            header: gettext('Size'),
            width: 100,
            sortable: true,
            renderer: Proxmox.Utils.render_size,
            dataIndex: 'size',
        },
        {
            header: gettext('Download'),
            renderer: function (filename) {
                return (
                    "<a class='download' href='" +
                    '/api2/json/nodes/' +
                    Proxmox.NodeName +
                    '/backup/' +
                    encodeURIComponent(filename) +
                    "'><i class='fa fa-fw fa-download'</i></a>"
                );
            },
            dataIndex: 'filename',
        },
    ],
});
