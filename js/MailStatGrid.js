Ext.define('PMG.MailStatGrid', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'pmgMailStatGrid',

    disableSelection: true,
    hideHeaders: true,

    store: {
        fields: ['name', 'value', 'percentage'],
    },

    columns: [
        {
            flex: 1,
            dataIndex: 'name',
        },
        {
            width: 150,
            dataIndex: 'value',
        },
        {
            width: 300,

            xtype: 'widgetcolumn',
            dataIndex: 'percentage',
            widget: {
                xtype: 'progressbarwidget',
                textTpl: ['{percent:number("0")}%'],
            },

            onWidgetAttach: function (column, widget, rec) {
                if (rec.data.percentage === undefined) {
                    widget.setStyle('visibility: hidden');
                } else {
                    widget.setStyle('visibility: visible');
                }
            },
        },
    ],
});
