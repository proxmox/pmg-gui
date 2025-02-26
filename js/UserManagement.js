Ext.define('PMG.UserManagement', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.pmgUserManagement',

    title: gettext('Configuration') + ': ' +
	gettext('User Management'),

    border: false,
    defaults: { border: false },

    items: [
	{
	    xtype: "pmgUserView",
	    title: gettext('Local'),
	    itemId: 'local',
	    iconCls: 'fa fa-user',
	},
	{
	    xtype: 'pmgTFAView',
	    title: 'Two Factor',
	    itemId: 'tfa',
	    iconCls: 'fa fa-key',
	    issuerName: `Proxmox Mail Gateway - ${Proxmox.NodeName}`,
	},
	{
	    xtype: 'pmgLDAPConfig',
	    title: 'LDAP',
	    itemId: 'ldap',
	    iconCls: 'fa fa-address-book-o',
	},
	{
	    xtype: 'pmgFetchmailView',
	    title: 'Fetchmail',
	    itemId: 'pop',
	    iconCls: 'fa fa-reply-all',
	},
	{
	    xtype: 'pmxAuthView',
	    title: gettext('Realms'),
	    itemId: 'realms',
	    baseUrl: '/access/auth-realm',
	    storeBaseUrl: '/access/auth-realm',
	    iconCls: 'fa fa-address-book-o',
	},
    ],
});
