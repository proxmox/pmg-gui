Ext.define('PMG.PBSKeyShow', {
    extend: 'Ext.window.Window',
    xtype: 'pmgPBSKeyShow',
    mixins: ['Proxmox.Mixin.CBind'],

    width: 600,
    modal: true,
    resizable: false,
    title: gettext('Important: Save your Encryption Key'),

    // avoid that esc closes this by mistake, force user to more manual action
    onEsc: Ext.emptyFn,
    closable: false,

    items: [
        {
            xtype: 'form',
            layout: {
                type: 'vbox',
                align: 'stretch',
            },
            bodyPadding: 10,
            border: false,
            defaults: {
                anchor: '100%',
                border: false,
                padding: '10 0 0 0',
            },
            items: [
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('Key'),
                    labelWidth: 80,
                    inputId: 'encryption-key-value',
                    cbind: {
                        value: '{key}',
                    },
                    editable: false,
                },
                {
                    xtype: 'component',
                    html:
                        gettext(
                            'Keep your encryption key safe, but easily accessible for disaster recovery.',
                        ) +
                        '<br>' +
                        gettext('We recommend the following safe-keeping strategy:'),
                },
                {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'component',
                            html: '1. ' + gettext('Save the key in your password manager.'),
                            flex: 1,
                        },
                        {
                            xtype: 'button',
                            text: gettext('Copy Key'),
                            iconCls: 'fa fa-clipboard x-btn-icon-el-default-toolbar-small',
                            cls: 'x-btn-default-toolbar-small proxmox-inline-button',
                            width: 110,
                            handler: function (b) {
                                document.getElementById('encryption-key-value').select();
                                document.execCommand('copy');
                            },
                        },
                    ],
                },
                {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'component',
                            html:
                                '2. ' +
                                gettext(
                                    'Download the key to a USB (pen) drive, placed in secure vault.',
                                ),
                            flex: 1,
                        },
                        {
                            xtype: 'button',
                            text: gettext('Download'),
                            iconCls: 'fa fa-download x-btn-icon-el-default-toolbar-small',
                            cls: 'x-btn-default-toolbar-small proxmox-inline-button',
                            width: 110,
                            handler: function (b) {
                                let win = this.up('window');

                                let pmgID = Proxmox.NodeName || window.location.hostname;
                                let name = `pmg-${pmgID}-remote-${win.rid}.enc`;

                                let hiddenElement = document.createElement('a');
                                hiddenElement.href = 'data:attachment/text,' + encodeURI(win.key);
                                hiddenElement.target = '_blank';
                                hiddenElement.download = name;
                                hiddenElement.click();
                            },
                        },
                    ],
                },
                {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'component',
                            html:
                                '3. ' +
                                gettext('Print as paperkey, laminated and placed in secure vault.'),
                            flex: 1,
                        },
                        {
                            xtype: 'button',
                            text: gettext('Print Key'),
                            iconCls: 'fa fa-print x-btn-icon-el-default-toolbar-small',
                            cls: 'x-btn-default-toolbar-small proxmox-inline-button',
                            width: 110,
                            handler: function (b) {
                                let win = this.up('window');
                                win.paperkey(win.key);
                            },
                        },
                    ],
                },
            ],
        },
        {
            xtype: 'component',
            border: false,
            padding: '10 10 10 10',
            userCls: 'pmx-hint',
            html: gettext(
                'Please save the encryption key - losing it will render any backup created with it unusable',
            ),
        },
    ],
    buttons: [
        {
            text: gettext('Close'),
            handler: function (b) {
                let win = this.up('window');
                win.close();
            },
        },
    ],
    paperkey: function (keyString) {
        let me = this;

        const key = JSON.parse(keyString);

        const qrwidth = 500;
        let qrdiv = document.createElement('div');
        let qrcode = new QRCode(qrdiv, {
            width: qrwidth,
            height: qrwidth,
            correctLevel: QRCode.CorrectLevel.H,
        });
        qrcode.makeCode(keyString);

        let shortKeyFP = '';
        if (key.fingerprint) {
            shortKeyFP = PMG.Utils.render_pbs_fingerprint(key.fingerprint);
        }

        let printFrame = document.createElement('iframe');
        Object.assign(printFrame.style, {
            position: 'fixed',
            right: '0',
            bottom: '0',
            width: '0',
            height: '0',
            border: '0',
        });
        const prettifiedKey = JSON.stringify(key, null, 2);
        const keyQrBase64 = qrdiv.children[0].toDataURL('image/png');
        const html = `<html><head><script>
	    window.addEventListener('DOMContentLoaded', (ev) => window.print());
	</script><style>@media print and (max-height: 150mm) {
	  h4, p { margin: 0; font-size: 1em; }
	}</style></head><body style="padding: 5px;">
	<h4>Encryption Key - Remote '${me.rid}' (${shortKeyFP})</h4>
<p style="font-size:1.2em;font-family:monospace;white-space:pre-wrap;overflow-wrap:break-word;">
-----BEGIN PROXMOX BACKUP KEY-----
${prettifiedKey}
-----END PROXMOX BACKUP KEY-----</p>
	<center><img style="width: 100%; max-width: ${qrwidth}px;" src="${keyQrBase64}"></center>
	</body></html>`;

        printFrame.src = 'data:text/html;base64,' + btoa(html);
        document.body.appendChild(printFrame);
        me.on('destroy', () => document.body.removeChild(printFrame));
    },
});

Ext.define('PMG.panel.PBSEncryptionKeyTab', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmgPBSEncryptionKeyTab',
    mixins: ['Proxmox.Mixin.CBind'],

    onlineHelp: 'pmgbackup_pbs_remotes',

    onGetValues: function (form) {
        let values = {};
        if (form.cryptMode === 'upload') {
            values['encryption-key'] = form['crypt-key-upload'];
        } else if (form.cryptMode === 'autogenerate') {
            values['encryption-key'] = 'autogen';
        } else if (form.cryptMode === 'none') {
            if (!this.isCreate) {
                values.delete = ['encryption-key'];
            }
        }
        return values;
    },

    setValues: function (values) {
        let me = this;
        let vm = me.getViewModel();

        let cryptKeyInfo = values['encryption-key'];
        if (cryptKeyInfo) {
            let icon = '<span class="fa fa-lock good"></span> ';
            if (cryptKeyInfo.match(/^[a-fA-F0-9]{2}:/)) {
                // new style fingerprint
                let shortKeyFP = PMG.Utils.render_pbs_fingerprint(cryptKeyInfo);
                values['crypt-key-fp'] =
                    icon + `${gettext('Active')} - ${gettext('Fingerprint')} ${shortKeyFP}`;
            } else {
                // old key without FP
                values['crypt-key-fp'] = icon + gettext('Active');
            }
            values.cryptMode = 'keep';
            values['crypt-allow-edit'] = false;
        } else {
            values['crypt-key-fp'] = gettext('None');
            let cryptModeNone = me.down('radiofield[inputValue=none]');
            cryptModeNone.setBoxLabel(gettext('Do not encrypt backups'));
            values.cryptMode = 'none';
            values['crypt-allow-edit'] = true;
        }
        vm.set('keepCryptVisible', !!cryptKeyInfo);
        vm.set('allowEdit', !cryptKeyInfo);

        me.callParent([values]);
    },

    viewModel: {
        data: {
            allowEdit: true,
            keepCryptVisible: false,
        },
        formulas: {
            showDangerousHint: (get) => {
                let allowEdit = get('allowEdit');
                return get('keepCryptVisible') && allowEdit;
            },
        },
    },

    items: [
        {
            xtype: 'displayfield',
            name: 'crypt-key-fp',
            fieldLabel: gettext('Encryption Key'),
            padding: '2 0',
        },
        {
            xtype: 'checkbox',
            name: 'crypt-allow-edit',
            boxLabel: gettext('Edit existing encryption key (dangerous!)'),
            hidden: true,
            submitValue: false,
            isDirty: () => false,
            bind: {
                hidden: '{!keepCryptVisible}',
                value: '{allowEdit}',
            },
        },
        {
            xtype: 'radiofield',
            name: 'cryptMode',
            inputValue: 'keep',
            boxLabel: gettext('Keep encryption key'),
            padding: '0 0 0 25',
            cbind: {
                hidden: '{isCreate}',
            },
            bind: {
                hidden: '{!keepCryptVisible}',
                disabled: '{!allowEdit}',
            },
        },
        {
            xtype: 'radiofield',
            name: 'cryptMode',
            inputValue: 'none',
            checked: true,
            padding: '0 0 0 25',
            cbind: {
                disabled: '{!isCreate}',
                checked: '{isCreate}',
                boxLabel: (get) =>
                    get('isCreate')
                        ? gettext('Do not encrypt backups')
                        : gettext('Delete existing encryption key'),
            },
            bind: {
                disabled: '{!allowEdit}',
            },
        },
        {
            xtype: 'radiofield',
            name: 'cryptMode',
            inputValue: 'autogenerate',
            boxLabel: gettext('Auto-generate a client encryption key'),
            padding: '0 0 0 25',
            cbind: {
                disabled: '{!isCreate}',
            },
            bind: {
                disabled: '{!allowEdit}',
            },
        },
        {
            xtype: 'radiofield',
            name: 'cryptMode',
            inputValue: 'upload',
            boxLabel: gettext('Upload an existing client encryption key'),
            padding: '0 0 0 25',
            cbind: {
                disabled: '{!isCreate}',
            },
            bind: {
                disabled: '{!allowEdit}',
            },
            listeners: {
                change: function (f, value) {
                    let panel = this.up('inputpanel');
                    if (!panel.rendered) {
                        return;
                    }
                    let uploadKeyField = panel.down('field[name=crypt-key-upload]');
                    uploadKeyField.setDisabled(!value);
                    uploadKeyField.setHidden(!value);

                    let uploadKeyButton = panel.down('filebutton[name=crypt-upload-button]');
                    uploadKeyButton.setDisabled(!value);
                    uploadKeyButton.setHidden(!value);

                    if (value) {
                        uploadKeyField.validate();
                    } else {
                        uploadKeyField.reset();
                    }
                },
            },
        },
        {
            xtype: 'fieldcontainer',
            layout: 'hbox',
            items: [
                {
                    xtype: 'proxmoxtextfield',
                    name: 'crypt-key-upload',
                    fieldLabel: gettext('Key'),
                    value: '',
                    disabled: true,
                    hidden: true,
                    allowBlank: false,
                    labelAlign: 'right',
                    flex: 1,
                    emptyText: gettext('You can drag-and-drop a key file here.'),
                    validator: function (value) {
                        if (value.length) {
                            let key;
                            try {
                                key = JSON.parse(value);
                            } catch (e) {
                                return 'Failed to parse key - ' + e;
                            }
                            if (key.data === undefined) {
                                return 'Does not seems like a valid Proxmox Backup key!';
                            }
                        }
                        return true;
                    },
                    afterRender: function () {
                        if (!window.FileReader) {
                            // No FileReader support in this browser
                            return;
                        }
                        let cancel = function (ev) {
                            ev = ev.event;
                            if (ev.preventDefault) {
                                ev.preventDefault();
                            }
                        };
                        this.inputEl.on('dragover', cancel);
                        this.inputEl.on('dragenter', cancel);
                        this.inputEl.on('drop', (ev) => {
                            cancel(ev);
                            let files = ev.event.dataTransfer.files;
                            Proxmox.Utils.loadTextFromFile(files[0], (v) => this.setValue(v));
                        });
                    },
                },
                {
                    xtype: 'filebutton',
                    name: 'crypt-upload-button',
                    iconCls: 'fa fa-fw fa-folder-open-o x-btn-icon-el-default-toolbar-small',
                    cls: 'x-btn-default-toolbar-small proxmox-inline-button',
                    margin: '0 0 0 4',
                    disabled: true,
                    hidden: true,
                    listeners: {
                        change: function (btn, e, value) {
                            let ev = e.event;
                            let field = btn.up().down('proxmoxtextfield[name=crypt-key-upload]');
                            Proxmox.Utils.loadTextFromFile(ev.target.files[0], (v) =>
                                field.setValue(v),
                            );
                            btn.reset();
                        },
                    },
                },
            ],
        },
        {
            xtype: 'component',
            border: false,
            padding: '5 2',
            userCls: 'pmx-hint',
            html: // `<b style="color:red;font-weight:600;">${ngettext('Warning', 'Warnings', 1)}</b>: ` +
                `<span class="fa fa-exclamation-triangle" style="color:red;font-size:14px;"></span> ` +
                gettext(
                    'Deleting or replacing the encryption key will break restoring backups created with it!',
                ),
            hidden: true,
            bind: {
                hidden: '{!showDangerousHint}',
            },
        },
    ],
});
Ext.define('PMG.PBSInputPanel', {
    extend: 'Ext.tab.Panel',
    xtype: 'pmgPBSInputPanel',
    mixins: ['Proxmox.Mixin.CBind'],

    bodyPadding: 10,
    remoteId: undefined,

    cbindData: function (initialConfig) {
        let me = this;
        me.isCreate = initialConfig.isCreate || !initialConfig.remoteId;
        return {};
    },

    items: [
        {
            xtype: 'inputpanel',
            title: gettext('Backup Server'),
            onGetValues: function (values) {
                values.disable = values.enable ? 0 : 1;
                delete values.enable;
                return values;
            },
            column1: [
                {
                    xtype: 'pmxDisplayEditField',
                    name: 'remote',
                    cbind: {
                        editable: '{isCreate}',
                    },
                    fieldLabel: gettext('ID'),
                    allowBlank: false,
                },
                {
                    xtype: 'pmxDisplayEditField',
                    name: 'server',
                    vtype: 'DnsOrIp',
                    fieldLabel: gettext('Server'),
                    cbind: { editable: '{isCreate}' },
                    allowBlank: false,
                },
                {
                    xtype: 'proxmoxintegerfield',
                    name: 'port',
                    fieldLabel: gettext('Port'),
                    minValue: 1,
                    maxValue: 65535,
                    emptyText: '8007',
                    allowBlank: true,
                    cbind: { deleteEmpty: '{!isCreate}' },
                },
                {
                    xtype: 'pmxDisplayEditField',
                    name: 'datastore',
                    fieldLabel: 'Datastore',
                    cbind: { editable: '{isCreate}' },
                    allowBlank: false,
                },
                {
                    xtype: 'pmxDisplayEditField',
                    name: 'namespace',
                    fieldLabel: gettext('Namespace'),
                    cbind: { editable: '{isCreate}' },
                    emptyText: gettext('Root'),
                },
            ],
            column2: [
                {
                    xtype: 'pmxDisplayEditField',
                    name: 'username',
                    fieldLabel: gettext('Username'),
                    emptyText: gettext('Example') + ': admin@pbs',
                    cbind: { editable: '{isCreate}' },
                    regex: /\S+@\w+/,
                    regexText: gettext('Example') + ': admin@pbs',
                    allowBlank: false,
                },
                {
                    xtype: 'pmxDisplayEditField',
                    editable: true, // FIXME: set to false if (!create && user == token)
                    editConfig: {
                        xtype: 'proxmoxtextfield',
                    },
                    inputType: 'password',
                    name: 'password',
                    cbind: {
                        allowBlank: '{!isCreate}',
                        emptyText: (get) => (get('isCreate') ? '' : gettext('Unchanged')),
                    },
                    fieldLabel: gettext('Password'),
                },
                {
                    xtype: 'proxmoxKVComboBox',
                    name: 'notify',
                    fieldLabel: gettext('Notify'),
                    comboItems: [
                        ['always', gettext('Always')],
                        ['error', gettext('Errors')],
                        ['never', gettext('Never')],
                    ],
                    deleteEmpty: false,
                    emptyText: gettext('Never'),
                },
                {
                    xtype: 'proxmoxcheckbox',
                    name: 'enable',
                    checked: true,
                    uncheckedValue: 0,
                    fieldLabel: gettext('Enable'),
                },
            ],
            columnB: [
                {
                    xtype: 'proxmoxcheckbox',
                    name: 'include-statistics',
                    checked: true,
                    uncheckedValue: 0,
                    fieldLabel: gettext('Statistics'),
                    boxLabel: gettext('Include in Backup'),
                },
                {
                    xtype: 'proxmoxtextfield',
                    name: 'fingerprint',
                    fieldLabel: gettext('Fingerprint'),
                    emptyText: gettext(
                        'Server certificate SHA-256 fingerprint, required for self-signed certificates',
                    ),
                    regex: /[A-Fa-f0-9]{2}(:[A-Fa-f0-9]{2}){31}/,
                    regexText: gettext('Example') + ': AB:CD:EF:...',
                    allowBlank: true,
                },
            ],
        },
        {
            xtype: 'inputpanel',
            title: gettext('Prune Options'),
            defaults: {
                // set nested, else we'd only set the defaults for the two column containers
                defaults: {
                    minValue: 1,
                    labelWidth: 100,
                    allowBlank: true,
                },
            },
            column1: [
                {
                    xtype: 'proxmoxintegerfield',
                    fieldLabel: gettext('Keep Last'),
                    name: 'keep-last',
                    cbind: { deleteEmpty: '{!isCreate}' },
                },
                {
                    xtype: 'proxmoxintegerfield',
                    fieldLabel: gettext('Keep Daily'),
                    name: 'keep-daily',
                    cbind: { deleteEmpty: '{!isCreate}' },
                },
                {
                    xtype: 'proxmoxintegerfield',
                    fieldLabel: gettext('Keep Monthly'),
                    name: 'keep-monthly',
                    cbind: { deleteEmpty: '{!isCreate}' },
                },
            ],
            column2: [
                {
                    xtype: 'proxmoxintegerfield',
                    fieldLabel: gettext('Keep Hourly'),
                    name: 'keep-hourly',
                    cbind: { deleteEmpty: '{!isCreate}' },
                },
                {
                    xtype: 'proxmoxintegerfield',
                    fieldLabel: gettext('Keep Weekly'),
                    name: 'keep-weekly',
                    cbind: { deleteEmpty: '{!isCreate}' },
                },
                {
                    xtype: 'proxmoxintegerfield',
                    fieldLabel: gettext('Keep Yearly'),
                    name: 'keep-yearly',
                    cbind: { deleteEmpty: '{!isCreate}' },
                },
            ],
        },
        {
            xtype: 'pmgPBSEncryptionKeyTab',
            title: gettext('Encryption'),
            cbind: { isCreate: '{isCreate}' },
        },
    ],
});

Ext.define('PMG.PBSEdit', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmgPBSEdit',
    onlineHelp: 'pmgbackup_pbs_remotes',

    subject: 'Proxmox Backup Server',
    isAdd: true,

    bodyPadding: 0,

    apiCallDone: function (success, response, options) {
        let res = response.result.data;
        if (!(res && res.config && res.config['encryption-key'])) {
            return;
        }
        let key = res.config['encryption-key'];
        Ext.create('PMG.PBSKeyShow', {
            autoShow: true,
            rid: res.remote,
            key: key,
        });
    },

    initComponent: function () {
        let me = this;

        me.isCreate = !me.remoteId;

        me.method = 'POST';
        me.url = '/api2/extjs/config/pbs';
        if (!me.isCreate) {
            me.url += `/${me.remoteId}`;
            me.method = 'PUT';
        }

        me.items = [
            {
                xtype: 'pmgPBSInputPanel',
                isCreate: me.isCreate,
                remoteId: me.remoteId,
            },
        ];

        me.callParent();

        if (!me.isCreate) {
            me.load({
                success: function (response, options) {
                    let values = response.result.data;

                    values.enable = values.disable ? 0 : 1;
                    me.setValues(values);
                },
            });
        }
    },
});
