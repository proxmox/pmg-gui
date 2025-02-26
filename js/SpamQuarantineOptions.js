Ext.define('PMG.SpamQuarantineOptions', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.pmgSpamQuarantineOptions'],

    monStoreErrors: true,

    authmodeTextHash: {
	ticket: 'Ticket',
	ldap: 'LDAP',
	ldapticket: 'LDAP or Ticket',
    },

    reportstyleTextHash: {
	none: gettext('No Reports'),
	'short': gettext('Short'),
	verbose: gettext('Verbose'),
	custom: gettext('Custom'),
    },

    initComponent: function() {
	let me = this;

	me.add_integer_row('lifetime', gettext('Lifetime (days)'), {
	    minValue: 1,
	    defaultValue: 7,
	    deleteEmpty: true,
	});

	let render_authmode = value => me.authmodeTextHash[value] || value;
	me.add_combobox_row('authmode', gettext('Authentication mode'), {
	    defaultValue: 'ticket',
	    renderer: render_authmode,
	    comboItems: [
		['ticket', render_authmode('ticket')],
		['ldap', render_authmode('ldap')],
		['ldapticket', render_authmode('ldapticket')]],
	});

	let render_reportstyle = value => me.reportstyleTextHash[value] || value;
	me.add_combobox_row('reportstyle', gettext('User Spamreport Style'), {
	    defaultValue: 'verbose',
	    renderer: render_reportstyle,
	    comboItems: [
		['none', render_reportstyle('none')],
		['short', render_reportstyle('short')],
		['verbose', render_reportstyle('verbose')],
		['custom', render_reportstyle('custom')],
	    ],
	});

	me.add_text_row('hostname', gettext('Quarantine Host'), {
	    deleteEmpty: true,
	    defaultValue: Proxmox.Utils.noneText,
	});
	me.add_integer_row('port', gettext('Quarantine port'), {
	    deleteEmpty: true,
	    defaultValue: Proxmox.Utils.defaultText,
	});
	me.add_text_row('mailfrom', gettext("EMail 'From:'"), {
	    deleteEmpty: true,
	    defaultValue: Proxmox.Utils.noneText,
	});
	me.add_boolean_row('viewimages', gettext('View images'), {
	    defaultValue: 1,
	});
	me.add_boolean_row('allowhrefs', gettext('Allow HREFs'), {
	    defaultValue: 1,
	});

	let baseurl = '/config/spamquar';

	me.selModel = Ext.create('Ext.selection.RowModel', {});

	Ext.apply(me, {
	    tbar: [{
		text: gettext('Edit'),
		xtype: 'proxmoxButton',
		disabled: true,
		handler: function() { me.run_editor(); },
		selModel: me.selModel,
	    }],
	    url: '/api2/json' + baseurl,
	    editorConfig: {
		url: '/api2/extjs' + baseurl,
		onlineHelp: 'pmgconfig_spamdetector_quarantine',
	    },
	    interval: 5000,
	    cwidth1: 200,
	    listeners: {
		itemdblclick: me.run_editor,
	    },
	});

	me.callParent();

	me.on('activate', me.rstore.startUpdate);
	me.on('destroy', me.rstore.stopUpdate);
	me.on('deactivate', me.rstore.stopUpdate);
    },
});
