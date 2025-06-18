Ext.define('PMG.StatTimeSelector', {
    extend: 'Ext.container.Container',
    xtype: 'pmgStatTimeSelector',

    statics: {
        selected_year: undefined,
        selected_month: undefined,
        selected_day: undefined,

        initSelected: function () {
            let today = new Date();
            this.selected_year = today.getFullYear();
            this.selected_month = today.getMonth() + 1;
            this.selected_day = today.getDate();
        },

        getTimeSpan: function () {
            if (this.selected_year === undefined) {
                this.initSelected();
            }
            const year = this.selected_year;
            const month = this.selected_month;
            const day = this.selected_day;

            let starttime, endtime;
            if (!month) {
                starttime = new Date(year, 0);
                endtime = new Date(year + 1, 0);
            } else if (!day) {
                starttime = new Date(year, month - 1);
                endtime = new Date(year, month);
            } else {
                starttime = new Date(year, month - 1, day);
                endtime = new Date(year, month - 1, day + 1);
            }

            return {
                starttime: (starttime.getTime() / 1000).toFixed(0),
                endtime: (endtime.getTime() / 1000).toFixed(0),
            };
        },
    },

    layout: {
        type: 'hbox',
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        updateVisibility: function () {
            let view = this.getView();

            let yearsel = this.lookupReference('yearsel');
            let monthsel = this.lookupReference('monthsel');
            let daysel = this.lookupReference('daysel');

            let year = yearsel.getValue();
            let month = monthsel.getValue();
            daysel.setVisible(month !== 0);
            if (!month) {
                daysel.setValue(0);
            }
            let day = daysel.getValue();

            let statics = Ext.getClass(view);

            statics.selected_year = year;
            statics.selected_month = month;
            statics.selected_day = day;

            let data = statics.getTimeSpan();
            Ext.GlobalEvents.fireEvent('pmgStatTimeSelectorUpdate', data);
        },

        updateMaxDays: function () {
            let year = this.lookup('yearsel').getValue();
            let month = this.lookup('monthsel').getValue();
            // get last day of current month by wrapping back day 0 from next (zero indexed) month
            let maxDays = new Date(year, month, 0).getDate();
            this.lookup('daysel')
                .getStore()
                .setFilters([
                    {
                        property: 'day',
                        operator: '<=',
                        value: maxDays,
                    },
                ]);
        },

        onSelect: function () {
            this.updateMaxDays();
            this.updateVisibility();
        },

        init: function (view) {
            let statics = Ext.getClass(view);

            let yearsel = this.lookupReference('yearsel');
            let monthsel = this.lookupReference('monthsel');
            let daysel = this.lookupReference('daysel');

            yearsel.setValue(statics.selected_year);
            monthsel.setValue(statics.selected_month);
            daysel.setValue(statics.selected_month ? statics.selected_day : 0);

            this.updateVisibility();
        },
    },

    items: [
        {
            xtype: 'combobox',
            reference: 'yearsel',
            store: {
                fields: ['year'],
                data: (function () {
                    let today = new Date();
                    let year = today.getFullYear();
                    return [{ year: year }, { year: year - 1 }, { year: year - 2 }];
                })(),
            },
            listeners: { select: 'onSelect' },
            value: new Date().getFullYear(),
            queryMode: 'local',
            displayField: 'year',
            editable: false,
            valueField: 'year',
        },
        {
            xtype: 'combobox',
            reference: 'monthsel',
            store: {
                fields: ['month', 'name'],
                data: (function () {
                    let i;
                    let data = [{ month: 0, name: gettext('Whole year') }];
                    for (i = 1; i <= 12; i++) {
                        data.push({ month: i, name: Ext.Date.monthNames[i - 1] });
                    }
                    return data;
                })(),
            },
            listeners: { select: 'onSelect' },
            queryMode: 'local',
            displayField: 'name',
            editable: false,
            valueField: 'month',
        },
        {
            xtype: 'combobox',
            reference: 'daysel',
            store: {
                fields: ['day', 'name'],
                data: (function () {
                    let i;
                    let data = [{ day: 0, name: gettext('Whole month') }];
                    for (i = 1; i <= 31; i++) {
                        data.push({ day: i, name: i });
                    }
                    return data;
                })(),
            },
            listeners: { select: 'onSelect' },
            queryMode: 'local',
            displayField: 'name',
            editable: false,
            valueField: 'day',
        },
    ],
});
