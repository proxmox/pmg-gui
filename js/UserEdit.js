Ext.define('PMG.UserEdit', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmgUserEdit',
    mixins: ['Proxmox.Mixin.CBind'],
    onlineHelp: 'pmgconfig_localuser',

    userid: undefined,

    isAdd: true,

    subject: gettext('User'),

    fieldDefaults: { labelWidth: 120 },

    cbindData: function(initialConfig) {
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
                    change: function(field) {
			field.next().validate();
                    },
                    blur: function(field) {
			field.next().validate();
                    },
		},
		cbind: {
		    hidden: '{!isCreate}',
		    disabled: '{!isCreate}',
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
		cbind: {
		    hidden: '{!isCreate}',
		    disabled: '{!isCreate}',
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

    getValues: function(dirtyOnly) {
	var me = this;

	var values = me.callParent(arguments);

	// hack: ExtJS datefield does not submit 0, so we need to set that
	if (!values.expire) {
	    values.expire = 0;
	}

	if (me.isCreate) {
	    values.userid = values.username + '@pmg';
	}

	delete values.username;

	if (!values.password) {
	    delete values.password;
	}

	return values;
    },

    setValues: function(values) {
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
