Ext.define('PMG.SpamDetectorConfiguration', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.pmgSpamDetectorConfiguration',

    title: gettext('Configuration') + ': ' + gettext('Spam Detector'),

    border: false,
    defaults: { border: false },

    items: [
        {
            title: gettext('Options'),
            itemId: 'options',
            xtype: 'pmgSpamDetectorOptions',
        },
        {
            title: gettext('Quarantine'),
            itemId: 'quarantine',
            xtype: 'pmgSpamQuarantineOptions',
        },
        {
            title: gettext('Status'),
            itemId: 'status',
            xtype: 'pmgSpamDetectorStatus',
        },
        {
            title: gettext('Custom Scores'),
            itemId: 'scores',
            xtype: 'pmgSpamDetectorCustomScores',
        },
    ],
});
