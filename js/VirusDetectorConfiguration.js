Ext.define('PMG.VirusDetectorConfiguration', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.pmgVirusDetectorConfiguration',

    title: gettext('Configuration') + ': ' + gettext('Virus Detector'),

    border: false,
    defaults: { border: false },

    items: [
        {
            title: gettext('Options'),
            itemId: 'options',
            xtype: 'pmgVirusDetectorOptions',
        },
        {
            title: gettext('ClamAV'),
            itemId: 'clamav',
            xtype: 'pmgClamAVDatabase',
        },
        {
            title: gettext('Quarantine'),
            itemId: 'quarantine',
            xtype: 'pmgVirusQuarantineOptions',
        },
    ],
});
