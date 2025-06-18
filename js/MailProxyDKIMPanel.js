Ext.define('PMG.DKIMDomains', {
    extend: 'PMG.RelayDomains',
    alias: ['widget.pmgDKIMDomains'],

    baseurl: '/config/dkim/domains',
    domain_desc: gettext('Sign Domain'),
    onlineHelp: 'pmgconfig_mailproxy_dkim',
});

Ext.define('PMG.MailProxyDKIMPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pmgMailProxyDKIMPanel',

    layout: {
        type: 'vbox',
        align: 'stretch',
    },

    bodyPadding: '0 0 10 0',
    defaults: {
        collapsible: true,
        animCollapse: false,
        margin: '10 10 0 10',
    },

    initComponent: function () {
        var me = this;

        var DKIMSettings = Ext.create('PMG.DKIMSettings', {
            title: gettext('Settings'),
        });

        var DKIMDomains = Ext.create('PMG.DKIMDomains', {
            title: gettext('Sign Domains'),
            flex: 1,
        });

        me.items = [DKIMSettings, DKIMDomains];

        me.callParent();

        DKIMSettings.relayEvents(me, ['activate', 'deactivate', 'destroy']);
        DKIMDomains.relayEvents(me, ['activate', 'deactivate', 'destroy']);
    },
});
