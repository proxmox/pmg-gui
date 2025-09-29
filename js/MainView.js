Ext.define('PMG.MainView', {
    extend: 'Ext.container.Container',
    xtype: 'mainview',

    title: 'Proxmox Mail Gateway',

    controller: {
        xclass: 'Ext.app.ViewController',
        routes: {
            ':path:subpath': {
                action: 'changePath',
                before: 'beforeChangePath',
                conditions: {
                    ':path': '(?:([%a-zA-Z0-9\\-\\_\\s,]+))',
                    ':subpath': '(?:(?::)([%a-zA-Z0-9\\-\\_\\s,]+))?',
                },
            },
        },

        beforeChangePath: function (path, subpathOrAction, action) {
            let me = this;

            let subpath = subpathOrAction;
            if (!action) {
                action = subpathOrAction;
                subpath = undefined;
            }

            if (!Ext.ClassManager.getByAlias('widget.' + path)) {
                console.warn('xtype "' + path + '" not found');
                action.stop();
                return;
            }

            let lastpanel = me.lookupReference('contentpanel').getLayout().getActiveItem();
            if (lastpanel && lastpanel.xtype === path) {
                // we have the right component already,
                // we just need to select the correct tab
                // default to the first
                subpath = subpath || 0;
                if (lastpanel.getActiveTab) {
                    // we assume lastpanel is a tabpanel
                    if (lastpanel.getActiveTab().getItemId() !== subpath) {
                        // set the active tab
                        lastpanel.setActiveTab(subpath);
                    }
                    // else we are already there
                }
                action.stop();
                return;
            }

            action.resume();
        },

        changePath: function (path, subpath) {
            let me = this;
            let contentpanel = me.lookupReference('contentpanel');
            let lastpanel = contentpanel.getLayout().getActiveItem();

            let obj = contentpanel.add({ xtype: path });
            let treelist = me.lookupReference('navtree');

            treelist.suspendEvents();
            treelist.select(path);
            treelist.resumeEvents();

            if (Ext.isFunction(obj.setActiveTab)) {
                obj.setActiveTab(subpath || 0);
                obj.addListener('tabchange', function (tabpanel, newc, oldc) {
                    let newpath = path;

                    // only add the subpath part for the
                    // non-default tabs
                    if (tabpanel.items.findIndex('id', newc.id) !== 0) {
                        newpath += ':' + newc.getItemId();
                    }

                    me.redirectTo(newpath);
                });
            }

            contentpanel.setActiveItem(obj);

            if (lastpanel) {
                contentpanel.remove(lastpanel, { destroy: true });
            }
        },

        logout: function () {
            PMG.app.logout();
        },

        navigate: function (treelist, item) {
            this.redirectTo(item.get('path'));
        },

        changeLanguage: function () {
            Ext.create('Proxmox.window.LanguageEditWindow', {
                cookieName: 'PMGLangCookie',
            }).show();
        },

        control: {
            '[reference=logoutButton]': {
                click: 'logout',
            },
            '[reference=languageButton]': {
                click: 'changeLanguage',
            },
        },

        init: function (view) {
            let me = this;

            // load username
            me.lookupReference('usernameinfo').setText(Proxmox.UserName);

            // show login on requestexception
            // fixme: what about other errors
            Ext.Ajax.on('requestexception', function (conn, response, options) {
                if (response.status === 401) {
                    // auth failure
                    me.logout();
                }
            });

            // get ticket periodically
            Ext.TaskManager.start({
                run: function () {
                    let ticket = Proxmox.Utils.authOK();
                    if (!ticket || !Proxmox.UserName) {
                        return;
                    }

                    Ext.Ajax.request({
                        params: {
                            username: Proxmox.UserName,
                            password: ticket,
                        },
                        url: '/api2/json/access/ticket',
                        method: 'POST',
                        failure: function () {
                            me.logout();
                        },
                        success: function (response, opts) {
                            let obj = Ext.decode(response.responseText);
                            PMG.Utils.updateLoginData(obj.data);
                        },
                    });
                },
                interval: 15 * 60 * 1000,
            });

            // select treeitem and load page from url fragment
            let token = Ext.util.History.getToken() || 'pmgDashboard';
            this.redirectTo(token, { force: true });
        },
    },

    plugins: 'viewport',

    layout: { type: 'border' },

    items: [
        {
            region: 'north',
            xtype: 'container',
            layout: {
                type: 'hbox',
                align: 'middle',
            },
            margin: '2 0 2 5',
            height: 38,
            items: [
                {
                    xtype: 'proxmoxlogo',
                },
                {
                    padding: '0 0 0 5',
                    xtype: 'versioninfo',
                },
                {
                    xtype: 'box', // keep markup simple, has no borders/background
                    flex: 1,
                },
                {
                    xtype: 'proxmoxHelpButton',
                    text: gettext('Documentation'),
                    hidden: false,
                    baseCls: 'x-btn',
                    iconCls: 'fa fa-info-circle x-btn-icon-el-default-toolbar-small ',
                    margin: '0 5 0 0',
                    listenToGlobalEvent: false,
                    onlineHelp: 'pmg_documentation_index',
                },
                {
                    xtype: 'button',
                    reference: 'usernameinfo',
                    style: {
                        // proxmox dark grey p light grey as border
                        backgroundColor: '#464d4d',
                        borderColor: '#ABBABA',
                    },
                    margin: '0 5 0 0',
                    iconCls: 'fa fa-user',
                    menu: [
                        {
                            iconCls: 'fa fa-gear',
                            text: gettext('My Settings'),
                            handler: () => Ext.create('PMG.window.Settings').show(),
                        },
                        {
                            iconCls: 'fa fa-paint-brush',
                            text: gettext('Color Theme'),
                            handler: () =>
                                Ext.create('Proxmox.window.ThemeEditWindow', {
                                    cookieName: 'PMGThemeCookie',
                                    autoShow: true,
                                }),
                        },
                        {
                            iconCls: 'fa fa-language',
                            text: gettext('Language'),
                            reference: 'languageButton',
                        },
                        '-',
                        {
                            reference: 'logoutButton',
                            iconCls: 'fa fa-sign-out',
                            text: gettext('Logout'),
                        },
                    ],
                },
            ],
        },
        {
            xtype: 'panel',
            scrollable: 'y',
            border: false,
            region: 'west',
            layout: {
                type: 'vbox',
                align: 'stretch',
            },
            items: [
                {
                    xtype: 'navigationtree',
                    minWidth: 180,
                    reference: 'navtree',
                    // we have to define it here until extjs 6.2 because of a bug where a
                    // viewcontroller does not detect the selectionchange event of a treelist
                    listeners: {
                        selectionchange: 'navigate',
                    },
                },
                {
                    xtype: 'box',
                    cls: 'x-treelist-pve-nav',
                    flex: 1,
                },
            ],
        },
        {
            xtype: 'panel',
            layout: { type: 'card' },
            region: 'center',
            border: false,
            reference: 'contentpanel',
        },
    ],
});
