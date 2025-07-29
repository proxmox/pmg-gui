include ../../defines.mk

# caution: order is important
MOBILESRC=				\
	  prelude.js			\
	  component.js			\
	  loginscreen.js		\
	  mailview.js			\
	  quarantineview.js		\
	  utils.js			\
	  app.js			\


.PHONY: check
check:

pmgmanagerlib-mobile.js: $(MOBILESRC)
	cat $^ >$@.tmp
	mv $@.tmp $@

.PHONY: clean
clean:
	rm -rf pmgmanagerlib-mobile.js pmgmanagerlib-mobile.js.tmp
