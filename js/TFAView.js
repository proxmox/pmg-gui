// TODO merge with the one from pbs in widget toolkit
Ext.define('PMG.WebauthnConfigEdit', {
    extend: 'Proxmox.window.Edit',
    alias: ['widget.pmgWebauthnConfigEdit'],

    subject: gettext('Webauthn'),
    url: '/api2/extjs/config/tfa/webauthn',
    autoLoad: true,

    width: 512,

    fieldDefaults: {
        labelWidth: 120,
    },

    setValues: function (values) {
        let me = this;

        me.relayingPartySet = values && typeof values.rp === 'string';

        me.callParent(arguments);
    },

    items: [
        {
            xtype: 'textfield',
            fieldLabel: gettext('Relying Party'),
            name: 'rp',
            allowBlank: false,
            listeners: {
                dirtychange: function (field, isDirty) {
                    let win = field.up('window');
                    let warningBox = win.down('box[id=rpChangeWarning]');
                    warningBox.setHidden(!win.relayingPartySet || !isDirty);
                },
            },
        },
        {
            xtype: 'textfield',
            fieldLabel: gettext('Origin'),
            name: 'origin',
            allowBlank: false,
        },
        {
            xtype: 'textfield',
            fieldLabel: 'ID',
            name: 'id',
            allowBlank: false,
        },
        {
            xtype: 'container',
            layout: 'hbox',
            items: [
                {
                    xtype: 'box',
                    flex: 1,
                },
                {
                    xtype: 'button',
                    text: gettext('Auto-fill'),
                    iconCls: 'fa fa-fw fa-pencil-square-o',
                    handler: function (button, ev) {
                        let panel = this.up('panel');
                        panel.down('field[name=rp]').setValue(document.location.hostname);
                        panel.down('field[name=origin]').setValue(document.location.origin);
                        panel.down('field[name=id]').setValue(document.location.hostname);
                    },
                },
            ],
        },
        {
            xtype: 'box',
            html:
                `<span class='pmx-hint'>${gettext('Note:')}</span> ` +
                gettext('WebAuthn requires using a trusted certificate.'),
        },
        {
            xtype: 'box',
            id: 'rpChangeWarning',
            hidden: true,
            padding: '5 0 0 0',
            html:
                '<i class="fa fa-exclamation-triangle warning"></i> ' +
                gettext('Changing the Relying Party may break existing webAuthn TFA entries.'),
        },
    ],
});

Ext.define('PMG.TFAView', {
    extend: 'Proxmox.panel.TfaView',
    alias: 'widget.pmgTFAView',

    initComponent: function () {
        let me = this;

        me.tbar.push('->', {
            text: gettext('WebAuthn'),
            itemId: 'webauthn',
            iconCls: 'fa fa-fw fa-cog',
            handler: () => Ext.create('PMG.WebauthnConfigEdit', { autoShow: true }),
        });

        me.callParent(arguments);
    },
});
