Ext.define('PMG.SubscriptionKeyEdit', {
    extend: 'Proxmox.window.Edit',

    title: gettext('Upload Subscription Key'),
    width: 300,
    autoLoad: true,

    onlineHelp: 'getting_help',

    items: {
        xtype: 'proxmoxtextfield',
        trimValue: true,
        name: 'key',
        value: '',
        fieldLabel: gettext('Subscription Key'),
    },
});

Ext.define('PMG.Subscription', {
    extend: 'Proxmox.grid.ObjectGrid',
    xtype: 'pmgSubscription',

    title: gettext('Subscription'),

    border: false,

    onlineHelp: 'getting_help',

    viewConfig: {
        enableTextSelection: true,
    },

    showReport: function () {
        let me = this;

        const getReportFileName = function () {
            let now = Ext.Date.format(new Date(), 'D-d-F-Y-G-i');
            return Proxmox.NodeName + '-report-' + now + '.txt';
        };

        let view = Ext.createWidget('component', {
            itemId: 'system-report-view',
            scrollable: true,
            style: {
                'white-space': 'pre',
                'font-family': 'monospace',
                padding: '5px',
            },
        });

        let reportWindow = Ext.create('Ext.window.Window', {
            title: gettext('System Report'),
            width: 1024,
            height: 600,
            layout: 'fit',
            modal: true,
            buttons: [
                '->',
                {
                    text: gettext('Download'),
                    handler: function () {
                        let fileContent = Ext.String.htmlDecode(
                            reportWindow.getComponent('system-report-view').html,
                        );
                        let fileName = getReportFileName();

                        // Internet Explorer
                        if (window.navigator.msSaveOrOpenBlob) {
                            navigator.msSaveOrOpenBlob(new Blob([fileContent]), fileName);
                        } else {
                            let element = document.createElement('a');
                            element.setAttribute(
                                'href',
                                'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent),
                            );
                            element.setAttribute('download', fileName);
                            element.style.display = 'none';
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                        }
                    },
                },
            ],
            items: view,
        });

        Proxmox.Utils.API2Request({
            url: '/api2/extjs/nodes/' + Proxmox.NodeName + '/report',
            method: 'GET',
            waitMsgTarget: me,
            failure: function (response) {
                Ext.Msg.alert(gettext('Error'), response.htmlStatus);
            },
            success: function (response) {
                let report = Ext.htmlEncode(response.result.data);
                reportWindow.show();
                view.update(report);
            },
        });
    },

    initComponent: function () {
        let me = this;

        const reload = function () {
            me.rstore.load();
        };

        let baseurl = `/nodes/${Proxmox.NodeName}/subscription`;

        let render_status = function (value) {
            let message = me.getObjectValue('message');
            if (message) {
                return value + ': ' + message;
            }
            return value;
        };

        let rows = {
            productname: {
                header: gettext('Type'),
            },
            key: {
                header: gettext('Subscription Key'),
            },
            status: {
                header: gettext('Status'),
                renderer: render_status,
            },
            message: {
                visible: false,
            },
            serverid: {
                header: gettext('Server ID'),
            },
            sockets: {
                header: gettext('Sockets'),
            },
            checktime: {
                header: gettext('Last checked'),
                renderer: Proxmox.Utils.render_timestamp,
            },
            nextduedate: {
                header: gettext('Next due date'),
            },
        };

        Ext.apply(me, {
            url: '/api2/json' + baseurl,
            cwidth1: 170,
            tbar: [
                {
                    text: gettext('Upload Subscription Key'),
                    handler: function () {
                        let win = Ext.create('PMG.SubscriptionKeyEdit', {
                            url: '/api2/extjs/' + baseurl,
                            autoShow: true,
                        });
                        win.on('destroy', reload);
                    },
                },
                {
                    text: gettext('Remove Subscription'),
                    xtype: 'proxmoxStdRemoveButton',
                    confirmMsg: gettext('Are you sure to remove the subscription key?'),
                    baseurl: baseurl,
                    dangerous: true,
                    selModel: false,
                    callback: reload,
                },
                {
                    text: gettext('Check'),
                    handler: function () {
                        Proxmox.Utils.API2Request({
                            params: { force: 1 },
                            url: baseurl,
                            method: 'POST',
                            waitMsgTarget: me,
                            failure: function (response, opts) {
                                Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                            },
                            callback: reload,
                        });
                    },
                },
                '-',
                {
                    text: gettext('System Report'),
                    handler: function () {
                        Proxmox.Utils.checked_command(function () {
                            me.showReport();
                        });
                    },
                },
            ],
            rows: rows,
        });

        me.callParent();

        reload();
    },
});
