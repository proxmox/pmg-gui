Ext.define('PMG.SpamScoreDistribution', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'pmgSpamScoreDistribution',

    disableSelection: true,
    border: false,

    title: gettext('Statistics') + ': ' + gettext('Spam Scores'),

    tbar: [{ xtype: 'pmgStatTimeSelector' }],

    store: {
        xclass: 'PMG.data.StatStore',
        staturl: '/api2/json/statistics/spamscores',
        fields: [
            'count',
            'ratio',
            {
                type: 'string',
                name: 'label',
                convert: function (v, rec) {
                    if (rec.data.level >= 10) {
                        return PMG.Utils.scoreText + ' >= 10';
                    } else {
                        return PMG.Utils.scoreText + ' ' + rec.data.level.toString();
                    }
                },
            },
        ],
    },

    columns: [
        {
            header: PMG.Utils.scoreText,
            flex: 1,
            dataIndex: 'label',
        },
        {
            header: gettext('Count'),
            width: 150,
            dataIndex: 'count',
        },
        {
            header: gettext('Percentage'),
            width: 300,

            xtype: 'widgetcolumn',
            dataIndex: 'ratio',
            widget: {
                xtype: 'progressbarwidget',
                textTpl: ['{percent:number("0")}%'],
            },
        },
    ],
});
