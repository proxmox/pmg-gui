Ext.define('PMG.Application', {
    extend: 'Ext.app.Application',

    name: 'PMG',
    appProperty: 'app',

    stores: ['NavigationStore'],

    layout: 'fit',

    realignWindows: function () {
        var modalwindows = Ext.ComponentQuery.query('window[modal]');
        Ext.Array.forEach(modalwindows, function (item) {
            item.center();
        });
    },

    logout: function () {
        var me = this;
        Proxmox.Utils.authClear();
        me.changeView('loginview', true);
    },

    changeView: function (view, skipCheck) {
        var me = this;
        PMG.view = view;
        me.view = view;
        me.currentView.destroy();
        me.currentView = Ext.create({
            xtype: view,
            targetview: me.targetview,
        });
        if (skipCheck !== true) {
            Proxmox.Utils.checked_command(Ext.emptyFn); // display subscription status
        }
    },

    view: 'loginview',
    targetview: 'mainview',

    launch: function () {
        var me = this;
        Ext.on('resize', me.realignWindows);

        var provider = new Ext.state.LocalStorageProvider({ prefix: 'ext-pmg-' });
        Ext.state.Manager.setProvider(provider);

        // show login window if not loggedin
        var loggedin = Proxmox.Utils.authOK();
        var cookie = Ext.util.Cookies.get(Proxmox.Setup.auth_cookie_name);
        var qs = Ext.Object.fromQueryString(location.search);

        var pathname = location.pathname.replace(/\/+$/, '');

        if (pathname === '/quarantine') {
            me.targetview = 'quarantineview';

            if (qs.ticket === undefined && loggedin) {
                me.view = 'quarantineview';
            }
        } else if (loggedin && cookie.substr(0, 7) !== 'PMGQUAR') {
            me.view = 'mainview';
        }

        PMG.view = me.view;
        me.currentView = Ext.create({
            xtype: me.view,
            targetview: me.targetview,
        });
    },
});

Ext.application('PMG.Application');
