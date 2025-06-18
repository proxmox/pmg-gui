Ext.define('PMG.ObjectGroup', {
    extend: 'Ext.grid.GridPanel',
    alias: 'widget.pmgObjectGroup',

    baseurl: undefined,

    otype_list: [],

    hideGroupInfo: false,
    showDirection: false, // only important for SMTP Whitelist

    ogdata: undefined,
    objectClass: undefined,

    emptyText: gettext('Please select an object.'),

    setBaseUrl: function (baseurl) {
        let me = this;

        me.baseurl = baseurl;

        if (me.baseurl === undefined) {
            me.store.proxy.setUrl(undefined);
            me.store.setData([]);
            me.setButtonState(me.store, [], false);
        } else {
            let url = '/api2/json' + me.baseurl + '/objects';
            me.store.proxy.setUrl(url);
            me.store.load();
        }
    },

    setObjectInfo: function (ogdata) {
        let me = this;

        let mode = ogdata?.invert ? 'not' : '';
        mode += ogdata?.and ? 'all' : 'any';

        me.ogdata = ogdata;

        if (me.ogdata === undefined) {
            me.down('#oginfo').update(me.emptyText);
            me.down('#separator').setHidden(true);
            me.down('#modeBox').setHidden(true);
            me.down('#whatWarning').setHidden(true);
        } else {
            let html =
                '<b style="font-weight: bold;">' + Ext.String.htmlEncode(me.ogdata.name) + '</b>';
            html += '<br><br>';
            html += Ext.String.htmlEncode(Ext.String.trim(me.ogdata.info));

            me.down('#oginfo').update(html);
            me.down('#ogdata').setHidden(false);
            me.down('#separator').setHidden(false);
            let modeSelector = me.down('#modeSelector');
            modeSelector.suspendEvents();
            me.down('#modeSelector').setValue(mode);
            modeSelector.resumeEvents();
            me.down('#modeBox').setHidden(false);
            me.down('#whatWarning').setHidden(me.objectClass !== 'what' || mode === 'any');
        }
    },

    setButtonState: function (store, records, success) {
        let me = this;
        if (!success || !me.baseurl) {
            me.down('#addMenuButton').setDisabled(true);
            return;
        }
        me.down('#addMenuButton').setDisabled(false);
    },

    initComponent: function () {
        let me = this;

        me.store = new Ext.data.Store({
            model: 'pmg-object-list',
            proxy: {
                type: 'proxmox',
            },
            sorters: [
                {
                    property: 'receivertest',
                },
                {
                    property: 'otype',
                    direction: 'ASC',
                },
            ],
        });

        me.columns = [
            {
                header: gettext('Type'),
                dataIndex: 'otype',
                renderer: PMG.Utils.format_otype,
                width: 200,
            },
        ];

        if (me.showDirection) {
            me.columns.push({
                header: gettext('Direction'),
                dataIndex: 'receivertest',
                renderer: function (value) {
                    return value ? PMG.Utils.receiverText : PMG.Utils.senderText;
                },
            });
        }

        me.columns.push({
            header: gettext('Value'),
            dataIndex: 'descr',
            renderer: Ext.String.htmlEncode,
            flex: 1,
        });

        let reload = function () {
            me.store.load();
        };

        me.selModel = Ext.create('Ext.selection.RowModel', {});

        let remove_btn = Ext.createWidget('proxmoxStdRemoveButton', {
            selModel: me.selModel,
            getUrl: function (rec) {
                return me.baseurl + '/objects/' + rec.data.id;
            },
            callback: reload,
            getRecordName: function (rec) {
                return PMG.Utils.format_otype_subject(rec.data.otype) + ': ' + rec.data.descr;
            },
            waitMsgTarget: me,
        });

        let full_subject = function (subject, receivertest) {
            if (me.showDirection) {
                let direction = receivertest ? PMG.Utils.receiverText : PMG.Utils.senderText;

                return subject + ' (' + direction + ')';
            } else {
                return subject;
            }
        };

        let run_editor = function () {
            let rec = me.selModel.getSelection()[0];
            if (!rec) {
                return;
            }

            let editor = PMG.Utils.object_editors[rec.data.otype];
            if (!editor || editor.uneditable) {
                return;
            }

            let config = Ext.apply({ method: 'PUT' }, editor);
            config.subject = full_subject(editor.subject, rec.data.receivertest);
            config.url = me.baseurl + '/' + editor.subdir + '/' + rec.data.id;

            let win = Ext.createWidget(config);

            win.load();
            win.on('destroy', reload);
            win.show();
        };

        let menu_items = [];

        Ext.Array.each(me.otype_list, function (otype) {
            let editor = PMG.Utils.object_editors[otype];

            let config = Ext.apply({ method: 'POST' }, editor);
            config.subject = full_subject(editor.subject, editor.receivertest);

            menu_items.push({
                text: config.subject,
                iconCls: config.iconCls || 'fa fa-question-circle',
                handler: function () {
                    if (me.baseurl === undefined) {
                        return;
                    }
                    config.url = me.baseurl + '/' + editor.subdir;
                    let win = Ext.create(config);
                    win.on('destroy', reload);
                    win.show();
                },
            });
        });

        me.dockedItems = [];

        me.dockedItems.push({
            xtype: 'toolbar',
            dock: 'top',
            items: [
                {
                    text: gettext('Add'),
                    disabled: true,
                    itemId: 'addMenuButton',
                    menu: {
                        items: menu_items,
                    },
                },
                '-',
                {
                    xtype: 'proxmoxButton',
                    text: gettext('Edit'),
                    disabled: true,
                    selModel: me.selModel,
                    enableFn: function (rec) {
                        let editor = PMG.Utils.object_editors[rec.data.otype];
                        return editor && !editor.uneditable;
                    },
                    handler: run_editor,
                },
                remove_btn,
                '->',
                {
                    xtype: 'pmgFilterField',
                    filteredFields: [
                        {
                            name: 'otype',
                            renderer: (otype) => PMG.Utils.object_editors[otype].subject,
                        },
                        'descr',
                    ],
                },
            ],
        });

        me.dockedItems.push({
            dock: 'top',
            border: 1,
            layout: {
                type: 'hbox',
                align: 'stretch',
            },
            hidden: !!me.hideGroupInfo,
            itemId: 'ogdata',
            xtype: 'toolbar',
            items: [
                {
                    xtype: 'container',
                    itemId: 'modeBox',
                    hidden: true,
                    width: 220,
                    padding: 10,
                    layout: {
                        type: 'vbox',
                        align: 'stretch',
                    },
                    items: [
                        {
                            xtype: 'box',
                            html: `<b style="font-weight: bold;">${gettext('Match if')}</b>`,
                        },
                        {
                            xtype: 'pmgMatchModeSelector',
                            itemId: 'modeSelector',
                            padding: '10 0 0 0',
                            listeners: {
                                change: function (_field, value) {
                                    let invert = value.startsWith('not') ? 1 : 0;
                                    let and = value.endsWith('all') ? 1 : 0;

                                    Proxmox.Utils.API2Request({
                                        url: `${me.baseurl}/config`,
                                        method: 'PUT',
                                        params: {
                                            and,
                                            invert,
                                        },
                                        success: () => {
                                            me.fireEvent('modeUpdate', me, !!and, !!invert);
                                            me.down('#whatWarning').setHidden(
                                                me.objectClass !== 'what' || value === 'any',
                                            );
                                        },
                                    });
                                },
                            },
                        },
                    ],
                },
                {
                    xtype: 'tbseparator',
                    itemId: 'separator',
                    hidden: true,
                },
                {
                    xtype: 'component',
                    flex: 1,
                    itemId: 'oginfo',
                    style: { 'white-space': 'pre' },
                    padding: 10,
                    html: me.emptyText,
                    listeners: {
                        dblclick: {
                            fn: function (e, t) {
                                if (me.ogdata === undefined) {
                                    return;
                                }
                                me.fireEvent('dblclickOGInfo', me, e, t, me.ogdata);
                            },
                            element: 'el',
                            scope: this,
                        },
                    },
                },
            ],
        });

        me.dockedItems.push({
            dock: 'top',
            border: 1,
            hidden: true,
            itemId: 'whatWarning',
            bodyPadding: 5,
            items: {
                xtype: 'displayfield',
                margin: 0,
                value: gettext(
                    "Caution: 'What Objects' match each mail part separately, so be careful with any option besides 'Any matches'.",
                ),
                userCls: 'pmx-hint',
            },
        });

        Proxmox.Utils.monStoreErrors(me, me.store, true);

        Ext.apply(me, {
            run_editor: run_editor,
            listeners: {
                itemdblclick: run_editor,
                activate: reload,
            },
        });

        me.callParent();

        me.mon(me.store, 'load', me.setButtonState, me);

        if (me.baseurl) {
            me.setBaseUrl(me.baseurl); // configure store, load()
        }
    },
});
