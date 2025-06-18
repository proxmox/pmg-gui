Ext.define('PMG.form.FilterField', {
    extend: 'Ext.form.field.Text',
    alias: 'widget.pmgFilterField',

    // the store to filter
    // optional, if not given the first parent grids store will be used
    store: undefined,

    // a list of fields of the records that will be searched
    // a field can be a string (dataIndex) or an object with 'name' and 'renderer'
    // the renderer will be used before testing the field
    filteredFields: [],

    fieldLabel: gettext('Filter'),
    labelAlign: 'right',

    triggers: {
        clear: {
            cls: 'pmx-clear-trigger',
            hidden: true,
            handler: function () {
                let me = this;
                me.setValue('');
                me.triggers.clear.setVisible(false);
            },
        },
    },

    listeners: {
        change: function (field, value) {
            let me = this;
            let grid = me.up('grid');
            if (!me.store) {
                me.store = grid.getStore();
            }

            me.store.clearFilter();
            field.triggers.clear.setVisible(value.length > 0);

            if (value) {
                me.store.filterBy((rec) =>
                    me.filteredFields.some((fieldDef) => {
                        let fieldname = fieldDef,
                            renderer = Ext.identityFn;
                        if (Ext.isObject(fieldDef)) {
                            fieldname = fieldDef.name;
                            renderer = fieldDef.renderer;
                        }
                        let testedValue = renderer(rec.data[fieldname]);
                        return (
                            testedValue.toString().toLowerCase().indexOf(value.toLowerCase()) !== -1
                        );
                    }),
                );
            }
        },
    },
});
