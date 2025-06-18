Ext.define('PMG.menu.QuarantineContextMenu', {
    extend: 'Ext.menu.Menu',
    xtype: 'pmgQuarantineMenu',

    showSeparator: false,

    controller: {
        xclass: 'Ext.app.ViewController',
        callCallback: function (btn) {
            let view = this.getView();
            if (Ext.isFunction(view.callback)) {
                view.callback(btn.action);
            }
        },
    },

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
    ],
});
