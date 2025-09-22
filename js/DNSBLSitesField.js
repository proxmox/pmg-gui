Ext.define('PMG.form.DNSBLSitesGrid', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.pmgDnsblSitesGrid',

    mixins: ['Ext.form.field.Field'],

    allowBlank: true,
    selectAll: false,
    isFormField: true,
    deleteEmpty: false,
    selModel: 'checkboxmodel',

    config: {
        deleteEmpty: false,
    },

    emptyText: gettext('No Sites defined'),
    viewConfig: {
        deferEmptyText: false,
    },

    setValue: function (value) {
        let me = this;
        let sites = value ?? '';
        if (!sites) {
            me.getStore().removeAll();
            me.checkChange();
            return me;
        }
        let matcher = /^(.*?)(?:=(.*?))?(?:\*(.*))?$/;
        let entries = (sites.split(/[;, ]/) || [])
            .filter((s) => !!s)
            .map((entry) => {
                let [, site, filter, weight] = matcher.exec(entry);
                return {
                    site,
                    filter,
                    weight,
                };
            });
        me.getStore().setData(entries);
        me.checkChange();
        return me;
    },

    getValue: function () {
        let me = this;
        let values = [];
        me.getStore().each((rec) => {
            let val = rec.data.site;
            if (rec.data.filter) {
                val += `=${rec.data.filter}`;
            }
            if (rec.data.weight) {
                val += `*${rec.data.weight}`;
            }
            values.push(val);
        });
        return values.join(';');
    },

    getErrors: function (value) {
        let me = this;
        let emptySite = false;
        me.getStore().each((rec) => {
            if (!rec.data.site) {
                emptySite = true;
            }
        });
        let errors = [];
        if (emptySite) {
            errors.push(gettext('Site must not be empty.'));
        }
        return errors;
    },

    // override framework function to implement deleteEmpty behaviour
    getSubmitData: function () {
        let me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getValue();
            if (val !== null && val !== '') {
                data = {};
                data[me.getName()] = val;
            } else if (me.getDeleteEmpty()) {
                data = {};
                data.delete = me.getName();
            }
        }
        return data;
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        addLine: function () {
            let me = this;
            me.getView().getStore().add({
                site: '',
                filter: '',
                weight: '',
            });
        },

        removeSelection: function () {
            let me = this;
            let view = me.getView();
            let selection = view.getSelection();
            if (selection === undefined) {
                return;
            }

            selection.forEach((sel) => {
                view.getStore().remove(sel);
            });
            view.checkChange();
        },

        fieldChange: function (field, newValue, oldValue) {
            let me = this;
            let view = me.getView();
            let rec = field.getWidgetRecord();
            if (!rec) {
                return;
            }
            let column = field.getWidgetColumn();
            rec.set(column.dataIndex, newValue);
            view.checkChange();
        },
    },

    tbar: [
        {
            text: gettext('Add'),
            handler: 'addLine',
        },
        {
            xtype: 'proxmoxButton',
            text: gettext('Remove'),
            handler: 'removeSelection',
            disabled: true,
        },
    ],

    columns: [
        {
            header: gettext('Site'),
            dataIndex: 'site',
            xtype: 'widgetcolumn',
            widget: {
                xtype: 'proxmoxtextfield',
                isFormField: false,
                allowBlank: false,
                listeners: {
                    change: 'fieldChange',
                },
            },
            flex: 1,
        },
        {
            header: gettext('Filter'),
            xtype: 'widgetcolumn',
            flex: 1,
            dataIndex: 'filter',
            widget: {
                xtype: 'proxmoxtextfield',
                emptyText: Proxmox.Utils.noneText,
                allowBlank: true,
                isFormField: false,
                listeners: {
                    change: 'fieldChange',
                },
            },
        },
        {
            header: gettext('Weight'),
            xtype: 'widgetcolumn',
            flex: 1,
            dataIndex: 'weight',
            widget: {
                xtype: 'proxmoxintegerfield',
                emptyText: '1',
                allowBlank: true,
                isFormField: false,
                listeners: {
                    change: 'fieldChange',
                },
            },
        },
    ],

    store: {
        listeners: {
            update: function () {
                this.commitChanges();
            },
        },
    },

    initComponent: function () {
        let me = this;
        me.callParent();
        me.initField();
    },
});
