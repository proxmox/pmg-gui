Ext.define('pmg-object-group', {
    extend: 'Ext.data.Model',
    fields: ['id', 'name', 'info'],
    idProperty: 'id',
});

Ext.define('pmg-object-list', {
    extend: 'Ext.data.Model',
    fields: [
	'id', 'descr',
	{ name: 'otype', type: 'integer' },
	{ name: 'receivertest', type: 'boolean' },
    ],
    idProperty: 'id',
});


Ext.define('PMG.ObjectGroupList', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.pmgObjectGroupList'],

    ogclass: undefined, //  'who', 'when', 'what'

    subject: 'Object Group List', // please overwrite

    baseurl: undefined,

    enableButtons: true,

    inputItems: [
	{
	    xtype: 'textfield',
	    name: 'name',
	    allowBlank: false,
	    fieldLabel: gettext('Name'),
	},
	{
	    xtype: 'textareafield',
	    name: 'info',
	    fieldLabel: gettext("Description"),
	},
    ],

    reload: function() {
	var me = this;

        me.store.load();
    },

    run_editor: function() {
	var me = this;

	var rec = me.selModel.getSelection()[0];
	if (!rec) {
	    return;
	}

	var config = {
	    url: "/api2/extjs" + me.baseurl +'/' + rec.data.id + '/config',
	    onlineHelp: 'chapter_mailfilter',
	    method: 'PUT',
	    subject: me.subject,
	    width: 400,
	    items: me.inputItems,
	};

	var win = Ext.createWidget('proxmoxWindowEdit', config);

	win.load();
	win.on('destroy', me.reload, me);
	win.show();
    },

    initComponent: function() {
	var me = this;

	if (!me.ogclass) {
	    throw "ogclass not initialized";
	}

	me.baseurl = "/config/ruledb/" + me.ogclass;

	me.store = new Ext.data.Store({
	    model: 'pmg-object-group',
	    proxy: {
		type: 'proxmox',
		url: "/api2/json" + me.baseurl,
	    },
	    sorters: {
		property: 'name',
		direction: 'ASC',
	    },
	});

	me.selModel = Ext.create('Ext.selection.RowModel', {});

	var tbar = [
            {
		text: gettext('Create'),
		handler: function() {
		    Ext.createWidget('proxmoxWindowEdit', {
			method: 'POST',
			url: `/api2/extjs${me.baseurl}`,
			onlineHelp: 'chapter_mailfilter',
			isCreate: true,
			width: 400,
			subject: me.subject,
			items: me.inputItems,
			autoShow: true,
			listeners: {
			    destroy: () => me.reload(),
			},
		    });
		},
            },
	    '-',
            {
		xtype: 'proxmoxButton',
		text: gettext('Edit'),
		disabled: true,
		selModel: me.selModel,
		handler: () => me.run_editor(),
            },
	    {
		xtype: 'proxmoxStdRemoveButton',
		selModel: me.selModel,
		baseurl: me.baseurl,
		callback: () => me.reload(),
		getRecordName: rec => rec.data.name,
		waitMsgTarget: me,
	    },
        ];

	Proxmox.Utils.monStoreErrors(me, me.store, true);

	if (me.enableButtons) {
	    me.tbar = tbar;
	}

	Ext.apply(me, {
	    columns: [
		{
		    header: gettext('Name'),
		    sortable: true,
		    flex: 1,
		    dataIndex: 'name',
		    renderer: Ext.String.htmlEncode,
		},
		{
		    header: gettext('Description'),
		    sortable: true,
		    flex: 1,
		    dataIndex: 'info',
		    renderer: Ext.String.htmlEncode,
		    hidden: true,
		},
	    ],
	    listeners: {
		itemdblclick: function() {
		    if (me.enableButtons) {
			me.run_editor();
		    }
		},
		activate: function() { me.reload(); },
	    },
	});

	me.callParent();

	me.reload(); // initial load
    },
});
