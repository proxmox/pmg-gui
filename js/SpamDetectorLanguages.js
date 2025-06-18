Ext.define('PMG.SpamDetectorLanguagesInputPanel', {
    extend: 'Proxmox.panel.InputPanel',
    alias: 'widget.pmgSpamDetectorLanguagesInputPanel',

    languages: [
        ['af', 'Afrikaans'],
        ['am', 'Amharic'],
        ['ar', 'Arabic'],
        ['be', 'Byelorussian'],
        ['bg', 'Bulgarian'],
        ['bs', 'Bosnian'],
        ['ca', 'Catalan'],
        ['cs', 'Czech'],
        ['cy', 'Welsh'],
        ['da', 'Danish'],
        ['de', 'German'],
        ['el', 'Greek'],
        ['en', 'English'],
        ['eo', 'Esperanto'],
        ['es', 'Spanish'],
        ['et', 'Estonian'],
        ['eu', 'Basque'],
        ['fa', 'Persian'],
        ['fi', 'Finnish'],
        ['fr', 'French'],
        ['fy', 'Frisian'],
        ['ga', 'Irish'],
        ['gd', 'Scottish'],
        ['he', 'Hebrew'],
        ['hi', 'Hindi'],
        ['hr', 'Croatian'],
        ['hu', 'Hungarian'],
        ['hy', 'Armenian'],
        ['id', 'Indonesian'],
        ['is', 'Icelandic'],
        ['it', 'Italian'],
        ['ja', 'Japanese'],
        ['ka', 'Georgian'],
        ['ko', 'Korean'],
        ['la', 'Latin'],
        ['lt', 'Lithuanian'],
        ['lv', 'Latvian'],
        ['mr', 'Marathi'],
        ['ms', 'Malay'],
        ['ne', 'Nepali'],
        ['nl', 'Dutch'],
        ['no', 'Norwegian'],
        ['pl', 'Polish'],
        ['pt', 'Portuguese'],
        ['qu', 'Quechua'],
        ['Rhaeto', 'Romance'],
        ['ro', 'Romanian'],
        ['ru', 'Russian'],
        ['sa', 'Sanskrit'],
        ['sco', 'Scots'],
        ['sk', 'Slovak'],
        ['sl', 'Slovenian'],
        ['sq', 'Albanian'],
        ['sr', 'Serbian'],
        ['sv', 'Swedish'],
        ['sw', 'Swahili'],
        ['ta', 'Tamil'],
        ['th', 'Thai'],
        ['tl', 'Tagalog'],
        ['tr', 'Turkish'],
        ['uk', 'Ukrainian'],
        ['vi', 'Vietnamese'],
        ['yi', 'Yiddish'],
        ['zh', 'Chinese'],
    ],

    onGetValues: function (values) {
        if (!values.languages) {
            values.delete = 'languages';
        } else if (Ext.isArray(values.languages)) {
            values.languages = values.languages.join(' ');
        }

        return values;
    },

    initComponent: function () {
        var me = this;

        me.column1 = [];
        me.column2 = [];
        me.column3 = [];
        me.column4 = [];

        var i, len;
        for (i = 0, len = me.languages.length; i < len; i++) {
            let config = {
                xtype: 'checkboxfield',
                inputValue: me.languages[i][0],
                boxLabel: me.languages[i][1],
                name: 'languages',
            };
            if (i % 4 === 0) {
                me.column1.push(config);
            } else if (i % 4 === 1) {
                me.column2.push(config);
            } else if (i % 4 === 2) {
                me.column3.push(config);
            } else if (i % 4 === 3) {
                me.column4.push(config);
            }
        }

        me.callParent();
    },
});

Ext.define('PMG.SpamDetectorLanguages', {
    extend: 'Proxmox.window.Edit',
    onlineHelp: 'pmgconfig_spamdetector',

    subject: 'Languages',

    items: [
        {
            xtype: 'pmgSpamDetectorLanguagesInputPanel',
        },
    ],

    initComponent: function () {
        let me = this;

        me.callParent();

        me.load({
            success: function (response, options) {
                let value = response.result.data.languages || '';
                let languages = value.split(/[ ,;]+/);
                me.setValues({ languages: languages });
            },
        });
    },
});
