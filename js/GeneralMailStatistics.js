Ext.define('PMG.GeneralMailStatistics', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmgGeneralMailStatistics',

    scrollable: true,

    bodyPadding: '10 0 0 0',
    border: false,
    defaults: {
        width: 700,
        padding: '0 0 10 10',
    },

    layout: 'column',

    title: gettext('Statistics') + ': ' + gettext('Mail'),

    tbar: [{ xtype: 'pmgStatTimeSelector' }],

    getInData: function (data) {
        var res = [];

        res.push({
            name: gettext('Incoming Mails'),
            value: data.count_in,
            percentage: 1,
        });

        res.push({
            name: gettext('Junk Mails'),
            value: data.junk_in,
            percentage: data.junk_in / data.count_in,
        });

        res.push({
            name: gettext('Greylisted Mails'),
            value: data.glcount,
            percentage: data.glcount / data.count_in,
        });

        res.push({
            name: gettext('Spam Mails'),
            value: data.spamcount_in,
            percentage: data.spamcount_in / data.count_in,
        });

        res.push({
            name: gettext('SPF rejects'),
            value: data.spfcount,
            percentage: data.spfcount / data.count_in,
        });

        res.push({
            name: gettext('Bounces'),
            value: data.bounces_in,
            percentage: data.bounces_in / data.count_in,
        });

        res.push({
            name: gettext('Virus Mails'),
            value: data.viruscount_in,
            percentage: data.viruscount_in / data.count_in,
        });

        return res;
    },

    getOutData: function (data) {
        var res = [];

        res.push({
            name: gettext('Outgoing Mails'),
            value: data.count_out,
            percentage: 1,
        });

        res.push({
            name: gettext('Bounces'),
            value: data.bounces_out,
            percentage: data.bounces_out / data.count_out,
        });

        res.push({
            name: gettext('Virus Mails'),
            value: data.viruscount_out,
            percentage: data.viruscount_out / data.count_out,
        });

        return res;
    },

    getGeneralData: function (data) {
        var res = [];

        res.push({
            name: gettext('Total Mails'),
            value: data.count,
            percentage: 1,
        });

        res.push({
            name: gettext('Incoming Mails'),
            value: data.count_in,
            percentage: data.count_in / data.count,
        });

        res.push({
            name: gettext('Outgoing Mails'),
            value: data.count_out,
            percentage: data.count_out / data.count,
        });

        res.push({
            name: gettext('Virus Outbreaks'),
            value: data.viruscount_out,
        });

        res.push({
            name: gettext('Avg. Mail Processing Time'),
            value: Ext.String.format(gettext('{0} seconds'), Ext.Number.toFixed(data.avptime, 2)),
        });

        res.push({
            name: gettext('Incoming Mail Traffic'),
            value: Ext.Number.toFixed(data.bytes_in / (1024 * 1024), 2) + ' MiB',
        });

        res.push({
            name: gettext('Outgoing Mail Traffic'),
            value: Ext.Number.toFixed(data.bytes_out / (1024 * 1024), 2) + ' MiB',
        });
        return res;
    },

    initComponent: function () {
        var me = this;

        var countstore = Ext.create('PMG.data.StatStore', {
            includeTimeSpan: true,
            staturl: '/api2/json/statistics/mailcount',
            fields: [
                { type: 'integer', name: 'count' },
                { type: 'integer', name: 'count_in' },
                { type: 'integer', name: 'count_out' },
                { type: 'integer', name: 'spamcount_in' },
                { type: 'integer', name: 'spamcount_out' },
                { type: 'integer', name: 'viruscount_in' },
                { type: 'integer', name: 'viruscount_out' },
                { type: 'integer', name: 'bounces_in' },
                { type: 'integer', name: 'bounces_out' },
                { type: 'date', dateFormat: 'timestamp', name: 'time' },
            ],
        });

        var totalgrid = Ext.createWidget('pmgMailStatGrid', {
            dockedItems: [
                {
                    dock: 'top',
                    title: gettext('Total Mail Count'),
                    xtype: 'proxmoxRRDChart',
                    fields: ['count', 'count_in', 'count_out'],
                    fieldTitles: [
                        gettext('Total Mail Count'),
                        gettext('Incoming Mails'),
                        gettext('Outgoing Mails'),
                    ],
                    store: countstore,
                },
            ],
        });

        var ingrid = Ext.createWidget('pmgMailStatGrid', {
            dockedItems: [
                {
                    dock: 'top',
                    title: gettext('Incoming Mails'),
                    xtype: 'proxmoxRRDChart',
                    fields: ['count_in', 'spamcount_in', 'viruscount_in', 'bounces_in'],
                    fieldTitles: [
                        gettext('Incoming Mails'),
                        gettext('Junk Mails'),
                        gettext('Virus Mails'),
                        gettext('Bounces'),
                    ],
                    store: countstore,
                },
            ],
        });

        var outgrid = Ext.createWidget('pmgMailStatGrid', {
            dockedItems: [
                {
                    dock: 'top',
                    title: gettext('Outgoing Mails'),
                    xtype: 'proxmoxRRDChart',
                    fields: ['count_out', 'viruscount_out', 'bounces_out'],
                    fieldTitles: [
                        gettext('Outgoing Mails'),
                        gettext('Virus Mails'),
                        gettext('Bounces'),
                    ],
                    store: countstore,
                },
            ],
        });

        var infostore = Ext.create('PMG.data.StatStore', {
            staturl: '/api2/json/statistics/mail',
            fields: ['name', 'value', 'percentage'],
            listeners: {
                load: function (store, records, success) {
                    if (!success || records.length <= 0) {
                        return;
                    }
                    var data = me.getGeneralData(records[0].data);
                    totalgrid.store.setData(data);
                    data = me.getInData(records[0].data);
                    ingrid.store.setData(data);
                    data = me.getOutData(records[0].data);
                    outgrid.store.setData(data);
                },
            },
        });

        me.items = [totalgrid, ingrid, outgrid];

        me.callParent();

        me.on('destroy', infostore.destroy, infostore);
        me.on('destroy', countstore.destroy, countstore);
    },
});
