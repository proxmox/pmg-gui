Ext.define('PMG.RegexTester', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.pmgRegexTester',

    // the field reference which holds the regex value
    // has to be a sibling of the RegexTester component
    regexFieldReference: undefined,

    // if true, wraps the regex with ^ and $
    wholeMatch: false,

    layout: 'hbox',
    submitValue: false,

    items: [
        {
            xtype: 'textfield',
            submitValue: false,
            name: 'teststring',
            isDirty: () => false,
            reset: Ext.emptyFn,
            flex: 1,
        },
        {
            margin: '0 0 0 5',
            xtype: 'button',
            text: 'Test',
            handler: function (btn) {
                let view = this.up();
                let regexField = view.up().child(`field[reference=${view.regexFieldReference}]`);

                let regex = regexField.getValue();
                if (view.wholeMatch) {
                    regex = `^${regex}$`;
                }

                Proxmox.Utils.API2Request({
                    url: '/api2/extjs/config/regextest',
                    waitMsgTarget: view.up('window'),
                    params: {
                        regex: regex,
                        text: view.down('textfield[name=teststring]').getValue(),
                    },
                    method: 'POST',
                    success: function (response) {
                        let elapsed = response.result.data;
                        Ext.Msg.show({
                            title: gettext('Success'),
                            message: gettext('OK') + ` (elapsed time: ${elapsed}ms)`,
                            buttons: Ext.Msg.OK,
                            icon: Ext.MessageBox.INFO,
                        });
                    },
                    failure: function (response, opts) {
                        Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                    },
                });
            },
        },
    ],

    initComponent: function () {
        let me = this;

        if (!me.regexFieldReference) {
            throw 'No regex field reference given';
        }

        me.callParent();
    },
});
