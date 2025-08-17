Ext.define('PMG.store.NavigationStore', {
    extend: 'Ext.data.TreeStore',

    storeId: 'NavigationStore',

    root: {
        expanded: true,
        children: [
            {
                text: gettext('Dashboard'),
                iconCls: 'fa fa-tachometer',
                path: 'pmgDashboard',
                leaf: true,
            },
            {
                text: gettext('Mail Filter'),
                iconCls: 'fa fa-envelope',
                path: 'pmgRuleConfiguration',
                expanded: true,
                children: [
                    {
                        text: gettext('Action Objects'),
                        iconCls: 'fa fa-flag',
                        path: 'pmgActionList',
                        leaf: true,
                    },
                    {
                        text: gettext('Who Objects'),
                        iconCls: 'fa fa-user-circle',
                        path: 'pmgWhoConfiguration',
                        leaf: true,
                    },
                    {
                        text: gettext('What Objects'),
                        iconCls: 'fa fa-cube',
                        path: 'pmgWhatConfiguration',
                        leaf: true,
                    },
                    {
                        text: gettext('When Objects'),
                        iconCls: 'fa fa-clock-o',
                        path: 'pmgWhenConfiguration',
                        leaf: true,
                    },
                ],
            },
            {
                text: gettext('Configuration'),
                iconCls: 'fa fa-gears',
                path: 'pmgSystemConfiguration',
                expanded: true,
                children: [
                    {
                        text: gettext('Mail Proxy'),
                        iconCls: 'fa fa-envelope-o',
                        path: 'pmgMailProxyConfiguration',
                        leaf: true,
                    },
                    {
                        text: gettext('Spam Detector'),
                        iconCls: 'fa fa-bullhorn',
                        path: 'pmgSpamDetectorConfiguration',
                        leaf: true,
                    },
                    {
                        text: gettext('Virus Detector'),
                        iconCls: 'fa fa-bug',
                        path: 'pmgVirusDetectorConfiguration',
                        leaf: true,
                    },
                    {
                        text: gettext('User Management'),
                        iconCls: 'fa fa-users',
                        path: 'pmgUserManagement',
                        leaf: true,
                    },
                    {
                        text: gettext('Cluster'),
                        iconCls: 'fa fa-server',
                        path: 'pmgClusterAdministration',
                        leaf: true,
                    },
                    {
                        text: gettext('Subscription'),
                        iconCls: 'fa fa-support',
                        path: 'pmgSubscription',
                        leaf: true,
                    },
                    {
                        text: gettext('Backup/Restore'),
                        iconCls: 'fa fa-floppy-o',
                        path: 'pmgBackupConfiguration',
                        leaf: true,
                    },
                    {
                        text: gettext('Certificates'),
                        iconCls: 'fa fa-certificate',
                        path: 'pmgCertificateConfiguration',
                        leaf: true,
                    },
                ],
            },
            {
                text: gettext('Administration'),
                iconCls: 'fa fa-wrench',
                path: 'pmgServerAdministration',
                expanded: true,
                children: [
                    {
                        text: gettext('Spam Quarantine'),
                        iconCls: 'fa fa-bullhorn',
                        path: 'pmgSpamQuarantine',
                        leaf: true,
                    },
                    {
                        text: gettext('Virus Quarantine'),
                        iconCls: 'fa fa-bug',
                        path: 'pmgVirusQuarantine',
                        leaf: true,
                    },
                    {
                        text: gettext('Attachment Quarantine'),
                        iconCls: 'fa fa-paperclip',
                        path: 'pmgAttachmentQuarantine',
                        leaf: true,
                    },
                    {
                        text: gettext('User Welcomelist'),
                        iconCls: 'fa fa-file-o',
                        path: 'pmgUserWelcomelist',
                        leaf: true,
                    },
                    {
                        text: gettext('User Blocklist'),
                        iconCls: 'fa fa-file',
                        path: 'pmgUserBlocklist',
                        leaf: true,
                    },
                    {
                        text: gettext('Tracking Center'),
                        iconCls: 'fa fa-map-o',
                        path: 'pmgMailTracker',
                        leaf: true,
                    },
                    {
                        text: gettext('Queues'),
                        iconCls: 'fa fa-bars',
                        path: 'pmgQueueAdministration',
                        leaf: true,
                    },
                ],
            },
            {
                text: gettext('Statistics'),
                iconCls: 'fa fa-bar-chart',
                path: 'pmgGeneralMailStatistics',
                expanded: true,
                children: [
                    {
                        text: gettext('Spam Scores'),
                        iconCls: 'fa fa-table',
                        path: 'pmgSpamScoreDistribution',
                        leaf: true,
                    },
                    {
                        text: gettext('Virus Charts'),
                        iconCls: 'fa fa-bug',
                        path: 'pmgVirusCharts',
                        leaf: true,
                    },
                    {
                        text: gettext('Hourly Distribution'),
                        iconCls: 'fa fa-area-chart',
                        path: 'pmgHourlyMailDistribution',
                        leaf: true,
                    },
                    {
                        text: gettext('Postscreen'),
                        iconCls: 'fa fa-line-chart',
                        path: 'pmgRBLStatistics',
                        leaf: true,
                    },
                    {
                        text: gettext('Domain'),
                        iconCls: 'fa fa-table',
                        path: 'pmgDomainStatistics',
                        leaf: true,
                    },
                    {
                        text: gettext('Sender'),
                        iconCls: 'fa fa-table',
                        path: 'pmgSenderStatistics',
                        leaf: true,
                    },
                    {
                        text: gettext('Receiver'),
                        iconCls: 'fa fa-table',
                        path: 'pmgReceiverStatistics',
                        leaf: true,
                    },
                    {
                        text: gettext('Contact'),
                        iconCls: 'fa fa-table',
                        path: 'pmgContactStatistics',
                        leaf: true,
                    },
                ],
            },
        ],
    },
});

Ext.define('PMG.view.main.NavigationTree', {
    extend: 'Ext.list.Tree',
    xtype: 'navigationtree',

    select: function (path) {
        var me = this;
        var item = me.getStore().findRecord('path', path, 0, false, true, true);
        me.setSelection(item);
    },

    animation: false,
    expanderOnly: true,
    expanderFirst: false,
    store: 'NavigationStore',
    ui: 'pve-nav',
});
