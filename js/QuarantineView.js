Ext.define('PMG.QuarantineNavigationTree', {

    extend: 'Ext.list.Tree',
    xtype: 'quarantinenavigationtree',

    select: function(path) {
	let me = this;
	let item = me.getStore().findRecord('path', path, 0, false, true, true);
	me.setSelection(item);
    },

    store: {
	root: {
	    expanded: true,
	    children: [
		{
		    text: gettext('Spam Quarantine'),
		    iconCls: 'fa fa-cubes',
		    path: 'pmgSpamQuarantine',
		    expanded: true,
		    children: [
			{
			    text: gettext('Whitelist'),
			    iconCls: 'fa fa-file-o',
			    path: 'pmgUserWhitelist',
			    leaf: true,
			},
			{
			    text: gettext('Blacklist'),
			    iconCls: 'fa fa-file',
			    path: 'pmgUserBlacklist',
			    leaf: true,
			},
		    ],
		},
		{
		    text: gettext('Help'),
		    iconCls: 'fa fa-support',
		    path: 'pmgQuarantineAbout',
		    leaf: true,
		    expanded: true,
		},
	    ],
	},
    },

    animation: false,
    expanderOnly: true,
    expanderFirst: false,
    ui: 'pve-nav',
});

Ext.define('PMG.QuarantineView', {
    extend: 'Ext.container.Container',
    xtype: 'quarantineview',

    title: 'Proxmox Mail Gateway Quarantine',

    controller: {
	xclass: 'Ext.app.ViewController',
	routes: {
	    ':path:subpath': {
		action: 'changePath',
		before: 'beforeChangePath',
                conditions: {
		    ':path': '(?:([%a-zA-Z0-9\\-\\_\\s,]+))',
		    ':subpath': '(?:(?::)([%a-zA-Z0-9\\-\\_\\s,]+))?',
		},
	    },
	},

	beforeChangePath: function(path, subpathOrAction, action) {
	    let me = this;

	    let subpath = subpathOrAction;
	    if (!action) {
		action = subpathOrAction;
		subpath = undefined;
	    }

	    if (!Ext.ClassManager.getByAlias('widget.'+ path)) {
		console.warn('xtype "'+path+'" not found');
		action.stop();
		return;
	    }

	    let lastpanel = me.lookupReference('contentpanel').getLayout().getActiveItem();
	    if (lastpanel && lastpanel.xtype === path) {
		// we have the right component already,
		// we just need to select the correct tab
		// default to the first
		subpath = subpath || 0;
		if (lastpanel.getActiveTab) {
		    // we assume lastpanel is a tabpanel
		    if (lastpanel.getActiveTab().getItemId() !== subpath) {
			// set the active tab
			lastpanel.setActiveTab(subpath);
		    }
		    // else we are already there
		}
		action.stop();
		return;
	    }

	    action.resume();
	},

	changePath: function(path, subpath) {
	    let me = this;
	    let contentpanel = me.lookupReference('contentpanel');
	    let lastpanel = contentpanel.getLayout().getActiveItem();

	    let obj = contentpanel.add({ xtype: path, cselect: subpath });
	    let treelist = me.lookupReference('navtree');

	    treelist.suspendEvents();
	    treelist.select(path);
	    treelist.resumeEvents();

	    if (Ext.isFunction(obj.setActiveTab)) {
		obj.setActiveTab(subpath || 0);
		obj.addListener('tabchange', function(tabpanel, newc, oldc) {
		    let newpath = path;

		    // only add the subpath part for the
		    // non-default tabs
		    if (tabpanel.items.findIndex('id', newc.id) !== 0) {
			newpath += ":" + newc.getItemId();
		    }

		    me.redirectTo(newpath);
		});
	    }

	    contentpanel.setActiveItem(obj);

	    if (lastpanel) {
		contentpanel.remove(lastpanel, { destroy: true });
	    }
	},

	logout: function() {
	    PMG.app.logout();
	},

	changeLanguage: function() {
	    Ext.create('Proxmox.window.LanguageEditWindow', {
		cookieName: 'PMGLangCookie',
	    }).show();
	},

	changeTheme: () => Ext.create('Proxmox.window.ThemeEditWindow', {
		cookieName: 'PMGThemeCookie',
		autoShow: true,
	}),
	navigate: function(treelist, item) {
	    this.redirectTo(item.get('path'));
	},

	execQuarantineAction: function(qa) {
	    PMG.Utils.doQuarantineAction(qa.action, qa.cselect);
	},

	control: {
	    '[reference=logoutButton]': {
		click: 'logout',
	    },
	    '[reference=languageButton]': {
		click: 'changeLanguage',
	    },
	    '[reference=themeButton]': {
		click: 'changeTheme',
	    },
	},

	init: function(view) {
	    let me = this;

	    // load username
	    let username = Proxmox.UserName.replace(/@quarantine$/, '');
	    me.lookupReference('usernameinfo').setText(username);

	    // show login on requestexception
	    // fixme: what about other errors
	    Ext.Ajax.on('requestexception', function(conn, response, options) {
		if (response.status === 401) { // auth failure
		    me.logout();
		}
	    });

	    let qa = PMG.Utils.extractQuarantineAction();
	    let token;
	    if (qa) {
		token = 'pmgSpamQuarantine';
		if (qa.action === 'blacklist') { token = 'pmgUserBlacklist'; }
		if (qa.action === 'whitelist') { token = 'pmgUserWhitelist'; }
		if (qa.cselect) {
		    token += ':' + qa.cselect;
		}
		this.redirectTo(token, true);
		if (qa.action) {
		    me.execQuarantineAction(qa);
		}
	    } else {
		// select treeitem and load page from url fragment

		token = Ext.util.History.getToken() || 'pmgSpamQuarantine';
		this.redirectTo(token, true);
	    }
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
	    margin: '2 0 2 5',
	    height: 38,
	    items: [
		{
		    xtype: 'proxmoxlogo',
		},
		{
		    padding: '0 0 0 5',
		    xtype: 'versioninfo',
		},
		{
		    flex: 1,
		},
		{
		    xtype: 'button',
		    reference: 'usernameinfo',
		    style: {
			// proxmox dark grey p light grey as border
			backgroundColor: '#464d4d',
			borderColor: '#ABBABA',
		    },
		    margin: '0 5 0 0',
		    iconCls: 'fa fa-user',
		    menu: [
			{
			    reference: 'themeButton',
			    iconCls: 'fa fa-paint-brush',
			    text: gettext('Color Theme'),
			},
			{
			    iconCls: 'fa fa-language',
			    text: gettext('Language'),
			    reference: 'languageButton',
			},
			'-',
			{
			    reference: 'logoutButton',
			    iconCls: 'fa fa-sign-out',
			    text: gettext('Logout'),
			},
		    ],
		},
	    ],
	},
	{
	    xtype: 'panel',
	    scrollable: 'y',
	    border: false,
	    region: 'west',
	    layout: {
		type: 'vbox',
		align: 'stretch',
	    },
	    items: [
		{
		    xtype: 'quarantinenavigationtree',
		    reference: 'navtree',
		    minWidth: 180,
		    // we have to define it here until extjs 6.2 because of a bug where a
		    // viewcontroller does not detect the selectionchange event of a treelist
		    listeners: {
			selectionchange: 'navigate',
		    },
		},
		{
		    xtype: 'box',
		    cls: 'x-treelist-pve-nav',
		    flex: 1,
		},
	    ],
	},
	{
	    xtype: 'panel',
	    layout: {
		type: 'card',
	    },
	    region: 'center',
	    border: false,
	    reference: 'contentpanel',
	},
    ],
});
