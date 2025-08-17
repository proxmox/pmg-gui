Ext.define('PMG.SpamDetectorOptions', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.pmgSpamDetectorOptions'],

    monStoreErrors: true,

    initComponent: function () {
        var me = this;

        me.add_boolean_row('use_awl', gettext('Use auto-welcomelists'), {
            defaultValue: 0,
        });

        me.add_boolean_row('use_bayes', gettext('Use Bayesian filter'), {
            defaultValue: 0,
        });

        me.add_boolean_row('rbl_checks', gettext('Use RBL checks'), {
            defaultValue: 1,
        });

        me.add_boolean_row('use_razor', gettext('Use Razor2 checks'), {
            defaultValue: 1,
        });

        me.add_boolean_row('extract_text', gettext('Extract Text from Attachments'));

        me.add_integer_row('maxspamsize', gettext('Max Spam Size (bytes)'), {
            defaultValue: 256 * 1024,
            minValue: 64,
            deleteEmpty: true,
        });

        me.rows.languages = {
            required: true,
            header: gettext('Languages'),
            editor: 'PMG.SpamDetectorLanguages',
            renderer: (value) => value || 'all',
        };

        me.add_integer_row('bounce_score', gettext('Backscatter Score'), {
            defaultValue: 0,
            minValue: 0,
            maxValue: 1000,
            deleteEmpty: true,
        });

        me.add_integer_row('clamav_heuristic_score', gettext('Heuristic Score'), {
            defaultValue: 3,
            minValue: 0,
            maxValue: 1000,
            deleteEmpty: true,
        });

        var baseurl = '/config/spam';

        me.selModel = Ext.create('Ext.selection.RowModel', {});

        Ext.apply(me, {
            tbar: [
                {
                    text: gettext('Edit'),
                    xtype: 'proxmoxButton',
                    disabled: true,
                    handler: function () {
                        me.run_editor();
                    },
                    selModel: me.selModel,
                },
            ],
            url: '/api2/json' + baseurl,
            editorConfig: {
                url: '/api2/extjs' + baseurl,
                onlineHelp: 'pmgconfig_spamdetector',
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
