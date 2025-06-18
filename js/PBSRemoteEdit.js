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
    ],
});

Ext.define('PMG.PBSEdit', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmgPBSEdit',
    onlineHelp: 'pmgbackup_pbs_remotes',

    subject: 'Proxmox Backup Server',
    isAdd: true,

    bodyPadding: 0,

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
