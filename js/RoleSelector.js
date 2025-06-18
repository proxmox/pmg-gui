Ext.define('PMG.RoleSelector', {
    extend: 'Proxmox.form.KVComboBox',
    alias: 'widget.pmgRoleSelector',

    comboItems: [
        ['admin', PMG.Utils.format_user_role('admin')],
        ['helpdesk', PMG.Utils.format_user_role('helpdesk')],
        ['qmanager', PMG.Utils.format_user_role('qmanager')],
        ['audit', PMG.Utils.format_user_role('audit')],
    ],
});
