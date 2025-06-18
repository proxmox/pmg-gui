Ext.define('PMG.SystemConfiguration', {
    extend: 'Ext.tab.Panel',
    xtype: 'pmgSystemConfiguration',

    title: gettext('Configuration') + ': ' + gettext('System'),
    border: false,
    scrollable: true,
    defaults: { border: false },
    items: [
        {
            title: gettext('Network/Time'),
            itemId: 'network',
            iconCls: 'fa fa-exchange',
            xtype: 'panel',
            layout: {
                type: 'vbox',
                align: 'stretch',
                multi: true,
            },
            bodyPadding: '0 0 10 0',
            defaults: {
                collapsible: true,
                animCollapse: false,
                margin: '10 10 0 10',
            },
            items: [
                {
                    title: gettext('Time'),
                    xtype: 'proxmoxNodeTimeView',
                    nodename: Proxmox.NodeName,
                },
                {
                    title: gettext('DNS'),
                    xtype: 'proxmoxNodeDNSView',
                    nodename: Proxmox.NodeName,
                },
                {
                    flex: 1,
                    minHeight: 200,
                    title: gettext('Interfaces'),
                    xtype: 'proxmoxNodeNetworkView',
                    types: ['bond'],
                    nodename: Proxmox.NodeName,
                    showApplyBtn: true,
                },
            ],
        },
        {
            xtype: 'pmgSystemOptions',
            itemId: 'options',
            title: gettext('Options'),
            iconCls: 'fa fa-cogs',
        },
    ],

    initComponent: function () {
        var me = this;

        me.callParent();

        var networktime = me.getComponent('network');
        Ext.Array.forEach(networktime.query(), function (item) {
            item.relayEvents(networktime, ['activate', 'deactivate', 'destroy']);
        });
    },
});
