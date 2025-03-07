config = wiz.config("season")

if wiz.request.match("/auth/check") is not None:
    data = wiz.session.get()
    status = wiz.session.has("id")
    wiz.response.status(200, status=status, session=data)

if wiz.request.match("/auth/login") is not None:
    wiz.response.redirect("/authenticate")

if wiz.request.match("/auth/logout") is not None:
    wiz.session.clear()

if wiz.request.match("/auth/sls") is not None:
    wiz.session.clear()

if config.get("use_saml", False):
    wiz.model("portal/season/auth/saml").baseuri("/auth")

wiz.response.redirect(config.get("default_url", "/"))