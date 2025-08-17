Ext.define('pmg-address-list', {
    extend: 'Ext.data.Model',
    fields: ['address'],
    idProperty: 'address',
});

// base class - do not use directly
Ext.define('PMG.UserBlockWelcomeList', {
    extend: 'Ext.grid.GridPanel',

    border: false,
    listname: undefined, // 'blocklist' or 'welcomelist',

    selModel: 'checkboxmodel',

    emptyText: gettext('No data in database'),

    controller: {
        xclass: 'Ext.app.ViewController',

        onAddAddress: function () {
            let view = this.getView();
            let params = view.getStore().getProxy().getExtraParams() || {};

            let url = '/quarantine/' + view.listname;

            let items = [
                {
                    xtype: 'proxmoxtextfield',
                    name: 'address',
                    minLength: 3,
                    regex: /^[^,;\s]*$/, // no whitespace no , and no ;
                    fieldLabel: gettext('Address'),
                },
            ];

            Ext.Object.each(params, function (key, value) {
                items.push({
                    xtype: 'hidden',
                    name: key,
                    value: value,
                });
            });

            let config = {
                method: 'POST',
                url: url,
                onlineHelp: 'pmg_userblockwelcomelist',
                isCreate: true,
                isAdd: true,
                items: items,
            };

            if (view.listname === 'blocklist') {
                config.subject = gettext('Blocklist');
            } else if (view.listname === 'welcomelist') {
                config.subject = gettext('Welcomelist');
            } else {
                throw 'unknown list - internal error';
            }

            let win = Ext.createWidget('proxmoxWindowEdit', config);
            win.on('destroy', function () {
                view.store.load();
            });
            win.show();
        },

        onRemoveAddress: function () {
            let view = this.getView();
            let records = view.selModel.getSelection();
            if (records.length < 1) {
                return;
            }

            let url = '/quarantine/' + view.listname + '/';

            let params = {
                address: records.map((rec) => rec.getId()).join(','),
            };
            Ext.applyIf(params, view.getStore().getProxy().getExtraParams());

            Proxmox.Utils.API2Request({
                url: url + '?' + Ext.Object.toQueryString(params),
                method: 'DELETE',
                waitMsgTarget: view,
                callback: function (options, success, response) {
                    view.store.load();
                },
                failure: function (response, opts) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
            });
        },

        changeEmail: function (combobox, value) {
            let view = this.getView();
            if (value && combobox.isValid()) {
                view.getStore().getProxy().setExtraParams({
                    pmail: value,
                });
                view.getStore().load();
            }
        },

        init: function (view) {
            let emailcb = this.lookupReference('email');
            if (PMG.view === 'quarantineview') {
                emailcb.setVisible(false);
                view.getStore().load();
            } else {
                emailcb
                    .getStore()
                    .getProxy()
                    .setExtraParams({
                        list: view.listname === 'blocklist' ? 'BL' : 'WL',
                    });
            }
            Proxmox.Utils.monStoreErrors(view.getView(), view.getStore(), true);
        },

        control: {
            combobox: {
                change: {
                    fn: 'changeEmail',
                    buffer: 500,
                },
            },
        },
    },

    tbar: [
        {
            xtype: 'combobox',
            displayField: 'mail',
            vtype: 'PMGMail',
            allowBlank: false,
            valueField: 'mail',
            store: {
                proxy: {
                    type: 'proxmox',
                    url: '/api2/json/quarantine/quarusers',
                },
                fields: [
                    {
                        name: 'mail',
                        renderer: Ext.htmlEncode,
                    },
                ],
            },
            queryParam: false,
            queryCaching: false,
            editable: true,
            reference: 'email',
            name: 'email',
            listConfig: {
                emptyText: '<div class="x-grid-empty">' + gettext('No data in database') + '</div>',
            },
            fieldLabel: gettext('E-Mail'),
        },
        {
            text: gettext('Add'),
            handler: 'onAddAddress',
        },
        {
            xtype: 'proxmoxButton',
            text: gettext('Remove'),
            disabled: true,
            handler: 'onRemoveAddress',
            confirmMsg: function () {
                let view = this.up('gridpanel');

                let selection = view.selModel.getSelection();
                let text, param;
                if (selection.length > 1) {
                    text = gettext('Are you sure you want to remove {0} entries');
                    param = selection.length.toString();
                } else if (selection.length > 0) {
                    let rec = selection[0];
                    let name = rec.getId();
                    text = gettext('Are you sure you want to remove entry {0}');
                    param = "'" + Ext.String.htmlEncode(name) + "'";
                }

                if (text && param) {
                    return Ext.String.format(text, param);
                }
                return false;
            },
        },
    ],

    columns: [
        {
            header: gettext('Address'),
            dataIndex: 'address',
            renderer: Ext.String.htmlEncode,
            flex: 1,
        },
    ],
});

Ext.define('PMG.UserBlocklist', {
    extend: 'PMG.UserBlockWelcomeList',
    xtype: 'pmgUserBlocklist',

    title: gettext('Blocklist'),

    listname: 'blocklist',

    store: {
        model: 'pmg-address-list',
        autoDestroy: true,
        proxy: {
            type: 'proxmox',
            url: '/api2/json/quarantine/blocklist',
        },
        sorters: {
            property: 'address',
        },
    },

    dockedItems: [
        {
            dock: 'top',
            bodyStyle: {
                padding: '10px',
                'border-left': '0px',
                'border-right': '0px',
            },
            html:
                gettext(
                    'With this feature, you can manually mark E-mails from certain domains or addresses as spam.',
                ) +
                `<br><br>
		<b>*.com</b> (all mails from <b>.com</b> domains)<br>
		<b>*@example.com</b> (all mails from domain <b>example.com</b>)<br>
		<b>john@example.com</b> (all mails from <b>john@example.com</b>)`,
        },
    ],
});

Ext.define('PMG.UserWelcomelist', {
    extend: 'PMG.UserBlockWelcomeList',
    xtype: 'pmgUserWelcomelist',

    title: gettext('Welcomelist'),

    listname: 'welcomelist',

    store: {
        model: 'pmg-address-list',
        autoDestroy: true,
        proxy: {
            type: 'proxmox',
            url: '/api2/json/quarantine/welcomelist',
        },
        sorters: {
            property: 'address',
        },
    },

    dockedItems: [
        {
            dock: 'top',
            bodyStyle: {
                padding: '10px',
                'border-left': '0px',
                'border-right': '0px',
            },
            html:
                gettext(
                    'With this feature, you can manually bypass spam checking for certain domains or E-mail addresses.',
                ) +
                `<br><br>
		<b>*.com</b> (all mails from <b>.com</b> domains)<br>
		<b>*@example.com</b> (all mails from domain <b>example.com</b>)<br>
		<b>john@example.com</b> (all mails from <b>john@example.com</b>)`,
        },
    ],
});
