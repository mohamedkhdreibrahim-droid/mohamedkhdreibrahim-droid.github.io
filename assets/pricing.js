(() => {
  'use strict';
  const ar = document.documentElement.lang === 'ar';
  const text = (en, arabic) => ar ? arabic : en;
  const currencies = {
    EGP: { market: 'eg', ar: 'ج.م', en: 'EGP' },
    SAR: { market: 'sa', ar: 'ر.س', en: 'SAR' },
    AED: { market: 'ae', ar: 'د.إ', en: 'AED' }
  };
  const catalog = {
    presence: { monthly: true, rates: { EGP: 24000, SAR: 4000, AED: 4500 } },
    growth: { monthly: true, discount: 5, rates: { EGP: 42000, SAR: 7000, AED: 8000 } },
    scale: { monthly: true, rates: { EGP: 60000, SAR: 10000, AED: 11500 } },
    campaign: { monthly: false, rates: { EGP: 55000, SAR: 11000, AED: 12500 } },
    launch: { monthly: false, rates: { EGP: 85000, SAR: 17000, AED: 19000 } },
    'motion-identity': { monthly: false, rates: { EGP: 28000, SAR: 5500, AED: 6500 } }
  };
  const forms = [...document.querySelectorAll('#businessLead,#lead')];
  const pickers = [...document.querySelectorAll('[data-price-market]')];
  const format = value => new Intl.NumberFormat(ar ? 'ar-EG-u-nu-latn' : 'en-US', { maximumFractionDigits: 0 }).format(value);
  const money = (value, currency) => `${format(value)} ${currencies[currency][ar ? 'ar' : 'en']}`;
  const forMarket = value => ({ eg: 'EGP', sa: 'SAR', ae: 'AED', gulf: 'CUSTOM', multi: 'CUSTOM' })[value];
  const validCurrency = value => Object.hasOwn(currencies, value) || value === 'CUSTOM';
  const requested = new URLSearchParams(location.search).get('currency');
  let saved;
  try { saved = localStorage.getItem('mova-currency'); } catch (_) {}
  let currency = validCurrency(requested) ? requested : validCurrency(saved) ? saved : 'EGP';
  const syncLocation = () => {
    const target = new URL(location.href);
    target.searchParams.set('currency', currency);
    history.replaceState(history.state, '', target.pathname + target.search + target.hash);
  };
  const rate = (key, selectedCurrency) => {
    const item = catalog[key];
    if (!item || !Object.hasOwn(currencies, selectedCurrency)) return null;
    const base = item.rates[selectedCurrency];
    const discount = item.discount || 0;
    return { ...item, base, discount, amount: Math.round(base * (100 - discount) / 100), currency: selectedCurrency };
  };
  const quoteLines = form => {
    const key = form.elements.namedItem('package')?.value;
    if (!key || !catalog[key]) return [];
    const selectedCurrency = forMarket(form.elements.market?.value) || currency;
    const value = rate(key, selectedCurrency);
    if (!value) return [text('Price: tailored proposal for the selected markets.', 'السعر: عرض مخصص للأسواق المحددة.')];
    const lines = [`${value.monthly ? text('Monthly production fee', 'أتعاب الإنتاج الشهرية') : text('Project production fee', 'أتعاب إنتاج المشروع')}: ${money(value.amount, selectedCurrency)}`];
    if (value.discount) lines.push(`${text('Package discount', 'خصم الباقة')}: ${value.discount}% (${text('base fee', 'الأتعاب الأساسية')}: ${money(value.base, selectedCurrency)})`);
    const plan = (form.elements.engagement || form.elements.svc)?.value || '';
    if (value.monthly && /^retainer-(6|12)$/.test(plan)) {
      const months = Number(plan.split('-')[1]);
      lines.push(`${text(`Production fees over ${months} months`, `إجمالي أتعاب الإنتاج خلال ${months} شهرًا`)}: ${money(value.amount * months, selectedCurrency)}`);
    }
    lines.push(text('Production fees for the displayed scope; applicable taxes and additional costs are confirmed in the final proposal.', 'أتعاب إنتاج للنطاق المعروض؛ تُحدد الضرائب الواجبة والتكاليف الإضافية في العرض النهائي.'));
    return lines;
  };
  const refresh = () => {
    try { localStorage.setItem('mova-currency', currency); } catch (_) {}
    document.querySelectorAll('[data-language-link]').forEach(link => {
      const target = new URL(link.href, location.href);
      target.searchParams.set('currency', currency);
      link.href = target.pathname + target.search + target.hash;
    });
    pickers.forEach(select => { select.value = currency; select.disabled = false; });
    document.querySelectorAll('[data-package-card]').forEach(card => {
      const value = rate(card.dataset.packageCard, currency);
      const amount = card.querySelector('[data-price-amount]');
      if (!amount) return;
      amount.textContent = value ? money(value.amount, currency) : text('Tailored proposal', 'عرض مخصص');
      const original = card.querySelector('[data-price-original]');
      const badge = card.querySelector('[data-price-discount]');
      const discounted = !!value?.discount;
      if (original) {
        original.hidden = !discounted;
        if (discounted) original.querySelector('s').textContent = money(value.base, currency);
      }
      if (badge) {
        badge.hidden = !discounted;
        if (discounted) badge.textContent = text(`${value.discount}% package discount`, `خصم ${value.discount}% على باقة النمو`);
      }
      const unit = card.querySelector('[data-price-unit]');
      if (unit) unit.hidden = !value;
    });
    forms.forEach(form => {
      const summary = form.querySelector('[data-price-summary]');
      if (!summary) return;
      const lines = quoteLines(form);
      summary.hidden = !lines.length;
      summary.textContent = lines.join('\n');
    });
  };
  pickers.forEach(select => select.addEventListener('change', () => {
    currency = Object.hasOwn(currencies, select.value) ? select.value : 'CUSTOM';
    syncLocation();
    forms.forEach(form => {
      const market = form.elements.market;
      if (!market) return;
      if (currency !== 'CUSTOM') market.value = currencies[currency].market;
      else if (!['gulf', 'multi'].includes(market.value)) market.value = '';
    });
    refresh();
  }));
  forms.forEach(form => {
    const market = form.elements.market;
    market?.addEventListener('change', () => { currency = forMarket(market.value) || currency; syncLocation(); refresh(); });
    form.addEventListener('change', refresh);
  });
  window.MovaPricing = { quoteLines, refresh };
  refresh();
})();
