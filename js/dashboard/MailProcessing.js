Ext.define('PMG.dashboard.MailProcessing', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgMailProcessing',

    setData: function (data) {
        var me = this;
        me.down('#ptime').update(data);
        me.down('#traffic').update(data);
    },

    layout: {
        type: 'hbox',
        align: 'center',
        pack: 'center',
    },

    defaults: {
        xtype: 'box',
        flex: 1,
        style: {
            'text-align': 'center',
        },
    },

    items: [
        {
            itemId: 'traffic',
            data: {
                bytes_in: 0,
                bytes_out: 0,
            },
            tpl: [
                '<h3><i class="fa fa-exchange green"></i> ' + gettext('Traffic') + '</h3>',
                '<table class="dash"><tr>',
                '<td class="right half"><h2>{bytes_in}</h2></td>',
                '<td class="left">' + PMG.Utils.format_rule_direction(0) + '</td>',
                '</tr><tr>',
                '<td class="right half"><h2>{bytes_out}</h2></td>',
                '<td class="left">' + PMG.Utils.format_rule_direction(1) + '</td>',
                '</tr></table>',
            ],
        },
        {
            itemId: 'ptime',
            data: {
                avg_ptime: 0,
            },
            tpl: [
                '<h3><i class="fa fa-clock-o"></i> ' +
                    gettext('Avg. Mail Processing Time') +
                    '</h3>',
                '<p><h2>{avg_ptime}</h2></p>',
            ],
        },
    ],
});
