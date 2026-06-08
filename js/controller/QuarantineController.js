Ext.define('PMG.controller.QuarantineController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.quarantine',

    updatePreview: function (raw, rec) {
        let preview = this.lookupReference('preview');

        if (!rec || !rec.data || !rec.data.id) {
            preview.update('');
            preview.setDisabled(true);
            return;
        }

        let url = `/api2/htmlmail/quarantine/content?id=${rec.data.id}`;
        if (raw) {
            url += '&raw=1';
        }
        if (this.loadImages) {
            url += '&images=1';
        }
        preview.setDisabled(false);
        this.lookupReference('raw').setDisabled(false);
        this.lookupReference('download').setDisabled(false);
        preview.update(
            "<iframe frameborder=0 width=100% height=100% sandbox='allow-same-origin' src='" +
                url +
                "'></iframe>",
        );
    },

    multiSelect: function (selection) {
        let me = this;
        me.lookupReference('raw').setDisabled(true);
        me.lookupReference('download').setDisabled(true);
        me.lookupReference('mailinfo').setVisible(false);
        me.lookup('attachmentlist')?.setVisible(false);

        let preview = me.lookupReference('preview');
        preview.setDisabled(false);
        preview.update(
            `<h3 style="padding-left:5px;">${gettext('Multiple E-Mails selected')} (${selection.length})</h3>`,
        );
    },

    toggleTheme: function (button) {
        let preview = this.lookup('preview');
        this.themed = !this.themed;

        if (this.themed) {
            preview.addCls('pmg-mail-preview-themed');
        } else {
            preview.removeCls('pmg-mail-preview-themed');
        }
    },

    hideThemeToggle: function (argument) {
        let me = this;
        let themeButton = me.lookup('themeCheck');
        themeButton.disable();
        themeButton.hide();
        me.lookup('themeCheckSep').hide();
        me.themed = true;
        me.toggleTheme();
    },

    showThemeToggle: function (argument) {
        let me = this;
        let themeButton = me.lookup('themeCheck');
        me.themed = false;
        me.toggleTheme();
        themeButton.setValue(true);
        themeButton.enable();
        themeButton.show();
        me.lookup('themeCheckSep').show();
    },

    toggleRaw: function (button) {
        let me = this;
        let list = me.lookupReference('list');
        let rec = list.selModel.getSelection()[0];
        me.lookupReference('mailinfo').setVisible(me.raw);
        me.raw = !me.raw;
        me.updatePreview(me.raw, rec);
    },

    toggleImages: function (button) {
        let me = this;
        let list = me.lookupReference('list');
        let rec = list.selModel.getSelection()[0];
        me.loadImages = !me.loadImages;
        me.updatePreview(me.raw || false, rec);
    },

    btnHandler: function (button, e) {
        let me = this;
        let action = button.reference;
        let list = me.lookupReference('list');
        let selected = list.getSelection();
        me.doAction(action, selected);
    },

    downloadMail: function () {
        let me = this;
        let vm = me.getViewModel();
        let element = document.createElement('a');
        element.setAttribute('href', vm.get('downloadMailURL'));
        element.setAttribute('download', `${vm.get('mailid')}.eml`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    },

    doAction: function (action, selected) {
        if (!selected.length) {
            return;
        }

        let list = this.lookupReference('list');

        if (selected.length > 1) {
            let idlist = selected.map((item) => item.data.id);
            Ext.Msg.confirm(
                gettext('Confirm'),
                Ext.String.format(gettext("Action '{0}' for '{1}' items"), action, selected.length),
                async function (button) {
                    if (button !== 'yes') {
                        return;
                    }

                    list.mask(gettext('Processing...'), 'x-mask-loading');

                    const sliceSize = 2500,
                        maxInFlight = 2;
                    let batches = [],
                        batchCount = Math.ceil(selected.length / sliceSize);
                    for (let i = 0; i * sliceSize < selected.length; i++) {
                        let sliceStart = i * sliceSize;
                        let sliceEnd = Math.min(sliceStart + sliceSize, selected.length);
                        batches.push(
                            PMG.Async.doQAction(
                                action,
                                idlist.slice(sliceStart, sliceEnd),
                                i + 1,
                                batchCount,
                            ),
                        );
                        if (batches.length >= maxInFlight) {
                            await Promise.allSettled(batches); // eslint-disable-line no-await-in-loop
                            batches = [];
                        }
                    }
                    await Promise.allSettled(batches); // await possible remaining ones
                    list.unmask();
                    // below can be slow, we could remove directly from the in-memory store, but
                    // with lots of elements and some failures we could be quite out of sync?
                    list.getController().load();
                },
            );
            return;
        }

        // marking as seen/unseen keeps the mail in the list, just update the flag
        let isSeenAction = action === 'mark-seen' || action === 'mark-unseen';

        PMG.Utils.doQuarantineAction(action, selected[0].data.id, function () {
            if (isSeenAction) {
                selected[0].set('seen', action === 'mark-seen');
                selected[0].commit();
                return;
            }
            let listController = list.getController();
            listController.allowPositionSave = false;
            // success -> remove directly to avoid slow store reload for a single-element action
            list.getStore().remove(selected[0]);
            listController.restoreSavedSelection();
            listController.allowPositionSave = true;
        });
    },

    onSelectMail: function () {
        let me = this;
        let list = this.lookupReference('list');
        let selection = list.selModel.getSelection();

        // Reset the per-mail "load images" opt-in on every selection change, so
        // switching to another mail never silently loads its external resources;
        // the on-demand image mode is meant to be a deliberate per-mail decision.
        me.loadImages = false;
        me.lookupReference('loadimages')?.toggle(false, true);
        me.lookupReference('loadimages')?.setVisible(false);

        if (selection.length > 1) {
            me.multiSelect(selection);
            return;
        }

        let rec = selection[0] || {};

        let spaminfo = me.lookup('spaminfo');
        let id = rec.data?.id;
        if (id) {
            if (spaminfo) {
                // reuse the spam-info grid's content request
                spaminfo.getStore().on(
                    'load',
                    (store, records, success, op) => {
                        let data = op && Ext.decode(op.getResponse()?.responseText, true)?.data;
                        me.revealLoadImages(id, data?.external_images);
                    },
                    me,
                    { single: true },
                );
            } else {
                // virus quarantine has no spam-info grid
                Proxmox.Utils.API2Request({
                    url: '/quarantine/content',
                    method: 'GET',
                    params: { id },
                    autoErrorAlert: false,
                    success: ({ result }) => me.revealLoadImages(id, result?.data?.external_images),
                });
            }
        }

        spaminfo?.setID(rec);
        me.lookup('attachmentlist')?.setID(rec);
        me.lookup('attachmentlist')?.setVisible(!!rec.data);

        me.getViewModel().set('mailid', rec.data ? rec.data.id : '');
        me.updatePreview(me.raw || false, rec);
        me.lookupReference('mailinfo').setVisible(!!rec.data && !me.raw);
        me.lookupReference('mailinfo').update(rec.data);
    },

    // reveal the button from the mail's 'external_images' flag, but only if that
    // mail is still the single selected one (a slow response must not apply to a
    // mail the user already moved away from)
    revealLoadImages: function (id, external) {
        let sel = this.lookupReference('list').selModel.getSelection();
        if (sel.length !== 1 || sel[0].data?.id !== id) {
            return;
        }
        // a boolean can arrive as a bool, a number or a PVE::JSONSchema boolean string
        let on =
            external === true ||
            external === 1 ||
            (typeof external === 'string' && /^\s*(1|on|yes|true)\s*$/i.test(external));
        this.lookupReference('loadimages')?.setVisible(on);
    },

    openContextMenu: function (table, record, tr, index, event) {
        event.stopEvent();
        let me = this;
        let list = me.lookup('list');
        Ext.create('PMG.menu.QuarantineContextMenu', {
            callback: (action) => me.doAction(action, list.getSelection()),
        }).showAt(event.getXY());
    },

    keyPress: function (table, record, item, index, event) {
        let me = this;
        let list = me.lookup('list');
        let key = event.getKey();
        let action = '';
        switch (key) {
            case event.DELETE:
            case 127:
                action = 'delete';
                break;
            case Ext.event.Event.D:
            case Ext.event.Event.D + 32:
                action = 'deliver';
                break;
        }

        if (action !== '') {
            me.doAction(action, list.getSelection());
        }
    },

    beforeRender: function () {
        let me = this;
        let currentTheme = Ext.util.Cookies.get('PMGThemeCookie');

        if (currentTheme === '__default__' || currentTheme === null) {
            me.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

            me.themeListener = (e) => {
                if (e.matches) {
                    me.showThemeToggle();
                } else {
                    me.hideThemeToggle();
                }
            };

            me.themeListener(me.mediaQueryList);
            me.mediaQueryList.addEventListener('change', me.themeListener);
        } else if (currentTheme === 'crisp') {
            me.hideThemeToggle();
        } else {
            me.showThemeToggle();
        }
    },

    destroy: function () {
        let me = this;

        me.mediaQueryList?.removeEventListener('change', me.themeListener);

        me.callParent();
    },

    control: {
        'button[reference=raw]': {
            click: 'toggleRaw',
        },
        'button[reference=loadimages]': {
            click: 'toggleImages',
        },
        'proxmoxcheckbox[reference=themeCheck]': {
            change: 'toggleTheme',
        },
        pmgQuarantineList: {
            selectionChange: 'onSelectMail',
            itemkeypress: 'keyPress',
            rowcontextmenu: 'openContextMenu',
        },
    },
});
