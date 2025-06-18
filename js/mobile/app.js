$$ = Dom7;
app = new Framework7({
    root: '#app',
    init: false,
    name: 'Proxmox Mail Gateway',
    autoDarkTheme: true,
    routes: [
        {
            path: '/:path/:subpath?',
            async: function (routeTo, routeFrom, resolve, reject) {
                if (routeTo.params.path === 'mail') {
                    let mail = new MailView();
                    resolve(
                        {
                            template: mail.getTpl(),
                        },
                        {
                            context: {
                                mailid: routeTo.params.subpath,
                            },
                        },
                    );
                } else {
                    reject();
                }
            },
        },
        {
            path: '/mail/:mailid/:action',
            async: function (routeTo, routeFrom, resolve, reject) {
                let action = routeTo.params.action;
                let mailid = routeTo.params.mailid;
                app.dialog.confirm(
                    `${action}: ${mailid}`,
                    gettext('Confirm'),
                    () => {
                        let loader = app.dialog.preloader();
                        app.request({
                            method: 'POST',
                            url: '/api2/json/quarantine/content/',
                            data: {
                                action: action,
                                id: mailid,
                            },
                            headers: {
                                CSRFPreventionToken: Proxmox.CSRFPreventionToken,
                            },
                            success: (data, status, xhr) => {
                                loader.close();
                                PMG.Utils.showSuccessToast(`Action '${action}' successful`);
                                if (action === 'delete' || action === 'deliver') {
                                    app.ptr.refresh();
                                }
                                reject();
                            },
                            error: (xhr) => {
                                loader.close();
                                PMG.Utils.showError(xhr);
                                reject();
                            },
                        });
                    },
                    () => {
                        reject();
                    },
                );
            },
        },
    ],
});

let _quarantine_view = new QuarantineView();

app.init();
