Ext.define('PMG.RBLStatistics', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgRBLStatistics',

    scrollable: true,
    border: false,

    bodyPadding: '10 0 10 10',

    title: gettext('Statistics') + ': ' + gettext('Postscreen'),

    tbar: [{ xtype: 'pmgStatTimeSelector' }],

    items: [
        {
            title: gettext('Rejects'),
            xtype: 'proxmoxRRDChart',
            fields: ['rbl_rejects', 'pregreet_rejects'],
            fieldTitles: ['RBL', 'PREGREET'],
            store: {
                type: 'pmgStatStore',
                includeTimeSpan: true,
                staturl: '/api2/json/statistics/rejectcount',
                fields: [
                    { type: 'integer', name: 'rbl_rejects' },
                    { type: 'integer', name: 'pregreet_rejects' },
                    { type: 'date', dateFormat: 'timestamp', name: 'time' },
                ],
            },
        },
    ],
});
