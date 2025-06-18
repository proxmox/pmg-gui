Ext.define('PMG.MailInfoBox', {
    extend: 'Ext.container.Container',
    xtype: 'pmgMailInfo',

    cls: 'x-toolbar-default',
    style: {
        'border-left': '0px',
        'border-right': '0px',
    },

    update: function (data) {
        let me = this;
        let escaped = {};
        for (const [key, value] of Object.entries(data || {})) {
            escaped[key] = Ext.util.Format.ellipsis(Ext.htmlEncode(value), 103);
        }
        me.items.each((item) => item.update(escaped));
    },

    layout: {
        type: 'vbox',
        align: 'stretch',
    },

    defaults: {
        xtype: 'tbtext',
        margin: '2 2 0 0 ',
    },

    items: [
        {
            tpl:
                `<b class="bold">${gettext('From')}:</b> {from}` +
                `<span style="float:right;white-space:normal;overflow-wrap:break-word;">` +
                `<b class="bold">${gettext('Receiver')}:</b> {receiver}</span>`,
        },
        { tpl: `<b class="bold">${gettext('Subject')}:</b> {subject}` },
    ],
});
