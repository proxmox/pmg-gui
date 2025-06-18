Ext.define('PMG.MailDistChart', {
    extend: 'Ext.chart.CartesianChart',
    xtype: 'pmgMailDistChart',

    width: 770,
    height: 300,
    animation: false,

    axes: [
        {
            type: 'numeric',
            title: gettext('Count'),
            position: 'left',
            grid: true,
            minimum: 0,
        },
        {
            type: 'category',
            position: 'bottom',
            fields: ['index'],
        },
    ],

    checkThemeColors: function () {
        let me = this;
        let rootStyle = getComputedStyle(document.documentElement);

        // get colors
        let background = rootStyle.getPropertyValue('--pwt-panel-background').trim() || '#ffffff';
        let text = rootStyle.getPropertyValue('--pwt-text-color').trim() || '#000000';
        let primary = rootStyle.getPropertyValue('--pwt-chart-primary').trim() || '#000000';
        let gridStroke = rootStyle.getPropertyValue('--pwt-chart-grid-stroke').trim() || '#dddddd';

        // set the colors
        me.setBackground(background);
        me.axes.forEach((axis) => {
            axis.setLabel({ color: text });
            axis.setTitle({ color: text });
            axis.setStyle({ strokeStyle: primary });
            axis.setGrid({ stroke: gridStroke });
        });
        me.redraw();
    },

    initComponent: function () {
        var me = this;

        if (!me.store) {
            throw 'cannot work without store';
        }

        if (!me.field) {
            throw 'cannot work without a field';
        }

        me.callParent();

        me.addSeries({
            type: 'bar',
            xField: 'index',
            yField: me.field,
            tooltip: {
                trackMouse: true,
                renderer: function (tooltip, record, item) {
                    var start = record.get('index');
                    var end = start + 1;
                    tooltip.setHtml(
                        'Time: ' +
                            start.toString() +
                            ' - ' +
                            end.toString() +
                            '<br>' +
                            'Count: ' +
                            record.get(item.field),
                    );
                },
            },
        });

        me.checkThemeColors();

        // switch colors on media query changes
        me.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        me.themeListener = (e) => {
            me.checkThemeColors();
        };
        me.mediaQueryList.addEventListener('change', me.themeListener);
    },

    doDestroy: function () {
        let me = this;

        me.mediaQueryList.removeEventListener('change', me.themeListener);

        me.callParent();
    },
});

Ext.define('PMG.HourlyMailDistribution', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgHourlyMailDistribution',

    scrollable: true,
    border: false,

    bodyPadding: '10 0 0 0',
    defaults: {
        width: 700,
        padding: '0 0 10 10',
    },

    layout: 'column',

    title: gettext('Statistics') + ': ' + gettext('Hourly Distribution'),

    tbar: [{ xtype: 'pmgStatTimeSelector' }],

    initComponent: function () {
        var me = this;

        var store = Ext.create('PMG.data.StatStore', {
            staturl: '/api2/json/statistics/maildistribution',
            fields: [
                { type: 'integer', name: 'index' },
                { type: 'integer', name: 'count' },
                { type: 'integer', name: 'count_in' },
                { type: 'integer', name: 'count_out' },
                { type: 'integer', name: 'spamcount_in' },
                { type: 'integer', name: 'spamcount_out' },
                { type: 'integer', name: 'viruscount_in' },
                { type: 'integer', name: 'viruscount_ou' },
                { type: 'integer', name: 'bounces_in' },
                { type: 'integer', name: 'bounces_out' },
            ],
        });

        me.items = [
            {
                xtype: 'pmgMailDistChart',
                title: gettext('Incoming Mails'),
                field: 'count_in',
                store: store,
            },
            {
                xtype: 'pmgMailDistChart',
                title: gettext('Outgoing Mails'),
                field: 'count_out',
                store: store,
            },
        ];

        me.callParent();

        me.on('destroy', store.destroy, store);
    },
});
