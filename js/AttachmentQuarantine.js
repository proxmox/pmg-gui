Ext.define('pmg-attachment-list', {
    extend: 'Ext.data.Model',
    fields: [
        'id',
        'envelope_sender',
        'from',
        'sender',
        'receiver',
        'subject',
        { type: 'integer', name: 'bytes' },
        { type: 'date', dateFormat: 'timestamp', name: 'time' },
        {
            type: 'string',
            name: 'day',
            convert: function (v, rec) {
                return Ext.Date.format(rec.get('time'), 'Y-m-d');
            },
            depends: ['time'],
        },
    ],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/quarantine/attachment',
    },
    idProperty: 'id',
});

Ext.define('PMG.AttachmentQuarantine', {
    extend: 'Ext.container.Container',
    xtype: 'pmgAttachmentQuarantine',

    border: false,
    layout: { type: 'border' },

    defaults: { border: false },

    viewModel: {
        parent: null,
        data: {
            mailid: '',
        },
        formulas: {
            downloadMailURL: (get) =>
                '/api2/json/quarantine/download?mailid=' + encodeURIComponent(get('mailid')),
        },
    },
    controller: 'quarantine',
    items: [
        {
            title: gettext('Attachment Quarantine'),
            xtype: 'pmgQuarantineList',
            emptyText: gettext('No data in database'),
            selModel: 'checkboxmodel',
            quarantineType: 'attachment',
            reference: 'list',
            region: 'west',
            width: 600,
            split: true,
            collapsible: false,
            store: {
                model: 'pmg-attachment-list',
                groupField: 'day',
                groupDir: 'DESC',
                sorters: [
                    {
                        property: 'time',
                        direction: 'DESC',
                    },
                ],
            },

            columns: [
                {
                    header: `${gettext('Sender')}/${gettext('Receiver')}/${gettext('Subject')}`,
                    dataIndex: 'subject',
                    renderer: PMG.Utils.render_sender_receiver,
                    flex: 1,
                },
                {
                    header: gettext('Size') + ' (KB)',
                    renderer: (v) => Ext.Number.toFixed(v / 1024, 0),
                    dataIndex: 'bytes',
                    align: 'right',
                    width: 90,
                },
                {
                    header: gettext('Date'),
                    dataIndex: 'day',
                    hidden: true,
                },
                {
                    xtype: 'datecolumn',
                    header: gettext('Time'),
                    dataIndex: 'time',
                    format: 'H:i:s',
                },
            ],
        },
        {
            title: gettext('Selected Mail'),
            border: false,
            region: 'center',
            layout: 'fit',
            split: true,
            reference: 'preview',
            disabled: true,
            dockedItems: [
                {
                    xtype: 'toolbar',
                    overflowHandler: 'scroller',
                    dock: 'top',
                    listeners: {
                        resize: 'onToolbarResize',
                    },
                    items: [
                        {
                            xtype: 'button',
                            reference: 'raw',
                            text: gettext('Toggle Raw'),
                            tooltip: gettext('Show the raw message source instead of the rendered mail'),
                            responsiveText: true,
                            ariaLabel: gettext('Toggle raw message source'),
                            enableToggle: true,
                            iconCls: 'fa fa-file-code-o',
                        },
                        {
                            xtype: 'tbseparator',
                            reference: 'themeCheckSep',
                        },
                        {
                            xtype: 'proxmoxcheckbox',
                            reference: 'themeCheck',
                            checked: true,
                            boxLabel: gettext('Dark-mode filter'),
                            iconCls: 'fa fa-paint-brush',
                        },
                        '->',
                        {
                            xtype: 'button',
                            reference: 'download',
                            text: gettext('Download'),
                            tooltip: gettext('Download this mail as an .eml file'),
                            responsiveText: true,
                            ariaLabel: gettext('Download this mail as .eml'),
                            setDownload: function (id) {
                                this.el.dom.download = id + '.eml';
                            },
                            bind: {
                                href: '{downloadMailURL}',
                                download: '{mailid}',
                            },
                            iconCls: 'fa fa-download',
                        },
                        {
                            reference: 'deliver',
                            text: gettext('Deliver'),
                            tooltip: gettext('Release this mail to its recipient'),
                            iconCls: 'fa fa-paper-plane-o info-blue',
                            handler: 'btnHandler',
                        },
                        {
                            reference: 'delete',
                            text: gettext('Delete'),
                            tooltip: gettext('Permanently delete this quarantined mail'),
                            iconCls: 'fa fa-trash-o critical',
                            handler: 'btnHandler',
                        },
                    ],
                },
                {
                    xtype: 'pmgMailInfo',
                    hidden: true,
                    reference: 'mailinfo',
                },
                {
                    xtype: 'pmgAttachmentGrid',
                    reference: 'attachmentlist',
                    dock: 'bottom',
                    collapsible: false,
                },
            ],
        },
    ],
});
