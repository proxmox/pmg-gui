Ext.define('PMG.LoginView', {
    extend: 'Ext.container.Container',
    xtype: 'loginview',

    viewModel: {
	data: {
	    oidc: false,
	},
	formulas: {
	    buttonText: function(get) {
		if (get("oidc") === true) {
		    return gettext("Login (OpenID Connect redirect)");
		} else {
		    return gettext("Login");
		}
	    },
	},
    },

    controller: {
	xclass: 'Ext.app.ViewController',

	init: function(view) {
	    let me = this;

	    let realmfield = me.lookup('realmfield');

	    me.lookup('quarantineButton').setVisible(!!Proxmox.QuarantineLink);

	    if (view.targetview !== 'quarantineview') {
		return;
	    }

	    // hide save username field for quarantine view
	    me.lookup('saveunField').setVisible(false);

	    // disable/hide realm field for quarantine view
	    realmfield.setDisabled(true);
	    realmfield.setHidden(true);

	    realmfield.setValue('quarantine');

	    // try autologin with quarantine ticket from URL

	    let qs = Ext.Object.fromQueryString(location.search);
	    if (qs.ticket === undefined) {
		return;
	    }
	    let ticket = decodeURIComponent(qs.ticket);
	    let match = ticket.match(/^PMGQUAR:([^\s:]+):/);
	    if (!match) {
		return;
	    }
	    let username = match[1];
	    let loginwin = me.lookup('loginwindow');
	    loginwin.autoShow = false;
	    loginwin.setVisible(false);

	    me.lookup('usernameField').setValue(username);
	    me.lookup('passwordField').setValue(ticket);

	    me.submitForm();
	},

	submitForm: async function() {
	    let me = this;

	    let loginForm = this.lookupReference('loginForm');
	    let unField = this.lookupReference('usernameField');
	    let saveunField = this.lookupReference('saveunField');
	    let view = this.getView();

	    if (!loginForm.isValid()) {
		return;
	    }

	    if (loginForm.isVisible()) {
		loginForm.mask(gettext('Please wait...'), 'x-mask-loading');
	    }

	    // set or clear username for admin view
	    if (view.targetview !== 'quarantineview') {
		let sp = Ext.state.Manager.getProvider();
		if (saveunField.getValue() === true) {
		    sp.set(unField.getStateId(), unField.getValue());
		} else {
		    sp.clear(unField.getStateId());
		}
		sp.set(saveunField.getStateId(), saveunField.getValue());
	    }

	    let creds = loginForm.getValues();

	    if (this.getViewModel().data.oidc === true) {
		const redirectURL = location.origin;
		Proxmox.Utils.API2Request({
		    url: '/api2/extjs/access/oidc/auth-url',
		    params: {
			realm: creds.realm,
			"redirect-url": redirectURL,
		    },
		    method: 'POST',
		    success: function(resp, opts) {
			window.location = resp.result.data;
		    },
		    failure: function(resp, opts) {
			Proxmox.Utils.authClear();
			loginForm.unmask();
			Ext.MessageBox.alert(
			    gettext('Error'),
			    gettext('OpenID Connect redirect failed.') + `<br>${resp.htmlStatus}`,
			);
		    },
		});
		return;
	    }

	    try {
		let resp = await Proxmox.Async.api2({
		    url: '/api2/extjs/access/ticket',
		    params: creds,
		    method: 'POST',
		});

		let data = resp.result.data;
		if (data.ticket.startsWith('PMG:!tfa!')) {
		    data = await me.performTFAChallenge(data);
		}
		PMG.Utils.updateLoginData(data);
		PMG.app.changeView(view.targetview);
	    } catch (error) {
		Proxmox.Utils.authClear();
		loginForm.unmask();
		Ext.MessageBox.alert(
		    gettext('Error'),
		    gettext('Login failed. Please try again'),
		);
	    }
	},

	performTFAChallenge: async function(data) {
	    let me = this;

	    let userid = data.username;
	    let ticket = data.ticket;
	    let challenge = JSON.parse(decodeURIComponent(
		ticket.split(':')[1].slice("!tfa!".length),
	    ));

	    let resp = await new Promise((resolve, reject) => {
		Ext.create('Proxmox.window.TfaLoginWindow', {
		    userid,
		    ticket,
		    challenge,
		    onResolve: value => resolve(value),
		    onReject: reject,
		}).show();
	    });

	    return resp.result.data;
	},

	success: function(data) {
	    let me = this;
	    let view = me.getView();
	    let handler = view.handler || Ext.emptyFn;
	    handler.call(me, data);
	    PMG.Utils.updateLoginData(data);
	    PMG.app.changeView(view.targetview);
	},

	openQuarantineLinkWindow: function() {
	    let me = this;
	    me.lookup('loginwindow').setVisible(false);
	    Ext.create('Proxmox.window.Edit', {
		title: gettext('Request Quarantine Link'),
		url: '/quarantine/sendlink',
		isCreate: true,
		submitText: gettext('OK'),
		method: 'POST',
		items: [
		    {
			xtype: 'proxmoxtextfield',
			name: 'mail',
			fieldLabel: gettext('Your E-Mail'),
		    },
		],
		listeners: {
		    destroy: function() {
			me.lookup('loginwindow').show(true);
		    },
		},
	    }).show();
	},

	control: {
	    'field[name=lang]': {
		change: function(f, value) {
		    let dt = Ext.Date.add(new Date(), Ext.Date.YEAR, 10);
		    Ext.util.Cookies.set('PMGLangCookie', value, dt);

		    let loginwin = this.lookupReference('loginwindow');
		    loginwin.mask(gettext('Please wait...'), 'x-mask-loading');
		    window.location.reload();
		},
	    },
	    'field[name=realm]': {
		change: function(f, value) {
		    let record = f.store.getById(value);
		    if (!record) {
			return;
		    }
		    let data = record.data;
		    this.getViewModel().set("oidc", data.type === "oidc");
		},
	    },
	    'button[reference=quarantineButton]': {
		click: 'openQuarantineLinkWindow',
	    },
	    'button[reference=loginButton]': {
		click: 'submitForm',
	    },
	    'window[reference=loginwindow]': {
		show: function() {
		    let me = this;
		    let view = me.getView();
		    if (view.targetview !== 'quarantineview') {
			let sp = Ext.state.Manager.getProvider();
			let checkboxField = this.lookupReference('saveunField');
			let unField = this.lookupReference('usernameField');

			let checked = sp.get(checkboxField.getStateId());
			checkboxField.setValue(checked);

			if (checked === true) {
			    let username = sp.get(unField.getStateId());
			    unField.setValue(username);
			    let pwField = this.lookupReference('passwordField');
			    pwField.focus();
			}

			let auth = Proxmox.Utils.getOpenIDRedirectionAuthorization();
			if (auth !== undefined) {
			    Proxmox.Utils.authClear();

			    let loginForm = this.lookupReference('loginForm');
			    loginForm.mask(gettext('OpenID Connect login - please wait...'), 'x-mask-loading');

			    const redirectURL = location.origin;

			    Proxmox.Utils.API2Request({
				url: '/api2/extjs/access/oidc/login',
				params: {
				    state: auth.state,
				    code: auth.code,
				    "redirect-url": redirectURL,
				},
				method: 'POST',
				failure: function(response) {
				    loginForm.unmask();
				    let error = response.htmlStatus;
				    Ext.MessageBox.alert(
					gettext('Error'),
					gettext('OpenID Connect login failed, please try again') + `<br>${error}`,
					() => { window.location = redirectURL; },
				    );
				},
				success: function(response, options) {
				    loginForm.unmask();
				    let data = response.result.data;
				    history.replaceState(null, '', redirectURL);
				    me.success(data);
				},
			    });
			}
		    }
		},
	    },
	},
    },

    plugins: 'viewport',

    layout: {
	type: 'border',
    },

    items: [
	{
	    region: 'north',
	    xtype: 'container',
	    layout: {
		type: 'hbox',
		align: 'middle',
	    },
	    margin: '2 5 2 5',
	    height: 38,
	    items: [
		{
		    xtype: 'proxmoxlogo',
		},
		{
		    xtype: 'versioninfo',
		    makeApiCall: false,
		},
	    ],
	},
	{
	    region: 'center',
	},
	{
	    xtype: 'window',
	    closable: false,
	    resizable: false,
	    reference: 'loginwindow',
	    autoShow: true,
	    modal: true,
	    width: 450,

	    defaultFocus: 'usernameField',

	    layout: {
		type: 'auto',
	    },

	    title: gettext('Proxmox Mail Gateway Login'),

	    items: [
		{
		    xtype: 'form',
		    layout: {
			type: 'form',
		    },
		    defaultButton: 'loginButton',
		    url: '/api2/extjs/access/ticket',
		    reference: 'loginForm',

		    fieldDefaults: {
			labelAlign: 'right',
			allowBlank: false,
		    },

		    items: [
			{
			    xtype: 'textfield',
			    fieldLabel: gettext('User name'),
			    name: 'username',
			    itemId: 'usernameField',
			    reference: 'usernameField',
			    stateId: 'login-username',
			    inputAttrTpl: 'autocomplete=username',
			    bind: {
				visible: "{!oidc}",
				disabled: "{oidc}",
			    },
			},
			{
			    xtype: 'textfield',
			    inputType: 'password',
			    fieldLabel: gettext('Password'),
			    name: 'password',
			    reference: 'passwordField',
			    inputAttrTpl: 'autocomplete=current-password',
			    bind: {
				visible: "{!oidc}",
				disabled: "{oidc}",
			    },
			},
			{
			    xtype: 'pmxRealmComboBox',
			    reference: 'realmfield',
			    name: 'realm',
			    baseUrl: '/access/auth-realm',
			    value: 'pam',
			},
			{
			    xtype: 'proxmoxLanguageSelector',
			    fieldLabel: gettext('Language'),
			    value: Ext.util.Cookies.get('PMGLangCookie') || 'en',
			    name: 'lang',
			    submitValue: false,
			},
		    ],
		    buttons: [
			{
			    xtype: 'checkbox',
			    fieldLabel: gettext('Save User name'),
			    name: 'saveusername',
			    reference: 'saveunField',
			    stateId: 'login-saveusername',
			    labelAlign: 'right',
			    labelWidth: 150,
			    submitValue: false,
			    bind: {
				visible: "{!oidc}",
			    },
			},
			{
			    text: gettext('Request Quarantine Link'),
			    reference: 'quarantineButton',
			},
			{
			    bind: {
				text: "{buttonText}",
			    },
			    reference: 'loginButton',
			},
		    ],
		},
	    ],
	},
    ],
});
