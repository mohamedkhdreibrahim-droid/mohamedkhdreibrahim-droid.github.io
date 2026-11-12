(() => {
  'use strict';
  const ar = document.documentElement.lang === 'ar';
  const text = (en, arabic) => ar ? arabic : en;
  const currencies = {
    EGP: { market: 'eg', ar: 'ج.م', en: 'EGP' },
    SAR: { market: 'sa', ar: 'ر.س', en: 'SAR' },
    AED: { market: 'ae', ar: 'د.إ', en: 'AED' },
    USD: { market: 'multi', ar: 'دولار', en: 'USD' }
  };
  // Final fees are anchored to USD (Leadership = 250 USD) with rounded local equivalents (≈54 EGP, 3.75 SAR, 3.67 AED per USD).
  // "list" is the pre-discount fee shown struck through; the saving is computed from the two values.
  const catalog = {
    presence: { monthly: true, rates: { USD: 99, EGP: 5400, SAR: 375, AED: 365 }, firstMonth: { USD: 75, EGP: 3999, SAR: 279, AED: 275 } },
    growth: { monthly: true, rates: { USD: 175, EGP: 9500, SAR: 650, AED: 640 }, list: { USD: 195, EGP: 10500, SAR: 725, AED: 715 } },
    scale: { monthly: true, rates: { USD: 250, EGP: 13500, SAR: 940, AED: 920 }, list: { USD: 295, EGP: 15900, SAR: 1100, AED: 1085 } },
    campaign: { monthly: false, rates: { USD: 180, EGP: 9750, SAR: 675, AED: 660 } },
    launch: { monthly: false, rates: { USD: 230, EGP: 12500, SAR: 860, AED: 845 } },
    'motion-identity': { monthly: false, rates: { USD: 120, EGP: 6500, SAR: 450, AED: 440 } }
  };
  const retainerDiscount = { 6: 5, 12: 10 };
  const forms = [...document.querySelectorAll('#businessLead,#lead')];
  const pickers = [...document.querySelectorAll('[data-price-market]')];
  const format = value => new Intl.NumberFormat(ar ? 'ar-EG-u-nu-latn' : 'en-US', { maximumFractionDigits: 0 }).format(value);
  const money = (value, currency) => `${format(value)} ${currencies[currency][ar ? 'ar' : 'en']}`;
  const forMarket = value => ({ eg: 'EGP', sa: 'SAR', ae: 'AED', gulf: 'USD', multi: 'USD' })[value];
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
    const amount = item.rates[selectedCurrency];
    const base = item.list?.[selectedCurrency] || amount;
    const discount = Math.round((1 - amount / base) * 100);
    const firstMonth = item.firstMonth?.[selectedCurrency] || 0;
    return { ...item, base, discount, saving: base - amount, amount, firstMonth, currency: selectedCurrency };
  };
  const selection = form => {
    const key = form.elements.namedItem('package')?.value;
    if (!catalog[key]) return null;
    const selectedCurrency = forMarket(form.elements.market?.value) || currency;
    return { key, currency: selectedCurrency, price: rate(key, selectedCurrency) };
  };
  const quoteLines = form => {
    const key = form.elements.namedItem('package')?.value;
    if (!key || !catalog[key]) return [];
    const selectedCurrency = forMarket(form.elements.market?.value) || currency;
    const value = rate(key, selectedCurrency);
    if (!value) return [text('Price: tailored proposal for the selected markets.', 'السعر: عرض مخصص للأسواق المحددة.')];
    const lines = [`${value.monthly ? text('Monthly production fee', 'أتعاب الإنتاج الشهرية') : text('Project production fee', 'أتعاب إنتاج المشروع')}: ${money(value.amount, selectedCurrency)}`];
    if (value.discount) lines.push(`${text('Package discount', 'خصم الباقة')}: ${value.discount}% (${text('base fee', 'الأتعاب الأساسية')}: ${money(value.base, selectedCurrency)} — ${text('you save', 'توفير')} ${money(value.saving, selectedCurrency)})`);
    if (value.firstMonth) lines.push(text(`Introductory offer for new clients: first month at ${money(value.firstMonth, selectedCurrency)}, then ${money(value.amount, selectedCurrency)} per month`, `عرض العملاء الجدد: أول شهر بـ ${money(value.firstMonth, selectedCurrency)}، ثم ${money(value.amount, selectedCurrency)} شهريًا`));
    const plan = (form.elements.engagement || form.elements.svc)?.value || '';
    if (value.monthly && /^retainer-(6|12)$/.test(plan)) {
      const months = Number(plan.split('-')[1]);
      const off = retainerDiscount[months];
      const monthly = Math.round(value.amount * (100 - off) / 100);
      const total = value.firstMonth ? value.firstMonth + monthly * (months - 1) : monthly * months;
      lines.push(`${text(`${months}-month partnership discount`, `خصم شراكة ${months === 12 ? '12 شهرًا' : '6 أشهر'}`)}: ${off}% — ${text('monthly fee', 'الأتعاب الشهرية')}: ${money(monthly, selectedCurrency)}${value.firstMonth ? text(' from month two', ' من الشهر الثاني') : ''}`);
      lines.push(`${text(`Production fees over ${months} months`, `إجمالي أتعاب الإنتاج خلال ${months === 12 ? '12 شهرًا' : '6 أشهر'}`)}: ${money(total, selectedCurrency)}`);
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
        badge.hidden = !discounted && !value?.firstMonth;
        if (discounted) badge.textContent = text(`${value.discount}% off · save ${money(value.saving, currency)}`, `خصم ${value.discount}% · وفّر ${money(value.saving, currency)}`);
        else if (value?.firstMonth) badge.textContent = text(`New clients: first month ${money(value.firstMonth, currency)}`, `للعملاء الجدد: أول شهر بـ ${money(value.firstMonth, currency)}`);
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
    document.dispatchEvent(new Event('mova:pricingchange'));
  };
  pickers.forEach(select => select.addEventListener('change', () => {
    currency = Object.hasOwn(currencies, select.value) ? select.value : 'CUSTOM';
    syncLocation();
    forms.forEach(form => {
      const market = form.elements.market;
      if (!market) return;
      if (currency === 'USD' && ['gulf', 'multi'].includes(market.value)) return;
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
  window.MovaPricing = { quoteLines, refresh, selection };
  refresh();
})();
