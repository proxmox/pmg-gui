Ext.define('PMG.MailProxyConfiguration', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.pmgMailProxyConfiguration',

    title: gettext('Configuration') + ': ' + gettext('Mail Proxy'),

    border: false,
    defaults: { border: false },

    items: [
        {
            itemId: 'relaying',
            title: gettext('Relaying'),
            xtype: 'pmgMailProxyRelaying',
        },
        {
            itemId: 'relaydomains',
            title: gettext('Relay Domains'),
            xtype: 'pmgRelayDomains',
        },
        {
            itemId: 'ports',
            title: gettext('Ports'),
            xtype: 'pmgMailProxyPorts',
        },
        {
            itemId: 'options',
            title: gettext('Options'),
            xtype: 'pmgMailProxyOptions',
        },
        {
            itemId: 'transports',
            title: gettext('Transports'),
            xtype: 'pmgTransport',
        },
        {
            itemId: 'networks',
            title: gettext('Networks'),
            xtype: 'pmgMyNetworks',
        },
        {
            itemId: 'tls',
            title: gettext('TLS'),
            xtype: 'pmgMailProxyTLSPanel',
        },
        {
            itemId: 'dkim',
            title: gettext('DKIM'),
            xtype: 'pmgMailProxyDKIMPanel',
        },
        {
            itemId: 'whitelist',
            title: gettext('Whitelist'),
            xtype: 'pmgObjectGroup',
            hideGroupInfo: true,
            showDirection: true,
            otype_list: [1000, 1009, 1001, 1007, 1002, 1008, 1003, 1004],
            baseurl: '/config/whitelist',
        },
    ],
});
