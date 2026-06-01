Ext.define('pmg-virus-list', {
    extend: 'Ext.data.Model',
    fields: [
        'id',
        'envelope_sender',
        'from',
        'sender',
        'receiver',
        'subject',
        { type: 'integer', name: 'bytes' },
        { type: 'string', name: 'virusname' },
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
        url: '/api2/json/quarantine/virus',
    },
    idProperty: 'id',
});

Ext.define('PMG.VirusQuarantine', {
    extend: 'Ext.container.Container',
    xtype: 'pmgVirusQuarantine',

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
            title: gettext('Virus Quarantine'),
            xtype: 'pmgQuarantineList',
            emptyText: gettext('No data in database'),
            selModel: 'checkboxmodel',
            quarantineType: 'virus',
            reference: 'list',
            region: 'west',
            width: 600,
            split: true,
            collapsible: false,
            store: {
                model: 'pmg-virus-list',
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
                    header: gettext('Virus'),
                    dataIndex: 'virusname',
                    align: 'right',
                    width: 70,
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
                    dock: 'top',
                    overflowHandler: 'scroller',
                    style: {
                        // docked items have set the bottom with to 0px with '! important'
                        // but we still want one here, so we can remove the borders of the grids
                        'border-bottom-width': '1px ! important',
                    },
                    items: [
                        {
                            xtype: 'button',
                            reference: 'raw',
                            text: gettext('Toggle Raw'),
                            enableToggle: true,
                            iconCls: 'fa fa-file-code-o',
                        },
                        {
                            xtype: 'button',
                            reference: 'loadimages',
                            text: gettext('Load Images'),
                            enableToggle: true,
                            iconCls: 'fa fa-image',
                            // only has an effect when the configured image mode is 'on-demand'
                            tooltip: gettext(
                                'Load external images of this mail (only effective with the on-demand image mode)',
                            ),
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
                            iconCls: 'fa fa-paper-plane-o info-blue',
                            handler: 'btnHandler',
                        },
                        {
                            reference: 'delete',
                            text: gettext('Delete'),
                            iconCls: 'fa fa-trash-o critical',
                            handler: 'btnHandler',
                        },
                    ],
                },
                {
                    xtype: 'pmgMailInfo',
                    hidden: true,
                    reference: 'mailinfo',
                    border: false,
                },
                {
                    xtype: 'pmgAttachmentGrid',
                    reference: 'attachmentlist',
                    showDownloads: false,
                    border: false,
                    dock: 'bottom',
                },
            ],
        },
    ],
});
