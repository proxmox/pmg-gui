Ext.define('PMG.CertificateConfiguration', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.pmgCertificateConfiguration',

    title: gettext('Certificates'),

    ...PMG.Utils.onlineHelpTool('sysadmin_certificate_management'),

    border: false,
    defaults: { border: false },

    items: [
        {
            xtype: 'pmgCertificatesView',
            itemId: 'certificates',
            iconCls: 'fa fa-certificate',
        },
        {
            xtype: 'pmgACMEConfigView',
            itemId: 'acme',
            iconCls: 'fa fa-file-text',
        },
    ],
});

Ext.define('PMG.CertificateView', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pmgCertificatesView',

    title: gettext('Certificates'),
    scrollable: 'y',

    items: [
        {
            xtype: 'pmxCertificates',
            border: 0,
            infoUrl: '/nodes/' + Proxmox.NodeName + '/certificates/info',
            uploadButtons: [
                {
                    name: 'API',
                    id: 'pmg-api.pem',
                    url: `/nodes/${Proxmox.NodeName}/certificates/custom/api`,
                    deletable: false,
                    reloadUi: true,
                },
                {
                    name: 'SMTP',
                    id: 'pmg-tls.pem',
                    url: `/nodes/${Proxmox.NodeName}/certificates/custom/smtp`,
                    deletable: true,
                },
            ],
        },
        {
            xtype: 'pmxACMEDomains',
            border: 0,
            url: `/nodes/${Proxmox.NodeName}/config`,
            nodename: Proxmox.NodeName,
            acmeUrl: '/config/acme',
            domainUsages: [
                {
                    usage: 'api',
                    name: 'API',
                    url: `/nodes/${Proxmox.NodeName}/certificates/acme/api`,
                    reloadUi: true,
                },
                {
                    usage: 'smtp',
                    name: 'SMTP',
                    url: `/nodes/${Proxmox.NodeName}/certificates/acme/smtp`,
                },
            ],
        },
    ],
});

Ext.define('PMG.ACMEConfigView', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pmgACMEConfigView',

    title: gettext('ACME Accounts/Challenges'),

    //onlineHelp: 'sysadmin_certificate_management',

    items: [
        {
            xtype: 'pmxACMEAccounts',
            region: 'north',
            border: false,
            acmeUrl: '/config/acme',
        },
        {
            xtype: 'pmxACMEPluginView',
            region: 'center',
            border: false,
            acmeUrl: '/config/acme',
        },
    ],
});
