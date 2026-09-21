// Shoppage B2B Storefront Quote Basket & Live Interactions
let quoteItems = [];

function toggleQuoteDrawer() {
	const drawer = document.getElementById('quote-drawer');
	const backdrop = document.getElementById('quote-drawer-backdrop');
	if (!drawer || !backdrop) return;
	const isClosed = drawer.classList.contains('translate-x-full');
	if (isClosed) {
		drawer.classList.remove('translate-x-full');
		backdrop.classList.remove('hidden');
	} else {
		drawer.classList.add('translate-x-full');
		backdrop.classList.add('hidden');
	}
}

function addToQuote(id, title, priceZar, imageUrl) {
	const existing = quoteItems.find(item => item.id === id);
	if (existing) {
		existing.qty += 1;
	} else {
		quoteItems.push({
			id: id,
			title: title,
			priceZar: priceZar,
			imageUrl: imageUrl,
			qty: 1
		});
	}
	renderQuoteDrawer();
	// Flash badge
	const badge = document.getElementById('quote-badge-count');
	if (badge) {
		badge.classList.add('scale-125');
		setTimeout(() => badge.classList.remove('scale-125'), 300);
	}
	// Open drawer
	const drawer = document.getElementById('quote-drawer');
	if (drawer && drawer.classList.contains('translate-x-full')) {
		toggleQuoteDrawer();
	}
}

function removeQuoteItem(id) {
	quoteItems = quoteItems.filter(item => item.id !== id);
	renderQuoteDrawer();
}

function updateQuoteQty(id, delta) {
	const item = quoteItems.find(i => i.id === id);
	if (!item) return;
	item.qty += delta;
	if (item.qty <= 0) {
		removeQuoteItem(id);
	} else {
		renderQuoteDrawer();
	}
}

function renderQuoteDrawer() {
	const container = document.getElementById('quote-drawer-items');
	const badge = document.getElementById('quote-badge-count');
	const subtotalEl = document.getElementById('quote-subtotal');
	const vatEl = document.getElementById('quote-vat');
	const totalEl = document.getElementById('quote-total');
	if (!container) return;

	const totalCount = quoteItems.reduce((acc, i) => acc + i.qty, 0);
	if (badge) badge.textContent = totalCount;

	if (quoteItems.length === 0) {
		container.innerHTML = `
			<div id="quote-empty-state" class="text-center py-16 space-y-3">
				<span class="text-4xl block">📦</span>
				<h4 class="text-sm font-bold text-slate-700">Your quotation basket is empty</h4>
				<p class="text-xs text-slate-400 max-w-xs mx-auto">
					Click "Add to Quote" on any product in the catalog to prepare an instant proforma invoice.
				</p>
			</div>
		`;
		if (subtotalEl) subtotalEl.textContent = 'R 0.00';
		if (vatEl) vatEl.textContent = 'R 0.00';
		if (totalEl) totalEl.textContent = 'R 0.00';
		return;
	}

	let subtotal = 0;
	let html = '';

	quoteItems.forEach(item => {
		const lineTotal = item.priceZar * item.qty;
		subtotal += lineTotal;
		html += `
			<div class="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
				${item.imageUrl ? `<img src="${item.imageUrl}" class="w-12 h-12 rounded-lg object-contain bg-slate-50 border shrink-0" />` : '<div class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xs shrink-0">📦</div>'}
				<div class="flex-1 min-w-0">
					<h5 class="text-xs font-bold text-slate-900 truncate">${item.title}</h5>
					<p class="text-[11px] font-mono text-emerald-700 font-bold">R ${item.priceZar.toFixed(2)} each</p>
					<div class="flex items-center gap-2 mt-1">
						<button type="button" onclick="updateQuoteQty('${item.id}', -1);" class="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center justify-center">-</button>
						<span class="text-xs font-bold font-mono px-1.5">${item.qty}</span>
						<button type="button" onclick="updateQuoteQty('${item.id}', 1);" class="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center justify-center">+</button>
					</div>
				</div>
				<div class="text-right shrink-0">
					<p class="text-xs font-extrabold font-mono text-slate-900">R ${lineTotal.toFixed(2)}</p>
					<button type="button" onclick="removeQuoteItem('${item.id}');" class="text-[10px] text-rose-600 hover:underline mt-1">Remove</button>
				</div>
			</div>
		`;
	});

	container.innerHTML = html;

	const vat = subtotal * 0.15;
	const total = subtotal + vat;

	if (subtotalEl) subtotalEl.textContent = 'R ' + subtotal.toFixed(2);
	if (vatEl) vatEl.textContent = 'R ' + vat.toFixed(2);
	if (totalEl) totalEl.textContent = 'R ' + total.toFixed(2);
}

function dispatchWhatsAppQuote() {
	if (quoteItems.length === 0) {
		alert('Please add at least one product to your quotation basket first.');
		return;
	}
	const drawer = document.getElementById('quote-drawer');
	const merchantWa = drawer ? (drawer.dataset.storeWhatsapp || '') : '';
	const storeName = drawer ? (drawer.dataset.storeName || 'Merchant') : 'Merchant';
	let subtotal = 0;
	let billLines = [];
	quoteItems.forEach((item, idx) => {
		const lineTotal = item.priceZar * item.qty;
		subtotal += lineTotal;
		billLines.push(`${idx + 1}. ${item.title} x ${item.qty} units @ R${item.priceZar.toFixed(2)} = R${lineTotal.toFixed(2)} (SKU: ${item.id})`);
	});
	const vat = subtotal * 0.15;
	const grandTotal = subtotal + vat;

	let msg = `Sawubona! I would like to request an official B2B quotation / proforma invoice from ${storeName}:\n\n` +
		billLines.join('\n') +
		`\n\n--------------------------` +
		`\nSubtotal (Excl. VAT): R ${subtotal.toFixed(2)}` +
		`\nVAT (15%): R ${vat.toFixed(2)}` +
		`\nTotal Estimated: R ${grandTotal.toFixed(2)}` +
		`\n\nPlease confirm stock availability, lead time, and dispatch terms to our location. Thank you!`;

	const targetUrl = `https://wa.me/${merchantWa}?text=${encodeURIComponent(msg)}`;
	window.open(targetUrl, '_blank');
}

function copyStoreLink(btn, storeId) {
	const url = `${window.location.origin}/m/${storeId}`;
	navigator.clipboard.writeText(url).then(() => {
		const orig = btn.textContent;
		btn.textContent = 'Copied! ✓';
		setTimeout(() => btn.textContent = orig, 2000);
	});
}

function copyBadgeHTML(btn, storeId, badgeType) {
	const origin = window.location.origin;
	let width = 200;
	if (badgeType === 'order-on-shoppage') width = 220;
	if (badgeType === 'verified-merchant') width = 230;
	const snippet = `<a href="${origin}/m/${storeId}" target="_blank" rel="noopener noreferrer"><img src="${origin}/badges/${badgeType}.svg" alt="Shoppage South Africa" width="${width}" height="50" border="0" /></a>`;
	navigator.clipboard.writeText(snippet).then(() => {
		const orig = btn.textContent;
		btn.textContent = 'Copied! ✓';
		setTimeout(() => btn.textContent = orig, 2000);
	});
}

function copyEmailSignature(btn, name, address, cipc, phone, wa, storeId) {
	const origin = window.location.origin;
	const snippet = `<div style="font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.4;">
  <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${name}</div>
  <div style="font-size: 11px; color: #64748b;">${address} · CIPC: ${cipc}</div>
  <div style="font-size: 11px; color: #64748b;">Tel: ${phone} · WhatsApp: +${wa}</div>
  <div style="margin-top: 8px;">
    <a href="${origin}/m/${storeId}" target="_blank" rel="noopener noreferrer">
      <img src="${origin}/badges/order-on-shoppage.svg" alt="Order Wholesale on Shoppage" width="180" height="41" border="0" />
    </a>
  </div>
</div>`;
	navigator.clipboard.writeText(snippet).then(() => {
		const orig = btn.textContent;
		btn.textContent = 'Signature Copied! ✓';
		setTimeout(() => btn.textContent = orig, 2000);
	});
}

function copyEmbedCode(btn, storeId) {
	const origin = window.location.origin;
	const snippet = `<iframe src="${origin}/embed/m/${storeId}" width="100%" height="650" frameborder="0" style="border-radius: 16px; border: 1px solid #e2e8f0;"></iframe>`;
	navigator.clipboard.writeText(snippet).then(() => {
		const orig = btn.textContent;
		btn.textContent = 'Embed Code Copied! ✓';
		setTimeout(() => btn.textContent = orig, 2000);
	});
}
