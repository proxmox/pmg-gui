Ext.define('PMG.MatchModeSelector', {
    extend: 'Proxmox.form.KVComboBox',
    alias: 'widget.pmgMatchModeSelector',

    comboItems: [
        ['all', gettext('All match')],
        ['any', gettext('Any matches')],
        ['notall', gettext('At least one does not match')],
        ['notany', gettext('None matches')],
    ],
});
