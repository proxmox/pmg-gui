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
        { xtype: 'menuseparator' },
        {
            text: gettext('Mark as Seen'),
            iconCls: 'fa fa-fw fa-eye',
            action: 'mark-seen',
            handler: 'callCallback',
        },
        {
            text: gettext('Mark as Unseen'),
            iconCls: 'fa fa-fw fa-eye-slash',
            action: 'mark-unseen',
            handler: 'callCallback',
        },
        { xtype: 'menuseparator', itemId: 'copyLoginLinkSep', hidden: true },
        {
            text: gettext('Copy Login Link'),
            iconCls: 'fa fa-fw fa-link',
            action: 'copy-login-link',
            handler: 'callCallback',
            itemId: 'copyLoginLink',
            hidden: true,
        },
    ],
});
