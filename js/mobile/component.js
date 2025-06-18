class Component {
    constructor(config = {}) {
        var me = this;
        me.config = config;
        me.data = config.data || {};
        me.tpl = me.config.tpl || '<div class="component"></div>';
    }
    getTpl() {
        var me = this;
        if (!me._compiledtpl) {
            me._compiledtpl = Template7.compile(me.tpl);
        }
        return me._compiledtpl;
    }
    getEl(data) {
        var me = this;
        if (data === undefined && me._el) {
            return me._el;
        } else if (data !== undefined) {
            me.data = data;
        }
        me._el = Dom7(me.getTpl()(me.data));
        return me._el;
    }
}
