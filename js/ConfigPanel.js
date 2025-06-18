/*
 * Base class for all the multitab config panels.
 * Usage: You'd create a subclass of this, and then define your wanted tabs as items like this:
 *
 * items: [{
 *  title: "myTitle",
 *  xytpe: "somextype",
 *  iconCls: 'fa fa-icon',
 *  groups: ['somegroup'],
 *  expandedOnInit: true,
 *  itemId: 'someId'
 * }]
 *
 * this has to be in the declarative syntax, else we  cannot save them for later (so no Ext.create
 * or Ext.apply of an item in the subclass)
 *
 * the groups array expects the itemids of the items which are the parents, which have to come
 * before they are used.
 *
 * If you want following the tree:
 *   Option1
 *   Option2
 *      -> SubOption1
 *         -> SubSubOption1
 *
 * then the suboption1 group array has to look like this:
 *  groups: ['itemid-of-option2']
 *
 * and the subsuboption1 one:
 *  groups: ['itemid-of-option2', 'itemid-of-suboption1']
 *
 * setting the expandedOnInit determines if the item/group is expanded initially (false by default)
 */
Ext.define('PMG.panel.Config', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pmgPanelConfig',

    viewFilter: undefined, // a filter to pass to that ressource grid

    dockedItems: [
        {
            // this is needed for the overflow handler
            xtype: 'toolbar',
            overflowHandler: 'scroller',
            dock: 'left',
            style: {
                backgroundColor: '#f5f5f5',
                padding: 0,
                margin: 0,
            },
            items: {
                xtype: 'treelist',
                itemId: 'menu',
                ui: 'pve-nav',
                expanderOnly: true,
                expanderFirst: false,
                animation: false,
                singleExpand: false,
                listeners: {
                    selectionchange: function (treeList, selection) {
                        let view = this.up('panel');
                        view.suspendLayout = true;
                        view.activateCard(selection.data.id);
                        view.suspendLayout = false;
                        view.updateLayout();
                    },
                    itemclick: function (treelist, info) {
                        var olditem = treelist.getSelection();
                        var newitem = info.node;

                        // don't select when clicking on the expand arrow, but still want the original behavior
                        if (info.select === false) {
                            return;
                        }

                        // if a different open item is clicked, leave it open, else toggle the clicked item
                        if (olditem.data.id !== newitem.data.id && newitem.data.expanded === true) {
                            info.toggle = false;
                        } else {
                            info.toggle = true;
                        }
                    },
                },
            },
        },
    ],

    firstItem: '',
    layout: 'card',
    border: 0,

    // used for automated test
    selectById: function (cardid) {
        var me = this;

        var root = me.store.getRoot();
        var selection = root.findChild('id', cardid, true);

        if (selection) {
            selection.expand();
            var menu = me.down('#menu');
            menu.setSelection(selection);
            return cardid;
        }
        return null;
    },

    activateCard: function (cardid) {
        var me = this;
        if (me.savedItems[cardid]) {
            var curcard = me.getLayout().getActiveItem();
            me.add(me.savedItems[cardid]);
            if (curcard) {
                me.setActiveItem(cardid);
                me.remove(curcard, true);

                // trigger state change

                var ncard = cardid;
                // Note: '' is alias for first tab. First tab can be 'search' or something else
                if (cardid === me.firstItem) {
                    ncard = '';
                }
                if (me.hstateid) {
                    me.sp.set(me.hstateid, { value: ncard });
                }
            }
        }
    },

    initComponent: function () {
        var me = this;

        var stateid = me.hstateid;

        me.sp = Ext.state.Manager.getProvider();

        var activeTab; // leaving this undefined means items[0] will be the default tab

        if (stateid) {
            var state = me.sp.get(stateid);
            if (state && state.value) {
                // if this tab does not exists, it chooses the first
                activeTab = state.value;
            }
        }

        // include search tab
        me.items = me.items || [];

        me.savedItems = {};
        if (me.items[0]) {
            me.firstItem = me.items[0].itemId;
        }

        me.store = Ext.create('Ext.data.TreeStore', {
            root: {
                expanded: true,
            },
        });
        var root = me.store.getRoot();
        me.items.forEach(function (item) {
            var treeitem = Ext.create('Ext.data.TreeModel', {
                id: item.itemId,
                text: item.title,
                iconCls: item.iconCls,
                leaf: true,
                expanded: item.expandedOnInit,
            });
            item.header = false;
            if (me.savedItems[item.itemId] !== undefined) {
                throw 'itemId already exists, please use another';
            }
            me.savedItems[item.itemId] = item;

            var group;
            var curnode = root;

            // get/create the group items
            while (Ext.isArray(item.groups) && item.groups.length > 0) {
                group = item.groups.shift();

                var child = curnode.findChild('id', group);
                if (child === null) {
                    // did not find the group item so add it where we are
                    break;
                }
                curnode = child;
            }

            // lets see if it already exists
            var node = curnode.findChild('id', item.itemId);

            if (node === null) {
                curnode.appendChild(treeitem); // insert the item
            } else {
                // should not happen!
                throw 'id already exists';
            }
        });

        delete me.items;
        me.defaults = me.defaults || {};
        Ext.apply(me.defaults, {
            viewFilter: me.viewFilter,
            border: 0,
        });

        me.callParent();

        var menu = me.down('#menu');
        var selection = root.findChild('id', activeTab, true) || root.firstChild;
        var node = selection;
        while (node !== root) {
            node.expand();
            node = node.parentNode;
        }
        menu.setStore(me.store);
        menu.setSelection(selection);

        // on a state change select the new item
        const statechange = function (sp, key, newState) {
            // it the state change is for this panel
            if (stateid && key === stateid && newState) {
                // get active item
                var acard = me.getLayout().getActiveItem().itemId;
                // get the itemid of the new value
                var ncard = newState.value || me.firstItem;
                if (ncard && acard !== ncard) {
                    // select the chosen item
                    menu.setSelection(root.findChild('id', ncard, true) || root.firstChild);
                }
            }
        };

        if (stateid) {
            me.mon(me.sp, 'statechange', statechange);
        }
    },
});
