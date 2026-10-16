# Elevora — Elevator Operations Platform
# Build & deploy for the web admin (static React/Vite SPA).
#
# Usage:
#   make install   install frontend dependencies
#   make dev       run the web admin locally (Vite dev server)
#   make build     production build -> frontend/dist
#   make deploy    build + rsync to the server webroot
#   make push      git push to origin/main
#   make release   deploy + push (ship code and site together)
#
# Override the target if needed:  make deploy SSH_HOST=cranberry WEBROOT=/var/www/hani-yousif/elevora

SSH_HOST ?= cranberry
WEBROOT  ?= /var/www/hani-yousif/elevora
URL      ?= https://elevora.hani-yousif.com
FRONTEND := frontend

.PHONY: help install dev build deploy push release verify

help:
	@echo "Elevora — make targets:"
	@echo "  make install   install frontend deps"
	@echo "  make dev       run locally (vite dev server)"
	@echo "  make build     production build ($(FRONTEND)/dist)"
	@echo "  make deploy    build + rsync to $(SSH_HOST):$(WEBROOT)"
	@echo "  make push      git push origin main"
	@echo "  make release   deploy + push"
	@echo "  make verify    curl the live URL"

install:
	cd $(FRONTEND) && npm install

dev:
	cd $(FRONTEND) && npm run dev

build:
	cd $(FRONTEND) && npm run build

deploy: build
	rsync -az --delete -e "ssh -o ConnectTimeout=15" $(FRONTEND)/dist/ $(SSH_HOST):$(WEBROOT)/
	@echo "✓ Deployed → $(URL)"

push:
	git push origin main

release: deploy push
	@echo "✓ Release complete → $(URL)"

verify:
	@curl -s -o /dev/null -w "HTTP %{http_code}  (%{url_effective})\n" $(URL)
	@curl -s $(URL) | grep -oiE "<title>[^<]*</title>" || true
