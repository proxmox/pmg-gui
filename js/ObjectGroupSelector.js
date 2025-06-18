Ext.define('PMG.ObjectGroupSelector', {
    extend: 'Ext.window.Window',
    alias: 'widget.pmgObjectGroupSelector',

    width: 600,
    layout: 'auto',
    modal: true,
    bodyPadding: 5,

    rulegroup: undefined,

    initComponent: function () {
        var me = this;

        if (!me.rulegroup) {
            throw 'undefined rulegroup';
        }

        var ogclass;

        if (me.rulegroup === 'from') {
            ogclass = 'who';
            me.title = gettext('From');
        } else if (me.rulegroup === 'to') {
            ogclass = 'who';
            me.title = gettext('To');
        } else if (me.rulegroup === 'when') {
            ogclass = 'when';
            me.title = gettext('When');
        } else if (me.rulegroup === 'what') {
            ogclass = 'what';
            me.title = gettext('What');
        } else if (me.rulegroup === 'action') {
            ogclass = 'action';
            me.title = gettext('Action');
        } else {
            throw 'unknown rulegroup';
        }

        if (me.rulegroup === 'action') {
            me.items = {
                xtype: 'pmgActionList',
                title: undefined,
                enableButtons: false,
                border: true,
                listeners: {
                    itemdblclick: function (view, rec) {
                        me.fireEvent('selectObjectGroup', me, rec);
                    },
                },
            };
        } else {
            me.items = {
                xtype: 'pmgObjectGroupList',
                enableButtons: false,
                ogclass: ogclass,
                listeners: {
                    itemdblclick: function (view, rec) {
                        me.fireEvent('selectObjectGroup', me, rec);
                    },
                },
            };
        }

        me.callParent();
    },
});
