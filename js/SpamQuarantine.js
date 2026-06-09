Ext.define('pmg-spam-archive', {
    extend: 'Ext.data.Model',
    fields: [
        { type: 'number', name: 'spamavg' },
        { type: 'integer', name: 'count' },
        { type: 'date', dateFormat: 'timestamp', name: 'day' },
    ],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/quarantine/spam',
    },
    idProperty: 'day',
});

Ext.define('pmg-spam-list', {
    extend: 'Ext.data.Model',
    fields: [
        'id',
        'envelope_sender',
        'from',
        'sender',
        'receiver',
        'pmail',
        'subject',
        { type: 'number', name: 'spamlevel' },
        { type: 'number', name: 'score-positive' },
        { type: 'number', name: 'score-negative' },
        { type: 'boolean', name: 'seen' },
        { type: 'integer', name: 'bytes' },
        { type: 'date', dateFormat: 'timestamp', name: 'time' },
        {
            type: 'string',
            name: 'day',
            convert: function (v, rec) {
                return Ext.Date.format(rec.get('time'), 'Y-m-d');
            },
            depends: ['time'],
        },
    ],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/quarantine/spam',
    },
    idProperty: 'id',
});

Ext.define('PMG.SpamQuarantineController', {
    extend: 'PMG.controller.QuarantineController',
    xtype: 'pmgSpamQuarantineController',
    alias: 'controller.spamquarantine',

    updatePreview: function (raw, rec) {
        let me = this;
        // the score breakdown is only meaningful for a single selected mail
        me.lookupReference('spaminfo').setVisible(true);
        me.refreshSeenButton();

        me.callParent(arguments);
    },

    multiSelect: function (selection) {
        let me = this;
        me.refreshSeenButton();
        me.lookupReference('spaminfo').setVisible(false);
        me.callParent(arguments);
    },

    toggleSeen: function (btn) {
        let me = this;
        let rec = me.lookupReference('list').selModel.getSelection()[0];
        if (!rec) {
            return;
        }
        // the toggle button already flipped, so its state is the desired one
        me.setSeenIcon(btn, btn.pressed);
        me.doAction(btn.pressed ? 'mark-seen' : 'mark-unseen', [rec]);
    },

    setSeenIcon: function (btn, seen) {
        btn.setIconCls(seen ? 'fa fa-eye' : 'fa fa-eye-slash');
    },

    refreshSeenButton: function () {
        let me = this;
        let sel = me.lookupReference('list').selModel.getSelection();
        let single = sel.length === 1;
        let seen = single && !!sel[0].data.seen;
        let markseen = me.lookupReference('markseen');
        markseen.setDisabled(!single);
        markseen.setPressed(seen);
        me.setSeenIcon(markseen, seen);
    },

    openContextMenu: function (table, record, tr, index, event) {
        event.stopEvent();
        let me = this;
        let list = me.lookup('list');
        let menu = Ext.create('PMG.menu.SpamContextMenu', {
            callback: (action) => {
                if (action === 'copy-login-link') {
                    me.copyQuarantineLink(list.getSelection());
                } else {
                    me.doAction(action, list.getSelection());
                }
            },
        });
        // minting a login link needs admin/qmanager, so hide it from end users that
        // are logged into their own quarantine through the '@quarantine' realm
        if (!Proxmox.UserName.endsWith('@quarantine')) {
            menu.down('#copyLoginLinkSep').setHidden(false);
            menu.down('#copyLoginLink').setHidden(false);
        }
        menu.showAt(event.getXY());
    },

    copyQuarantineLink: function (selection) {
        let rec = selection[0];
        if (!rec) {
            return;
        }
        // the quarantine is keyed by pmail; the per-mail receiver may be an alias
        let mail = rec.get('pmail') || rec.get('receiver');
        Proxmox.Utils.API2Request({
            url: '/quarantine/link',
            method: 'GET',
            params: { mail },
            failure: (response) => Ext.Msg.alert(gettext('Error'), response.htmlStatus),
            success: function (response) {
                let link = response.result.data.link;
                Ext.create('Ext.window.Window', {
                    title: gettext('Quarantine Login Link'),
                    modal: true,
                    width: 600,
                    layout: 'fit',
                    bodyPadding: 10,
                    items: [
                        {
                            xtype: 'form',
                            border: false,
                            layout: 'anchor',
                            items: [
                                {
                                    xtype: 'displayfield',
                                    userCls: 'pmx-hint',
                                    value: Ext.String.format(
                                        gettext(
                                            'Anyone with this link gains full access to the quarantine of {0}. Only share it with the legitimate recipient.',
                                        ),
                                        Ext.htmlEncode(mail),
                                    ),
                                },
                                {
                                    xtype: 'textfield',
                                    inputId: 'pmgQuarantineLinkValue',
                                    fieldLabel: gettext('Login Link'),
                                    labelAlign: 'top',
                                    anchor: '100%',
                                    editable: false,
                                    value: link,
                                },
                            ],
                        },
                    ],
                    buttons: [
                        {
                            text: gettext('Copy Link'),
                            iconCls: 'fa fa-clipboard',
                            handler: function (btn) {
                                let field = document.getElementById('pmgQuarantineLinkValue');
                                field.select();
                                document.execCommand('copy');
                                btn.up('window').close();
                            },
                        },
                        {
                            text: gettext('Close'),
                            handler: (btn) => btn.up('window').close(),
                        },
                    ],
                    autoShow: true,
                });
            },
        });
    },

    keyPress: function (table, record, item, index, event) {
        var me = this;
        var list = me.lookup('list');
        var key = event.getKey();
        var action = '';
        switch (key) {
            case event.DELETE:
            case 127:
                action = 'delete';
                break;
            case Ext.event.Event.D:
            case Ext.event.Event.D + 32:
                action = 'deliver';
                break;
            case Ext.event.Event.W:
            case Ext.event.Event.W + 32:
                action = 'welcomelist';
                break;
            case Ext.event.Event.B:
            case Ext.event.Event.B + 32:
                action = 'blocklist';
                break;
            case Ext.event.Event.S:
            case Ext.event.Event.S + 32:
                // mirror the Seen button: toggle the selection's seen state
                action = list.getSelection().every((r) => r.data.seen)
                    ? 'mark-unseen'
                    : 'mark-seen';
                break;
        }

        if (action !== '') {
            me.doAction(action, list.getSelection());
        }
    },

    init: function (view) {
        let me = this;
        let list = me.lookup('list');
        list.cselect = view.cselect;
        // so a keyboard mark (or any record change) refreshes the toolbar too
        list.getStore().on('update', me.refreshSeenButton, me);
    },

    control: {
        'button[reference=raw]': {
            click: 'toggleRaw',
        },
        'button[reference=loadimages]': {
            click: 'toggleImages',
        },
        'button[reference=markseen]': {
            click: 'toggleSeen',
        },
        pmgQuarantineList: {
            itemkeypress: 'keyPress',
            rowcontextmenu: 'openContextMenu',
        },
    },
});

Ext.define('PMG.SpamQuarantine', {
    extend: 'Ext.container.Container',
    xtype: 'pmgSpamQuarantine',

    border: false,
    layout: { type: 'border' },

    defaults: { border: false },

    // from mail link
    cselect: undefined,

    viewModel: {
        parent: null,
        data: {
            mailid: '',
        },
        formulas: {
            downloadMailURL: (get) =>
                '/api2/json/quarantine/download?mailid=' + encodeURIComponent(get('mailid')),
        },
    },
    controller: 'spamquarantine',

    items: [
        {
            title: gettext('Spam Quarantine'),
            xtype: 'pmgQuarantineList',
            selModel: 'checkboxmodel',
            reference: 'list',
            region: 'west',
            width: 600,
            split: true,
            collapsible: false,
            store: {
                model: 'pmg-spam-list',
                groupField: 'day',
                groupDir: 'DESC',
                sorters: [
                    {
                        property: 'time',
                        direction: 'DESC',
                    },
                ],
            },

            columns: [
                {
                    // hidden by default: the seen state shows inline in the
                    // Sender/Subject column and by dimming the row
                    header: gettext('Seen'),
                    dataIndex: 'seen',
                    align: 'center',
                    width: 60,
                    hidden: true,
                    renderer: (v) =>
                        v
                            ? `<i class="fa fa-check" data-qtip="${gettext('Marked as seen')}"></i>`
                            : '',
                },
                {
                    header: gettext('Sender/Subject'),
                    dataIndex: 'subject',
                    renderer: function (value, meta, rec) {
                        let sender = PMG.Utils.render_sender(value, meta, rec);
                        if (!rec.get('seen')) {
                            return sender;
                        }
                        let icon = `<i class="fa fa-check" data-qtip="${gettext('Marked as seen')}"></i>`;
                        return `${icon} ${sender}`;
                    },
                    flex: 1,
                },
                {
                    header: gettext('Score'),
                    dataIndex: 'spamlevel',
                    align: 'right',
                    width: 90,
                    // show the net score plus the separate sums of the positive and
                    // negative test scores, which gives a better feel for borderline
                    // mails where strong negative tests can mask many positive hits
                    renderer: function (value, _meta, rec) {
                        let fmt = (v) => Ext.util.Format.number(v, '0.##');
                        let pos = rec.get('score-positive');
                        let neg = rec.get('score-negative');
                        if (
                            pos === undefined ||
                            pos === null ||
                            neg === undefined ||
                            neg === null
                        ) {
                            return fmt(value);
                        }
                        return `${fmt(value)}<br><span style="opacity: 0.7; font-size: 90%;">+${fmt(pos)} / ${fmt(neg)}</span>`;
                    },
                },
                {
                    header: gettext('Size') + ' (KB)',
                    renderer: (v) => Ext.Number.toFixed(v / 1024, 0),
                    dataIndex: 'bytes',
                    align: 'right',
                    width: 90,
                },
                {
                    header: gettext('Date'),
                    dataIndex: 'day',
                    hidden: true,
                },
                {
                    xtype: 'datecolumn',
                    header: gettext('Time'),
                    dataIndex: 'time',
                    format: 'H:i:s',
                },
            ],
        },
        {
            title: gettext('Selected Mail'),
            border: false,
            region: 'center',
            layout: 'fit',
            split: true,
            reference: 'preview',
            disabled: true,
            dockedItems: [
                {
                    xtype: 'toolbar',
                    dock: 'top',
                    overflowHandler: 'menu',
                    listeners: {
                        resize: 'onToolbarResize',
                    },
                    style: {
                        // docked items have set the bottom with to 0px with '! important'
                        // but we still want one here, so we can remove the borders of the grids
                        'border-bottom-width': '1px ! important',
                    },
                    items: [
                        {
                            xtype: 'button',
                            reference: 'raw',
                            text: gettext('Toggle Raw'),
                            tooltip: gettext(
                                'Show the raw message source instead of the rendered mail',
                            ),
                            responsiveText: true,
                            ariaLabel: gettext('Toggle raw message source'),
                            enableToggle: true,
                            iconCls: 'fa fa-file-code-o',
                        },
                        {
                            xtype: 'button',
                            reference: 'loadimages',
                            text: gettext('Load Images'),
                            enableToggle: true,
                            iconCls: 'fa fa-image',
                            // revealed per-mail by the controller
                            hidden: true,
                            tooltip: gettext('Load external images of this mail'),
                        },
                        {
                            xtype: 'tbseparator',
                            reference: 'themeCheckSep',
                        },
                        {
                            xtype: 'proxmoxcheckbox',
                            reference: 'themeCheck',
                            checked: true,
                            boxLabel: gettext('Dark-mode filter'),
                            iconCls: 'fa fa-paint-brush',
                        },
                        '->',
                        {
                            xtype: 'button',
                            reference: 'download',
                            text: gettext('Download'),
                            tooltip: gettext('Download this mail as an .eml file'),
                            responsiveText: true,
                            ariaLabel: gettext('Download this mail as .eml'),
                            setDownload: function (id) {
                                this.el.dom.download = id + '.eml';
                            },
                            bind: {
                                href: '{downloadMailURL}',
                                download: '{mailid}',
                            },
                            iconCls: 'fa fa-download',
                        },
                        '-',
                        {
                            xtype: 'button',
                            reference: 'markseen',
                            text: gettext('Seen'),
                            responsiveText: true,
                            ariaLabel: gettext('Toggle seen state'),
                            enableToggle: true,
                            iconCls: 'fa fa-eye',
                            tooltip: gettext('Mark this mail as seen or unseen'),
                        },
                        {
                            xtype: 'splitbutton',
                            reference: 'deliver',
                            text: gettext('Deliver'),
                            tooltip: gettext('Release this mail to its recipient'),
                            iconCls: 'fa fa-paper-plane-o info-blue',
                            handler: 'btnHandler',
                            menu: {
                                items: [
                                    {
                                        reference: 'welcomelist',
                                        text: gettext('Welcomelist'),
                                        iconCls: 'fa fa-check',
                                        handler: 'btnHandler',
                                    },
                                ],
                            },
                        },
                        {
                            xtype: 'splitbutton',
                            reference: 'delete',
                            text: gettext('Delete'),
                            tooltip: gettext('Permanently delete this quarantined mail'),
                            iconCls: 'fa fa-trash-o critical',
                            handler: 'btnHandler',
                            menu: {
                                items: [
                                    {
                                        reference: 'blocklist',
                                        text: gettext('Blocklist'),
                                        iconCls: 'fa fa-times',
                                        handler: 'btnHandler',
                                    },
                                ],
                            },
                        },
                    ],
                },
                {
                    xtype: 'pmgSpamInfoGrid',
                    reference: 'spaminfo',
                    border: false,
                    dock: 'bottom',
                },
                {
                    xtype: 'pmgMailInfo',
                    hidden: true,
                    reference: 'mailinfo',
                    border: false,
                },
                {
                    xtype: 'pmgAttachmentGrid',
                    reference: 'attachmentlist',
                    showDownloads: false,
                    border: false,
                    dock: 'bottom',
                },
            ],
        },
    ],
});
