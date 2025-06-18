PMG = {
    Utils: {
        getCookie(name) {
            let cookies = document.cookie.split(/;\s*/);
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].split('=');
                if (cookie[0] === name && cookie.length > 1) {
                    return cookie[1];
                }
            }
            return undefined;
        },
        setCookie(name, value, expires) {
            value = encodeURIComponent(value);
            let cookie = `${name}=${value}`;
            if (expires) {
                cookie += `; expires=${expires}`;
            }
            document.cookie = cookie;
        },
        deleteCookie(name) {
            PMG.Utils.setCookie(name, '', 'Thu, 01 Jan 1970 00:00:00 UTC');
        },
        authOK(options) {
            var authCookie = PMG.Utils.getCookie('PMGAuthCookie') || '';
            return authCookie.substr(0, 7) === 'PMGQUAR' && Proxmox.UserName !== '';
        },
        isoToUnix(iso) {
            let fields = iso.split('-').map((field) => parseInt(field, 10));
            // monthIndex starts at 0
            let date = new Date(fields[0], fields[1] - 1, fields[2]);
            return Math.round(date.getTime() / 1000);
        },
        unixToIso(unix) {
            let date = new Date(unix * 1000);
            let year = date.getFullYear().toString();
            let month = (date.getMonth() + 1).toString().padStart(2, '0');
            let day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        showError(xhr) {
            let statusText = '',
                errorText = '';
            if (xhr instanceof Error) {
                statusText = gettext('Error');
                errorText = xhr.message;
            } else if (xhr.error instanceof Error) {
                statusText = gettext('Error');
                errorText = xhr.error.message;
            } else {
                statusText = xhr.status.toString() + ' ' + xhr.statusText;
                try {
                    let errorObj = JSON.parse(xhr.responseText);
                    if (errorObj.errors) {
                        let errors = Object.keys(errorObj.errors).map(
                            (key) => key + ': ' + errorObj.errors[key],
                        );
                        errorText = errors.join('<br>');
                    }
                } catch (e) {
                    statusText = gettext('Error');
                    errorText = e.message;
                }
            }
            app.toast.show({
                text: `Error:<br>
		    ${statusText}<br>
		    ${errorText}
		    `,
                closeButton: true,
                destroyOnClose: true,
            });
        },
        showSuccessToast(msg) {
            app.toast.show({
                text: msg,
                closeTimeout: 2000,
                closeButton: true,
                destroyOnClose: true,
            });
        },
        extractParams() {
            let queryObj = app.utils.parseUrlQuery(location.search);
            let mail, action, date, username, ticket;
            if (queryObj.ticket) {
                let tocheck = decodeURIComponent(queryObj.ticket);
                let match = tocheck.match(/^PMGQUAR:([^\s:]+):/);
                if (match) {
                    ticket = tocheck;
                    username = match[1];
                }
                delete queryObj.ticket;
            }

            if (queryObj.date) {
                date = queryObj.date;
                delete queryObj.date;
            }

            if (queryObj.cselect) {
                mail = queryObj.cselect;
                action = queryObj.action;
                delete queryObj.cselect;
                delete queryObj.action;
            }

            if (mail || action || date || ticket) {
                let queryString = app.utils.serializeObject(queryObj);
                window.history.replaceState(
                    window.history.state,
                    document.title,
                    location.pathname + (queryString ? '?' + queryString : ''),
                );
            }

            return { mail, action, date, username, ticket };
        },
        setLoginInfo(result) {
            PMG.Utils.setCookie('PMGAuthCookie', result.data.ticket);
            Proxmox.CSRFPreventionToken = result.data.CSRFPreventionToken;
        },
        getSubscriptionInfo() {
            return new Promise(function (resolve, reject) {
                app.request({
                    url: '/api2/json/nodes/localhost/subscription',
                    dataType: 'json',
                    success: (result, status, xhr) => {
                        resolve(result.data);
                    },
                    error: (xhr, status) => {
                        reject(xhr);
                    },
                });
            });
        },
        checkSubscription(data, showPopup) {
            return new Promise(function (resolve, reject) {
                if (data.status?.toLowerCase() !== 'active') {
                    let url = data.url || 'https://www.proxmox.com';
                    let err = `You do not have a valid subscription for this server.
			    Please visit
			    <a target="_blank" href="${url}">www.proxmox.com</a>
			    to get a list of available options.`;
                    app.toolbar.show('.toolbar.subscription');
                    $$('.button.subscription').on('click', () => {
                        app.dialog.alert(err, gettext('No valid subscription'));
                    });
                    if (showPopup) {
                        app.dialog.alert(err, gettext('No valid subscription'), () => {
                            resolve(data);
                        });
                    } else {
                        resolve();
                    }
                } else {
                    $$('.toolbar.subscription').remove();
                    resolve();
                }
            });
        },
    },
};
