Ext.define('PMG.data.StatStore', {
    extend: 'Ext.data.Store',
    alias: 'store.pmgStatStore',

    autoDestroy: true,

    staturl: undefined,

    includeTimeSpan: false,

    setUrl: function (url, extraparam) {
        var me = this;

        me.proxy.abort(); // abort pending requests

        me.staturl = url;
        me.proxy.extraParams = {};
        if (extraparam !== undefined) {
            me.proxy.extraParams = extraparam;
        }

        me.setData([]);
    },

    reload: function () {
        var me = this;

        me.proxy.abort(); // abort pending requests

        if (me.staturl === undefined) {
            me.proxy.extraParams = {};
            me.setData([]);
            return;
        }

        var ts = PMG.StatTimeSelector.getTimeSpan();

        var last = me.proxy.extraParams;

        if (last.starttime === ts.starttime && last.endtime === ts.endtime) {
            return; // avoid repeated loads
        }

        me.proxy.url = me.staturl;
        Ext.apply(me.proxy.extraParams, {
            starttime: ts.starttime,
            endtime: ts.endtime,
        });

        var timespan = 3600;
        if (me.includeTimeSpan) {
            var period = ts.endtime - ts.starttime;
            if (period <= 86400 * 7) {
                timespan = 3600;
            } else {
                timespan = 3600 * 24;
            }
            me.proxy.extraParams.timespan = timespan;
        }

        me.load();
    },

    proxy: {
        type: 'proxmox',
    },

    autoReload: true,

    constructor: function (config) {
        var me = this;

        config = config || {};

        me.mon(
            Ext.GlobalEvents,
            'pmgStatTimeSelectorUpdate',
            function () {
                if (me.autoReload) {
                    me.reload();
                }
            },
            me,
        );

        me.callParent([config]);

        me.reload();
    },
});
