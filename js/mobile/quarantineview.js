class QuarantineView extends Component {
    constructor(config = {}) {
        config.tpl =
            config.tpl ||
            `
	    <div class="view view-quarantine">
	    <div data-name="quarantine-list" class="page">
		<div class="navbar">
		    <div class="navbar-inner">
			<div class="left">
			    <img class="logo-navbar" style="padding: 0 10px"
			        src="pve2/images/logo-128.png" height=32 />
			</div>
			<div class="title">Mail Gateway</div>
		    </div>
		</div>
		<div class="settings-form elevation-5 fab-morph-target">
		    <div class="block-title block-title-medium">` +
                gettext('Range') +
                `</div>
		    <div class="list no-hairlines-md">
			<ul>
			    <li class="item-content item-input">
				<div class="item-inner">
				    <div class="item-title item-label">` +
                gettext('Since') +
                `</div>
				    <div class="item-input-wrap">
					<input type="date" name="from" placeholder="from" required validate>
				    </div>
				</div>
			    </li>
			    <li class="item-content item-input">
				<div class="item-inner">
				    <div class="item-title item-label">` +
                gettext('Until') +
                `</div>
				    <div class="item-input-wrap">
					<input type="date" name="to" placeholder="to" required validate>
				    </div>
				</div>
			    </li>
			</ul>
			<a class="button fab-close range-form">` +
                gettext('OK') +
                `</a>
		    </div>
		</div>
		<div class="fab fab-morph fab-right-bottom" data-morph-to=".settings-form">
		    <a href="#">
			<i class="icon f7-icons ios-only">calendar</i>
			<i class="icon material-icons md-only">date_range</i>
		    </a>
		</div>
		    <div class="toolbar subscription toolbar-hidden toolbar-bottom">
			<div class="toolbar-inner">
			<a class="button subscription">
			    <i class="icon f7-icons ios-only color-yellow">alert</i>
			    <i class="icon material-icons md-only color-yellow">warning</i>
			    <span class="subscription-text">
			    ` +
                gettext('No valid subscription') +
                `
			    </span>
			</a>
			</div>
		    </div>
		<div class="page-content ptr-content">
		    <div class="ptr-preloader">
			<div class="preloader"></div>
			<div class="ptr-arrow"></div>
		    </div>
		    <div class="list virtual-list"></div>
		</div>
	    </div>
	    </div>`;
        config.itemTemplate =
            config.itemTemplate ||
            `
	    <li class="swipeout">
		<div class="swipeout-content">
		<a href="/mail/{{id}}/" class="item-link item-content">
		    <div class="item-inner">
			<div class="item-title">
			<div class="item-header">{{escape from}}</div>
			{{escape subject}}
			</div>
			<div class="item-after">Score: {{js "this.spamlevel || 0"}}</div>
		    </div>
		</a>
		</div>
		<div class="swipeout-actions-left">
		    <a href="/mail/{{id}}/deliver" class="color-green swipeout-close">
			<i class="icon f7-icons ios-only">paper_plane</i>
			<i class="icon material-icons md-only">send</i>
			&nbsp;` +
                gettext('Deliver') +
                `
		    </a>
		    <a href="/mail/{{id}}/whitelist" class="swipeout-close">
			<i class="icon f7-icons ios-only">check</i>
			<i class="icon material-icons md-only">check</i>
			&nbsp;` +
                gettext('Whitelist') +
                `
		    </a>
		</div>
		<div class="swipeout-actions-right">
		    <a href="/mail/{{id}}/blacklist" class="color-orange swipeout-close">
			<i class="icon f7-icons ios-only">close</i>
			<i class="icon material-icons md-only">close</i>
			&nbsp;` +
                gettext('Blacklist') +
                `
		    </a>
		    <a href="/mail/{{id}}/delete" class="color-red swipeout-close">
			<i class="icon f7-icons ios-only">trash</i>
			<i class="icon material-icons md-only">delete</i>
			&nbsp;` +
                gettext('Delete') +
                `
		    </a>
		</div>
	    </li>`;
        config.dividerTemplate =
            config.dividerTemplate || '<li class="item-divider">{{group}}</li>';
        super(config);

        var me = this;

        me._compiledItemTemplate = Template7.compile(me.config.itemTemplate);
        me._compiledDividerTemplate = Template7.compile(me.config.dividerTemplate);
        me.skelTpl = `
	    <li class="skeleton-text skeleton-effect-fade">
		<a href="#" class="item-content item-link">
		<div class="item-inner">
		    <div class="item-title">
			<div class="item-header">_______________________</div>
			____ ______ __ _______ ____ _______ _______ ___
		    </div>
		    <div class="item-after">Score: 15</div>
		</div>
		</a>
	    </li>`;
        me.skelDividerTpl = '<li class="item-divider skeleton-text">____-__-__</li>';
        me.setEndtime(new Date());
        let startdate = new Date();
        startdate.setDate(startdate.getDate() - 7);
        me.setStarttime(startdate);

        // add to dom
        $$(me.config.target || '#app').append(me.getEl());

        $$(document).on('page:init', '.page[data-name=quarantine-list]', (e, page) => {
            me.vList = app.virtualList.create({
                el: '.virtual-list',
                items: [],
                renderItem: function (item) {
                    return me._renderItem(item);
                },
                height: function (item) {
                    return me._calculateHeight(item);
                },
                emptyTemplate: '<div class="empty">No data in database</div>',
            });

            // setup pull to refresh
            $$('.ptr-content').on('ptr:refresh', (ev) => {
                me.setItems([
                    { skel: true, divider: true },
                    { skel: true },
                    { skel: true },
                    { skel: true },
                    { skel: true, divider: true },
                    { skel: true },
                    { skel: true },
                    { skel: true },
                    { skel: true },
                    { skel: true },
                    { skel: true },
                    { skel: true },
                ]);
                me.load()
                    .then((data) => {
                        me.setItems(data, {
                            sorter: {
                                property: 'time',
                                numeric: true,
                                direction: 'DESC',
                            },
                            grouperFn: (val) => PMG.Utils.unixToIso(val.time),
                        });
                    })
                    .catch(PMG.Utils.showError)
                    .then(() => {
                        ev.detail();
                    });
            });

            // process query parameters
            let { mail, action, date, username, ticket } = PMG.Utils.extractParams();
            if (date) {
                me.setStarttime(date);
            }

            // setup range form
            $$('input[name=from]').val(PMG.Utils.unixToIso(me.starttime));
            $$('input[name=to]').val(PMG.Utils.unixToIso(me.endtime));

            $$('.fab').on('fab:close', () => {
                let fromChanged = me.setStarttime($$('input[name=from]').val());
                let toChanged = me.setEndtime($$('input[name=to]').val());
                if (fromChanged || toChanged) {
                    app.ptr.refresh();
                }
            });

            // check login

            let loginInfo = { username, ticket };
            let showPopup = (username && ticket) || !PMG.Utils.authOK();
            me._loginScreen = new LoginScreen({ loginInfo });

            me._loginScreen
                .open()
                .then((data) => {
                    me._loginScreen.close();
                    PMG.Utils.setLoginInfo(data);
                    return PMG.Utils.getSubscriptionInfo();
                })
                .then((data) => PMG.Utils.checkSubscription(data, showPopup))
                .then((data) => {
                    app.ptr.refresh();
                    if (mail) {
                        let url = '/mail/' + mail + '/' + (action || '');
                        me._view.router.navigate(url);
                    }
                })
                .catch(PMG.Utils.showError);
        });

        me._view = app.views.create('.view-quarantine', {
            main: me.config.mainView !== undefined ? me.config.mainView : true,
            url: '/',
            pushState: true,
            pushStateAnimateOnLoad: true,
        });
    }
    setStarttime(starttime) {
        var me = this;
        let date = starttime;
        if (!(starttime instanceof Date)) {
            // we assume an ISO string
            if (starttime === '') {
                return null;
            }
            date = new Date(PMG.Utils.isoToUnix(starttime) * 1000);
        }
        // starttime is at beginning of date
        date.setHours(0, 0, 0, 0);
        let result = Math.round(date.getTime() / 1000);
        if (result !== me.starttime) {
            me.starttime = result;
            return true;
        }
        return false;
    }
    setEndtime(endtime) {
        var me = this;
        let date = endtime;
        if (!(endtime instanceof Date)) {
            if (endtime === '') {
                return null;
            }
            // we assume an ISO string
            date = new Date(PMG.Utils.isoToUnix(endtime) * 1000);
        }
        // endtime is at the end of the day
        date.setHours(23, 59, 59);
        let result = Math.round(date.getTime() / 1000);
        if (result !== me.endtime) {
            me.endtime = result;
            return true;
        }
        return false;
    }
    _calculateHeight(item) {
        var _me = this;

        let height = 48; // default

        if (typeof item === 'object') {
            let type = app.theme + '-' + (item.divider ? 'divider' : 'item');
            switch (type) {
                case 'md-divider':
                    height = 48;
                    break;
                case 'md-item':
                    height = 54;
                    break;
                case 'ios-divider':
                    height = 31;
                    break;
                case 'ios-item':
                    height = 53;
                    break;
                default:
            }
        }

        return height;
    }
    _renderItem(item) {
        var me = this;

        if (typeof item === 'object') {
            if (item.skel) {
                return item.divider ? me.skelDividerTpl : me.skelTpl;
            } else if (item.divider) {
                return me._compiledDividerTemplate(item);
            } else {
                return me._compiledItemTemplate(item);
            }
        }

        return item.toString();
    }
    setItems(items, options) {
        var me = this;
        if (options && options.sorter) {
            if (options.sorter.sorterFn) {
                items.sort(options.sorter.sorterFn);
            } else {
                let prop = options.sorter.property;
                let numeric = options.sorter.numeric;
                let dir = options.sorter.direction === 'ASC' ? 1 : -1;
                items.sort((a, b) => {
                    let result;

                    if (numeric) {
                        result = a[prop] - b[prop];
                    } else {
                        result = a[prop] === b[prop] ? 0 : a[prop] < b[prop] ? 1 : -1;
                    }

                    return result * dir;
                });
            }
        }
        me.vList.replaceAllItems(items);
        if (options && options.grouperFn) {
            let lastgroup;
            let offset = 0;
            for (let i = 0; i + offset < items.length; i++) {
                let item = items[i + offset];
                let curgroup = options.grouperFn(item);
                if (curgroup !== lastgroup) {
                    me.vList.insertItemBefore(i + offset++, {
                        divider: true,
                        group: curgroup,
                    });
                    lastgroup = curgroup;
                }
            }
        }
    }
    load() {
        var me = this;
        return new Promise(function (resolve, reject) {
            app.request({
                url: '/api2/json/quarantine/spam',
                data: {
                    starttime: me.starttime,
                    endtime: me.endtime,
                },
                dataType: 'json',
                success: (response, status, xhr) => {
                    resolve(response.data);
                },
                error: (xhr) => {
                    reject(xhr);
                },
            });
        });
    }
}
