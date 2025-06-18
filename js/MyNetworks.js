Ext.define('pmg-mynetworks', {
    extend: 'Ext.data.Model',
    fields: ['cidr', 'comment'],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/config/mynetworks',
    },
    idProperty: 'cidr',
});

Ext.define('PMG.MyNetworks', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.pmgMyNetworks'],

    initComponent: function () {
        let me = this;

        let store = new Ext.data.Store({
            model: 'pmg-mynetworks',
            sorters: {
                property: 'cidr',
                direction: 'ASC',
            },
        });
        let reload = () => store.load();

        me.selModel = Ext.create('Ext.selection.RowModel', {});

        let run_editor = function () {
            let rec = me.selModel.getSelection()[0];
            if (!rec) {
                return;
            }
            Ext.createWidget('proxmoxWindowEdit', {
                autoShow: true,
                autoLoad: true,
                url: '/api2/extjs/config/mynetworks/' + rec.data.cidr,
                onlineHelp: 'pmgconfig_mailproxy_networks',
                method: 'PUT',
                subject: gettext('Trusted Network'),
                items: [
                    {
                        xtype: 'displayfield',
                        name: 'cidr',
                        fieldLabel: gettext('CIDR'),
                    },
                    {
                        xtype: 'textfield',
                        name: 'comment',
                        fieldLabel: gettext('Comment'),
                    },
                ],
                listeners: {
                    destroy: () => reload(),
                },
            });
        };

        let tbar = [
            {
                text: gettext('Create'),
                handler: () =>
                    Ext.createWidget('proxmoxWindowEdit', {
                        autoShow: true,
                        method: 'POST',
                        url: '/api2/extjs/config/mynetworks',
                        onlineHelp: 'pmgconfig_mailproxy_networks',
                        isCreate: true,
                        subject: gettext('Trusted Network'),
                        items: [
                            {
                                xtype: 'proxmoxtextfield',
                                name: 'cidr',
                                fieldLabel: gettext('CIDR'),
                            },
                            {
                                xtype: 'proxmoxtextfield',
                                name: 'comment',
                                fieldLabel: gettext('Comment'),
                            },
                        ],
                        listeners: {
                            destroy: () => reload(),
                        },
                    }),
            },
            '-',
            {
                xtype: 'proxmoxButton',
                text: gettext('Edit'),
                disabled: true,
                selModel: me.selModel,
                handler: run_editor,
            },
            {
                xtype: 'proxmoxStdRemoveButton',
                selModel: me.selModel,
                baseurl: '/config/mynetworks',
                callback: reload,
                waitMsgTarget: me,
            },
            '->',
            {
                xtype: 'pmgFilterField',
                filteredFields: ['cidr', 'comment'],
            },
        ];

        Proxmox.Utils.monStoreErrors(me, store, true);

        Ext.apply(me, {
            store: store,
            tbar: tbar,
            run_editor: run_editor,
            viewConfig: {
                trackOver: false,
            },
            columns: [
                {
                    header: gettext('Trusted Network'),
                    width: 200,
                    sortable: true,
                    dataIndex: 'cidr',
                },
                {
                    header: gettext('Comment'),
                    sortable: false,
                    renderer: Ext.String.htmlEncode,
                    dataIndex: 'comment',
                    flex: 1,
                },
            ],
            listeners: {
                itemdblclick: run_editor,
                activate: reload,
            },
        });

        me.callParent();
    },
});
