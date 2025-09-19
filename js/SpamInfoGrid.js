Ext.define('PMG.grid.SpamInfoGrid', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'pmgSpamInfoGrid',

    store: {
        autoDestroy: true,
        fields: ['desc', 'name', { type: 'number', name: 'score' }],
        proxy: {
            type: 'proxmox',
            root: 'data.spaminfo',
        },
        sorters: 'score',
    },

    setID: function (rec) {
        let me = this;
        let id = rec?.data?.id;
        if (!id) {
            me.getStore().removeAll();
            return;
        }
        me.store.proxy.setUrl(`/api2/json/quarantine/content?id=${id}`);
        me.store.load();
    },

    emptyText: gettext('No Spam Info'),
    hidden: true,

    features: [
        {
            ftype: 'summary',
        },
    ],

    viewConfig: {
        enableTextSelection: true,
    },

    columns: [
        {
            text: gettext('Test Name'),
            dataIndex: 'name',
            flex: 1,
            summaryType: 'count',
            summaryRenderer: (_v) => gettext('Spamscore'),
            tdCls: 'txt-monospace',
        },
        {
            text: gettext('Score'),
            dataIndex: 'score',
            align: 'right',
            tdCls: 'txt-monospace',
            renderer: function (score, meta) {
                if (score === 0) {
                    return score;
                }

                let absScore = Math.abs(score),
                    fontWeight = '400';
                let background = score < 0 ? '--pmg-spam-mid-neg' : '--pmg-spam-mid-pos';

                if (absScore >= 3) {
                    fontWeight = '900';
                    background = score < 0 ? '--pmg-spam-high-neg' : '--pmg-spam-high-pos';
                } else if (absScore >= 1.5) {
                    fontWeight = '600';
                } else if (absScore <= 0.1) {
                    fontWeight = '200';
                    background = score < 0 ? '--pmg-spam-low-neg' : '--pmg-spam-low-pos';
                }

                meta.tdStyle = `font-weight: ${fontWeight};background-color: var(${background});`;
                return score;
            },
            summaryType: 'sum',
            summaryRenderer: (value) => Ext.util.Format.round(value, 5),
        },
        {
            text: gettext('Description'),
            dataIndex: 'desc',
            flex: 2,
        },
    ],
});
