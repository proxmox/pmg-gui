include /usr/share/dpkg/pkg-info.mk

PACKAGE=pmg-gui

BUILDDIR ?= $(PACKAGE)-$(DEB_VERSION)
DSC=$(PACKAGE)_$(DEB_VERSION).dsc
DEB=$(PACKAGE)_$(DEB_VERSION)_all.deb

DESTDIR=
DOCDIR=$(DESTDIR)/usr/share/doc/$(PACKAGE)
WWWBASEDIR=$(DESTDIR)/usr/share/javascript/$(PACKAGE)
WWWCSSDIR=$(WWWBASEDIR)/css
WWWIMAGESDIR=$(WWWBASEDIR)/images
WWWJSDIR=$(WWWBASEDIR)/js

IMAGES=				\
	images/logo-128.png		\
	images/proxmox_logo.png

CSSFILES = css/ext6-pmg.css

export DEB_VERSION_UPSTREAM_REVISION

all:

$(BUILDDIR):
	rm -rf $@ $@.tmp
	rsync -a * $@.tmp
	mv $@.tmp $@


.PHONY: dsc deb
dsc: $(DSC)

$(DSC): $(BUILDDIR)
	cd $(BUILDDIR); dpkg-buildpackage -S -us -uc -d
	lintian $(DSC)

sbuild: $(DSC)
	sbuild $(DSC)

deb: $(DEB)

$(DEB): $(BUILDDIR)
	cd $(BUILDDIR); dpkg-buildpackage -b -us -uc
	lintian $(DEB)

.PHONY: js/pmgmanagerlib.js
js/pmgmanagerlib.js:
	make -C js pmgmanagerlib.js

install: pmg-index.html.tt js/pmgmanagerlib.js $(IMAGES) $(CSSFILES)
	install -d -m 755 $(WWWBASEDIR)
	install -d -m 755 $(WWWCSSDIR)
	install -d -m 755 $(WWWIMAGESDIR)
	install -d -m 755 $(WWWJSDIR)
	install -m 0644 pmg-index.html.tt $(WWWBASEDIR)
	install -m 0644 js/pmgmanagerlib.js $(WWWJSDIR)
	for f in $(IMAGES); do install -m 0644 "$$f" $(WWWIMAGESDIR); done
	for f in $(CSSFILES); do install -m 0644 "$$f" $(WWWCSSDIR); done

.PHONY: upload
upload: UPLOAD_DIST ?= $(DEB_DISTRIBUTION)
upload: $(DEB)
	tar cf - $(DEB) | ssh -X repoman@repo.proxmox.com -- upload --product pmg --dist $(UPLOAD_DIST)

distclean: clean
	rm -f examples/simple-demo.pem

.PHONY: check
check:
	$(MAKE) -C js/ check

clean:
	make -C js clean
	rm -rf $(PACKAGE)-[0-9]*/ *.dsc $(PACKAGE)*.tar.* *.deb *.changes *.buildinfo *.build
	find . -name '*~' -exec rm {} ';'

.PHONY: dinstall
dinstall: $(DEB)
	dpkg -i $(DEB)
