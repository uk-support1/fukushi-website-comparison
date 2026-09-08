(function () {
  'use strict';
  const directory = window.CompanyDirectory;
  const results = document.getElementById('search-results');
  if (!directory || !results) return;
  const form = document.querySelector('.directory-form');
  const cards = [...results.querySelectorAll('[data-company]')];
  function render() {
    const params = new URLSearchParams(location.search);
    const selected = [...new Set(params.getAll('condition'))];
    const category = params.get('category') || 'b-type';
    const invalid = selected.some(key => !Object.hasOwn(directory.filters,key)) || category !== 'b-type';
    form.querySelectorAll('[name="condition"]').forEach(input => {input.checked = selected.includes(input.value);});
    const chips = document.getElementById('selected-conditions');
    chips.replaceChildren();
    for (const key of selected) {
      const chip = document.createElement('span');
      chip.textContent = directory.filters[key] || '未対応の条件';
      chips.append(chip);
    }
    if (!selected.length) chips.textContent = '条件の指定なし';
    let count = 0;
    for (const card of cards) {
      const company = directory.companies.find(item => item.id === card.dataset.company);
      const match = !invalid && directory.matches(company,selected,category);
      card.hidden = !match;
      let planNote = card.querySelector('[data-matched-plan]');
      if (!planNote) {
        planNote = document.createElement('p');
        planNote.className = 'directory-note';
        planNote.dataset.matchedPlan = '';
        card.querySelector('.directory-price').after(planNote);
      }
      const plans = match && selected.length ? directory.matchingPlans(company,selected) : [];
      const primary = plans[0];
      card.querySelector('.directory-price').textContent = primary ? primary.price : company.price;
      planNote.textContent = primary ? '選択条件に合うプラン：' + primary.name + (primary.note ? '。' + primary.note : '') : '';
      const otherPlans = primary ? company.plans.filter(plan => plan !== primary && plan.verified !== false) : [];
      card.querySelector('[data-price-note]').textContent = company.priceNote + (otherPlans.length
        ? ' その他プラン：' + otherPlans.map(plan => plan.name + '／' + plan.price).join('、') : '');
      if (match) count++;
    }
    document.getElementById('result-count').textContent = invalid ? '条件を確認してください' : `該当する制作会社は${count}社です`;
    document.getElementById('empty-results').hidden = count !== 0;
    document.getElementById('empty-message').textContent = invalid
      ? '未対応の検索条件が含まれています。下のフォームで条件を選び直してください。'
      : 'すべての条件に合う会社は見つかりませんでした。条件を減らして再検索するか、各社へ対応内容をご相談ください。';
    document.getElementById('search-pending').hidden = true;
    results.hidden = false;
  }
  // Full GET navigations preserve shareable URLs and native back/forward behavior.
  window.addEventListener('pageshow', render);
  render();
})();
