class LoginScreen extends Component {
    constructor(config = {}) {
        config.tpl =
            `
	<div class="login-screen">
	  <div class="view">
	    <div class="page">
	      <div class="page-content login-screen-content">
		<div class="login-screen-title">
		<img class="logo" src="pve2/images/logo-128.png" />
		Proxmox Mail Gateway
		</div>
		<form action="/api2/json/access/ticket" method="POST" class="form-ajax-submit">
		  <div class="list">
		    <ul>
		      <li class="item-content item-input">
			<div class="item-inner">
			  <div class="item-title item-label">Username</div>
			  <div class="item-input-wrap">
			    <input type="text" name="username" placeholder="` +
            gettext('Username') +
            `" required validate>
			    <span class="input-clear-button"></span>
			  </div>
			</div>
		      </li>
		      <li class="item-content item-input">
			<div class="item-inner">
			  <div class="item-title item-label">Password</div>
			  <div class="item-input-wrap">
			    <input type="password" name="password" placeholder="` +
            gettext('Password') +
            `" required validate>
			    <span class="input-clear-button"></span>
			  </div>
			</div>
		      </li>
		    </ul>
		  </div>
		  <div class="list">
		    <ul>
		      <li>
			<input type="submit" class="button" value='` +
            gettext('Log In') +
            `'>
		      </li>
		    </ul>
		  </div>
		</form>
	      </div>
	    </div>
	  </div>
	</div>
	`;
        super(config);
        var me = this;
        me._screen = app.loginScreen.create({
            content: me.getEl(),
        });

        let login = config.loginInfo;
        me._form = me.getEl().find('form');

        if (login.username && login.ticket) {
            app.form.fillFromData(me._form, {
                username: login.username,
                password: login.ticket,
            });
            me._autoLogin = true;
        } else if (PMG.Utils.authOK()) {
            app.form.fillFromData(me._form, {
                username: Proxmox.UserName,
                password: decodeURIComponent(PMG.Utils.getCookie('PMGAuthCookie')),
            });
            me._autoLogin = true;
        }
    }
    open(onLogin) {
        var me = this;
        return new Promise(function (resolve, reject) {
            me._form.on('formajax:beforesend', (e) => {
                me.loader = app.dialog.preloader();
            });

            me._form.on('formajax:success', (e) => {
                let xhr = e.detail.xhr;
                let json;
                try {
                    json = JSON.parse(xhr.responseText);
                } catch (err) {
                    xhr.error = err;
                    PMG.Utils.showError(xhr);
                    return;
                }

                resolve(json);
            });

            me._form.on('formajax:error', (e) => {
                let xhr = e.detail.xhr;
                me.loader.close();
                PMG.Utils.showError(xhr);
            });

            if (me._autoLogin) {
                delete me._autoLogin;
                me._screen.on('open', () => {
                    me._form.trigger('submit');
                });
            }

            me._screen.open();
        });
    }
    close() {
        var me = this;
        if (me.loader) {
            me.loader.close();
        }
        me._screen.close(false);
    }
}
