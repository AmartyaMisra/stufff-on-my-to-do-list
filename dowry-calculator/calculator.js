// Dowry Calculator - clean UTF-8, safe rendering
(function(){
  function formatRs(n){ return 'Rs ' + Math.round(n).toLocaleString('en-IN'); }
  function addRow(container, key, val, cls){
    var d = document.createElement('div');
    d.className = 'row';
    var k = document.createElement('div'); k.className = 'k'; k.textContent = key;
    var v = document.createElement('div'); v.className = 'v' + (cls ? (' ' + cls) : ''); v.textContent = val;
    d.appendChild(k); d.appendChild(v); container.appendChild(d);
  }
  function el(id){ return document.getElementById(id); }

  function compute(){
    var base = 100000; var mods = 0; var rows = []; var mults = [];

    var age = parseInt(el('age').value, 10) || 0;
    if (age < 18) { mods += -500000; rows.push(["Illegal Early Bird Discount (Jail Edition)", formatRs(-500000), 'negative']); }
    else if (age <= 22) { var v1 = base * 0.30; mods += v1; rows.push(["Peak Shaadi Market Hype (18-22)", formatRs(v1), 'positive']); }
    else if (age <= 27) { var v2 = base * 0.20; mods += v2; rows.push(["Prime Marriage Age (23-27)", formatRs(v2), 'positive']); }
    else if (age <= 32) { var v3 = base * 0.10; mods += v3; rows.push(["Still Marketable (28-32)", formatRs(v3), 'positive']); }
    else if (age <= 35) { var v4 = base * -0.15; mods += v4; rows.push(["Getting Risky (33-35)", formatRs(v4), 'negative']); }
    else if (age <= 40) { var v5 = base * -0.30; mods += v5; rows.push(["Late Bloomer (36-40)", formatRs(v5), 'negative']); }
    else { var v6 = base * -0.50; mods += v6; rows.push(["Early Retirement Bundle (40+)", formatRs(v6), 'negative']); }

    var hv = el('height').value;
    if (hv === 'under5'){ var vh1 = base * -0.30; mods += vh1; rows.push(["Pocket-sized Edition (<5'0)", formatRs(vh1), 'negative']); }
    else if (hv === '5to54'){ var vh2 = base * -0.10; mods += vh2; rows.push(["Average Height (5'0-5'4)", formatRs(vh2), 'negative']); }
    else if (hv === '55to6'){ var vh3 = base * 0.10; mods += vh3; rows.push(["Good Height (5'5-6'0)", formatRs(vh3), 'positive']); }
    else if (hv === 'over6'){ var vh4 = base * 0.20; mods += vh4; rows.push(["Genetics Lootbox (6'0+)", formatRs(vh4), 'positive']); }

    var bmi = el('bmi').value;
    if (bmi === 'under'){ var b1 = base * -0.15; mods += b1; rows.push(["Fragile Princess Tax (Underweight)", formatRs(b1), 'negative']); }
    else if (bmi === 'normal'){ var b2 = base * 0.15; mods += b2; rows.push(["Perfect BMI (18.5-24.9)", formatRs(b2), 'positive']); }
    else if (bmi === 'over'){ var b3 = base * -0.20; mods += b3; rows.push(["Overweight Penalty (25-29.9)", formatRs(b3), 'negative']); }
    else if (bmi === 'obese'){ var b4 = base * -0.40; mods += b4; rows.push(["Free Diabetes Expansion Pack (30+)", formatRs(b4), 'negative']); }

    var edu = el('edu').value;
    if (edu === 'dropout'){ mods += -50000; rows.push(["Dropout Penalty", formatRs(-50000), 'negative']); }
    else if (edu === 'ba'){ mods += 20000; rows.push(["BA/BA Hons Bonus", formatRs(20000), 'positive']); }
    else if (edu === 'btech'){ mods += 75000; rows.push(["BTech/Engineering Bonus", formatRs(75000), 'positive']); }
    else if (edu === 'mba'){ mods += 100000 + 20000; rows.push(["MBA Bonus", formatRs(100000), 'positive']); rows.push(["Synergy Tax", formatRs(20000), 'positive']); }
    else if (edu === 'phd'){ mods += 200000 - 40000; rows.push(["PhD Bonus", formatRs(200000), 'positive']); rows.push(["Overqualified Curse (-20%)", formatRs(-40000), 'negative']); }
    else if (edu === 'iit'){ mods += 1000000; rows.push(["Elite Lootbox Unlock (IIT/IIM)", formatRs(1000000), 'positive']); }

    var prof = el('prof').value; var pv = 0; var pl = '';
    if (prof === 'artist'){ pv=-100000; pl='Paid in Exposure (Artist/Musician)'; }
    else if (prof === 'influencer'){ pv=-200000; pl='TikTok Tax (Influencer)'; }
    else if (prof === 'startup'){ pv = Math.random()*5500000 - 500000; pl='Unicorn RNG Roll (Startup Founder)'; }
    else if (prof === 'software'){ pv=150000; pl='Software Engineer Bonus'; }
    else if (prof === 'doctor'){ pv=300000; pl='Doctor Premium'; }
    else if (prof === 'ias'){ pv=500000; pl='Corruption & Prestige Expansion (IAS/IPS)'; }
    else if (prof === 'politician'){ pv=5000000; pl="Dynasty Premium (Politician's Child)"; }
    mods += pv; rows.push([pl, formatRs(pv), pv>=0?'positive':'negative']);

    if (el('faang') && el('faang').checked){ mods += 200000; rows.push(["FAANG Flex", formatRs(200000), 'positive']); }
    if (el('smoker') && el('smoker').checked){ mods += -30000; rows.push(["Smoker Tax", formatRs(-30000), 'negative']); }
    if (el('teetotal') && el('teetotal').checked){ mods += 15000; rows.push(["Teetotaller Virtue Signal", formatRs(15000), 'positive']); }
    if (el('cook') && el('cook').checked){ mods += 40000; rows.push(["MasterChef at Home", formatRs(40000), 'positive']); }
    if (el('pet') && el('pet').checked){ mods += -5000; rows.push(["Fur Baby Budget", formatRs(-5000), 'negative']); }

    var followers = parseInt(el('followers') && el('followers').value, 10) || 0;
    if (followers >= 100000){ mods += 200000; rows.push(["Influence Meter: 100k+", formatRs(200000), 'positive']); }
    else if (followers >= 10000){ mods += 50000; rows.push(["Influence Meter: 10k+", formatRs(50000), 'positive']); }
    else if (followers > 0){ mods += -10000; rows.push(["Irrelevant Follower Tax", formatRs(-10000), 'negative']); }

    var siblings = parseInt(el('siblings') && el('siblings').value, 10) || 0;
    if (siblings > 0){ var sv = siblings * -10000; mods += sv; rows.push(["Siblings ("+siblings+") Shared Inheritance Anxiety", formatRs(sv), 'negative']); }
    if (el('eldest') && el('eldest').checked){ mods += 25000; rows.push(["Eldest Responsibility Pack", formatRs(25000), 'positive']); }

    if (el('gold') && el('gold').checked){ mods += 15000; rows.push(["Astrologer-Approved Gold Chain", formatRs(15000), 'positive']); }

    var casteM=1, relM=1, skinM=1;
    var caste = el('caste').value;
    if (caste==='lower'){ casteM=0.7; mults.push(["Lower Caste Multiplier", "x0.7"]); }
    else if (caste==='middle'){ casteM=1.2; mults.push(["Middle Caste Multiplier", "x1.2"]); }
    else if (caste==='upper'){ casteM=1.5; mults.push(["Upper Caste Multiplier", "x1.5"]); }
    else if (caste==='outcaste'){ casteM=0.5; mults.push(["Forbidden DLC (Outcaste)", "x0.5"]); }

    var rel = el('religion').value;
    if (rel==='minority'){ relM=0.9; mults.push(["Minority Religion Multiplier", "x0.9"]); }
    else if (rel==='majority'){ relM=1.1; mults.push(["Majority Religion Multiplier", "x1.1"]); }
    else if (rel==='convert'){ mods += -100000; rows.push(["Patch Update Penalty (Convert)", formatRs(-100000), 'negative']); }

    var skin = el('skin').value;
    if (skin==='dark'){ skinM=0.7; mults.push(["Society's Bias DLC (Dark)", "x0.7"]); }
    else if (skin==='wheatish'){ skinM=1.1; mults.push(["Wheatish Multiplier", "x1.1"]); }
    else if (skin==='fair'){ skinM=1.4; mults.push(["Fair Skin Premium", "x1.4"]); }
    else if (skin==='albino'){ skinM=2.0; mults.push(["Rare Legendary Skin Drop (Albino)", "x2.0"]); }

    var astro = el('astro').value;
    if (astro==='manglik'){ mods += -200000; rows.push(["Manglik Penalty", formatRs(-200000), 'negative']); }
    else if (astro==='matching'){ mods += 100000; rows.push(["Matching Kundali Bonus", formatRs(100000), 'positive']); }
    else if (astro==='mars7'){ mods += -50000; rows.push(["Mars in 7th Penalty", formatRs(-50000), 'negative']); }
    else if (astro==='rahu'){ mods += -75000; rows.push(["Rahu/Ketu Dosh", formatRs(-75000), 'negative']); }
    else if (astro==='guru9'){ mods += 50000; rows.push(["Guru in 9th Bonus", formatRs(50000), 'positive']); }
    else if (astro==='shani'){ mods += -100000; rows.push(["Shani Sade Sati (7 years lag)", formatRs(-100000), 'negative']); }
    else if (astro==='random'){ mults.push(["Random astrologer note", "Needs extra gold chain"]); }

    var nri = el('nri').value;
    if (nri==='us'){ mods+=500000; rows.push(["US/Canada NRI Premium", formatRs(500000), 'positive']); }
    else if (nri==='uk'){ mods+=300000; rows.push(["UK NRI Premium", formatRs(300000), 'positive']); }
    else if (nri==='dubai'){ mods+=200000; rows.push(["Dubai NRI Premium", formatRs(200000), 'positive']); }
    else if (nri==='australia'){ mods+=150000; rows.push(["Cricket Visa (Australia)", formatRs(150000), 'positive']); }
    else if (nri==='africa'){ mods+=-50000; rows.push(["Not the NRI We Meant (Africa)", formatRs(-50000), 'negative']); }

    var region = el('region').value;
    if (region==='metro'){ mods+=100000; rows.push(["Metro Resident Premium", formatRs(100000), 'positive']); }
    else if (region==='tier2'){ mods+=20000; rows.push(["Tier-2 City Bonus", formatRs(20000), 'positive']); }
    else if (region==='rural'){ mods+=-50000; rows.push(["Rural Discount (City Envy)", formatRs(-50000), 'negative']); }

    var wealth = el('wealth').value;
    if (wealth==='landlord'){ mods+=500000; rows.push(["Landlord/Zamindar Bonus", formatRs(500000), 'positive']); }
    else if (wealth==='business'){ mods+=1000000; rows.push(["Business Tycoon Bonus", formatRs(1000000), 'positive']); }
    else if (wealth==='farmer'){ mods+=-50000; rows.push(["Agricultural Subsidy Tax", formatRs(-50000), 'negative']); }
    else if (wealth==='politician'){ mods+=2500000; rows.push(["Democracy DLC (Politician Family)", formatRs(2500000), 'positive']); }

    var asset = el('asset').value;
    if (asset==='house'){ mods+=200000; rows.push(["House Ownership Bonus", formatRs(200000), 'positive']); }
    else if (asset==='bhk'){ mods+=1000000; rows.push(["2BHK in Metro Premium", formatRs(1000000), 'positive']); }
    else if (asset==='iphone'){ mods+=50000; rows.push(["iPhone Latest Bonus", formatRs(50000), 'positive']); }
    else if (asset==='maruti'){ mods+=100000; rows.push(["Maruti Car Bonus", formatRs(100000), 'positive']); }
    else if (asset==='bmw'){ mods+=500000; rows.push(["BMW Car Premium", formatRs(500000), 'positive']); }

    if (el('cracked').checked) { mods += 10000; rows.push(["Cracked iPhone Screen Tax", formatRs(10000), 'positive']); }
    if (el('crypto').checked) { mods += -5000; rows.push(["Crypto Investor Tax", formatRs(-5000), 'negative']); }
    if (el('excel').checked) { mods += 20000; rows.push(["Excel Shortcut God Bonus", formatRs(20000), 'positive']); }
    if (el('astrol').checked) { mods += -15000; rows.push(["Irony Tax (Astrology Believer)", formatRs(-15000), 'negative']); }
    if (el('gym').checked) { mods += 50000; rows.push(["Gym Selfies Bonus", formatRs(50000), 'positive']); }
    if (el('pubg').checked) { mods += -25000; rows.push(["PUBG Addiction Tax", formatRs(-25000), 'negative']); }

    var mult = 1 * (el('wedding') && el('wedding').checked ? 1.1 : 1);
    mult = (casteM * relM * skinM) * (el('wedding') && el('wedding').checked ? 1.1 : 1);

    var total = (base + mods) * mult;

    var name = (el('name').value || '').toLowerCase();
    if (name.indexOf('c++') !== -1 || name.indexOf('cpp') !== -1){ total += 50000; rows.push(["C++ Pointers Knowledge Bonus", formatRs(50000), 'positive']); }

    return { base: base, rows: rows, mults: mults, total: total };
  }

  function render(){
    var out = el('output');
    try{
      out.innerHTML = '';
      var result = compute();
      addRow(out, 'Base', formatRs(result.base), 'mult');
      for (var i=0;i<result.rows.length;i++){ addRow(out, result.rows[i][0], result.rows[i][1], result.rows[i][2]); }
      for (var j=0;j<result.mults.length;j++){ addRow(out, result.mults[j][0], result.mults[j][1], 'mult'); }
      var t = document.createElement('div'); t.className = 'total'; t.innerHTML = '<div>Total Dowry Amount</div><div>' + formatRs(result.total) + '</div>'; out.appendChild(t);
    }catch(e){
      out.innerHTML = '';
      addRow(out, 'Error', 'Check console', 'negative');
      console.error(e);
    }
  }

  window.addEventListener('DOMContentLoaded', function(){
    var calcBtn = el('calc'); if (calcBtn) calcBtn.addEventListener('click', render);
    var shareBtn = el('share'); if (shareBtn) shareBtn.addEventListener('click', function(){
      try{
        var node = document.getElementById('invoiceCard');
        if (!window.html2canvas || !node){ alert('Please calculate first, then try again.'); return; }
        html2canvas(node, {backgroundColor: '#101330', scale: 2}).then(function(canvas){
          var link = document.createElement('a');
          link.download = 'dowry-invoice-meme.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        });
      }catch(e){ console.error(e); alert('Failed to generate image.'); }
    });
  });
})();
