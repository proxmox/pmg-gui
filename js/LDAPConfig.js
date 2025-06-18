Ext.define('pmg-ldap-config', {
    extend: 'Ext.data.Model',
    fields: [
        'profile',
        'server1',
        'server2',
        'comment',
        'mode',
        'binddn',
        'bindpw',
        'basedn',
        'groupbasedn',
        'filter',
        'accountattr',
        'mailattr',
        { name: 'port', type: 'integer' },
        { name: 'gcount', type: 'integer' },
        { name: 'mcount', type: 'integer' },
        { name: 'ucount', type: 'integer' },
        { name: 'disable', type: 'boolean' },
    ],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/config/ldap',
    },
    idProperty: 'profile',
});

Ext.define('PMG.LDAPInputPanel', {
    extend: 'Proxmox.panel.InputPanel',
    alias: 'widget.pmgLDAPInputPanel',

    profileId: undefined,

    onGetValues: function (values) {
        var me = this;

        values.disable = values.enable ? 0 : 1;
        delete values.enable;

        // do not send empty password
        if (values.bindpw === '') {
            delete values.bindpw;
        }

        return values;
    },

    initComponent: function () {
        var me = this;

        me.column1 = [
            {
                xtype: me.profileId ? 'displayfield' : 'textfield',
                fieldLabel: gettext('Profile Name'),
                value: me.profileId || '',
                name: 'profile',
                vtype: 'StorageId',
                allowBlank: false,
            },
            {
                xtype: 'proxmoxKVComboBox',
                name: 'mode',
                comboItems: [
                    ['ldap', PMG.Utils.format_ldap_protocol('ldap')],
                    ['ldaps', PMG.Utils.format_ldap_protocol('ldaps')],
                    ['ldap+starttls', PMG.Utils.format_ldap_protocol('ldap+starttls')],
                ],
                value: 'ldap',
                fieldLabel: gettext('Protocol'),
                listeners: {
                    change: function (cb, value) {
                        var isldap = value === 'ldap';
                        me.down('field[name=verify]').setVisible(!isldap);
                    },
                },
            },
            {
                xtype: 'proxmoxcheckbox',
                name: 'verify',
                fieldLabel: gettext('Verify Certificate'),
                hidden: true,
                uncheckedValue: 0,
                value: 1,
                checked: 1,
            },
            {
                xtype: 'textfield',
                fieldLabel: gettext('Server'),
                allowBlank: false,
                vtype: 'DnsOrIp',
                name: 'server1',
            },
            {
                xtype: 'proxmoxtextfield',
                fieldLabel: gettext('Server'),
                allowBlank: true,
                deleteEmpty: !me.isCreate,
                vtype: 'DnsOrIp',
                name: 'server2',
            },
            {
                xtype: 'proxmoxintegerfield',
                name: 'port',
                emptyText: gettext('Default'),
                deleteEmpty: !me.isCreate,
                minValue: 1,
                maxValue: 65535,
                fieldLabel: gettext('Port'),
            },
            {
                xtype: 'textfield',
                name: 'binddn',
                allowBlank: true,
                fieldLabel: gettext('User name'),
            },
            {
                xtype: 'textfield',
                inputType: 'password',
                allowBlank: true,
                emptyText: gettext('Unchanged'),
                name: 'bindpw',
                fieldLabel: gettext('Password'),
            },
        ];

        me.column2 = [
            {
                xtype: 'proxmoxcheckbox',
                name: 'enable',
                checked: true,
                uncheckedValue: 0,
                fieldLabel: gettext('Enable'),
            },
            {
                xtype: 'proxmoxtextfield',
                allowBlank: true,
                deleteEmpty: !me.isCreate,
                name: 'basedn',
                fieldLabel: gettext('Base DN'),
            },
            {
                xtype: 'proxmoxtextfield',
                allowBlank: true,
                deleteEmpty: !me.isCreate,
                name: 'groupbasedn',
                fieldLabel: gettext('Base DN for Groups'),
            },
            {
                xtype: 'proxmoxtextfield',
                allowBlank: true,
                deleteEmpty: !me.isCreate,
                name: 'mailattr',
                fieldLabel: gettext('EMail attribute name(s)'),
            },
            {
                xtype: 'proxmoxtextfield',
                allowBlank: true,
                deleteEmpty: !me.isCreate,
                name: 'accountattr',
                fieldLabel: gettext('Account attribute name'),
            },
            {
                xtype: 'proxmoxtextfield',
                allowBlank: true,
                deleteEmpty: !me.isCreate,
                name: 'filter',
                fieldLabel: gettext('LDAP filter'),
            },
            {
                xtype: 'proxmoxtextfield',
                allowBlank: true,
                deleteEmpty: !me.isCreate,
                name: 'groupclass',
                fieldLabel: gettext('Group objectclass'),
            },
        ];

        me.columnB = [
            {
                xtype: 'textfield',
                fieldLabel: gettext('Comment'),
                allowBlank: true,
                name: 'comment',
            },
        ];

        me.callParent();
    },
});

Ext.define('PMG.LDAPEdit', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmgLDAPEdit',
    onlineHelp: 'pmgconfig_ldap',

    subject: 'LDAP Profile',
    isAdd: true,

    initComponent: function () {
        var me = this;

        me.isCreate = !me.profileId;

        if (me.isCreate) {
            me.url = '/api2/extjs/config/ldap';
            me.method = 'POST';
        } else {
            me.url = '/api2/extjs/config/ldap/' + me.profileId + '/config';
            me.method = 'PUT';
        }

        var ipanel = Ext.create('PMG.LDAPInputPanel', {
            isCreate: me.isCreate,
            profileId: me.profileId,
        });

        me.items = [ipanel];

        me.fieldDefaults = {
            labelWidth: 150,
        };

        me.callParent();

        if (!me.isCreate) {
            me.load({
                success: function (response, options) {
                    var values = response.result.data;

                    values.enable = values.disable ? 0 : 1;
                    values.verify = !!values.verify;
                    ipanel.setValues(values);
                },
            });
        }
    },
});

Ext.define('PMG.LDAPUserGrid', {
    extend: 'Ext.grid.Panel',
    xtype: 'pmgLDAPUserGrid',

    emptyText: gettext('No data in database'),
    store: {
        autoDestroy: true,
        fields: ['dn', 'account', 'pmail'],
        proxy: { type: 'proxmox' },
        sorters: ['dn'],
    },
    columns: [
        {
            text: 'DN',
            dataIndex: 'dn',
            flex: 1,
        },
        {
            text: gettext('Account'),
            dataIndex: 'account',
            flex: 1,
        },
        {
            text: gettext('Primary E-Mail'),
            dataIndex: 'pmail',
            flex: 1,
        },
    ],

    initComponent: function () {
        var me = this;
        me.callParent();
        if (me.url) {
            me.getStore().getProxy().setUrl(me.url);
            me.getStore().load();
        }
    },
});

Ext.define('PMG.LDAPConfig', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgLDAPConfig',

    controller: {
        xclass: 'Ext.app.ViewController',

        openUserList: function (grid, record) {
            var name = this.getViewModel().get('name');
            Ext.create('Ext.window.Window', {
                title: Ext.String.format(gettext("Users of '{0}'"), record.data.dn),
                modal: true,
                width: 600,
                height: 400,
                layout: 'fit',
                items: [
                    {
                        xtype: 'pmgLDAPUserGrid',
                        border: false,
                        url:
                            '/api2/json/config/ldap/' +
                            name +
                            '/groups/' +
                            encodeURIComponent(record.data.gid),
                    },
                ],
            }).show();
        },

        showUsers: function (button) {
            var me = this;
            var view = me.lookup('groupgrid');
            var record = view.getSelection()[0];
            me.openUserList(view, record);
        },

        openUserMails: function (grid, record) {
            var name = this.getViewModel().get('name');
            Ext.create('Ext.window.Window', {
                title: Ext.String.format(gettext("E-Mail addresses of '{0}'"), record.data.dn),
                modal: true,
                width: 600,
                height: 400,
                layout: 'fit',
                items: [
                    {
                        xtype: 'grid',
                        border: false,
                        store: {
                            autoLoad: true,
                            field: ['email', 'primary'],
                            proxy: {
                                type: 'proxmox',
                                url:
                                    '/api2/json/config/ldap/' +
                                    name +
                                    '/users/' +
                                    encodeURIComponent(record.data.pmail),
                            },
                        },
                        columns: [{ dataIndex: 'email', text: gettext('E-Mail address'), flex: 1 }],
                    },
                ],
            }).show();
        },

        showEmails: function (button) {
            var me = this;
            var view = me.lookup('usergrid');
            var record = view.getSelection()[0];
            me.openUserMails(view, record);
        },

        reload: function (grid) {
            var me = this;
            var selection = grid.getSelection();
            me.showInfo(grid, selection);
        },

        showInfo: function (grid, selected) {
            var me = this;
            var viewModel = me.getViewModel();
            if (selected[0]) {
                var name = selected[0].data.profile;
                viewModel.set('selected', true);
                viewModel.set('name', name);

                // set grid stores and load them
                var gstore = me.lookup('groupgrid').getStore();
                var ustore = me.lookup('usergrid').getStore();
                gstore.getProxy().setUrl('/api2/json/config/ldap/' + name + '/groups');
                ustore.getProxy().setUrl('/api2/json/config/ldap/' + name + '/users');
                gstore.load();
                ustore.load();
            } else {
                viewModel.set('selected', false);
            }
        },

        init: function (view) {
            var me = this;
            me.lookup('grid').relayEvents(view, ['activate']);
            var groupgrid = me.lookup('groupgrid');
            var usergrid = me.lookup('usergrid');

            Proxmox.Utils.monStoreErrors(groupgrid, groupgrid.getStore(), true);
            Proxmox.Utils.monStoreErrors(usergrid, usergrid.getStore(), true);
        },

        control: {
            'grid[reference=grid]': {
                selectionchange: 'showInfo',
                load: 'reload',
            },
            'grid[reference=groupgrid]': {
                itemdblclick: 'openUserList',
            },
            'grid[reference=usergrid]': {
                itemdblclick: 'openUserMails',
            },
        },
    },

    viewModel: {
        data: {
            name: '',
            selected: false,
        },
    },

    layout: 'border',

    items: [
        {
            region: 'center',
            reference: 'grid',
            xtype: 'pmgLDAPConfigGrid',
            border: false,
        },
        {
            xtype: 'tabpanel',
            reference: 'data',
            hidden: true,
            height: '50%',
            border: false,
            split: true,
            region: 'south',
            bind: {
                hidden: '{!selected}',
            },
            items: [
                {
                    xtype: 'grid',
                    reference: 'groupgrid',
                    border: false,
                    emptyText: gettext('No data in database'),
                    tbar: [
                        {
                            xtype: 'proxmoxButton',
                            text: gettext('Show Users'),
                            handler: 'showUsers',
                            disabled: true,
                        },
                    ],
                    store: {
                        fields: ['dn', 'gid'],
                        proxy: { type: 'proxmox' },
                        sorters: ['dn'],
                    },
                    bind: {
                        title: Ext.String.format(gettext("Groups of '{0}'"), '{name}'),
                    },
                    columns: [
                        {
                            text: 'DN',
                            dataIndex: 'dn',
                            flex: 1,
                        },
                    ],
                },
                {
                    xtype: 'pmgLDAPUserGrid',
                    reference: 'usergrid',
                    border: false,
                    tbar: [
                        {
                            xtype: 'proxmoxButton',
                            text: gettext('Show E-Mail addresses'),
                            handler: 'showEmails',
                            disabled: true,
                        },
                    ],
                    bind: {
                        title: Ext.String.format(gettext("Users of '{0}'"), '{name}'),
                    },
                },
            ],
        },
    ],
});

Ext.define('PMG.LDAPConfigGrid', {
    extend: 'Ext.grid.GridPanel',
    alias: 'widget.pmgLDAPConfigGrid',

    controller: {
        xclass: 'Ext.app.ViewController',

        run_editor: function () {
            var me = this;
            var view = me.getView();
            var rec = view.getSelection()[0];
            if (!rec) {
                return;
            }

            var win = Ext.createWidget('pmgLDAPEdit', {
                profileId: rec.data.profile,
            });
            win.on('destroy', me.reload, me);
            win.load();
            win.show();
        },

        newProfile: function () {
            var me = this;
            var win = Ext.createWidget('pmgLDAPEdit', {});
            win.on('destroy', me.reload, me);
            win.show();
        },

        reload: function () {
            let view = this.getView();
            view.getStore().load();
            view.fireEvent('load', view);
        },

        sync: function () {
            var me = this;
            var view = me.getView();
            var rec = view.getSelection()[0];
            Proxmox.Utils.API2Request({
                url: '/config/ldap/' + rec.data.profile + '/sync',
                method: 'POST',
                waitMsgTarget: view,
                callback: function () {
                    me.reload();
                },
                failure: function (response, opts) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
            });
        },

        init: function (view) {
            var me = this;
            Proxmox.Utils.monStoreErrors(view, view.getStore(), true);
        },
    },

    store: {
        model: 'pmg-ldap-config',
        sorters: [
            {
                property: 'profile',
                direction: 'ASC',
            },
        ],
    },

    tbar: [
        {
            text: gettext('Create'),
            handler: 'newProfile',
        },
        '-',
        {
            xtype: 'proxmoxButton',
            text: gettext('Edit'),
            disabled: true,
            handler: 'run_editor',
        },
        {
            xtype: 'proxmoxStdRemoveButton',
            baseurl: '/config/ldap',
            callback: 'reload',
        },
        '-',
        {
            xtype: 'proxmoxButton',
            text: gettext('Synchronize'),
            enableFn: function (rec) {
                return !rec.data.disable;
            },
            disabled: true,
            handler: 'sync',
        },
    ],

    listeners: {
        itemdblclick: 'run_editor',
        activate: 'reload',
    },

    columns: [
        {
            header: gettext('Profile Name'),
            sortable: true,
            width: 120,
            dataIndex: 'profile',
        },
        {
            header: gettext('Protocol'),
            sortable: true,
            dataIndex: 'mode',
            renderer: PMG.Utils.format_ldap_protocol,
        },
        {
            header: gettext('Server'),
            sortable: true,
            dataIndex: 'server1',
            renderer: function (value, metaData, rec) {
                if (rec.data.server2) {
                    return value + '<br>' + rec.data.server2;
                }
                return value;
            },
        },
        {
            header: gettext('Enabled'),
            width: 80,
            sortable: true,
            dataIndex: 'disable',
            renderer: Proxmox.Utils.format_neg_boolean,
        },
        {
            header: gettext('Comment'),
            sortable: false,
            renderer: Ext.String.htmlEncode,
            dataIndex: 'comment',
            flex: 1,
        },
        {
            header: gettext('Accounts'),
            width: 80,
            sortable: true,
            dataIndex: 'ucount',
        },
        {
            header: gettext('Addresses'),
            width: 80,
            sortable: true,
            dataIndex: 'mcount',
        },
        {
            header: gettext('Groups'),
            width: 80,
            sortable: true,
            dataIndex: 'gcount',
        },
    ],
});
