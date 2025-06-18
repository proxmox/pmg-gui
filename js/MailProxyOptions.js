Ext.define('PMG.MailProxyOptions', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.pmgMailProxyOptions'],

    monStoreErrors: true,

    initComponent: function () {
        var me = this;

        me.add_integer_row('maxsize', gettext('Message Size (bytes)'), {
            defaultValue: 1024 * 1024 * 10,
            minValue: 1024,
            deleteEmpty: true,
        });

        me.add_boolean_row('rejectunknown', gettext('Reject Unknown Clients'));

        me.add_boolean_row('rejectunknownsender', gettext('Reject Unknown Senders'));

        me.add_boolean_row('helotests', gettext('SMTP HELO checks'));

        me.add_text_row('dnsbl_sites', gettext('DNSBL Sites'), {
            deleteEmpty: true,
            defaultValue: Proxmox.Utils.noneText,
            renderer: Ext.htmlEncode,
        });

        me.add_integer_row('dnsbl_threshold', gettext('DNSBL Threshold'), {
            deleteEmpty: true,
            defaultValue: 1,
            minValue: 0,
        });

        var render_verifyreceivers = function (value) {
            if (value === undefined || value === '__default__') {
                return Proxmox.Utils.noText;
            }
            return Proxmox.Utils.yesText + ' (' + value + ')';
        };

        me.add_combobox_row('verifyreceivers', gettext('Verify Receivers'), {
            renderer: render_verifyreceivers,
            defaultValue: '__default__',
            deleteEmpty: true,
            comboItems: [
                ['__default__', render_verifyreceivers('__default__')],
                ['450', render_verifyreceivers('450')],
                ['550', render_verifyreceivers('550')],
            ],
        });

        me.add_boolean_row('greylist', gettext('Use Greylisting for IPv4'), {
            defaultValue: 1,
        });

        me.add_integer_row('greylistmask4', gettext('Netmask for Greylisting IPv4'), {
            defaultValue: 24,
            minValue: 0,
            maxValue: 32,
        });

        me.add_boolean_row('greylist6', gettext('Use Greylisting for IPv6'), {
            defaultValue: 0,
        });

        me.add_integer_row('greylistmask6', gettext('Netmask for Greylisting IPv6'), {
            defaultValue: 64,
            minValue: 0,
            maxValue: 128,
        });

        me.add_boolean_row('spf', gettext('Use SPF'), { defaultValue: 1 });

        me.add_boolean_row('hide_received', gettext('Hide Internal Hosts'));

        me.add_integer_row('dwarning', gettext('Delay Warning Time (hours)'), {
            defaultValue: 4,
            minValue: 0,
        });

        me.add_integer_row('conn_count_limit', gettext('Client Connection Count Limit'), {
            defaultValue: 50,
            minValue: 0,
            maxValue: 65535,
        });

        me.add_integer_row('conn_rate_limit', gettext('Client Connection Rate Limit'), {
            defaultValue: 0,
            minValue: 0,
        });

        me.add_integer_row('message_rate_limit', gettext('Client Message Rate Limit'), {
            defaultValue: 0,
            minValue: 0,
        });

        me.add_text_row('banner', gettext('SMTPD Banner'), {
            deleteEmpty: true,
            defaultValue: 'ESMTP Proxmox',
            renderer: Ext.htmlEncode,
        });

        me.add_boolean_row('ndr_on_block', gettext('Send NDR on Blocked E-Mails'));
        // FIXME allow to pass onlineHelp to ObjectGrid's add_xyz_row..
        // onlineHelp: 'pmgconfig_mailproxy_before_after_queue',
        me.rows.ndr_on_block.editor.onlineHelp = 'pmgconfig_mailproxy_before_after_queue';

        me.add_boolean_row('before_queue_filtering', gettext('Before Queue Filtering'));

        var baseurl = '/config/mail';

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
                onlineHelp: 'pmgconfig_mailproxy_options',
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
