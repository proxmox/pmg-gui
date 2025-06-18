class MailView extends Component {
    constructor(config = {}) {
        config.tpl =
            `
	<div class="page">
	    <div class="navbar sliding">
		<div class="navbar-inner">
		    <div class="left">
		  <a href="#" class="link back">
		<i class="icon icon-back"></i>
		<span class="ios-only">` +
            gettext('Back') +
            `</span>
		  </a>
		    </div>
		    <div class="title">Preview</div>
		</div>
	    </div>
	    <div class="fab fab-right-bottom">
		<a href="#">
		    <i class="icon f7-icons ios-only">menu</i>
		    <i class="icon f7-icons ios-only">close</i>
		    <i class="icon material-icons md-only">menu</i>
		    <i class="icon material-icons md-only">close</i>
		</a>
		<div class="fab-buttons fab-buttons-top">
		    <a href="/mail/{{mailid}}/blacklist" class="fab-label-button fab-close color-orange">
			<span>
			  <i class="icon f7-icons ios-only">close</i>
			  <i class="icon material-icons md-only">close</i>
			</span>
			<span class="fab-label">` +
            gettext('Blacklist') +
            `</span>
		    </a>
		    <a href="/mail/{{mailid}}/whitelist" class="fab-label-button fab-close">
			<span>
			    <i class="icon f7-icons ios-only">check</i>
			    <i class="icon material-icons md-only">check</i>
			</span>
			<span class="fab-label">` +
            gettext('Whitelist') +
            `</span>
		    </a>
		    <a href="/mail/{{mailid}}/delete" class="fab-label-button fab-close color-red">
			<span>
			    <i class="icon f7-icons ios-only">trash</i>
			    <i class="icon material-icons md-only">delete</i>
			</span>
		    <span class="fab-label">` +
            gettext('Delete') +
            `</span>
		    </a>
		    <a href="/mail/{{mailid}}/deliver" class="fab-label-button fab-close color-green">
			<span>
			    <i class="icon f7-icons ios-only">paper_plane</i>
			    <i class="icon material-icons md-only">send</i>
			</span>
			<span class="fab-label">` +
            gettext('Deliver') +
            `</span>
		    </a>
		</div>
	    </div>
	    <div class="page-content">
		<iframe frameborder=0 width="100%" height="100%" sandbox="allow-same-origin"
		    src="/api2/htmlmail/quarantine/content?id={{mailid}}"></iframe>
	    </div>
	</div>
	`;
        super(config);
    }
}
