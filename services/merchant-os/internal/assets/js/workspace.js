// Shoppage Merchant — workspace shell behaviour.
// Plain script, no build step. Everything here is progressive: pages render and
// forms work without it; it adds navigation state, theming, toasts with undo,
// keyboard shortcuts and phone-friendly tables.
(function () {
	"use strict";

	var store = {
		get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
		set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
	};

	// ---- Theme: "system" (default), "light" or "dark" ----
	function applyTheme(theme) {
		var root = document.documentElement;
		if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
		else root.removeAttribute("data-theme");
		store.set("shoppage_theme", theme || "system");
		document.querySelectorAll("[data-theme-choice]").forEach(function (b) {
			b.setAttribute("aria-pressed", String(b.getAttribute("data-theme-choice") === (theme || "system")));
		});
	}
	window.applyTheme = applyTheme;

	// ---- Sidebar ----
	function app() { return document.getElementById("app-root"); }
	window.toggleMerchantSidebar = function () {
		var root = app();
		if (!root) return;
		if (window.matchMedia("(max-width: 1024px)").matches) {
			setNavOpen(!root.classList.contains("nav-open"));
			return;
		}
		var collapsed = root.classList.toggle("collapsed");
		store.set("merchant_sidebar_collapsed", collapsed ? "1" : "0");
	};
	function setNavOpen(open) {
		var root = app();
		if (!root) return;
		root.classList.toggle("nav-open", open);
		var btn = document.querySelector(".menu-btn");
		if (btn) btn.setAttribute("aria-expanded", String(open));
		if (open) { var first = document.querySelector(".side .nav-item"); if (first) first.focus(); }
	}
	window.closeMerchantNav = function () { setNavOpen(false); };

	// ---- Menus (account menu, "more") ----
	document.addEventListener("click", function (e) {
		var trigger = e.target.closest("[data-menu]");
		document.querySelectorAll(".menu-pop").forEach(function (pop) {
			if (!trigger || pop.id !== trigger.getAttribute("data-menu")) {
				pop.hidden = true;
				var t = document.querySelector('[data-menu="' + pop.id + '"]');
				if (t) t.setAttribute("aria-expanded", "false");
			}
		});
		if (trigger) {
			var pop = document.getElementById(trigger.getAttribute("data-menu"));
			if (pop) {
				pop.hidden = !pop.hidden;
				trigger.setAttribute("aria-expanded", String(!pop.hidden));
			}
		}
		var copyBtn = e.target.closest("[data-copy]");
		if (copyBtn) {
			var text = copyBtn.getAttribute("data-copy");
			(navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
				function () { toast("Copied to clipboard."); },
				function () { toast("Couldn't copy automatically. Select the text and copy it."); }
			);
		}
		if (e.target.closest(".scrim")) setNavOpen(false);
		if (e.target.closest(".side .nav-item")) setNavOpen(false);

		// Rows marked data-href open their record, unless a control was clicked.
		var row = e.target.closest("[data-href]");
		if (row && !e.target.closest("a, button, input, select, textarea, label")) {
			var href = row.getAttribute("data-href");
			if (window.htmx && row.hasAttribute("data-hx")) {
				htmx.ajax("GET", href, { target: "#tab-content", pushUrl: true });
			} else {
				window.location.href = href;
			}
		}
	});

	// ---- Toasts (server sends HX-Trigger: {"toast": {"message", "undo"}}) ----
	function toast(message, undoID) {
		var stack = document.getElementById("toast-stack");
		if (!stack || !message) return;
		var el = document.createElement("div");
		el.className = "toast";
		el.setAttribute("role", "status");
		var p = document.createElement("p");
		p.textContent = message;
		el.appendChild(p);
		if (undoID) {
			var b = document.createElement("button");
			b.className = "btn small";
			b.type = "button";
			b.textContent = "Undo";
			b.addEventListener("click", function () {
				b.disabled = true;
				var csrf = document.querySelector('meta[name="csrf-token"]');
				fetch("/undo/" + encodeURIComponent(undoID), {
					method: "POST", credentials: "same-origin",
					headers: csrf ? { "X-CSRF-Token": csrf.content } : {}
				}).then(function (r) {
					var t = r.headers.get("HX-Trigger");
					el.remove();
					if (t) { try { var d = JSON.parse(t); if (d.toast) toast(d.toast.message, d.toast.undo); } catch (e) {} }
					if (window.htmx) htmx.ajax("GET", window.location.pathname + window.location.search, { target: "#tab-content" });
				});
			});
			el.appendChild(b);
		}
		var x = document.createElement("button");
		x.className = "x";
		x.type = "button";
		x.setAttribute("aria-label", "Dismiss");
		x.textContent = "×";
		x.addEventListener("click", function () { el.remove(); });
		el.appendChild(x);
		stack.appendChild(el);
		setTimeout(function () { el.remove(); }, undoID ? 10000 : 5000);
	}
	window.showToast = toast;
	document.body.addEventListener("toast", function (e) {
		var d = e.detail || {};
		toast(d.message, d.undo);
	});
	document.body.addEventListener("htmx:responseError", function (e) {
		var xhr = e.detail && e.detail.xhr;
		var msg = xhr && xhr.responseText && xhr.responseText.length < 200 ? xhr.responseText : "Something went wrong. Nothing was changed; please try again.";
		toast(msg.trim());
	});
	document.body.addEventListener("htmx:sendError", function () {
		toast("You're offline. Check your connection and try again.");
	});

	// ---- Tables: label cells so phones can show rows as cards ----
	function labelTables(root) {
		(root || document).querySelectorAll(".table-wrap").forEach(function (wrap) {
			var table = wrap.querySelector("table");
			if (!table || wrap.classList.contains("no-cards")) return;
			var heads = Array.prototype.map.call(table.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
			if (!heads.length) return;
			table.querySelectorAll("tbody tr").forEach(function (tr) {
				Array.prototype.forEach.call(tr.children, function (td, i) {
					if (!td.hasAttribute("data-label")) td.setAttribute("data-label", heads[i] || "");
				});
			});
			wrap.classList.add("cards");
		});
	}

	// ---- Inline price editing: save on change, confirm with undo ----
	document.addEventListener("keydown", function (e) {
		if (!e.target || !e.target.matches) return;
		if (e.key === "Enter" && e.target.matches("[data-price-input]")) { e.preventDefault(); e.target.blur(); }
		if (e.key === "Escape" && e.target.matches("[data-price-input]")) { e.target.value = e.target.defaultValue; e.target.blur(); }
	});

	// ---- Keyboard shortcuts ----
	var goKeys = { h: "/tab/overview", o: "/tab/orders", p: "/tab/catalog", s: "/tab/inventory", i: "/tab/chat", c: "/tab/customers", m: "/tab/feeds", a: "/tab/analytics" };
	var pendingG = false;
	window.addEventListener("keydown", function (e) {
		var typing = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]");
		var k = e.key.toLowerCase();
		if ((e.ctrlKey || e.metaKey) && k === "k") {
			e.preventDefault();
			window.openOmnibar && window.openOmnibar();
			return;
		}
		if ((e.ctrlKey || e.metaKey) && k === "b") { e.preventDefault(); window.toggleMerchantSidebar(); return; }
		if (e.key === "Escape") { setNavOpen(false); document.querySelectorAll(".menu-pop").forEach(function (p) { p.hidden = true; }); }
		if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
		if (pendingG && goKeys[k]) {
			pendingG = false;
			e.preventDefault();
			if (window.htmx) htmx.ajax("GET", goKeys[k], { target: "#tab-content", pushUrl: true });
			return;
		}
		pendingG = k === "g";
		if (pendingG) setTimeout(function () { pendingG = false; }, 1200);
		if (e.key === "/") { e.preventDefault(); window.openOmnibar && window.openOmnibar(); }
	});

	// ---- Boot and after each swap ----
	function boot(root) {
		labelTables(root);
		var theme = store.get("shoppage_theme") || "system";
		document.querySelectorAll("[data-theme-choice]").forEach(function (b) {
			b.setAttribute("aria-pressed", String(b.getAttribute("data-theme-choice") === theme));
		});
	}
	document.addEventListener("DOMContentLoaded", function () { boot(document); });
	document.body.addEventListener("htmx:afterSettle", function (e) { boot(e.target); window.scrollTo({ top: 0 }); });
	document.body.addEventListener("htmx:historyRestore", function () { boot(document); });

	// ---- Offline app shell ----
	if ("serviceWorker" in navigator && location.protocol !== "file:") {
		window.addEventListener("load", function () { navigator.serviceWorker.register("/merchant-sw.js").catch(function () {}); });
	}
	function onlineState() {
		var el = document.getElementById("offline-banner");
		if (el) el.hidden = navigator.onLine;
	}
	window.addEventListener("online", onlineState);
	window.addEventListener("offline", onlineState);
	document.addEventListener("DOMContentLoaded", onlineState);
})();
