(() => {
  'use strict';
  const source = document.querySelector('#businessLead,#lead');
  const form = document.getElementById('transferReceipt');
  if (!source || !form || !window.MovaPricing) return;
  const ar = document.documentElement.lang === 'ar';
  const text = (en, arabic) => ar ? arabic : en;
  const section = document.getElementById('transfer');
  const error = section.querySelector('[data-transfer-error]');
  const file = form.elements.attachment;
  let identity = '';
  let senderEdited = false;
  form.elements.name.addEventListener('input', () => { senderEdited = true; });
  const showError = message => { error.textContent = message; error.hidden = !message; };
  const sync = () => {
    const selected = window.MovaPricing.selection(source);
    const plan = source.elements.engagement || source.elements.svc;
    const next = selected ? `${selected.key}:${selected.currency}:${plan.value}` : '';
    if (identity && identity !== next) {
      ['transfer_reference', 'transferred_amount_egp', 'attachment'].forEach(name => { form.elements[name].value = ''; });
      form.elements.review_acknowledged.checked = false;
      showError('');
    }
    identity = next;
    section.querySelector('[data-transfer-empty]').hidden = !!selected;
    section.querySelector('[data-transfer-selected]').hidden = !selected;
    const payable = selected?.currency === 'EGP' && !!selected.price;
    section.querySelector('[data-transfer-foreign]').hidden = !selected || payable;
    section.querySelector('[data-transfer-egp-panel]').hidden = !payable;
    form.querySelector('button[type="submit"]').disabled = !payable;
    const label = source.elements.namedItem('package')?.selectedOptions[0]?.textContent || '';
    const quote = selected ? window.MovaPricing.quoteLines(source).join('\n') : '';
    section.querySelector('[data-transfer-summary]').textContent = `${label}\n${quote}`;
    form.elements.namedItem('package').value = label;
    form.elements.package_id.value = selected?.key || '';
    form.elements.engagement.value = plan.selectedOptions[0]?.textContent || '';
    form.elements.quoted_scope.value = quote;
    const name = source.elements.company || source.elements.name;
    if (!senderEdited && name) form.elements.name.value = name.value.trim();
    form.elements._subject.value = `MOVA Creative — Transfer receipt pending review — ${label}`;
    return payable;
  };
  const validateFile = () => {
    const receipt = file.files[0];
    let message = '';
    if (receipt && (receipt.size === 0 || receipt.size > 5 * 1024 * 1024)) message = text('Choose a non-empty receipt no larger than 5 MiB.', 'اختَر إيصالًا غير فارغ لا يتجاوز 5 ميجابايت.');
    else if (receipt && (!/\.(jpe?g|png|pdf)$/i.test(receipt.name) || (receipt.type && !['image/jpeg', 'image/png', 'application/pdf'].includes(receipt.type)))) message = text('Use a JPG, PNG or PDF receipt.', 'استخدم إيصالًا بصيغة JPG أو PNG أو PDF.');
    file.setCustomValidity(message);
    showError(message);
    return !message;
  };
  section.querySelector('[data-transfer-egp]').addEventListener('click', () => {
    const picker = document.querySelector('[data-price-market]');
    picker.value = 'EGP'; picker.dispatchEvent(new Event('change', { bubbles: true }));
  });
  document.addEventListener('mova:pricingchange', sync);
  source.addEventListener('input', sync);
  source.addEventListener('change', sync);
  file.addEventListener('change', validateFile);
  form.addEventListener('submit', event => {
    if (!sync() || !validateFile() || !form.reportValidity()) {
      event.preventDefault();
      if (!identity) showError(text('Choose a package first.', 'اختَر باقة أولًا.'));
      return;
    }
    // Native multipart POST preserves the attachment and the provider's CAPTCHA.
    // The provider's response opens separately; no local payment success is shown.
    showError('');
  });
  sync();
})();
