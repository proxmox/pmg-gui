Ext.define('PMG.grid.AttachmentGrid', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'pmgAttachmentGrid',
    mixins: ['Proxmox.Mixin.CBind'],

    showDownloads: true,

    title: gettext('Attachments'),
    iconCls: 'fa fa-paperclip',

    minHeight: 50,
    maxHeight: 250,
    scrollable: true,

    collapsible: true,
    titleCollapse: true,
    animCollapse: false,

    tbar: [
        '->',
        {
            xtype: 'checkbox',
            boxLabel: gettext('Show All Parts'),
            boxLabelAlgign: 'before',
            listeners: {
                change: function (checkBox, value) {
                    let store = this.up('pmgAttachmentGrid').getStore();
                    store.clearFilter();
                    if (!value) {
                        store.filter({
                            property: 'content-disposition',
                            value: 'attachment',
                        });
                    }
                },
            },
        },
    ],

    store: {
        autoDestroy: true,
        fields: ['name', 'content-type', 'size', 'content-disposition'],
        proxy: {
            type: 'proxmox',
        },
        filters: {
            property: 'content-disposition',
            value: 'attachment',
        },
    },

    controller: {
        xclass: 'Ext.app.ViewController',
        init: function (view) {
            view.store.on('load', this.onLoad, this);
        },
        onLoad: function (store, records, success) {
            let me = this;
            let view = me.getView();
            if (!success) {
                view.updateTitleStats(-1);
                return;
            }
            let attachments = records.filter(
                ({ data }) => data['content-disposition'] === 'attachment',
            );
            let totalSize = attachments.reduce((sum, { data }) => sum + data.size, 0);
            view.updateTitleStats(attachments.length, totalSize);
        },
    },

    updateTitleStats: function (count, totalSize) {
        let me = this;
        let title;
        if (count > 0) {
            title = Ext.String.format(gettext('{0} Attachments'), count);
            title += ` (${Proxmox.Utils.format_size(totalSize)})`;
            if (me.collapsible) {
                me.expand();
            }
        } else {
            title = gettext('No Attachments');
            if (me.collapsible) {
                me.collapse();
            }
        }
        me.setTitle(title);
    },

    setID: function (rec) {
        var me = this;
        if (!rec || !rec.data || !rec.data.id) {
            me.getStore().removeAll();
            return;
        }
        var url = '/api2/json/quarantine/listattachments?id=' + rec.data.id;
        me.mailid = rec.data.id;
        me.store.proxy.setUrl(url);
        me.store.load();
    },

    emptyText: gettext('No Attachments'),

    download: function () {
        Ext.Msg.alert(arguments);
    },

    columns: [
        {
            text: gettext('Filename'),
            dataIndex: 'name',
            flex: 1,
        },
        {
            text: gettext('Filetype'),
            dataIndex: 'content-type',
            renderer: PMG.Utils.render_filetype,
            flex: 1,
        },
        {
            text: gettext('Size'),
            renderer: Proxmox.Utils.render_size,
            dataIndex: 'size',
            flex: 1,
        },
        {
            header: gettext('Download'),
            cbind: {
                hidden: '{!showDownloads}',
            },
            renderer: function (value, mD, rec) {
                var me = this;
                let url = `/api2/json/quarantine/download?mailid=${me.mailid}&attachmentid=${rec.data.id}`;
                return `<a target='_blank' class='download' download='${rec.data.name}' href='${url}'>
		    <i class='fa fa-fw fa-download'</i>
		</a>`;
            },
        },
    ],
});
