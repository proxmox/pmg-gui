Ext.define('pmg-rule-list', {
    extend: 'Ext.data.Model',
    fields: [
        'id',
        'name',
        { name: 'active', type: 'boolean' },
        { name: 'direction', type: 'integer' },
        { name: 'priority', type: 'integer' },
    ],
    idProperty: 'id',
});

Ext.define('PMG.RulesConfiguration', {
    extend: 'Ext.container.Container',
    xtype: 'pmgRuleConfiguration',

    layout: 'border',
    border: false,
    defaults: {
        border: false,
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        selectedRuleChange: function (grid, selected, eOpts) {
            let me = this;
            let infoPanel = me.lookupReference('infopanel');
            let baseurl = '';

            if (selected.length > 0) {
                baseurl = `/config/ruledb/rules/${selected[0].data.id}`;
            }

            infoPanel.getController().setBaseUrl(baseurl);
        },

        editIconClick: function (gridView, rowindex, colindex, column, e, record) {
            let me = this;
            me.showEditWindow(gridView, record);
        },

        showEditWindow: function (gridView, record) {
            let _me = this;
            let win = Ext.create('PMG.RuleEditor', {
                url: `/api2/extjs/config/ruledb/rules/${record.data.id}/config`,
                listeners: {
                    destroy: function () {
                        gridView.getStore().load();
                    },
                },
            });
            win.load();
            win.show();
        },

        toggleIconClick: function (gridView, rowindex, colindex, column, e, record) {
            let _me = this;
            Proxmox.Utils.API2Request({
                url: `/config/ruledb/rules/${record.data.id}/config`,
                params: {
                    active: record.data.active ? 0 : 1,
                },
                method: 'PUT',
                callback: function () {
                    gridView.getStore().load();
                },
                failure: function (response, opts) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
            });
        },

        reload: function () {
            let me = this;
            me.lookupReference('rulegrid').getStore().load();
        },

        addRule: function () {
            let me = this;
            let win = Ext.create('PMG.RuleEditor', {
                url: '/api2/extjs/config/ruledb/rules/',
                method: 'POST',
                isCreate: true,
                listeners: {
                    destroy: function () {
                        me.lookupReference('rulegrid').getStore().load();
                    },
                },
            });
            win.load();
            win.show();
        },

        onFactoryDefaults: function () {
            let me = this;

            Ext.Msg.confirm(
                gettext('Confirm'),
                gettext('Reset rule database to factory defaults?'),
                function (button) {
                    if (button !== 'yes') {
                        return;
                    }
                    Proxmox.Utils.API2Request({
                        url: '/config/ruledb',
                        method: 'POST',
                        waitMsgTarget: me.getView(),
                        callback: function () {
                            me.reload();
                        },
                        failure: function (response, opts) {
                            Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                        },
                    });
                },
            );
        },

        init: function (view) {
            let grid = this.lookupReference('rulegrid');
            Proxmox.Utils.monStoreErrors(grid, grid.getStore(), true);
        },

        control: {
            'grid[reference=rulegrid]': {
                itemdblclick: 'showEditWindow',
                selectionchange: 'selectedRuleChange',
            },
            'button[reference=addButton]': {
                click: 'addRule',
            },
        },
    },

    viewModel: {
        data: {
            selectedRule: undefined,
            baseUrl: '/config/ruledb/rules',
        },
    },

    items: [
        {
            xtype: 'grid',
            layout: 'fit',
            title: 'Rules',
            reference: 'rulegrid',
            region: 'center',

            bind: {
                selection: '{selectedRule}',
            },

            dockedItems: {
                xtype: 'toolbar',
                reference: 'mytb',
                items: [
                    {
                        xtype: 'button',
                        text: gettext('Add'),
                        iconCls: 'fa fa-plus-circle',
                        reference: 'addButton',
                    },
                    {
                        xtype: 'proxmoxStdRemoveButton',
                        text: gettext('Remove'),
                        iconCls: 'fa fa-minus-circle',
                        reference: 'removeButton',
                        callback: 'reload',
                        getRecordName: function (rec) {
                            return rec.data.name;
                        },
                        bind: {
                            baseurl: '{baseUrl}',
                        },
                    },
                    '->',
                    {
                        text: gettext('Factory Defaults'),
                        handler: 'onFactoryDefaults',
                    },
                ],
            },

            viewConfig: {
                getRowClass: function (record, rowIndex) {
                    return record.get('active') ? 'enabled' : 'disabled';
                },
            },

            store: {
                autoLoad: true,
                model: 'pmg-rule-list',
                reference: 'rulesStore',
                proxy: {
                    type: 'proxmox',
                    url: '/api2/json/config/ruledb/rules',
                },
                sorters: [
                    {
                        property: 'priority',
                        direction: 'DESC',
                    },
                    {
                        property: 'name',
                    },
                ],
            },

            sortableColumns: false,
            columns: [
                {
                    text: 'Active',
                    dataIndex: 'active',
                    hidden: true,
                },
                {
                    text: 'Name',
                    dataIndex: 'name',
                    flex: 1,
                    renderer: Ext.htmlEncode,
                },
                {
                    text: 'Priority',
                    dataIndex: 'priority',
                },
                {
                    text: 'Direction',
                    dataIndex: 'direction',
                    renderer: PMG.Utils.format_rule_direction,
                },
                {
                    text: '',
                    xtype: 'actioncolumn',
                    align: 'center',
                    width: 70,
                    items: [
                        {
                            iconCls: 'fa fa-fw fa-pencil',
                            tooltip: 'Edit',
                            handler: 'editIconClick',
                        },
                        {
                            getClass: function (val, meta, rec) {
                                return (
                                    'fa fa-fw fa-' +
                                    (rec.get('active') ? 'toggle-on' : 'toggle-off')
                                );
                            },
                            getTip: function (val, meta, rec) {
                                return rec.get('active') ? 'Deactivate' : 'Activate';
                            },
                            handler: 'toggleIconClick',
                        },
                    ],
                },
            ],
        },
        {
            region: 'east',
            reference: 'infopanel',
            xtype: 'pmgRuleInfo',
            split: true,
            width: 440,
        },
    ],
});
