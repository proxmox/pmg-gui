Ext.define('PMG.MailProxyTLSPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pmgMailProxyTLSPanel',

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

        var tlsSettings = Ext.create('PMG.MailProxyTLS', {
            title: gettext('Settings'),
        });

        var tlsDestinations = Ext.create('PMG.MailProxyTLSDestinations', {
            title: gettext('TLS Destination Policy'),
            flex: 1,
        });

        const tlsInboundDomains = Ext.create('PMG.MailProxyTLSInboundDomains', {
            title: gettext('TLS Inbound Domains'),
            flex: 1,
        });

        me.items = [tlsSettings, tlsDestinations, tlsInboundDomains];

        me.callParent();

        tlsSettings.relayEvents(me, ['activate', 'deactivate', 'destroy']);
        tlsDestinations.relayEvents(me, ['activate', 'deactivate', 'destroy']);
        tlsInboundDomains.relayEvents(me, ['activate', 'deactivate', 'destroy']);
    },
});
