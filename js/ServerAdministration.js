Ext.define('PMG.ServerAdministration', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.pmgServerAdministration',

    title: gettext('Server Administration'),

    border: false,
    defaults: { border: false },

    controller: {
        xclass: 'Ext.app.ViewController',

        init: function (view) {
            var upgradeBtn = view.lookupReference('upgradeBtn');
            upgradeBtn.setDisabled(!(Proxmox.UserName && Proxmox.UserName === 'root@pam'));
        },
    },

    items: [
        {
            xtype: 'pmgServerStatus',
            itemId: 'status',
            iconCls: 'fa fa-area-chart',
        },
        {
            xtype: 'proxmoxNodeServiceView',
            title: gettext('Services'),
            itemId: 'services',
            iconCls: 'fa fa-cogs',
            startOnlyServices: {
                syslog: true,
                pmgproxy: true,
                pmgdaemon: true,
            },
            nodename: Proxmox.NodeName,
        },
        {
            xtype: 'proxmoxNodeAPT',
            title: gettext('Updates'),
            iconCls: 'fa fa-refresh',
            upgradeBtn: {
                xtype: 'button',
                reference: 'upgradeBtn',
                disabled: true,
                text: gettext('Upgrade'),
                handler: function () {
                    Proxmox.Utils.openXtermJsViewer('upgrade', 0, Proxmox.NodeName);
                },
            },
            itemId: 'updates',
            nodename: Proxmox.NodeName,
        },
        {
            xtype: 'proxmoxNodeAPTRepositories',
            title: gettext('Repositories'),
            iconCls: 'fa fa-files-o',
            itemId: 'aptrepositories',
            nodename: 'localhost',
            product: 'Proxmox Mail Gateway',
            onlineHelp: 'pmg_package_repositories',
        },
        {
            xtype: 'proxmoxJournalView',
            itemId: 'logs',
            iconCls: 'fa fa-list',
            title: gettext('Syslog'),
            url: '/api2/extjs/nodes/' + Proxmox.NodeName + '/journal',
        },
        {
            xtype: 'proxmoxNodeTasks',
            itemId: 'tasks',
            iconCls: 'fa fa-list-alt',
            title: gettext('Tasks'),
            height: 'auto',
            nodename: Proxmox.NodeName,
        },
    ],
});
