Ext.define('PMG.UserEdit', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmgUserEdit',
    mixins: ['Proxmox.Mixin.CBind'],
    onlineHelp: 'pmgconfig_localuser',

    userid: undefined,

    isAdd: true,

    subject: gettext('User'),

    fieldDefaults: { labelWidth: 120 },

    cbindData: function (initialConfig) {
        var me = this;

        var userid = initialConfig.userid;
        var baseurl = '/api2/extjs/access/users';

        me.isCreate = !userid;
        me.url = userid ? baseurl + '/' + userid : baseurl;
        me.method = userid ? 'PUT' : 'POST';
        me.autoLoad = !!userid;

        return {
            useridXType: userid ? 'displayfield' : 'textfield',
            isSuperUser: userid === 'root@pam',
        };
    },

    viewModel: {
        data: {
            realm: 'pmg',
        },
        formulas: {
            maySetPassword: function (get) {
                let realm = get('realm');

                let view = this.getView();
                let realmStore = view.down('pmxRealmComboBox').getStore();
                if (realmStore.isLoaded()) {
                    let rec = realmStore.findRecord('realm', realm, 0, false, true, true);
                    return rec.data.type === 'pmg' && view.isCreate;
                } else {
                    return view.isCreate;
                }
            },
        },
    },

    items: {
        xtype: 'inputpanel',
        column1: [
            {
                xtype: 'textfield',
                name: 'username',
                fieldLabel: gettext('User name'),
                renderer: Ext.htmlEncode,
                allowBlank: false,
                cbind: {
                    submitValue: '{isCreate}',
                    xtype: '{useridXType}',
                },
            },
            {
                xtype: 'textfield',
                inputType: 'password',
                fieldLabel: gettext('Password'),
                minLength: 8,
                allowBlank: false,
                name: 'password',
                listeners: {
                    change: function (field) {
                        field.next().validate();
                    },
                    blur: function (field) {
                        field.next().validate();
                    },
                },
                bind: {
                    hidden: '{!maySetPassword}',
                    disabled: '{!maySetPassword}',
                },
            },
            {
                xtype: 'textfield',
                inputType: 'password',
                fieldLabel: gettext('Confirm password'),
                name: 'verifypassword',
                vtype: 'password',
                initialPassField: 'password',
                allowBlank: false,
                submitValue: false,
                bind: {
                    hidden: '{!maySetPassword}',
                    disabled: '{!maySetPassword}',
                },
            },
            {
                xtype: 'pmgRoleSelector',
                name: 'role',
                allowBlank: false,
                fieldLabel: gettext('Role'),
                cbind: {
                    disabled: '{isSuperUser}',
                },
            },
            {
                xtype: 'datefield',
                name: 'expire',
                emptyText: Proxmox.Utils.neverText,
                format: 'Y-m-d',
                submitFormat: 'U',
                fieldLabel: gettext('Expire'),
                cbind: {
                    disabled: '{isSuperUser}',
                },
            },
            {
                xtype: 'proxmoxcheckbox',
                fieldLabel: gettext('Enabled'),
                name: 'enable',
                uncheckedValue: 0,
                defaultValue: 1,
                checked: true,
                cbind: {
                    disabled: '{isSuperUser}',
                },
            },
        ],

        column2: [
            {
                xtype: 'pmxRealmComboBox',
                reference: 'realmfield',
                name: 'realm',
                baseUrl: '/access/auth-realm',
                bind: {
                    value: '{realm}',
                },
                cbind: {
                    disabled: '{!isCreate}',
                    hidden: '{!isCreate}',
                },
            },
            {
                xtype: 'proxmoxtextfield',
                name: 'firstname',
                fieldLabel: gettext('First Name'),
                cbind: {
                    deleteEmpty: '{!isCreate}',
                },
            },
            {
                xtype: 'proxmoxtextfield',
                name: 'lastname',
                fieldLabel: gettext('Last Name'),
                cbind: {
                    deleteEmpty: '{!isCreate}',
                },
            },
            {
                xtype: 'proxmoxtextfield',
                name: 'email',
                fieldLabel: gettext('E-Mail'),
                vtype: 'proxmoxMail',
                cbind: {
                    deleteEmpty: '{!isCreate}',
                },
            },
        ],

        columnB: [
            {
                xtype: 'proxmoxtextfield',
                name: 'comment',
                fieldLabel: gettext('Comment'),
                cbind: {
                    disabled: '{isSuperUser}',
                    deleteEmpty: '{!isCreate}',
                },
            },
            {
                xtype: 'proxmoxtextfield',
                name: 'keys',
                fieldLabel: gettext('Key IDs'),
                cbind: {
                    deleteEmpty: '{!isCreate}',
                },
            },
        ],
    },

    getValues: function (dirtyOnly) {
        var me = this;

        var values = me.callParent(arguments);

        // hack: ExtJS datefield does not submit 0, so we need to set that
        if (!values.expire) {
            values.expire = 0;
        }

        if (me.isCreate) {
            values.userid = values.username + '@' + values.realm;
        }

        delete values.username;

        if (!values.password) {
            delete values.password;
        }

        return values;
    },

    setValues: function (values) {
        var me = this;

        if (Ext.isDefined(values.expire)) {
            if (values.expire) {
                values.expire = new Date(values.expire * 1000);
            } else {
                // display 'never' instead of '1970-01-01'
                values.expire = null;
            }
        }

        me.callParent([values]);
    },
});
