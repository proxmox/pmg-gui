Ext.define('PMG.ObjectGroupConfiguration', {
    extend: 'Ext.panel.Panel',

    ogclass: undefined, // who, when, what
    otype_list: [],

    layout: 'border',
    border: false,

    initComponent: function () {
        var me = this;

        if (me.ogclass === undefined) {
            throw 'undefined object group class';
        }

        if (!PMG.Utils.oclass_text[me.ogclass]) {
            throw 'unknown object group class';
        }

        var left = Ext.create('PMG.ObjectGroupList', {
            width: 250,
            ogclass: me.ogclass,
            subject: PMG.Utils.oclass_text[me.ogclass],
            title: PMG.Utils.oclass_text[me.ogclass],
            border: false,
            split: true,
            region: 'west',
        });

        var right = Ext.create('PMG.ObjectGroup', {
            otype_list: me.otype_list,
            objectClass: me.ogclass,
            border: false,
            region: 'center',
            listeners: {
                dblclickOGInfo: function (w, e, t, ogdata) {
                    // test if the correct groups is selected (just to be sure)
                    var rec = left.selModel.getSelection()[0];
                    if (rec && rec.data && rec.data.id === ogdata.id) {
                        left.run_editor();
                    }
                },
                modeUpdate: (_cmp, and, invert) => {
                    let rec = left.selModel.getSelection()[0];
                    rec.set('and', and);
                    rec.set('invert', invert);
                    rec.commit();
                },
            },
        });

        me.mon(left.store, 'refresh', function () {
            var rec = left.selModel.getSelection()[0];
            if (!(rec && rec.data && rec.data.id)) {
                return;
            }
            right.setObjectInfo(rec.data);
        });

        me.mon(left.selModel, 'selectionchange', function () {
            var rec = left.selModel.getSelection()[0];
            if (!(rec && rec.data && rec.data.id)) {
                right.setObjectInfo(undefined);
                right.setBaseUrl(undefined);
                return;
            }
            right.setObjectInfo(rec.data);
            var baseurl = '/config/ruledb/' + me.ogclass + '/' + rec.data.id;
            right.setBaseUrl(baseurl);
        });

        me.items = [left, right];

        me.callParent();
    },
});

Ext.define('PMG.WhoConfiguration', {
    extend: 'PMG.ObjectGroupConfiguration',
    xtype: 'pmgWhoConfiguration',

    ogclass: 'who',
    otype_list: [1000, 1001, 1002, 1003, 1004, 1005, 1006],
});

Ext.define('PMG.WhenConfiguration', {
    extend: 'PMG.ObjectGroupConfiguration',
    xtype: 'pmgWhenConfiguration',

    ogclass: 'when',
    otype_list: [2000],
});

Ext.define('PMG.WhatConfiguration', {
    extend: 'PMG.ObjectGroupConfiguration',
    xtype: 'pmgWhatConfiguration',

    ogclass: 'what',
    otype_list: [3000, 3001, 3002, 3003, 3004, 3005, 3006],
});
