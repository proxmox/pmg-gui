Ext.define('pmg-users', {
    extend: 'Ext.data.Model',
    fields: [
        'userid',
        'firstname',
        'lastname',
        'email',
        'comment',
        'role',
        'keys',
        'realm',
        'totp-lock',
        { type: 'boolean', name: 'enable' },
        { type: 'date', dateFormat: 'timestamp', name: 'expire' },
    ],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/access/users',
    },
    idProperty: 'userid',
});

Ext.define('PMG.UserView', {
    extend: 'Ext.grid.GridPanel',
    alias: 'widget.pmgUserView',

    store: {
        autoLoad: true,
        model: 'pmg-users',
        sorters: [
            {
                property: 'realm',
                direction: 'ASC',
            },
            {
                property: 'userid',
                direction: 'ASC',
            },
        ],
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        init: function (view) {
            Proxmox.Utils.monStoreErrors(view, view.store);
        },

        renderUsername: function (userid) {
            return Ext.htmlEncode(userid.match(/^(.+)(@[^@]+)$/)[1]);
        },

        renderFullName: function (firstname, metaData, record) {
            var first = firstname || '';
            var last = record.data.lastname || '';
            return Ext.htmlEncode(first + ' ' + last);
        },

        onAdd: function () {
            var view = this.getView();

            var win = Ext.create('PMG.UserEdit', {});
            win.on('destroy', function () {
                view.reload();
            });
            win.show();
        },

        onEdit: function () {
            var view = this.getView();

            var rec = view.selModel.getSelection()[0];

            var win = Ext.create('PMG.UserEdit', {
                userid: rec.data.userid,
            });
            win.on('destroy', function () {
                view.reload();
            });
            win.show();
        },

        onPassword: function (btn, event, rec) {
            var view = this.getView();

            var win = Ext.create('Proxmox.window.PasswordEdit', {
                userid: rec.data.userid,
            });
            win.on('destroy', function () {
                view.reload();
            });
            win.show();
        },

        onAfterRemove: function (btn, res) {
            var view = this.getView();
            view.reload();
        },

        onUnlockTfa: function (btn, event, rec) {
            let me = this;
            let view = me.getView();
            Ext.Msg.confirm(
                Ext.String.format(gettext('Unlock TFA authentication for {0}'), rec.data.userid),
                gettext(
                    "Locked 2nd factors can happen if the user's password was leaked. Are you sure you want to unlock the user?",
                ),
                function (btn_response) {
                    if (btn_response === 'yes') {
                        Proxmox.Utils.API2Request({
                            url: `/access/users/${rec.data.userid}/unlock-tfa`,
                            waitMsgTarget: view,
                            method: 'PUT',
                            failure: function (response, options) {
                                Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                            },
                            success: function (response, options) {
                                view.reload();
                            },
                        });
                    }
                },
            );
        },
    },

    listeners: {
        scope: 'controller',
        itemdblclick: 'onEdit',
    },

    tbar: [
        {
            text: gettext('Add'),
            reference: 'addBtn',
            handler: 'onAdd',
        },
        '-',
        {
            xtype: 'proxmoxButton',
            text: gettext('Edit'),
            disabled: true,
            handler: 'onEdit',
        },
        {
            xtype: 'proxmoxStdRemoveButton',
            baseurl: '/access/users',
            reference: 'removeBtn',
            callback: 'onAfterRemove',
            waitMsgTarget: true,
        },
        {
            xtype: 'proxmoxButton',
            text: gettext('Password'),
            disabled: true,
            handler: 'onPassword',
        },
        '-',
        {
            xtype: 'proxmoxButton',
            text: gettext('Unlock TFA'),
            handler: 'onUnlockTfa',
            disabled: true,
            enableFn: ({ data }) =>
                data['totp-locked'] || data['tfa-locked-until'] > new Date().getTime() / 1000,
        },
    ],

    columns: [
        {
            header: gettext('User name'),
            width: 200,
            sortable: true,
            renderer: 'renderUsername',
            dataIndex: 'userid',
        },
        {
            header: gettext('Realm'),
            width: 100,
            sortable: true,
            dataIndex: 'realm',
        },
        {
            header: gettext('Role'),
            width: 150,
            sortable: true,
            renderer: PMG.Utils.format_user_role,
            dataIndex: 'role',
        },
        {
            header: gettext('Enabled'),
            width: 80,
            sortable: true,
            renderer: Proxmox.Utils.format_boolean,
            dataIndex: 'enable',
        },
        {
            header: gettext('Expire'),
            width: 80,
            sortable: true,
            renderer: Proxmox.Utils.format_expire,
            dataIndex: 'expire',
        },
        {
            header: gettext('Name'),
            width: 150,
            sortable: true,
            renderer: 'renderFullName',
            dataIndex: 'firstname',
        },
        {
            header: gettext('TFA Lock'),
            width: 120,
            sortable: true,
            dataIndex: 'totp-locked',
            renderer: function (v, metaData, record) {
                let locked_until = record.data['tfa-locked-until'];
                if (locked_until !== undefined) {
                    let now = new Date().getTime() / 1000;
                    if (locked_until > now) {
                        return gettext('Locked');
                    }
                }

                if (record.data['totp-locked']) {
                    return gettext('TOTP Locked');
                }

                return Proxmox.Utils.noText;
            },
        },
        {
            header: gettext('Comment'),
            sortable: false,
            renderer: Ext.String.htmlEncode,
            dataIndex: 'comment',
            flex: 1,
        },
    ],

    reload: function () {
        var me = this;

        me.store.load();
    },
});
