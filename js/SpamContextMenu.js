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
            text: gettext('Whitelist'),
            iconCls: 'fa fa-fw fa-check',
            action: 'whitelist',
            handler: 'callCallback',
        },
        {
            text: gettext('Blacklist'),
            iconCls: 'fa fa-fw fa-times',
            action: 'blacklist',
            handler: 'callCallback',
        },
    ],
});
