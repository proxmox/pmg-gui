Ext.define('PMG.VirusCharts', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'pmgVirusCharts',

    title: gettext('Statistics') + ': ' + gettext('Virus Charts'),

    border: false,
    disableSelection: true,

    tbar: [{ xtype: 'pmgStatTimeSelector' }],

    emptyText: gettext('No data in database'),
    viewConfig: {
        deferEmptyText: false,
    },

    store: {
        xclass: 'PMG.data.StatStore',
        fields: ['name', 'count'],
        staturl: '/api2/json/statistics/virus',
    },

    columns: [
        {
            header: gettext('Name'),
            flex: 1,
            dataIndex: 'name',
        },
        {
            header: gettext('Count'),
            width: 150,
            dataIndex: 'count',
        },
    ],

    initComponent: function () {
        var me = this;

        me.callParent();

        Proxmox.Utils.monStoreErrors(me, me.store);
    },
});
