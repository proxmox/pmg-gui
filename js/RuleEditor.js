Ext.define('PMG.RuleEditor', {
    extend: 'Proxmox.window.Edit',
    xtype: 'ruleeditwindow',
    onlineHelp: 'chapter_mailfilter',

    url: undefined,

    method: 'PUT',

    subject: gettext('Rules'),

    width: 400,

    items: [
        {
            xtype: 'textfield',
            name: 'name',
            allowBlank: false,
            fieldLabel: gettext('Name'),
        },
        {
            xtype: 'proxmoxintegerfield',
            name: 'priority',
            allowBlank: false,
            minValue: 0,
            maxValue: 100,
            fieldLabel: gettext('Priority'),
        },
        {
            xtype: 'proxmoxKVComboBox',
            name: 'direction',
            comboItems: [
                [0, PMG.Utils.rule_direction_text[0]],
                [1, PMG.Utils.rule_direction_text[1]],
                [2, PMG.Utils.rule_direction_text[2]],
            ],
            value: 2,
            fieldLabel: gettext('Direction'),
        },
        {
            xtype: 'proxmoxcheckbox',
            name: 'active',
            defaultValue: 0,
            uncheckedValue: 0,
            checked: false,
            fieldLabel: gettext('Active'),
        },
    ],
});
