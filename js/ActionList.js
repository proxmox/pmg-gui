Ext.define('pmg-action-list', {
    extend: 'Ext.data.Model',
    fields: ['id', 'name', 'info', 'descr', 'editable', { name: 'otype', type: 'integer' }],
    idProperty: 'id',
});

Ext.define('PMG.ActionList', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.pmgActionList'],

    title: PMG.Utils.oclass_text.action,
    border: false,

    baseurl: '/config/ruledb/action',

    otype_list: [4002, 4003, 4005, 4007, 4009],

    enableButtons: true,

    initComponent: function () {
        var me = this;

        me.store = new Ext.data.Store({
            model: 'pmg-action-list',
            proxy: {
                type: 'proxmox',
                url: '/api2/json' + me.baseurl + '/objects',
            },
            sorters: {
                property: 'name',
                direction: 'ASC',
            },
        });

        me.selModel = Ext.create('Ext.selection.RowModel', {});

        var reload = function () {
            me.store.load();
        };

        var run_editor = function () {
            var rec = me.selModel.getSelection()[0];
            if (!rec) {
                return;
            }

            var editor = PMG.Utils.object_editors[rec.data.otype];
            if (!editor) {
                return;
            }

            var config = Ext.apply({ method: 'PUT' }, editor);

            config.url = me.baseurl + '/' + editor.subdir + '/' + rec.data.id;

            var win = Ext.createWidget('proxmoxWindowEdit', config);

            win.load();
            win.on('destroy', reload);
            win.show();
        };

        var remove_btn = Ext.createWidget('proxmoxStdRemoveButton', {
            selModel: me.selModel,
            getUrl: function (rec) {
                return me.baseurl + '/objects/' + rec.data.id;
            },
            enableFn: (rec) => !!rec.data.editable,
            callback: reload,
            getRecordName: function (rec) {
                return rec.data.descr;
            },
            waitMsgTarget: me,
        });

        var menu_items = [];

        Ext.Array.each(me.otype_list, function (otype) {
            var editor = PMG.Utils.object_editors[otype];

            var config = Ext.apply({ method: 'POST' }, editor);

            config.isCreate = true;
            menu_items.push({
                text: config.subject,
                handler: function () {
                    if (me.baseurl === undefined) {
                        return;
                    }
                    config.url = me.baseurl + '/' + editor.subdir;
                    var win = Ext.createWidget('proxmoxWindowEdit', config);
                    win.on('destroy', reload);
                    win.show();
                },
            });
        });

        var tbar = [
            {
                text: gettext('Add'),
                menu: new Ext.menu.Menu({
                    items: menu_items,
                }),
            },
            {
                xtype: 'proxmoxButton',
                text: gettext('Edit'),
                disabled: true,
                selModel: me.selModel,
                enableFn: (rec) => !!rec.data.editable,
                handler: run_editor,
            },
            remove_btn,
        ];

        Proxmox.Utils.monStoreErrors(me, me.store, true);

        if (me.enableButtons) {
            me.tbar = tbar;
        }

        Ext.apply(me, {
            run_editor: run_editor,
            columns: [
                {
                    header: gettext('Name'),
                    sortable: true,
                    width: 200,
                    dataIndex: 'name',
                    renderer: Ext.String.htmlEncode,
                },
                {
                    header: gettext('Description'),
                    sortable: true,
                    width: 300,
                    dataIndex: 'descr',
                    renderer: Ext.String.htmlEncode,
                },
                {
                    header: gettext('Comment'),
                    sortable: false,
                    flex: 1,
                    dataIndex: 'info',
                    renderer: Ext.String.htmlEncode,
                },
                {
                    header: gettext('Editable'),
                    dataIndex: 'editable',
                    renderer: Proxmox.Utils.format_boolean,
                },
            ],
            listeners: {
                itemdblclick: function () {
                    if (me.enableButtons) {
                        run_editor();
                    }
                },
                activate: reload,
            },
        });

        me.callParent();

        reload(); // initial load
    },
});
