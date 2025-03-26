Ext.define('PMG.OIDCInputPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmgAuthOIDCPanel',
    mixins: ['Proxmox.Mixin.CBind'],
    onlineHelp: 'user_oidc',

    type: 'oidc',

    viewModel: {
	data: {
	    roleSource: '__default__',
	    autocreate: 0,
	},
	formulas: {
	    hideFixedRoleAssignment: function(get) {
		return get('roleSource') !== 'fixed' || !get('autocreate');
	    },
	    hideClaimRoleAssignment: function(get) {
		return get('roleSource') !== 'from-claim' || !get('autocreate');
	    },
	},
    },

    onGetValues: function(values) {
	let me = this;

	if (me.isCreate && !me.useTypeInUrl) {
	    values.type = me.type;
	}

	let autocreateRoleAssignment = {};
	if (values.source) {
	    autocreateRoleAssignment.source = values.source;
	}
	if (values.source === 'fixed') {
	    autocreateRoleAssignment['fixed-role'] = values['fixed-role'];
	} else if (values.source === 'from-claim') {
	    autocreateRoleAssignment['role-claim'] = values['role-claim'];
	}
	values['autocreate-role-assignment'] = Proxmox.Utils.printPropertyString(autocreateRoleAssignment);
	Proxmox.Utils.delete_if_default(values, 'autocreate-role-assignment', '', me.isCreate);

	delete values.source;
	delete values['fixed-role'];
	delete values['role-claim'];

	return values;
    },

    setValues: function(values) {
	let autocreateRoleAssignment =
	    Proxmox.Utils.parsePropertyString(values['autocreate-role-assignment']);

	values.source = autocreateRoleAssignment.source ?? '__default__';

	if (autocreateRoleAssignment.source === 'fixed') {
	    values['fixed-role'] = autocreateRoleAssignment['fixed-role'];
	}
	if (autocreateRoleAssignment.source === 'from-claim') {
	    values['role-claim'] = autocreateRoleAssignment['role-claim'];
	}

	this.callParent(arguments);
    },


    columnT: [
	{
	    xtype: 'textfield',
	    name: 'issuer-url',
	    fieldLabel: gettext('Issuer URL'),
	    allowBlank: false,
	},
    ],

    column1: [
	{
	    xtype: 'pmxDisplayEditField',
	    name: 'realm',
	    cbind: {
		value: '{realm}',
		editable: '{isCreate}',
	    },
	    fieldLabel: gettext('Realm'),
	    allowBlank: false,
	},
	{
	    xtype: 'proxmoxcheckbox',
	    fieldLabel: gettext('Default realm'),
	    name: 'default',
	    value: 0,
	    cbind: {
		deleteEmpty: '{!isCreate}',
	    },
	    autoEl: {
		tag: 'div',
		'data-qtip': gettext('Set realm as default for login'),
	    },
	},
	{
	    xtype: 'proxmoxtextfield',
	    fieldLabel: gettext('Client ID'),
	    name: 'client-id',
	    allowBlank: false,
	},
	{
	    xtype: 'proxmoxtextfield',
	    fieldLabel: gettext('Client Key'),
	    cbind: {
		deleteEmpty: '{!isCreate}',
	    },
	    name: 'client-key',
	},
    ],

    column2: [
	{
	    xtype: 'pmxDisplayEditField',
	    name: 'username-claim',
	    fieldLabel: gettext('Username Claim'),
	    editConfig: {
		xtype: 'proxmoxKVComboBox',
		editable: true,
		comboItems: [
		    ['__default__', Proxmox.Utils.defaultText],
		    ['sub', gettext('sub (subject)')],
		    ['preferred_username', gettext('preferred_username')],
		],
	    },
	    cbind: {
		value: get => get('isCreate') ? '__default__' : Proxmox.Utils.defaultText,
		deleteEmpty: '{!isCreate}',
		editable: '{isCreate}',
	    },
	},
	{
	    xtype: 'proxmoxtextfield',
	    name: 'scopes',
	    fieldLabel: gettext('Scopes'),
	    emptyText: `${Proxmox.Utils.defaultText} (email profile)`,
	    submitEmpty: false,
	    cbind: {
		deleteEmpty: '{!isCreate}',
	    },
	},
	{
	    xtype: 'proxmoxKVComboBox',
	    name: 'prompt',
	    fieldLabel: gettext('Prompt'),
	    editable: true,
	    emptyText: gettext('Auth-Provider Default'),
	    comboItems: [
		['__default__', gettext('Auth-Provider Default')],
		['none', 'none'],
		['login', 'login'],
		['consent', 'consent'],
		['select_account', 'select_account'],
	    ],
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
		deleteEmpty: '{!isCreate}',
	    },
	},
	{
	    xtype: 'displayfield',
	    value: gettext('Autocreate Options'),
	},
	{
	    xtype: 'proxmoxcheckbox',
	    fieldLabel: gettext('Autocreate Users'),
	    name: 'autocreate',
	    bind: {
		value: '{autocreate}',
	    },
	    cbind: {
		deleteEmpty: '{!isCreate}',
	    },
	},
	{
	    xtype: 'proxmoxKVComboBox',
	    name: 'source',
	    fieldLabel: gettext('Source for Role Assignment'),
	    allowBlank: false,
	    deleteEmpty: false,
	    comboItems: [
		[
		    '__default__',
		    Proxmox.Utils.defaultText
			+ ' (' + gettext('All auto-created users get audit role') + ')',
		],
		['fixed', gettext('Fixed role for all auto-created users')],
		['from-claim', gettext('Get role from OIDC claim')],
	    ],
	    bind: {
		value: '{roleSource}',
		disabled: '{!autocreate}',
		hidden: '{!autocreate}',
	    },
	},
	{
	    xtype: 'pmgRoleSelector',
	    name: 'fixed-role',
	    allowBlank: false,
	    deleteEmpty: false,
	    fieldLabel: gettext('Fixed Role'),
	    bind: {
		disabled: '{hideFixedRoleAssignment}',
		hidden: '{hideFixedRoleAssignment}',
	    },
	},
	{
	    xtype: 'proxmoxtextfield',
	    name: 'role-claim',
	    allowBlank: false,
	    deleteEmpty: false,
	    fieldLabel: gettext('Role Claim'),
	    bind: {
		disabled: '{hideClaimRoleAssignment}',
		hidden: '{hideClaimRoleAssignment}',
	    },
	},
    ],

    advancedColumnB: [
	{
	    xtype: 'proxmoxtextfield',
	    name: 'acr-values',
	    fieldLabel: gettext('ACR Values'),
	    submitEmpty: false,
	    cbind: {
		deleteEmpty: '{!isCreate}',
	    },
	},
    ],
});
