Ext.ns('PMG');

console.log('Starting PMG Manager');

Ext.define('PMG.Utils', {
    singleton: true,

    // this singleton contains miscellaneous utilities

    // use in panels with object spread (...) operator, for example:
    // ...PMG.Utils.onlineHelpTool('sysadmin_certificate_management'),
    onlineHelpTool: function (blockid) {
        let info = Proxmox.Utils.get_help_info(blockid);
        if (info === undefined) {
            info = Proxmox.Utils.get_help_info('pmg_documentation_index');
            if (info === undefined) {
                throw 'get_help_info failed'; // should not happen
            }
        }

        let docsURI = window.location.origin + info.link;
        let title = info.title || gettext('Help');
        if (info.subtitle) {
            title += ' - ' + info.subtitle;
        }
        return {
            tools: [
                {
                    type: 'help',
                    tooltip: title,
                    handler: () => window.open(docsURI),
                },
            ],
        };
    },

    senderText: gettext('Sender'),
    receiverText: gettext('Receiver'),
    scoreText: gettext('Score'),

    user_role_text: {
        root: gettext('Superuser'),
        admin: gettext('Administrator'),
        helpdesk: gettext('Help Desk'),
        qmanager: gettext('Quarantine Manager'),
        audit: gettext('Auditor'),
    },

    format_user_role: function (role) {
        return PMG.Utils.user_role_text[role] || role;
    },

    oclass_text: {
        who: gettext('Who Objects'),
        what: gettext('What Objects'),
        when: gettext('When Objects'),
        action: gettext('Action Objects'),
        from: gettext('From'),
        to: gettext('To'),
    },

    oclass_icon: {
        who: '<span class="fa fa-fw fa-user-circle"></span> ',
        what: '<span class="fa fa-fw fa-cube"></span> ',
        when: '<span class="fa fa-fw fa-clock-o"></span> ',
        action: '<span class="fa fa-fw fa-flag"></span> ',
        from: '<span class="fa fa-fw fa-user-circle"></span> ',
        to: '<span class="fa fa-fw fa-user-circle"></span> ',
    },

    mail_status_map: {
        2: 'delivered',
        4: 'deferred',
        5: 'bounced',
        N: 'rejected',
        G: 'greylisted',
        A: 'accepted',
        B: 'blocked',
        Q: 'quarantine',
    },

    icon_status_map_class: {
        2: 'check-circle',
        4: 'clock-o',
        5: 'mail-reply',
        N: 'times-circle',
        G: 'list',
        A: 'check',
        B: 'ban',
        Q: 'cube',
    },

    icon_status_map_color: {
        2: 'green',
        5: 'gray',
        A: 'green',
        B: 'red',
    },

    format_status_icon: function (status) {
        var icon = PMG.Utils.icon_status_map_class[status] || 'question-circle';
        var color = PMG.Utils.icon_status_map_color[status] || '';
        return '<i class="fa fa-' + icon + ' ' + color + '"></i> ';
    },

    format_oclass: function (oclass) {
        var icon = PMG.Utils.oclass_icon[oclass] || '';
        var text = PMG.Utils.oclass_text[oclass] || oclass;
        return icon + text;
    },

    rule_direction_text: {
        0: gettext('In'),
        1: gettext('Out'),
        2: gettext('In & Out'),
    },

    rule_direction_icon: {
        0: '<span class="fa fa-fw fa-long-arrow-left"></span> ',
        1: '<span class="fa fa-fw fa-long-arrow-right"></span> ',
        2: '<span class="fa fa-fw fa-exchange"></span> ',
    },

    format_rule_direction: function (dir) {
        var icon = PMG.Utils.rule_direction_icon[dir] || '';
        var text = PMG.Utils.rule_direction_text[dir] || dir;
        return icon + text;
    },

    format_otype_subject: function (otype) {
        let editor = PMG.Utils.object_editors[otype];
        return editor.subject ?? 'unknown';
    },

    format_otype: function (otype) {
        let editor = PMG.Utils.object_editors[otype];
        let iconCls = 'fa fa-question-circle';
        if (editor) {
            return `<span class="fa-fw ${editor.iconCls || iconCls}"></span> ${editor.subject}`;
        }
        return `<span class="fa-fw ${iconCls}"></span> unknown`;
    },

    format_ldap_protocol: function (p) {
        if (p === undefined) {
            return 'LDAP';
        }
        if (p === 'ldap') {
            return 'LDAP';
        }
        if (p === 'ldaps') {
            return 'LDAPS';
        }
        if (p === 'ldap+starttls') {
            return 'LDAP+STARTTLS';
        }
        return 'unknown';
    },

    convert_field_to_per_min: function (value, record) {
        return value / (record.data.timespan / 60);
    },

    object_editors: {
        1000: {
            onlineHelp: 'pmg_mailfilter_regex',
            iconCls: 'fa fa-filter',
            xtype: 'proxmoxWindowEdit',
            subdir: 'regex',
            subject: gettext('Regular Expression'),
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'regex',
                    reference: 'regex',
                    fieldLabel: gettext('Regex'),
                },
                {
                    xtype: 'pmgRegexTester',
                    fieldLabel: gettext('Test String'),
                    wholeMatch: true,
                    regexFieldReference: 'regex',
                },
            ],
        },
        1005: {
            onlineHelp: 'pmgconfig_ldap',
            iconCls: 'fa fa-users',
            xtype: 'pmgLDAPGroupEditor',
            subdir: 'ldap',
            subject: gettext('LDAP Group'),
        },
        1006: {
            onlineHelp: 'pmgconfig_ldap',
            iconCls: 'fa fa-user',
            xtype: 'pmgLDAPUserEditor',
            subdir: 'ldapuser',
            subject: gettext('LDAP User'),
        },
        1009: {
            onlineHelp: 'pmg_mailfilter_regex',
            iconCls: 'fa fa-filter',
            xtype: 'proxmoxWindowEdit',
            subdir: 'receiver_regex',
            subject: gettext('Regular Expression'),
            receivertest: true,
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'regex',
                    fieldLabel: gettext('Regex'),
                },
            ],
        },
        1001: {
            onlineHelp: 'pmg_mailfilter_who',
            iconCls: 'fa fa-envelope-o',
            xtype: 'proxmoxWindowEdit',
            subdir: 'email',
            subject: gettext('E-Mail'),
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'email',
                    fieldLabel: gettext('E-Mail'),
                },
            ],
        },
        1007: {
            onlineHelp: 'pmg_mailfilter_who',
            iconCls: 'fa fa-envelope-o',
            xtype: 'proxmoxWindowEdit',
            subdir: 'receiver',
            subject: gettext('E-Mail'),
            receivertest: true,
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'email',
                    fieldLabel: gettext('E-Mail'),
                },
            ],
        },
        1002: {
            onlineHelp: 'pmg_mailfilter_who',
            iconCls: 'fa fa-globe',
            xtype: 'proxmoxWindowEdit',
            subdir: 'domain',
            subject: gettext('Domain'),
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'domain',
                    fieldLabel: gettext('Domain'),
                },
            ],
        },
        1008: {
            onlineHelp: 'pmg_mailfilter_who',
            iconCls: 'fa fa-globe',
            xtype: 'proxmoxWindowEdit',
            subdir: 'receiver_domain',
            subject: gettext('Domain'),
            receivertest: true,
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'domain',
                    fieldLabel: gettext('Domain'),
                },
            ],
        },
        1003: {
            onlineHelp: 'pmg_mailfilter_who',
            iconCls: 'fa fa-globe',
            xtype: 'proxmoxWindowEdit',
            subdir: 'ip',
            subject: gettext('IP Address'),
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'ip',
                    fieldLabel: gettext('IP Address'),
                },
            ],
        },
        1004: {
            onlineHelp: 'pmg_mailfilter_who',
            iconCls: 'fa fa-globe',
            xtype: 'proxmoxWindowEdit',
            subdir: 'network',
            subject: gettext('IP Network'),
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'cidr',
                    fieldLabel: gettext('IP Network'),
                },
            ],
        },
        2000: {
            onlineHelp: 'pmg_mailfilter_when',
            iconCls: 'fa fa-clock-o',
            xtype: 'proxmoxWindowEdit',
            subdir: 'timeframe',
            subject: gettext('TimeFrame'),
            items: [
                {
                    xtype: 'timefield',
                    name: 'start',
                    format: 'H:i',
                    fieldLabel: gettext('Start Time'),
                },
                {
                    xtype: 'timefield',
                    name: 'end',
                    format: 'H:i',
                    fieldLabel: gettext('End Time'),
                },
            ],
        },
        3000: {
            onlineHelp: 'pmg_mailfilter_what',
            iconCls: 'fa fa-bullhorn',
            xtype: 'proxmoxWindowEdit',
            subdir: 'spamfilter',
            subject: gettext('Spam Filter'),
            items: [
                {
                    xtype: 'proxmoxintegerfield',
                    name: 'spamlevel',
                    allowBlank: false,
                    minValue: 0,
                    fieldLabel: gettext('Level'),
                },
            ],
        },
        3001: {
            onlineHelp: 'pmg_mailfilter_what',
            iconCls: 'fa fa-bug',
            xtype: 'proxmoxWindowEdit',
            subdir: 'virusfilter',
            subject: gettext('Virus Filter'),
            uneditable: true,
            // there are no parameters to give, so we simply submit it
            listeners: {
                show: function (win) {
                    win.submit();
                },
            },
        },
        3002: {
            onlineHelp: 'pmg_mailfilter_regex',
            iconCls: 'fa fa-code',
            xtype: 'proxmoxWindowEdit',
            subdir: 'matchfield',
            subject: gettext('Match Field'),
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'field',
                    allowBlank: false,
                    fieldLabel: gettext('Field'),
                },
                {
                    xtype: 'textfield',
                    name: 'value',
                    reference: 'value',
                    allowBlank: false,
                    fieldLabel: gettext('Value'),
                },
                {
                    xtype: 'pmgRegexTester',
                    fieldLabel: gettext('Test String'),
                    regexFieldReference: 'value',
                },
                {
                    xtype: 'proxmoxcheckbox',
                    name: 'top-part-only',
                    fieldLabel: gettext('Only top level headers'),
                    uncheckedValue: '0',
                },
            ],
        },
        3003: {
            onlineHelp: 'pmg_mailfilter_what',
            iconCls: 'fa fa-file-image-o',
            xtype: 'proxmoxWindowEdit',
            subdir: 'contenttype',
            width: 400,
            subject: gettext('Content Type Filter'),
            items: [
                {
                    xtype: 'combobox',
                    displayField: 'text',
                    valueField: 'mimetype',
                    name: 'contenttype',
                    editable: true,
                    queryMode: 'local',
                    store: {
                        autoLoad: true,
                        proxy: {
                            type: 'proxmox',
                            url: '/api2/json/config/mimetypes',
                        },
                    },
                    fieldLabel: gettext('Content Type'),
                    anyMatch: true,
                    matchFieldWidth: false,
                    listeners: {
                        change: function (cb, value) {
                            var me = this;
                            me.up().down('displayfield').setValue(value);
                        },
                    },
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: gettext('Value'),
                    allowBlank: false,
                    reset: Ext.emptyFn,
                },
                {
                    xtype: 'proxmoxcheckbox',
                    name: 'only-content',
                    fieldLabel: gettext('Ignore header information'),
                    uncheckedValue: '0',
                },
            ],
        },
        3004: {
            onlineHelp: 'pmg_mailfilter_regex',
            iconCls: 'fa fa-file-o',
            xtype: 'proxmoxWindowEdit',
            subdir: 'filenamefilter',
            width: 400,
            subject: gettext('Match Filename'),
            items: [
                {
                    xtype: 'textfield',
                    name: 'filename',
                    reference: 'filename',
                    fieldLabel: gettext('Filename'),
                    allowBlank: false,
                },
                {
                    xtype: 'pmgRegexTester',
                    fieldLabel: gettext('Test String'),
                    wholeMatch: true,
                    regexFieldReference: 'filename',
                },
            ],
        },
        3005: {
            onlineHelp: 'pmg_mailfilter_what',
            iconCls: 'fa fa-file-archive-o',
            xtype: 'proxmoxWindowEdit',
            subdir: 'archivefilter',
            width: 400,
            subject: gettext('Archive Filter'),
            items: [
                {
                    xtype: 'combobox',
                    displayField: 'text',
                    valueField: 'mimetype',
                    name: 'contenttype',
                    editable: true,
                    queryMode: 'local',
                    store: {
                        autoLoad: true,
                        proxy: {
                            type: 'proxmox',
                            url: '/api2/json/config/mimetypes',
                        },
                    },
                    fieldLabel: gettext('Content Type'),
                    anyMatch: true,
                    matchFieldWidth: false,
                    listeners: {
                        change: function (cb, value) {
                            var me = this;
                            me.up().down('displayfield').setValue(value);
                        },
                    },
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: gettext('Value'),
                    allowBlank: false,
                    reset: Ext.emptyFn,
                },
            ],
        },
        3006: {
            onlineHelp: 'pmg_mailfilter_regex',
            iconCls: 'fa fa-file-archive-o',
            xtype: 'proxmoxWindowEdit',
            subdir: 'archivefilenamefilter',
            width: 400,
            subject: gettext('Match Archive Filename'),
            items: [
                {
                    xtype: 'textfield',
                    name: 'filename',
                    reference: 'filename',
                    fieldLabel: gettext('Filename'),
                    allowBlank: false,
                },
                {
                    xtype: 'pmgRegexTester',
                    fieldLabel: gettext('Test String'),
                    wholeMatch: true,
                    regexFieldReference: 'filename',
                },
            ],
        },
        4002: {
            onlineHelp: 'pmg_mailfilter_action',
            xtype: 'proxmoxWindowEdit',
            subdir: 'notification',
            subject: gettext('Notification'),
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'name',
                    allowBlank: false,
                    fieldLabel: gettext('Name'),
                },
                {
                    xtype: 'textareafield',
                    name: 'info',
                    fieldLabel: gettext('Comment'),
                },
                {
                    xtype: 'textfield',
                    name: 'to',
                    allowBlank: false,
                    value: '__ADMIN__',
                    fieldLabel: gettext('Receiver'),
                },
                {
                    xtype: 'textfield',
                    name: 'subject',
                    allowBlank: false,
                    value: 'Notification: __SUBJECT__',
                    fieldLabel: gettext('Subject'),
                },
                {
                    xtype: 'textarea',
                    name: 'body',
                    allowBlank: false,
                    grow: true,
                    growMax: 250,
                    value:
                        'Proxmox Notification:\n\n' +
                        'Sender:   __SENDER__\n' +
                        'Receiver: __RECEIVERS__\n' +
                        'Targets:  __TARGETS__\n\n' +
                        'Subject:  __SUBJECT__\n\n' +
                        'Matching Rule: __RULE__\n\n' +
                        '__RULE_INFO__\n\n' +
                        '__VIRUS_INFO__\n' +
                        '__SPAM_INFO__\n',
                    fieldLabel: gettext('Body'),
                },
                {
                    xtype: 'proxmoxcheckbox',
                    name: 'attach',
                    fieldLabel: gettext('Attach orig. Mail'),
                },
            ],
        },
        4003: {
            onlineHelp: 'pmg_mailfilter_action',
            xtype: 'proxmoxWindowEdit',
            subdir: 'field',
            subject: gettext('Header Attribute'),
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'name',
                    allowBlank: false,
                    fieldLabel: gettext('Name'),
                },
                {
                    xtype: 'textareafield',
                    name: 'info',
                    fieldLabel: gettext('Comment'),
                },
                {
                    xtype: 'textfield',
                    name: 'field',
                    allowBlank: false,
                    fieldLabel: gettext('Field'),
                },
                {
                    xtype: 'textfield',
                    reference: 'value',
                    name: 'value',
                    allowBlank: false,
                    fieldLabel: gettext('Value'),
                },
            ],
        },
        4005: {
            onlineHelp: 'pmg_mailfilter_action',
            xtype: 'proxmoxWindowEdit',
            subdir: 'bcc',
            subject: gettext('BCC'),
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'name',
                    allowBlank: false,
                    fieldLabel: gettext('Name'),
                },
                {
                    xtype: 'textareafield',
                    name: 'info',
                    fieldLabel: gettext('Comment'),
                },
                {
                    xtype: 'textfield',
                    name: 'target',
                    allowBlank: false,
                    fieldLabel: gettext('Target'),
                },
                {
                    xtype: 'proxmoxcheckbox',
                    checked: true,
                    name: 'original',
                    boxLabel: gettext('Send Original Mail'),
                },
            ],
        },
        4007: {
            onlineHelp: 'pmg_mailfilter_action',
            xtype: 'proxmoxWindowEdit',
            subdir: 'removeattachments',
            subject: gettext('Remove Attachments'),
            width: 500,
            items: [
                {
                    xtype: 'textfield',
                    name: 'name',
                    allowBlank: false,
                    fieldLabel: gettext('Name'),
                },
                {
                    xtype: 'textareafield',
                    name: 'info',
                    fieldLabel: gettext('Comment'),
                },
                {
                    xtype: 'textareafield',
                    name: 'text',
                    grow: true,
                    growMax: 250,
                    fieldLabel: gettext('Text Replacement'),
                },
                {
                    xtype: 'proxmoxcheckbox',
                    checked: true,
                    name: 'all',
                    boxLabel: gettext('Remove all Attachments'),
                },
                {
                    xtype: 'proxmoxcheckbox',
                    checked: false,
                    name: 'quarantine',
                    boxLabel: gettext('Copy original mail to Attachment Quarantine'),
                },
            ],
        },
        4009: {
            onlineHelp: 'pmg_mailfilter_action',
            xtype: 'proxmoxWindowEdit',
            subdir: 'disclaimer',
            subject: gettext('Disclaimer'),
            width: 400,
            items: [
                {
                    xtype: 'textfield',
                    name: 'name',
                    allowBlank: false,
                    fieldLabel: gettext('Name'),
                },
                {
                    xtype: 'textareafield',
                    name: 'info',
                    fieldLabel: gettext('Comment'),
                },
                {
                    xtype: 'textareafield',
                    name: 'disclaimer',
                    grow: true,
                    growMax: 250,
                    fieldLabel: gettext('Disclaimer'),
                },
                {
                    xtype: 'proxmoxKVComboBox',
                    name: 'position',
                    fieldLabel: gettext('Position'),
                    deleteEmpty: false,
                    value: 'end',
                    comboItems: [
                        ['end', gettext('End')],
                        ['start', gettext('Start')],
                    ],
                },
                {
                    xtype: 'proxmoxcheckbox',
                    name: 'add-separator',
                    fieldLabel: gettext('Add Separator'),
                    uncheckedValue: '0',
                    value: true,
                },
            ],
        },
    },

    updateLoginData: function (data) {
        Proxmox.CSRFPreventionToken = data.CSRFPreventionToken;
        Proxmox.UserName = data.username;
        Ext.util.Cookies.set('PMGAuthCookie', data.ticket, null, '/', null, true);
    },

    quarantineActionExtracted: false,

    extractQuarantineAction: function () {
        if (PMG.Utils.quarantineActionExtracted) {
            return null;
        }

        PMG.Utils.quarantineActionExtracted = true;

        let qs = Ext.Object.fromQueryString(location.search);

        let cselect = qs.cselect;
        let action = qs.action;
        let dateString = qs.date;

        if (dateString) {
            let date = new Date(dateString).getTime() / 1000;

            // set from date for QuarantineList
            PMG.QuarantineList.from = date;
        }

        delete qs.cselect;
        delete qs.action;
        delete qs.ticket;
        delete qs.date;

        var newsearch = Ext.Object.toQueryString(qs);

        var newurl = location.protocol + '//' + location.host + location.pathname;
        if (newsearch) {
            newurl += '?' + newsearch;
        }
        newurl += location.hash;

        if (window.history) {
            window.history.pushState({ path: newurl }, '', newurl);
        }

        if (action || cselect) {
            return {
                action: action,
                cselect: cselect,
            };
        }
        return null;
    },

    doQuarantineAction: function (action, id, callback) {
        Proxmox.Utils.API2Request({
            url: '/quarantine/content/',
            params: {
                action: action,
                id: id,
            },
            method: 'POST',
            failure: function (response, opts) {
                Ext.Msg.alert(gettext('Error'), response.htmlStatus);
            },
            success: function (response, opts) {
                let count = id.split(';').length;
                let fmt =
                    count > 1
                        ? gettext("Action '{0}' for '{1}' items successful")
                        : gettext("Action '{0}' successful");
                let message = Ext.String.format(fmt, action, count);
                let title = Ext.String.format('{0} successful', Ext.String.capitalize(action));

                Ext.toast({
                    html: message,
                    title: title,
                    minWidth: 200,
                    hideDuration: 250,
                    slideBackDuration: 250,
                    slideBackAnimation: 'easeOut',
                    iconCls: 'fa fa-check',
                    shadow: true,
                    align: 'br',
                });

                if (Ext.isFunction(callback)) {
                    callback();
                }
            },
        });
    },

    render_filetype: function (value) {
        let iconCls = 'fa-file-o';
        let text = Proxmox.Utils.unknownText;

        if (!value) {
            return `<i class='fa ${iconCls}'></i> ${text}`;
        }

        text = value.toString().toLowerCase();
        const type = text.split('/')[0];

        switch (type) {
            case 'audio':
            case 'image':
            case 'video':
            case 'text':
                iconCls = `fa-file-${type}-o`;
                break;
            case 'application':
                {
                    const subtypes = ['excel', 'pdf', 'word', 'powerpoint'];
                    let found = subtypes.find((st) => text.includes(st));
                    if (found !== undefined) {
                        iconCls = `fa-file-${found}-o`;
                    }
                }
                break;
            default:
                break;
        }

        return `<i class='fa ${iconCls}'></i> ${text}`;
    },

    render_envelope: function (value, { data }, render_receiver) {
        let subject = Ext.htmlEncode(value);
        let from = Ext.htmlEncode(data.from);
        if (data.sender) {
            let sender = Ext.htmlEncode(data.sender);
            from = Ext.String.format(gettext('{0} on behalf of {1}'), sender, from);
        }
        if (render_receiver) {
            let receiver = Ext.htmlEncode(data.receiver);
            return `<small>${from}<br>To: ${receiver}</small><br>${subject}`;
        }
        return `<small>${from}</small><br>${subject}`;
    },

    render_sender: (value, _meta, rec) => PMG.Utils.render_envelope(value, rec, false),
    render_sender_receiver: (value, _meta, rec) => PMG.Utils.render_envelope(value, rec, true),

    constructor: function () {
        var _me = this;

        // use oidc instead of openid
        Proxmox.Schema.authDomains.oidc = Proxmox.Schema.authDomains.openid;
        Proxmox.Schema.authDomains.oidc.useTypeInUrl = false;
        Proxmox.Schema.authDomains.oidc.ipanel = 'pmgAuthOIDCPanel';
        delete Proxmox.Schema.authDomains.openid;

        // Disable LDAP/AD as a realm until LDAP/AD login is implemented
        Proxmox.Schema.authDomains.ldap.add = false;
        Proxmox.Schema.authDomains.ad.add = false;

        Proxmox.Schema.overrideAuthDomains({
            pmg: {
                name: 'Proxmox Mail Gateway authentication server',
                ipanel: 'pmxAuthSimplePanel',
                add: false,
                edit: true,
                pwchange: true,
                sync: false,
            },
        });

        // do whatever you want here
        Proxmox.Utils.override_task_descriptions({
            applycustomscores: ['', gettext('Apply custom SpamAssassin scores')],
            avupdate: ['', gettext('ClamAV update')],
            backup: ['', gettext('Backup')],
            clustercreate: ['', gettext('Create Cluster')],
            clusterjoin: ['', gettext('Join Cluster')],
            restore: ['', gettext('Restore')],
            saupdate: ['', gettext('SpamAssassin update')],
        });
    },
});

Ext.define('PMG.Async', {
    singleton: true,

    // Returns a Promise which executes a quarantine action when awaited.
    // Shows a Toast message box once completed, if batchNumber and batchTotal
    // are set, they will be included into the title of that toast.
    doQAction: function (action, ids, batchNumber, batchTotal) {
        if (!Ext.isArray(ids)) {
            ids = [ids];
        }
        return Proxmox.Async.api2({
            url: '/quarantine/content/',
            params: {
                action: action,
                id: ids.join(';'),
            },
            method: 'POST',
        }).then(
            (response) => {
                let count = ids.length;
                let fmt =
                    count > 1
                        ? gettext("Action '{0}' for '{1}' items successful")
                        : gettext("Action '{0}' successful");
                let message = Ext.String.format(fmt, action, count);
                let titleFmt =
                    batchNumber !== undefined && batchTotal > 1
                        ? gettext('{0} ({1}/{2}) successful')
                        : gettext('{0} successful');
                let title = Ext.String.format(
                    titleFmt,
                    Ext.String.capitalize(action),
                    batchNumber,
                    batchTotal,
                );

                Ext.toast({
                    html: message,
                    title: title,
                    minWidth: 200,
                    hideDuration: 250,
                    slideBackDuration: 250,
                    slideBackAnimation: 'easeOut',
                    iconCls: 'fa fa-check',
                    shadow: true,
                    align: 'br',
                });
            },
            (response) => Proxmox.Utils.alertResponseFailure(response),
        );
    },
});

// custom Vtypes
Ext.apply(Ext.form.field.VTypes, {
    // matches the pmg-email-address in pmg-api
    PMGMail: function (v) {
        return /^[^\s\\@]+@[^\s/\\@]+$/.test(v);
    },
    PMGMailText: gettext('Example') + ': user@example.com',
});
