Ext.define('PMG.FilterProxy', {
    extend: 'Proxmox.RestProxy',
    alias: 'proxy.pmgfilterproxy',

    filterId: undefined, // 'x-gridfilter-XXXXX'

    getParams: function (operation) {
        var me = this,
            i;
        if (!operation.isReadOperation) {
            return {};
        }
        var params = me.callParent(arguments);

        var filters = operation.getFilters() || [];
        for (i = 0; i < filters.length; i++) {
            let filter = filters[i];
            if (filter.config.id === me.filterId) {
                let v = filter.getValue();
                if (v !== undefined && v !== '') {
                    params.filter = v;
                }
            }
        }
        return params;
    },
});
