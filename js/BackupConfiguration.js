Ext.define('PMG.BackupConfiguration', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.pmgBackupConfiguration',

    title: gettext('Backup'),

    border: false,
    defaults: { border: false },

    items: [
        {
            itemId: 'local',
            title: gettext('Local Backup/Restore'),
            xtype: 'pmgBackupRestore',
            iconCls: 'fa fa-folder',
        },
        {
            itemId: 'proxmoxbackupserver',
            title: 'Proxmox Backup Server',
            xtype: 'pmgPBSConfig',
            iconCls: 'fa fa-floppy-o',
        },
    ],
});
