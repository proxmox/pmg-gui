Ext.define('PMG.menu.SpamContextMenu', {
    extend: 'PMG.menu.QuarantineContextMenu',

    items: [
        {
            text: gettext('Deliver'),
            iconCls: 'fa fa-fw fa-paper-plane-o info-blue',
            action: 'deliver',
            handler: 'callCallback',
        },
        {
            text: gettext('Delete'),
            iconCls: 'fa fa-fw fa-trash-o critical',
            action: 'delete',
            handler: 'callCallback',
        },
        { xtype: 'menuseparator' },
        {
            text: gettext('Welcomelist'),
            iconCls: 'fa fa-fw fa-check',
            action: 'welcomelist',
            handler: 'callCallback',
        },
        {
            text: gettext('Blocklist'),
            iconCls: 'fa fa-fw fa-times',
            action: 'blocklist',
            handler: 'callCallback',
        },
    ],
});
