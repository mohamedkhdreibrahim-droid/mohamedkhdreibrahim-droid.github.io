(() => {
  'use strict';
  const ar = document.documentElement.lang === 'ar';
  const text = (en, arabic) => ar ? arabic : en;
  const form = document.getElementById('businessLead');
  const packageFamilies = {
    presence: 'monthly', growth: 'monthly', scale: 'monthly',
    campaign: 'project', launch: 'project', 'motion-identity': 'project'
  };
  const familyFor = value => value === 'campaign' ? 'project' : value === 'monthly' || value.startsWith('retainer-') ? 'monthly' : null;
  const configurePackages = (target, planName) => {
    if (!target) return null;
    const selector = target.elements.namedItem('package');
    const plan = target.elements.namedItem(planName);
    if (!selector || !plan) return null;
    const refresh = () => {
      const family = familyFor(plan.value);
      const selected = selector.value;
      [...selector.options].forEach(option => {
        const disabled = !!option.value && !!family && packageFamilies[option.value] !== family;
        option.disabled = disabled; option.hidden = disabled;
      });
      if (selected && family && packageFamilies[selected] !== family) selector.value = '';
    };
    plan.addEventListener('change', refresh);
    selector.addEventListener('change', () => {
      const family = packageFamilies[selector.value];
      if (family === 'project') plan.value = 'campaign';
      if (family === 'monthly' && !plan.value.startsWith('retainer-')) plan.value = 'monthly';
      refresh();
    });
    refresh(); return { selector, refresh };
  };
  const packageChoice = configurePackages(form, 'engagement');
  configurePackages(document.getElementById('lead'), 'svc');
  let term = '6';
  const terms = [...document.querySelectorAll('[data-retainer-term]')];
  const setTerm = value => {
    term = value === '12' ? '12' : '6';
    terms.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.retainerTerm === term)));
    const current = terms.find(button => button.dataset.retainerTerm === term);
    const summary = document.getElementById('retainerSummary');
    if (summary && current) summary.textContent = current.dataset.summary;
    document.querySelectorAll('[data-retainer-cta]').forEach(a => {
      a.textContent = text(`Discuss a ${term}-month partnership`, `ناقش شراكة لمدة ${term === '12' ? '12 شهرًا' : '6 أشهر'}`);
    });
    if (form && form.elements.engagement.value.startsWith('retainer-')) form.elements.engagement.value = `retainer-${term}`;
    packageChoice?.refresh();
  };
  terms.forEach(button => button.addEventListener('click', () => setTerm(button.dataset.retainerTerm)));
  setTerm(term);

  if (!form) return;
  const allowedPlans = ['monthly', 'campaign', 'retainer-6', 'retainer-12'];
  const allowedIndustries = ['real-estate', 'restaurants', 'ecommerce', 'other'];
  document.querySelectorAll('[data-lead-plan]').forEach(link => link.addEventListener('click', () => {
    const chosen = link.dataset.leadPlan === 'retainer' ? `retainer-${term}` : link.dataset.leadPlan;
    if (allowedPlans.includes(chosen)) form.elements.engagement.value = chosen;
    packageChoice?.refresh();
    if (packageChoice && packageFamilies[link.dataset.leadPackage]) packageChoice.selector.value = link.dataset.leadPackage;
    if (allowedIndustries.includes(link.dataset.leadIndustry)) form.elements.industry.value = link.dataset.leadIndustry;
    form.elements.company.focus({ preventScroll: true });
  }));
  form.elements.engagement.addEventListener('change', () => {
    const value = form.elements.engagement.value;
    if (value.startsWith('retainer-')) setTerm(value.endsWith('12') ? '12' : '6');
  });
  const query = new URLSearchParams(location.search);
  if (allowedPlans.includes(query.get('plan'))) {
    form.elements.engagement.value = query.get('plan');
    if (query.get('plan').startsWith('retainer-')) setTerm(query.get('plan').endsWith('12') ? '12' : '6');
  }
  if (allowedIndustries.includes(query.get('industry'))) form.elements.industry.value = query.get('industry');
  if (packageChoice && packageFamilies[query.get('package')]) {
    const family = packageFamilies[query.get('package')];
    if (!form.elements.engagement.value) form.elements.engagement.value = family === 'monthly' ? 'monthly' : 'campaign';
    packageChoice.refresh();
    if (familyFor(form.elements.engagement.value) === family) packageChoice.selector.value = query.get('package');
  }
  packageChoice?.refresh();

  const label = name => {
    const control = form.elements[name];
    return control.tagName === 'SELECT' ? control.selectedOptions[0]?.textContent || '' : control.value.trim();
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const lines = [
      text('Hello MOVA Creative, I would like a scoped proposal.', 'مرحبًا MOVA Creative، أرغب في عرض سعر بنطاق واضح.'),
      `${text('Company / brand', 'الشركة / العلامة')}: ${label('company')}`,
      `${text('Target market', 'السوق المستهدف')}: ${label('market')}`,
      `${text('Sector', 'القطاع')}: ${label('industry')}`,
      `${text('Engagement', 'نوع التعاون')}: ${label('engagement')}`
    ];
    if (form.elements.namedItem('package')?.value) lines.push(`${text('Package', 'الباقة')}: ${label('package')}`);
    if (label('budget')) lines.push(`${text('Indicative budget', 'الميزانية التقريبية')}: ${label('budget')}`);
    if (label('brief')) lines.push(`${text('Goals / launch dates', 'الأهداف / موعد الإطلاق')}: ${label('brief')}`);
    window.open(`https://wa.me/201558664894?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
  });
  form.querySelector('button[type="submit"]').disabled = false;
})();
