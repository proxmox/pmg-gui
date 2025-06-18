Ext.define('PMG.dashboard.MiniGraph', {
    extend: 'Proxmox.widget.RRDChart',
    xtype: 'pmgMiniGraph',

    legend: undefined,
    interactions: undefined,
    insetPadding: 20,
    padding: '5 5 0 0',
    axes: [
        {
            type: 'numeric',
            position: 'left',
            minimum: 0,
            grid: true,
            majorTickSteps: 2,
            label: {
                fillStyle: '#5f5f5f',
            },
            style: {
                axisLine: false,
                majorTickSize: 0,
            },
        },
        {
            type: 'time',
            position: 'bottom',
            dateFormat: 'H:i',
            fields: ['time'],
            label: {
                fillStyle: '#5f5f5f',
            },
            style: {
                axisLine: false,
                majorTickSize: 0,
            },
        },
    ],
    border: false,
    flex: 1,
    noTool: true,
});
