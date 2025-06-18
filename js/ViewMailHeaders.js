Ext.define('PMG.ViewMailHeaders', {
    extend: 'Ext.window.Window',
    alias: 'widget.pmgViewMailHeaders',

    url: undefined,

    width: 600,

    height: 400,

    bodyPadding: 10,

    modal: true,

    layout: {
        type: 'vbox',
        align: 'stretch',
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        toggleRaw: function (field, newValue) {
            let me = this;
            let view = me.getView();
            view.raw = !newValue;
            me.loadData(view.url);
        },

        setData: function (data) {
            let view = this.getView();
            let panel = view.lookupReference('contentPanel');
            let from = data.match(/^FROM:\s*(.*\S)\s*$/im);
            if (from) {
                view.lookupReference('fromField').setValue(from[1]);
            }
            let to = data.match(/^TO:\s*(.*\S)\s*$/im);
            if (to) {
                view.lookupReference('toField').setValue(to[1]);
            }
            let subject = data.match(/^SUBJECT:\s*(.*\S)\s*$/im);
            if (subject) {
                view.lookupReference('subjectField').setValue(subject[1]);
            }
            panel.update(Ext.String.htmlEncode(data));
        },

        loadData: function (url) {
            let me = this;
            let view = me.getView();
            if (!view.raw) {
                url += '?decode-header=1';
            }
            Proxmox.Utils.API2Request({
                url,
                waitMsgTarget: view,
                method: 'GET',
                success: (response) => me.setData(response.result.data),
                failure: function (response, opts) {
                    view.destroy();
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
            });
        },

        init: function (view) {
            let me = this;
            me.loadData(view.url);
        },
    },

    items: [
        {
            xtype: 'textfield',
            fieldLabel: gettext('From'),
            reference: 'fromField',
            focusable: false,
            exitable: false,
        },
        {
            xtype: 'textfield',
            fieldLabel: gettext('To'),
            reference: 'toField',
            focusable: false,
            exitable: false,
        },
        {
            xtype: 'textfield',
            fieldLabel: gettext('Subject'),
            reference: 'subjectField',
            focusable: false,
            exitable: false,
        },
        {
            xtype: 'container',
            layout: 'hbox',
            items: [
                {
                    xtype: 'displayfield',
                    fieldLabel: gettext('Header'),
                    flex: 1,
                },
                {
                    xtype: 'checkbox',
                    reference: 'raw',
                    boxLabel: gettext('Decode'),
                    value: true,
                    iconCls: 'fa fa-file-code-o',
                    handler: 'toggleRaw',
                },
            ],
        },
        {
            xtype: 'panel',
            bodyPadding: 5,
            reference: 'contentPanel',
            flex: 1,
            autoScroll: true,
            bodyStyle: 'white-space:pre',
        },
    ],
});
