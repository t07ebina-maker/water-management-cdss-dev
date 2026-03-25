// ============================================================
//  STATE
// ============================================================
let consciousnessMode = 'jcs'; // 'jcs' | 'gcs'
let urineMode = 'h'; // 'h' | 'd'
let alerts = { critical: [], warning: [], info: [] };

// ============================================================
//  TOGGLE HELPERS
// ============================================================
function toggleCard(id) {
  const header = document.querySelector('#' + id + ' .card-header');
  const body   = document.getElementById(id + '-body');
  const toggle = document.getElementById('c-toggle' + id.replace('card',''));
  header.classList.toggle('collapsed');
  body.classList.toggle('hidden');
}
function toggleCb(id) {
  const el = document.getElementById(id);
  const wrap = document.getElementById('cb-' + id);
  if (el && wrap) wrap.classList.toggle('checked', el.checked);
}
function toggleEdema() {
  const sub = document.getElementById('edemaSub');
  sub.classList.toggle('show', document.getElementById('edema').checked);
}
function switchConsciousness(mode) {
  consciousnessMode = mode;
  document.getElementById('tab-jcs').classList.toggle('active', mode === 'jcs');
  document.getElementById('tab-gcs').classList.toggle('active', mode === 'gcs');
  document.getElementById('jcs-area').style.display = mode === 'jcs' ? '' : 'none';
  document.getElementById('gcs-area').style.display = mode === 'gcs' ? '' : 'none';
  validate();
}
function switchUrine(mode) {
  urineMode = mode;
  document.getElementById('uBtn-h').classList.toggle('active', mode === 'h');
  document.getElementById('uBtn-d').classList.toggle('active', mode === 'd');
  document.getElementById('urine-h-area').style.display = mode === 'h' ? '' : 'none';
  document.getElementById('urine-d-area').style.display = mode === 'd' ? '' : 'none';
  validate();
}
function setStress(val) {
  document.querySelectorAll('.stress-opt').forEach(el => {
    el.classList.toggle('selected', el.querySelector('input').value === val);
  });
}

// ============================================================
//  GET VALUES
// ============================================================
function v(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const n = parseFloat(el.value);
  return isNaN(n) ? null : n;
}
function vs(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function vd(id) { // returns Date or null
  const s = vs(id);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function getStress() {
  const sel = document.querySelector('input[name="stress"]:checked');
  return sel ? parseFloat(sel.value) : null;
}
function getUrinePerDay() {
  if (urineMode === 'd') return v('urineD');
  const h = v('urineH');
  return h !== null ? h * 24 : null;
}
function getUrinePerHour() {
  if (urineMode === 'h') return v('urineH');
  const d = v('urineD');
  return d !== null ? d / 24 : null;
}
function getGCSSum() {
  const e = parseInt(vs('gcsE')), vv = parseInt(vs('gcsV')), m = parseInt(vs('gcsM'));
  if (isNaN(e) || isNaN(vv) || isNaN(m)) return null;
  return e + vv + m;
}
function updateGCSDisplay() {
  const eVal = vs('gcsE'), vVal = vs('gcsV'), mVal = vs('gcsM');
  const el = document.getElementById('gcsTotal');
  if (!el) return;
  const eN = parseInt(eVal), vN = parseInt(vVal), mN = parseInt(mVal);
  const allSet = !isNaN(eN) && !isNaN(vN) && !isNaN(mN);
  if (!allSet) {
    const eStr = eVal ? 'E'+eN : 'E?';
    const vStr = vVal ? 'V'+vN : 'V?';
    const mStr = mVal ? 'M'+mN : 'M?';
    el.textContent = eStr + ' + ' + vStr + ' + ' + mStr + ' = —';
    el.className = 'gcs-total-display';
    return;
  }
  const total = eN + vN + mN;
  el.textContent = 'E' + eN + ' + V' + vN + ' + M' + mN + ' = ' + total;
  if (total < 9) el.className = 'gcs-total-display calc-crit';
  else if (total < 12) el.className = 'gcs-total-display calc-warn';
  else el.className = 'gcs-total-display calc-ok';
}
function getConsciousnessLevel() {
  // JCS: returns 0=清明, 1=I, 2=II, 3=III | GCS: returns sum
  if (consciousnessMode === 'jcs') {
    const val = vs('jcs');
    if (!val) return null;
    if (val === '0') return 0;
    if (val.startsWith('I-')) return 1;
    if (val.startsWith('II-')) return 2;
    if (val.startsWith('III-')) return 3;
    return null;
  } else {
    return getGCSSum();
  }
}
function isConsciousnessCritical() {
  if (consciousnessMode === 'jcs') {
    const val = vs('jcs');
    if (!val) return false;
    return val.startsWith('II-') || val.startsWith('III-'); // JCS II or III
  } else {
    const g = getGCSSum();
    return g !== null && g < 12;
  }
}

// ============================================================
//  eGFR CALC (日本人式)
// ============================================================
function calcEGFR(age, sex, cre) {
  if (!age || !cre || !sex) return null;
  let egfr = 194 * Math.pow(cre, -1.094) * Math.pow(age, -0.287);
  if (sex === 'female') egfr *= 0.739;
  return Math.round(egfr * 10) / 10;
}
function egfrStage(egfr) {
  if (egfr === null) return null;
  if (egfr >= 90) return 'G1';
  if (egfr >= 60) return 'G2';
  if (egfr >= 45) return 'G3a';
  if (egfr >= 30) return 'G3b';
  if (egfr >= 15) return 'G4';
  return 'G5';
}

// ============================================================
//  FIELD FEEDBACK
// ============================================================
function setField(id, state, msg) { // state: 'error'|'warn'|'ok'|''
  const el = document.getElementById(id);
  if (!el) return;
  el.className = el.className.replace(/\bf-(error|warn|ok)\b/g, '').trim();
  if (state === 'error') el.classList.add('f-error');
  else if (state === 'warn') el.classList.add('f-warn');
  else if (state === 'ok')   el.classList.add('f-ok');
  const msgEl = document.getElementById(id + '-msg');
  if (msgEl) { msgEl.textContent = msg || ''; msgEl.className = 'fmsg' + (state === 'error' ? ' err' : state === 'warn' ? ' warn' : state === 'info' ? ' info' : ''); }
}
function setAutoField(id, text, state) { // state: 'calc-ok'|'calc-warn'|'calc-crit'|''
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'auto-field' + (state ? ' ' + state : '');
}

// ============================================================
//  RANGE CHECK HELPER
// ============================================================
function checkRange(id, min, max, label) {
  const val = v(id);
  if (val === null) return { ok: false, empty: true };
  if (val < min || val > max) {
    setField(id, 'error', `${label}: ${min}〜${max} の範囲で入力してください（入力値: ${val}）`);
    return { ok: false, empty: false, val };
  }
  setField(id, 'ok', '');
  return { ok: true, val };
}
function checkRangeOptional(id, min, max, label) {
  const el = document.getElementById(id);
  if (!el || el.value.trim() === '') { setField(id, '', ''); return { ok: true, empty: true, val: null }; }
  return checkRange(id, min, max, label);
}

// ============================================================
//  MAIN VALIDATE
// ============================================================
function validate() {
  alerts = { critical: [], warning: [], info: [] };

  // --- Section 1 ---
  let s1Errors = 0;

  // Age
  const ageR = checkRange('age', 0, 120, '年齢');
  if (!ageR.ok) s1Errors++;
  if (!ageR.ok && !ageR.empty) {} // already handled

  // Sex
  if (!vs('sex')) { s1Errors++; } else { setField('sex', 'ok', ''); }

  // Height
  const htR = checkRange('height', 50, 250, '身長');
  if (!htR.ok) s1Errors++;

  // Weights
  const uwR = checkRange('usuWeight', 20, 300, '通常時体重');
  if (!uwR.ok) s1Errors++;
  const cwR = checkRange('curWeight', 20, 300, '現体重');
  if (!cwR.ok) s1Errors++;

  // Dates
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const uwDate = vd('usuWeightDate');
  const cwDate = vd('curWeightDate');
  const uwDateEl = document.getElementById('usuWeightDate');
  const cwDateEl = document.getElementById('curWeightDate');

  // 日時は任意 — 未入力でもエラーにしない（curWeightDate のみ初期値あり）
  if (uwDate && uwDate > today) {
    setField('usuWeightDate', 'error', '未来の日付は入力できません'); s1Errors++;
  } else if (uwDate) { setField('usuWeightDate', 'ok', ''); }

  if (cwDate && cwDate > today) {
    setField('curWeightDate', 'error', '未来の日付は入力できません'); s1Errors++;
  } else if (cwDate) { setField('curWeightDate', 'ok', ''); }

  // Date logic check
  if (uwDate && cwDate && uwDate <= today && cwDate <= today) {
    if (cwDate < uwDate) {
      setField('curWeightDate', 'error', '現体重の測定日が通常時体重の測定日より前になっています');
      s1Errors++;
    }
  }

  // Weight diff auto calc — 体重が揃えば変化量は即表示、日付が揃えば日数も表示
  if (uwR.ok && cwR.ok) {
    const diff = uwR.val - cwR.val;
    const sign = diff > 0 ? '▼ ' : diff < 0 ? '▲ +' : '±';
    const absDiff = Math.abs(diff).toFixed(1);
    let wstate = diff > 5 ? 'calc-warn' : 'calc-ok';
    setAutoField('weightDiff', `${sign}${absDiff} kg`, wstate);

    // 日数は両日付が揃ったときのみ
    if (uwDate && cwDate && cwDate >= uwDate) {
      const days = Math.round((cwDate - uwDate) / (1000 * 60 * 60 * 24));
      setAutoField('weightDays', `${days} 日間`, 'calc-ok');
      if (days > 7 && diff > 0) {
        alerts.info.push({ title: '体重減少（慢性期）', msg: `体重が ${absDiff}kg 減少（${days}日間）。慢性的な組織減少の可能性があり、体重法による水分欠乏量計算は無効化されます。` });
      }
    } else {
      setAutoField('weightDays', '日付を入力すると算出', '');
    }

    // 体重増加＋脱水所見の矛盾チェック
    const contradEl = document.getElementById('exam-contradiction');
    if (diff < 0 && (document.getElementById('dryMouth').checked || document.getElementById('turgurDown').checked)) {
      if (contradEl) contradEl.innerHTML = '<div class="alert-box warning"><div class="alert-body"><div class="alert-title warning">データの矛盾</div><div class="alert-msg">体重が増加しているにもかかわらず脱水症状（口腔乾燥・ツルゴール低下）が認められます。希釈性低Na血症や心不全による体液過剰の可能性を検討してください。</div></div></div>';
      alerts.warning.push({ title: 'データの矛盾: 体重増加＋脱水症状', msg: '体重増加しているにもかかわらず脱水所見あり。希釈性低Na血症・溢水を考慮してください。' });
    } else {
      if (contradEl) contradEl.innerHTML = '';
    }
  } else {
    setAutoField('weightDiff', '—', '');
    setAutoField('weightDays', '—', '');
  }

  setSection('s1-status', s1Errors);

  // --- Section 2 ---
  let s2Errors = 0;

  // Consciousness
  const conLevel = getConsciousnessLevel();
  if (consciousnessMode === 'jcs') {
    if (!vs('jcs')) { s2Errors++; }
    else { setField('jcs', 'ok', ''); }
  } else {
    const gcsSum = getGCSSum();
    if (gcsSum === null) { s2Errors++; }
  }
  if (isConsciousnessCritical()) {
    alerts.critical.push({ title: '意識障害', msg: 'JCS II以上またはGCS < 12。意識障害あり。原因検索と全身管理を優先してください。' });
  }

  // Blood pressure
  const sbpR = checkRange('sbp', 50, 250, '収縮期血圧');
  const dbpR = checkRange('dbp', 30, 150, '拡張期血圧');
  if (!sbpR.ok || !sbpR.ok && !sbpR.empty) { /* error set */ }
  if (!dbpR.ok || !dbpR.ok && !dbpR.empty) { /* error set */ }

  const bpMsgEl = document.getElementById('bp-msg');
  if (sbpR.ok && dbpR.ok) {
    if (sbpR.val <= dbpR.val) {
      setField('sbp', 'error', '');
      setField('dbp', 'error', '');
      if (bpMsgEl) { bpMsgEl.textContent = '収縮期血圧は拡張期血圧より大きい値を入力してください'; bpMsgEl.className = 'fmsg err'; }
      s2Errors++;
    } else {
      if (bpMsgEl) { bpMsgEl.textContent = ''; bpMsgEl.className = 'fmsg'; }
    }
  } else if (!sbpR.empty || !dbpR.empty) {
    s2Errors++;
  }

  // HR
  const hrR = checkRange('hr', 30, 200, '心拍数');
  if (!hrR.ok) s2Errors++;

  // Shock Index
  if (sbpR.ok && hrR.ok && sbpR.val > 0) {
    const si = (hrR.val / sbpR.val).toFixed(2);
    const siNum = parseFloat(si);
    let siState = 'calc-ok';
    if (siNum > 1.0) siState = 'calc-crit';
    else if (siNum > 0.8) siState = 'calc-warn';
    setAutoField('shockIndex', `SI = ${si}`, siState);
    document.getElementById('si-hint').style.display = 'none';
    if (sbpR.val < 90 || siNum > 1.0) {
      alerts.critical.push({ title: 'ショック状態の疑い', msg: `収縮期血圧 ${sbpR.val} mmHg / Shock Index ${si} > 1.0。循環動態が不安定です。直ちに医師へ報告してください。` });
    }
  } else {
    setAutoField('shockIndex', '—', '');
    document.getElementById('si-hint').style.display = '';
  }

  // RR
  const rrR = checkRange('rr', 5, 60, '呼吸数');
  if (!rrR.ok) s2Errors++;

  // SpO2
  const spo2R = checkRange('spo2', 70, 100, 'SpO₂');
  if (!spo2R.ok) s2Errors++;
  if (spo2R.ok) {
    if (spo2R.val < 88) alerts.critical.push({ title: '重度低酸素血症', msg: `SpO₂ ${spo2R.val}% < 88%。重度低酸素血症。呼吸管理を優先してください。` });
    else if (spo2R.val < 90) alerts.warning.push({ title: '低酸素血症', msg: `SpO₂ ${spo2R.val}% < 90%。呼吸状態を注意深く観察してください。` });
  }

  // Temp
  const tempR = checkRange('temp', 34.0, 42.0, '体温');
  if (!tempR.ok) s2Errors++;
  if (tempR.ok && tempR.val > 37.0) {
    const excess = Math.floor(tempR.val - 37.0);
    if (excess > 0) alerts.info.push({ title: '発熱', msg: `体温 ${tempR.val}℃。維持輸液量に発熱補正が必要です（37℃超1℃ごと +15%）。` });
  }

  // Urine
  const urinePerDay = getUrinePerDay();
  const urinePerHour = getUrinePerHour();
  const curWeightVal = cwR.ok ? cwR.val : null;
  if (urinePerDay !== null) {
    if (urinePerDay < 100) {
      alerts.critical.push({ title: '無尿', msg: `尿量 ${urinePerDay.toFixed(0)}mL/日 < 100mL/日。無尿状態。腎後性・腎性の鑑別が必要です。` });
      setField(urineMode === 'h' ? 'urineH' : 'urineD', 'error', '');
    } else if (urinePerHour !== null && curWeightVal) {
      const uPerKg = urinePerHour / curWeightVal;
      if (uPerKg < 0.5) {
        alerts.warning.push({ title: '重度乏尿', msg: `尿量 ${uPerKg.toFixed(2)}mL/kg/h < 0.5mL/kg/h。腎前性・腎性・腎後性の鑑別が必要です。試験的輸液負荷後の尿量評価を検討してください。` });
        setField(urineMode === 'h' ? 'urineH' : 'urineD', 'warn', '');
      } else if (uPerKg < 1.0) {
        alerts.warning.push({ title: '乏尿', msg: `尿量 ${uPerKg.toFixed(2)}mL/kg/h（0.5〜1.0mL/kg/h）。腎前性・腎性・腎後性の鑑別を検討してください。試験的輸液負荷後の尿量評価を行ってください。` });
        setField(urineMode === 'h' ? 'urineH' : 'urineD', 'warn', '');
      } else {
        setField(urineMode === 'h' ? 'urineH' : 'urineD', 'ok', '');
      }
    } else {
      setField(urineMode === 'h' ? 'urineH' : 'urineD', 'ok', '');
    }
    const uMsgEl = document.getElementById('urine-msg');
    if (uMsgEl) uMsgEl.textContent = '';
  } else {
    s2Errors++;
  }

  setSection('s2-status', s2Errors);

  // --- Section 3 (no required fields) ---
  // Cross-validation: edema/rales + dehydration signs handled above in weight section
  const edema = document.getElementById('edema').checked;
  const rales = document.getElementById('rales').checked;
  const cpAngleVal = document.getElementById('cpAngle').value;
  const cpAngle = cpAngleVal === 'dull';
  const bnpVal = v('bnp');
  // edema + rales → possible heart failure overflow (checked in sec 4 with BNP)
  if (cpAngle && edema && rales) {
    alerts.warning.push({ title: '溢水/うっ血の複合所見', msg: '浮腫＋ラ音＋CP angle鈍化。画像上もうっ血を示唆する所見が揃っています。補液量の制限を強く検討してください。' });
  } else if (cpAngle) {
    alerts.info.push({ title: 'CP angle鈍化（うっ血補助所見）', msg: '胸水/うっ血の可能性。単独では補液制限の根拠になりませんが、他の溢水所見と合わせて評価してください。' });
  }

  // --- Section 4 ---
  let s4Errors = 0;

  // Na (任意 — 未入力でもエラーにしない。入力値が範囲外のみエラー)
  const naR = checkRangeOptional('na', 100, 180, 'Na');
  if (!naR.ok) s4Errors++;
  if (naR.ok && naR.val !== null) {
    if (naR.val < 120) alerts.critical.push({ title: '重度低ナトリウム血症', msg: `Na ${naR.val} mEq/L < 120。重度低ナトリウム血症。急速補正による浸透圧性脱髄症候群（ODS）に注意。` });
    else if (naR.val > 160) alerts.critical.push({ title: '重度高ナトリウム血症', msg: `Na ${naR.val} mEq/L > 160。重度高ナトリウム血症。脳出血リスクに注意。` });
    else if (naR.val < 135) {
      const hasEdema = document.getElementById('edema').checked;
      const bnp = v('bnp');
      if (hasEdema || (bnp !== null && bnp > 200)) {
        alerts.warning.push({ title: '希釈性低ナトリウム血症の疑い', msg: `Na ${naR.val} mEq/L < 135 かつ 浮腫あり/BNP高値。水制限を優先。安易な輸液は禁忌。` });
        setField('na', 'f-warn', '');
      } else {
        alerts.info.push({ title: '軽度低ナトリウム血症', msg: `Na ${naR.val} mEq/L（正常: 138〜145）。軽度低Naに注意。` });
      }
    } else if (naR.val > 145) {
      alerts.info.push({ title: '高ナトリウム血症', msg: `Na ${naR.val} mEq/L > 145。高張性脱水の可能性。` });
    }
  }

  // K (任意)
  const kR = checkRangeOptional('k', 2.0, 8.0, 'K');
  if (!kR.ok) s4Errors++;
  if (kR.ok && kR.val !== null) {
    if (kR.val > 6.0) alerts.critical.push({ title: '重度高カリウム血症', msg: `K ${kR.val} mEq/L > 6.0。緊急対応が必要です。K含有輸液は絶対禁忌。` });
    else if (kR.val < 2.5) alerts.critical.push({ title: '重度低カリウム血症', msg: `K ${kR.val} mEq/L < 2.5。不整脈リスクがあります。緊急補正を検討してください。` });
    else if (kR.val > 5.5) alerts.warning.push({ title: '高カリウム血症', msg: `K ${kR.val} mEq/L > 5.5。K含有輸液使用不可。2〜4時間ごとの再検査を行ってください。` });
    else if (kR.val < 3.5) alerts.info.push({ title: '低カリウム血症', msg: `K ${kR.val} mEq/L < 3.5。軽度低K。経過観察と補正を検討してください。` });
  }

  // Cl
  const clR = checkRangeOptional('cl', 70, 130, 'Cl');
  if (!clR.ok) s4Errors++;

  // BUN (任意)
  const bunR = checkRangeOptional('bun', 1, 200, 'BUN');
  if (!bunR.ok) s4Errors++;

  // Cre (任意)
  const creR = checkRangeOptional('cre', 0.1, 20, 'Cre');
  if (!creR.ok) s4Errors++;

  // eGFR
  const ageVal = v('age');
  const sexVal = vs('sex');
  const egfrVal = calcEGFR(ageVal, sexVal, creR.ok ? creR.val : null);
  if (egfrVal !== null) {
    const stage = egfrStage(egfrVal);
    let eState = 'calc-ok';
    let eMsg = '';
    if (egfrVal < 15) {
      eState = 'calc-crit';
      eMsg = '末期腎不全';
      alerts.critical.push({ title: '末期腎不全 (G5)', msg: `eGFR ${egfrVal} mL/分/1.73m² < 15。透析適応を含め専門医へ相談してください。` });
    } else if (egfrVal < 30) {
      eState = 'calc-warn';
      eMsg = '高度低下';
      alerts.warning.push({ title: '高度腎機能障害 (G4)', msg: `eGFR ${egfrVal} mL/分/1.73m²。K含有輸液は慎重に。投与量を通常の75%に制限し、尿量・K・呼吸状態を再評価してください。` });
    } else if (egfrVal < 45) {
      eState = 'calc-warn';
      eMsg = '中等度〜高度低下';
      alerts.info.push({ title: '腎機能低下 (G3b)', msg: `eGFR ${egfrVal} mL/分/1.73m²。K含有輸液は慎重に。2〜4時間ごとの評価を。` });
    } else if (egfrVal < 60) {
      eState = 'calc-ok';
      eMsg = '軽度〜中等度低下';
      alerts.info.push({ title: '腎機能低下 (G3a)', msg: `eGFR ${egfrVal} mL/分/1.73m²。K含有輸液に注意。4〜6時間ごとの尿量評価を。` });
    }
    setAutoField('egfr', `eGFR = ${egfrVal}　（CKD Stage: ${stage}）${eMsg ? '　' + eMsg : ''}`, eState);
    const egfrMsgEl = document.getElementById('egfr-msg');
    if (egfrMsgEl) { egfrMsgEl.textContent = '日本人式（194 × Cre⁻¹·⁰⁹⁴ × 年齢⁻⁰·²⁸⁷ × 女性0.739）'; egfrMsgEl.className = 'fmsg info'; }
  } else {
    setAutoField('egfr', '年齢・性別・Cre を入力で自動計算', '');
  }

  // BUN/Cre ratio
  if (bunR.ok && creR.ok && creR.val > 0) {
    const ratio = (bunR.val / creR.val).toFixed(1);
    const ratioNum = parseFloat(ratio);
    let rState = 'calc-ok';
    let rNote = '';
    if (ratioNum > 20) { rState = 'calc-warn'; rNote = ' ▶ 腎前性要素あり（脱水疑い）'; alerts.info.push({ title: 'BUN/Cre比高値', msg: `BUN/Cre = ${ratio} > 20。腎前性要素あり（脱水疑い）。` }); }
    else if (ratioNum < 10) { rNote = ' ▶ 低栄養・肝不全・過剰輸液の可能性'; rState = 'calc-warn'; }
    setAutoField('bunCreRatio', `${ratio}${rNote}`, rState);
  } else {
    setAutoField('bunCreRatio', '—', '');
  }

  // Glu (任意)
  const gluR = checkRangeOptional('glu', 20, 1000, 'Glu');
  if (!gluR.ok) s4Errors++;
  if (gluR.ok && gluR.val !== null) {
    if (gluR.val > 500) alerts.critical.push({ title: '高血糖緊急症', msg: `Glu ${gluR.val} mg/dL > 500。DKA/HHSの可能性。専門的治療が必要です。` });
    else if (gluR.val > 250) alerts.warning.push({ title: '中等度高血糖', msg: `Glu ${gluR.val} mg/dL。インスリン併用を検討。ブドウ糖液は避けてください。` });
    else if (gluR.val < 70) alerts.warning.push({ title: '低血糖', msg: `Glu ${gluR.val} mg/dL < 70。低血糖への対応が必要です。` });
  }

  // TP
  const tpR = checkRangeOptional('tp', 3.0, 10.0, 'TP');
  if (!tpR.ok) s4Errors++;
  if (tpR.ok && tpR.val !== null && tpR.val < 6.0) alerts.info.push({ title: '低タンパク血症', msg: `TP ${tpR.val} g/dL < 6.0。TP法による水分欠乏量計算は低栄養の影響で信頼性が低下します。` });

  // Alb
  const albR = checkRangeOptional('alb', 1.0, 6.0, 'Alb');
  if (!albR.ok) s4Errors++;
  if (albR.ok && albR.val !== null && albR.val < 3.0) alerts.info.push({ title: '低アルブミン血症', msg: `Alb ${albR.val} g/dL < 3.0。低栄養状態。膠質浸透圧低下による浮腫に注意。` });

  // Hb, Hct
  const hbR  = checkRangeOptional('hb', 3.0, 25.0, 'Hb');
  const hctR = checkRangeOptional('hct', 10, 70, 'Hct');
  if (!hbR.ok || !hctR.ok) s4Errors++;
  if (hctR.ok && hctR.val !== null) {
    const sex2 = vs('sex');
    if ((sex2 === 'male' && hctR.val > 50) || (sex2 === 'female' && hctR.val > 45)) {
      alerts.info.push({ title: '血液濃縮（脱水疑い）', msg: `Hct ${hctR.val}%。血液濃縮あり。脱水の可能性が高い。` });
    } else if ((sex2 === 'male' && hctR.val < 40) || (sex2 === 'female' && hctR.val < 36)) {
      alerts.info.push({ title: '貧血・過剰輸液の可能性', msg: `Hct ${hctR.val}%。貧血・出血・過剰輸液の可能性。Hct法による計算は信頼性低下。` });
    }
  }

  // BNP
  const bnpR = checkRangeOptional('bnp', 0, 50000, 'BNP');
  if (!bnpR.ok) s4Errors++;
  if (bnpR.ok && bnpR.val !== null) {
    if (bnpR.val > 500 || (edema && rales)) {
      alerts.warning.push({ title: '重症心不全または溢水', msg: `BNP ${bnpR.val} pg/mL > 500（または浮腫＋ラ音）。輸液量を通常の50%に制限し、呼吸状態・浮腫・尿量を注意深く観察してください。（※BNP閾値は心不全の診断閾値ではなく、本ツールで慎重投与判断のために採用した安全上の参考閾値です）` });
    } else if (bnpR.val > 200) {
      alerts.warning.push({ title: '心不全リスクまたは腎機能障害', msg: `BNP ${bnpR.val} pg/mL > 200。輸液量を通常の75%に制限し、4〜6時間ごとに再評価してください。（※BNP閾値は心不全の診断閾値ではなく、本ツールで採用した安全上の参考閾値です）` });
    } else if (bnpR.val > 100) {
      alerts.info.push({ title: 'BNP軽度上昇', msg: `BNP ${bnpR.val} pg/mL。心不全の可能性を念頭に輸液管理を慎重に。` });
    }
  }

  setSection('s4-status', s4Errors);

  // --- Section 5 ---
  const stress = getStress();
  let s5Errors = 0;
  if (stress === null) {
    s5Errors++;
    document.getElementById('stress-msg').textContent = 'ストレス係数を選択してください';
  } else {
    document.getElementById('stress-msg').textContent = '';
    document.querySelectorAll('.stress-opt').forEach(el => {
      el.classList.toggle('selected', parseFloat(el.querySelector('input').value) === stress);
    });
  }
  setSection('s5-status', s5Errors);

  // ============================================================
  //  UPDATE ALERT DISPLAY
  // ============================================================
  renderAlerts();

  // Update global status
  const totalCrit = alerts.critical.length;
  const totalWarn = alerts.warning.length;
  const totalInfo = alerts.info.length;

  const badge = document.getElementById('statusBadge');
  const cCount = document.getElementById('critCount');
  const wCount = document.getElementById('warnCount');
  const iCount = document.getElementById('infoCount');

  cCount.textContent = totalCrit;
  wCount.textContent = totalWarn;
  iCount.textContent = totalInfo;

  cCount.className = 'status-badge ' + (totalCrit > 0 ? 'critical' : 'ok');
  wCount.className = 'status-badge ' + (totalWarn > 0 ? 'warning' : 'ok');
  iCount.className = 'status-badge ' + (totalInfo > 0 ? 'warning' : 'ok');

  const totalErrors = s1Errors + s2Errors + s4Errors + s5Errors;
  const btnNext = document.getElementById('btnNext');
  const footerStat = document.getElementById('footerStat');

  if (totalCrit > 0) {
    badge.className = 'status-badge critical'; badge.textContent = '危険 – 即時対応が必要';
    btnNext.disabled = true;
    footerStat.textContent = `Critical アラート ${totalCrit} 件が発動中。医師に報告し、安全確認が必要です。`;
  } else if (totalErrors > 0) {
    badge.className = 'status-badge critical'; badge.textContent = '入力エラーあり';
    btnNext.disabled = true;
    footerStat.textContent = '入力エラーを修正してください。';
  } else if (totalWarn > 0) {
    badge.className = 'status-badge warning'; badge.textContent = '要注意 – 警告あり';
    btnNext.disabled = false;
    footerStat.textContent = `Warning ${totalWarn} 件。慎重投与モードで第2段階へ進めます。`;
  } else if (vs('age') && vs('sex')) {
    badge.className = 'status-badge ok'; badge.textContent = '入力OK';
    btnNext.disabled = false;
    footerStat.textContent = '入力が完了しました。第2段階（計算・判定）へ進む準備ができました。';
  } else {
    badge.className = 'status-badge waiting'; badge.textContent = '入力待ち';
    btnNext.disabled = true;
    footerStat.textContent = '必須項目を入力してください。';
  }
}

// ============================================================
//  RENDER ALERTS
// ============================================================
function renderAlerts() {
  const container = document.getElementById('alertSummary');
  const noAlert = document.getElementById('noAlertMsg');
  const all = [...alerts.critical.map(a => ({ ...a, level: 'critical' })),
               ...alerts.warning.map(a =>  ({ ...a, level: 'warning' })),
               ...alerts.info.map(a =>     ({ ...a, level: 'info' }))];

  if (all.length === 0) {
    noAlert.style.display = '';
    // Remove all dynamic alerts
    container.querySelectorAll('.alert-box').forEach(el => el.remove());
    return;
  }
  noAlert.style.display = 'none';
  container.querySelectorAll('.alert-box').forEach(el => el.remove());

  const icons = { critical: '', warning: '', info: '' };
  const labels = { critical: '【CRITICAL】', warning: '【WARNING】', info: '【INFO】' };

  all.forEach(a => {
    const div = document.createElement('div');
    div.className = 'alert-box ' + a.level;
    div.innerHTML = `<span class="alert-icon">${icons[a.level]}</span><div class="alert-body"><div class="alert-title ${a.level}">${labels[a.level]} ${a.title}</div><div class="alert-msg">${a.msg}</div></div>`;
    container.appendChild(div);
  });
}

// ============================================================
//  SECTION STATUS
// ============================================================
function setSection(id, errors) {
  const el = document.getElementById(id);
  if (!el) return;
  if (errors > 0) { el.className = 'c-status error'; el.textContent = `エラー ${errors}件`; }
  else { el.className = 'c-status ok'; el.textContent = '入力OK'; }
}

// ============================================================
//  RESET
// ============================================================
function resetAll() {
  if (!confirm('すべての入力をリセットしますか？')) return;
  document.querySelectorAll('input[type="number"], input[type="date"], input[type="text"]').forEach(el => el.value = '');
  document.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
  document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
  document.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
  document.querySelectorAll('.cb-item').forEach(el => el.classList.remove('checked'));
  document.querySelectorAll('.stress-opt').forEach(el => el.classList.remove('selected'));
  document.getElementById('edemaSub').classList.remove('show');
  document.querySelectorAll('.fmsg').forEach(el => { el.textContent = ''; el.className = 'fmsg'; });
  document.querySelectorAll('input').forEach(el => el.className = el.className.replace(/\bf-(error|warn|ok)\b/g,'').trim());
  document.getElementById('exam-contradiction').innerHTML = '';
  switchConsciousness('jcs'); switchUrine('h');
  const gcsTotalEl = document.getElementById('gcsTotal');
  if (gcsTotalEl) { gcsTotalEl.textContent = 'E? + V? + M? = —'; gcsTotalEl.className = 'gcs-total-display'; }
  const p2card = document.getElementById('card-p2');
  if (p2card) { p2card.style.display = 'none'; document.getElementById('p2-body').innerHTML = ''; }
  setAutoField('weightDiff', '—', ''); setAutoField('weightDays', '—', '');
  setAutoField('shockIndex', '—', ''); setAutoField('egfr', '年齢・性別・Creを入力で計算', '');
  setAutoField('bunCreRatio', '—', '');
  ['s1-status','s2-status','s3-status','s4-status','s5-status'].forEach(id => {
    const el = document.getElementById(id); if (el) { el.className = 'c-status waiting'; el.textContent = '入力待ち'; }
  });
  alerts = { critical: [], warning: [], info: [] };
  renderAlerts();
  document.getElementById('noAlertMsg').style.display = '';
  document.getElementById('statusBadge').className = 'status-badge waiting'; document.getElementById('statusBadge').textContent = '入力待ち';
  ['critCount','warnCount','infoCount'].forEach(id => { const el = document.getElementById(id); el.textContent = '0'; el.className = 'status-badge waiting'; });
  document.getElementById('btnNext').disabled = true;
  document.getElementById('footerStat').textContent = '必須項目を入力してください。';
}

// ============================================================
//  PHASE 2 HELPERS
// ============================================================
function getTBWCoef(age, sex) {
  if (!age) return sex === 'female' ? 0.5 : 0.6;
  if (age < 15) return 0.65;
  if (age >= 65) return sex === 'female' ? 0.45 : 0.5;
  return sex === 'female' ? 0.5 : 0.6;
}
function getRefHct(sex) { return sex === 'female' ? 40 : 45; }
function getCatabolicRate(stress) {
  if (!stress) return 0.3;
  if (stress >= 1.7) return 0.5;
  if (stress >= 1.3) return 0.4;
  return 0.3;
}
function getWeightLossType(days, delta, stress) {
  if (days === null || delta === null) return { type:'未判定', methodOk:false, adjustedKg:null, tissueKg:null, tissueRate:null };
  if (delta <= 0) return { type:'体重増加', methodOk:false, adjustedKg:null, tissueKg:null, tissueRate:null };
  if (days <= 3) return { type:'急性（水分喪失主体）', methodOk:true, adjustedKg:Math.max(delta,0), tissueKg:0, tissueRate:0 };
  if (days <= 7) {
    const rate = getCatabolicRate(stress);
    const tissue = rate * days;
    const adj = Math.max(delta - tissue, 0);
    return { type:'亜急性（水分＋組織異化の混合）', methodOk:true, adjustedKg:adj, tissueKg:tissue, tissueRate:rate };
  }
  return { type:'慢性（組織減少主体）', methodOk:false, adjustedKg:null, tissueKg:null, tissueRate:getCatabolicRate(stress) };
}
function getMaintenance2(wt, age, temp) {
  if (!wt || !age) return { base:null, adjusted:null, hourly:null, feverF:1, mode:'未判定' };
  let base, mode;
  if (age < 15) {
    base = (Math.min(wt,10)*100 + Math.max(Math.min(wt-10,10),0)*50 + Math.max(wt-20,0)*20);
    mode = '小児 Holliday-Segar 法';
  } else if (age >= 65) {
    base = wt * 22.5; mode = '高齢者 22.5 mL/kg/日';
  } else {
    base = wt * 27.5; mode = '成人 27.5 mL/kg/日';
  }
  const ff = (temp && temp > 37) ? 1 + (temp - 37) * 0.15 : 1;
  const adj = Math.round(base * ff);
  return { base:Math.round(base), adjusted:adj, hourly:Math.round(adj/24*10)/10, feverF:Math.round(ff*100)/100, mode };
}
function buildFluidPlan2(dtype, naVal, egfr, hfRisk, kVal, volFactor = 1.0) {
  const kBad = egfr !== null && egfr < 30;
  const kCaut = egfr !== null && egfr >= 30 && egfr < 60;
  if (hfRisk) return {
    primary:'安易な補液は避け、水制限を優先', secondary:'医師へ製剤選択をコンサルト',
    steps:['希釈性低Na血症・心不全リスクを優先評価してください。','入出量・浮腫・ラ音・BNPを再確認してください。',`投与する場合は結果欄の制限係数に従い、通常量の${Math.round(volFactor * 100)}%から慎重に開始してください。`]
  };
  if (dtype === 'hyper') return {
    primary: kBad ? '5%ブドウ糖液（K非含有）' : '5%ブドウ糖液',
    secondary: 'KN1号（1号液）',
    steps:['初日24時間は推定欠乏量の1/3程度から開始します。','維持輸液を別途加算し、Na補正速度を0.5 mEq/L/h以下に保ちます。','4時間後にバイタル・尿量、8時間後にNaを再評価します。']
  };
  if (dtype === 'hypo') return {
    primary: 'ソルアセトF',
    secondary: (naVal !== null && naVal < 125) ? 'Na<125：3%NaCl投与は必ず医師の指示で（ODS予防）' : (kBad ? 'ソルアセトF K 4mEq/L含有：尿量・K値を観察' : 'Na<125・神経症状は医師へ即報告'),
    steps:['SBP < 90ならCriticalとして医師へ即報告してください。','循環維持が必要なら初期負荷（500mL/30分）を検討します。','Na < 125 や神経症状があれば必ず医師へ相談してください（ODS予防: ≤8〜10 mEq/day）。']
  };
  return {
    primary: 'ソルアセトF',
    secondary: (!kBad && !kCaut) ? 'ソルデム3A（K含有：eGFR>30のみ）' : 'K含有は医師に確認',
    steps:['急性期は500〜1000mLの初期輸液負荷を検討します。','維持期は100〜150 mL/hを参考に尿量と血圧反応を観察します。',kBad ? 'eGFR<30 → ソルデム3A等K含有輸液は禁忌です。' : kCaut ? 'eGFR<60 → K含有は慎重に。尿量・Kを2〜4時間ごとに確認。' : 'ソルデム3A（K含有）はeGFR>30の場合に使用可能です。']
  };
}

// ============================================================
//  PHASE 2: 脱水タイプ分類・欠乏量計算・輸液計画
// ============================================================
function goNext() {
  // --- 入力値収集 ---
  const age = v('age'), sex = vs('sex');
  const curWeight = v('curWeight'), usualWeight = v('usuWeight');
  const naVal = v('na'), kVal = v('k'), bunVal = v('bun'), gluVal = v('glu');
  const tpVal = v('tp'), hctVal = v('hct'), bnpVal = v('bnp');
  const tempVal = v('temp'), stress = getStress();
  const cre = v('cre'), egfrVal = calcEGFR(age, sex, cre);
  const hasEdema   = document.getElementById('edema').checked;
  const hasRales   = document.getElementById('rales').checked;
  const hasJvd     = document.getElementById('jvd').checked;
  const hasCpAngle = document.getElementById('cpAngle').value === 'dull';
  const cwd = vd('curWeightDate'), uwd = vd('usuWeightDate');
  const weightDays = (cwd && uwd) ? Math.round(Math.abs(cwd - uwd) / 86400000) : null;
  const deltaW = (usualWeight && curWeight) ? usualWeight - curWeight : null;
  const tbwCoef = getTBWCoef(age, sex);
  const refHct  = getRefHct(sex);
  const baseWt  = usualWeight || curWeight; // prefer usual weight for deficit calc

  // --- 血清浸透圧 (Posm) ---
  const posm = (naVal !== null && gluVal !== null && bunVal !== null)
    ? Math.round((2 * naVal + gluVal / 18 + bunVal / 2.8) * 10) / 10
    : null;

  // --- 1. 脱水タイプ分類（Posm優先→Na fallback）---
  let dtype, dlabel, dcolor, dbasis, pathology;
  const classVal = posm !== null ? posm : naVal;
  const classMode = posm !== null ? 'posm' : (naVal !== null ? 'na' : null);
  if (!classMode) {
    dtype = 'unknown'; dlabel = '不明（Na・Posm 未算出）'; dcolor = 'unknown'; pathology = '—';
    dbasis = 'Na が未入力のため分類不可。臨床所見（口腔乾燥・ツルゴール低下・浮腫など）から判断し、Na 測定を強く推奨します。';
  } else if ((classMode === 'posm' && classVal > 295) || (classMode === 'na' && naVal > 145)) {
    dtype = 'hyper'; dcolor = 'hyper'; pathology = '細胞内脱水';
    dlabel = classMode === 'posm' ? '高張性脱水（水欠乏型）　Posm ' + classVal + ' mOsm/L' : '高張性脱水（水欠乏型）　Na ' + naVal + ' mEq/L';
    dbasis = '体内水分の相対的不足。自由水（低張液）で補充。Na 補正速度 ≤ 0.5 mEq/L/h、最大 10〜12 mEq/day を超えないこと。';
  } else if ((classMode === 'posm' && classVal < 285) || (classMode === 'na' && naVal < 135)) {
    dtype = 'hypo'; dcolor = 'hypo'; pathology = '細胞外液減少＋細胞内浮腫';
    dlabel = classMode === 'posm' ? '低張性脱水（Na欠乏型）　Posm ' + classVal + ' mOsm/L' : '低張性脱水（Na欠乏型）　Na ' + naVal + ' mEq/L';
    dbasis = 'Na 欠乏が主体。等張〜高張 NaCl 液で補充。慢性例：補正速度 ≤ 8〜10 mEq/day（ODS 予防）。';
  } else {
    dtype = 'iso'; dcolor = 'iso'; pathology = '細胞外液減少';
    dlabel = classMode === 'posm' ? '等張性脱水　Posm ' + classVal + ' mOsm/L' : '等張性脱水　Na ' + naVal + ' mEq/L';
    dbasis = '水分と電解質がほぼ等比で失われている。乳酸リンゲル/酢酸リンゲル/生食などの等張液で補充。';
  }

  // --- 2. 体重減少の質的判定 ---
  const wloss = getWeightLossType(weightDays, deltaW, stress);
  const bwDefMl = wloss.methodOk && wloss.adjustedKg ? Math.round(wloss.adjustedKg * 1000) : null;

  // --- 3. 水分欠乏量計算（4手法） ---
  // Na法（Adrogue-Madias原理 — 高張性脱水のみ）
  let naDef = null, naDefNote = '';
  if (naVal !== null && naVal > 145 && baseWt && tbwCoef) {
    naDef = Math.round((1 - 140 / naVal) * baseWt * tbwCoef * 1000);
    naDefNote = '(1 − 140/' + naVal + ') × ' + baseWt + 'kg × TBW係数' + tbwCoef;
  } else {
    naDefNote = naVal !== null && naVal <= 145 ? 'Na ≤ 145 → Na法は高張性脱水のみ適用' : 'Na 未入力';
  }

  // Hct法
  let hctDef = null, hctDefNote = '';
  if (hctVal !== null && baseWt && tbwCoef) {
    const raw = Math.round((1 - refHct / hctVal) * baseWt * tbwCoef * 1000);
    if (raw <= 0) { hctDefNote = 'Hct ' + hctVal + '% ≤ 基準' + refHct + '% → 血液希釈（不算入）'; }
    else { hctDef = raw; hctDefNote = '(1 − ' + refHct + '/' + hctVal + ') × ' + baseWt + 'kg × ' + tbwCoef; }
  } else { hctDefNote = 'Hct 未入力'; }

  // TP法
  let tpDef = null, tpDefNote = '';
  if (tpVal !== null && baseWt && tbwCoef) {
    const raw = Math.round((tpVal / 7.0 - 1) * baseWt * tbwCoef * 1000);
    if (raw <= 0) { tpDefNote = 'TP ' + tpVal + ' < 7.0 → 血液希釈（不算入）'; }
    else {
      tpDef = raw;
      tpDefNote = '(TP ' + tpVal + '/7.0 − 1) × ' + baseWt + 'kg × ' + tbwCoef;
      if (tpVal < 6.0) tpDefNote += '【TP<6.0: 低栄養による過大評価の可能性】';
    }
  } else { tpDefNote = 'TP 未入力'; }

  // 平均・乖離率
  const valids = [bwDefMl, naDef, hctDef, tpDef].filter(x => x !== null && x > 0);
  const avgDefMl = valids.length > 0 ? Math.round(valids.reduce((a, b) => a + b, 0) / valids.length) : null;
  const divPct = valids.length >= 2 && avgDefMl
    ? Math.round((Math.max(...valids) - Math.min(...valids)) / avgDefMl * 100) : null;

  // --- 4. 維持輸液量（年齢補正） ---
  const mnt = getMaintenance2(curWeight, age, tempVal);

  // --- 5. 心不全・腎不全リスク ---
  const kRestrict  = egfrVal !== null && egfrVal < 30;
  const ckdCaution = egfrVal !== null && egfrVal >= 30 && egfrVal < 60;
  const hfSevere   = (bnpVal !== null && bnpVal > 500) || (hasEdema && hasRales);
  const hfCaution  = !hfSevere && ((bnpVal !== null && bnpVal > 200) || (hasEdema && hasJvd) || (hasRales && hasCpAngle) || (hasEdema && hasCpAngle));
  const hfRisk     = hfSevere || hfCaution;

  // --- 6. 輸液剤・プロトコル ---
  // 減量係数: 重症心不全または溢水→0.50、心不全リスクまたは腎機能障害→0.75、通常→1.00
  let volFactor = 1.0, volLabel = '通常量';
  if (hfSevere) { volFactor = 0.50; volLabel = '重症心不全または溢水では、通常の50%に制限'; }
  else if (hfCaution || kRestrict || ckdCaution) { volFactor = 0.75; volLabel = '心不全リスクまたは腎機能障害では、通常の75%に制限'; }

  const fluidPlan = buildFluidPlan2(dtype, naVal, egfrVal, hfRisk, kVal, volFactor);

  const adjMnt = Math.round(mnt.adjusted * volFactor);
  const proto = avgDefMl !== null && mnt.adjusted !== null ? [
    { day:'Day 1', def:Math.round(avgDefMl/3 * volFactor), note:'欠乏量の1/3' + (volFactor < 1 ? '（減量適用）' : '') + 'から開始' },
    { day:'Day 2', def:Math.round(avgDefMl*2/3 * volFactor), note:'残り2/3を補正' + (volFactor < 1 ? '（減量適用）' : '') + '、Na・尿量を再評価' },
    { day:'Day 3', def:0, note:'維持中心。経口移行を検討' }
  ].map(r => ({ ...r, mnt:adjMnt, total:r.def+adjMnt, rate:Math.round((r.def+adjMnt)/24) })) : [];

  // --- 8. Na補正速度安全計算（Adrogue-Madias） ---
  const tbwL = (curWeight && tbwCoef) ? Math.round(curWeight * tbwCoef * 10) / 10 : null;
  const adroguePerL = (tbwL !== null && naVal !== null) ? Math.round(((0 - naVal) / (tbwL + 1)) * 100) / 100 : null;
  const naChgH = adroguePerL !== null ? Math.abs(Math.round(adroguePerL / 24 * 1000) / 1000) : null;
  const chronic = weightDays === null || weightDays >= 2;
  let naSafetyLabel = '—', naSafetyClass = '';
  if (naChgH !== null) {
    const lim = chronic ? 0.5 : 1.0;
    if (naChgH <= 0.5) { naSafetyLabel = '安全範囲内（≤ 0.5 mEq/L/h）'; naSafetyClass = 'color:var(--success)'; }
    else if (naChgH <= 1.0) { naSafetyLabel = '要注意（0.5〜1.0 mEq/L/h）'; naSafetyClass = 'color:#E65100'; }
    else { naSafetyLabel = '危険（> 1.0 mEq/L/h）'; naSafetyClass = 'color:var(--danger)'; }
  }

  // --- HTML構築 ---
  const fmt = (n, d=0) => n !== null ? n.toFixed(d) : '—';
  const row = (th, val, note='') => `<tr><th>${th}</th><td class="pv">${val}</td>${note ? '<td class="pn">'+note+'</td>' : '<td></td>'}</tr>`;
  let h = '';

  // 全体ステータス
  const statusCls = alerts.critical.length > 0 ? 'critical' : (alerts.warning.length > 0 ? 'warning' : 'ok');
  const statusMsg = alerts.critical.length > 0
    ? 'Critical ' + alerts.critical.length + ' 件。輸液計画提示を最小化します。まず医師へ報告してください。'
    : alerts.warning.length > 0
    ? 'Warning ' + alerts.warning.length + ' 件。慎重投与モードで計画を提示します。'
    : '判定完了。以下の計画を参考に実施してください。';
  h += `<div class="p2-strip ${statusCls}">${statusMsg}</div>`;

  // Critical 一覧（あれば）
  if (alerts.critical.length > 0) {
    h += '<div class="p2-crit-list"><strong>Critical 警告</strong><ul>';
    alerts.critical.forEach(a => { h += `<li>${a.title}：${a.msg}</li>`; });
    h += '</ul></div>';
  }

  // 総合判定
  const egfrStg = egfrVal !== null ? egfrStage(egfrVal) : '—';
  const hrVal = v('hr'), sbpVal = v('sbp');
  const si = (hrVal && sbpVal) ? Math.round(hrVal / sbpVal * 100) / 100 : null;
  const bunCre = v('bun') !== null && cre !== null ? Math.round(v('bun') / cre) : null;
  h += `<div class="band"><div class="band-title blue">総合判定</div><div class="band-body">`;
  h += `<table class="p2-tbl">`;
  h += row('脱水タイプ', `<span class="p2-type-badge ${dcolor}" style="padding:3px 10px;font-size:13px;">${dlabel}</span>`, dbasis.substring(0,50)+'…');
  if (classMode === 'posm' && naVal !== null) {
    const naCategory = naVal > 145 ? '高張性' : naVal < 135 ? '低張性' : '等張性';
    const posmCategory = posm > 295 ? '高張性' : posm < 285 ? '低張性' : '等張性';
    const mismatch = naCategory !== posmCategory;
    const posmNote = mismatch
      ? `※ NaからはNaCategory（${naCategory}）と推定されますが、Posmを優先して${posmCategory}と判定しています。`
      : `※ Posmを優先して判定しています（Naとの整合あり）。`;
    h += `<tr><td colspan="3" style="font-size:11px;color:#555;padding:4px 8px;background:#f5f5f5;border-radius:4px;">`
      + `本ツールはNa・Glu・BUNから算出したPosmが得られる場合、血清Na単独よりPosmを優先して脱水タイプを判定します。`
      + (mismatch ? `　<strong style="color:#E65100;">見かけ上のNa区分（${naCategory}）と最終判定（${posmCategory}）が一致していません。</strong>` : '')
      + `</td></tr>`;
  }
  h += row('血清浸透圧', posm !== null ? posm + ' mOsm/L' : '（Na・Glu・BUN を入力すると算出）', '正常: 285〜295');
  h += row('eGFR / CKD', egfrVal !== null ? egfrVal + ' mL/分/1.73m²' : '（Cre 未入力）', egfrStg);
  h += row('Shock Index', si !== null ? si : '（HR・SBP 未入力）', si !== null ? (si > 1.0 ? '[Critical]' : si > 0.8 ? '[Warning]' : '正常') : '');
  h += row('BUN/Cre 比', bunCre !== null ? bunCre : '（BUN・Cre 未入力）', bunCre !== null ? (bunCre > 20 ? '腎前性脱水を示唆' : bunCre < 10 ? '低栄養・過剰輸液の可能性' : '正常') : '');
  h += '</table></div></div>';

  // 体重減少の質的判定
  h += `<div class="band"><div class="band-title blue">体重減少の質的判定</div><div class="band-body">`;
  h += `<table class="p2-tbl">`;
  h += row('減少期間', weightDays !== null ? weightDays + ' 日' : '—', '');
  h += row('体重差', deltaW !== null ? deltaW.toFixed(1) + ' kg' : '—', usualWeight && curWeight ? '通常体重 ' + usualWeight + ' kg → 現体重 ' + curWeight + ' kg' : '');
  h += row('判定区分', wloss.type, '');
  h += row('組織異化推定', wloss.tissueKg !== null ? wloss.tissueKg.toFixed(1) + ' kg' : '—', wloss.tissueRate !== null ? wloss.tissueRate + ' kg/日 × ' + weightDays + ' 日' : '');
  h += row('補正後水分欠乏推定', wloss.adjustedKg !== null ? wloss.adjustedKg.toFixed(1) + ' kg' : '算出対象外', '');
  h += '</table></div></div>';

  // 欠乏量推定（4手法クロスチェック）
  const defRow = (name, val, note) => `<tr><th>${name}</th><td class="pv">${val !== null ? val.toLocaleString() + ' mL' : '<span style="color:var(--text-sub);font-weight:400">算出不可</span>'}</td><td class="pn">${note}</td></tr>`;
  h += `<div class="band"><div class="band-title blue">欠乏量推定（4手法クロスチェック）</div><div class="band-body">`;
  h += `<table class="p2-tbl">`;
  h += defRow('体重法', bwDefMl, wloss.type + (wloss.methodOk ? '' : ' → 欠乏量に不算入'));
  h += defRow('Na 法', naDef, naDefNote);
  h += defRow('Hct 法', hctDef, hctDefNote);
  h += defRow('TP 法', tpDef, tpDefNote);
  h += '</table>';
  if (avgDefMl !== null) {
    h += `<div class="p2-avg-row"><span class="p2-avg-lbl">参考欠乏量（算出可能 ${valids.length} 手法の平均）</span><span class="p2-avg-num">${avgDefMl.toLocaleString()}</span><span class="p2-avg-unit"> mL</span></div>`;
    if (divPct !== null && divPct >= 20) {
      h += `<div class="p2-warn-line">推定法の乖離率 ${divPct}% — 身体所見・臨床判断を最優先してください。</div>`;
    }
  } else {
    h += `<div class="p2-rec">算出可能な欠乏量データがありません。体重法・Na法・Hct法・TP法のいずれかのデータ入力が必要です。</div>`;
  }
  h += '</div></div>';

  // 維持輸液量
  h += `<div class="band"><div class="band-title green">維持輸液量（基礎必要量）</div><div class="band-body">`;
  h += `<table class="p2-tbl">`;
  h += row('基本維持量', mnt.base !== null ? mnt.base.toLocaleString() + ' mL/日' : '—', mnt.mode);
  h += row('発熱補正係数', mnt.feverF !== 1 ? '× ' + mnt.feverF : '× 1.00（37℃以下）', '37℃超1℃ごとに +15%');
  h += row('補正後維持量', mnt.adjusted !== null ? mnt.adjusted.toLocaleString() + ' mL/日' : '—', mnt.hourly !== null ? mnt.hourly + ' mL/時' : '');
  h += `</table><div style="margin-top:6px;font-size:11px;color:#666;">※ 成人27.5 mL/kg/日・高齢者22.5 mL/kg/日は、NICE CG174推奨範囲（25-30 / 20-25）の中間値として本ツールで採用した参考値です。ただし、NICE CG174は重症腎疾患（severe renal disease）を適用除外としています。小児Holliday-Segarは文献整合的です。</div></div></div>`;

  // 推奨輸液プロトコル（Critical でなければ表示）
  if (alerts.critical.length === 0) {
    const protoTitle = volFactor < 1 ? '推奨輸液プロトコル（慎重投与 — 減量適用）' : '推奨輸液プロトコル（参考）';
    const protoColor = volFactor < 1 ? 'orange' : 'green';
    h += `<div class="band"><div class="band-title ${protoColor}">${protoTitle}</div><div class="band-body">`;
    if (volFactor < 1) {
      h += `<div class="p2-stop" style="margin-bottom:10px;">投与量制限: ${volLabel}（通常量 × ${Math.round(volFactor*100)}%）</div>`;
    }
    h += `<table class="p2-tbl">`;
    h += row('第1選択製剤', fluidPlan.primary, '');
    h += row('第2選択製剤', fluidPlan.secondary, 'eGFR と K 含有条件を反映');
    if (volFactor < 1 && mnt.adjusted !== null) {
      h += row('通常維持量', mnt.adjusted.toLocaleString() + ' mL/日', '減量前');
      h += row('減量後維持量', adjMnt.toLocaleString() + ' mL/日 (' + Math.round(adjMnt/24) + ' mL/時)', `× ${Math.round(volFactor*100)}%`);
    }
    h += '</table>';
    h += `<div class="p2-rec">思考支援：「欠乏補正量」と「維持輸液量」を分けて考え、合計量と速度を確認します。${volFactor < 1 ? '<br>溢水・心不全・腎障害リスクにより減量を適用しています。投与中は呼吸状態・浮腫・尿量を頻回に観察してください。' : ''}</div>`;

    if (proto.length > 0) {
      h += `<div class="proto-grid">`;
      proto.forEach(r => {
        h += `<div class="proto-card"><div class="proto-head">${r.day}</div><div class="proto-body">`;
        h += `<div class="proto-m deficit"><div class="proto-m-lbl">欠乏補正</div><div class="proto-m-val">${r.def.toLocaleString()} mL</div></div>`;
        h += `<div class="proto-m maintenance"><div class="proto-m-lbl">維持輸液</div><div class="proto-m-val">${r.mnt.toLocaleString()} mL</div></div>`;
        h += `<div class="proto-m total"><div class="proto-m-lbl">合計</div><div class="proto-m-val">${r.total.toLocaleString()} mL</div></div>`;
        h += `<div class="proto-m rate"><div class="proto-m-lbl">投与速度</div><div class="proto-m-val">${r.rate} mL/時</div></div>`;
        h += `<div class="proto-note">${r.note}</div></div></div>`;
      });
      h += '</div>';
      // 3日合計
      const tot3def = proto.reduce((a,r)=>a+r.def,0), tot3mnt = proto.reduce((a,r)=>a+r.mnt,0);
      h += `<table class="p2-tbl" style="margin-top:10px;">`;
      h += row('3日合計 欠乏補正', tot3def.toLocaleString() + ' mL', '');
      h += row('3日合計 維持輸液', tot3mnt.toLocaleString() + ' mL', '');
      h += row('3日合計', (tot3def+tot3mnt).toLocaleString() + ' mL', '再評価で前倒し・減量を許容');
      h += '</table>';
    } else if (mnt.adjusted !== null) {
      h += `<div class="p2-rec">欠乏量データが不足のため、維持輸液（${mnt.adjusted.toLocaleString()} mL/日 / ${mnt.hourly} mL/時）のみ算出可能です。</div>`;
    }

    h += `<div class="p2-stop">中止基準：呼吸困難・ラ音出現（肺水腫） / 尿量 &lt; 0.5 mL/kg/h / Na変化 &gt; 0.5 mEq/L/h</div>`;
    h += `<div class="p2-rec" style="margin-top:10px;">${fluidPlan.steps.map((s,i)=>`${i+1}. ${s}`).join('<br>')}</div>`;
    h += '</div></div>';
  } else {
    // Critical アラートあり → プロトコル非表示・代替メッセージ表示
    const critTitles = alerts.critical.map(a => a.title).join('　/　');
    h += `<div class="band"><div class="band-title" style="background:#C62828;color:#fff;">推奨輸液プロトコル — 表示停止中</div><div class="band-body">`;
    h += `<div class="p2-stop" style="margin-bottom:10px;">`;
    h += `Criticalアラートが発生しています。まず医師へ報告し、循環動態・呼吸状態・意識状態の安定化を優先してください。`;
    h += `</div>`;
    h += `<div style="font-size:12px;color:#555;margin-top:6px;">`;
    h += `<strong>停止理由：</strong>${critTitles}`;
    h += `</div>`;
    h += `<div style="font-size:12px;color:#555;margin-top:8px;">`;
    h += `状態が安定したら再入力・再計算を行い、プロトコルを確認してください。`;
    h += `</div>`;
    h += '</div></div>';
  }

  // Na補正速度安全計算
  if (naVal !== null) {
    h += `<div class="band"><div class="band-title orange">Na補正速度の安全計算（Adrogue-Madias 式）</div><div class="band-body">`;
    h += `<table class="p2-tbl">`;
    h += row('TBW', tbwL !== null ? tbwL + ' L' : '—', '体重 ' + (curWeight||'—') + ' kg × TBW係数 ' + tbwCoef);
    h += row('計算基準製剤', '5%ブドウ糖液（Na 0 / K 0 mEq/L）', '他製剤ではNa変化速度が異なります');
    h += row('1L 投与時のNa変化量', adroguePerL !== null ? adroguePerL + ' mEq/L' : '—', 'Adrogue-Madias 式');
    h += row('1時間あたり', naChgH !== null ? naChgH + ' mEq/L/h' : '—', `<span style="${naSafetyClass}">${naSafetyLabel}</span>`);
    h += '</table>';
    h += `<div class="p2-warn-line">慢性高Na血症・慢性低Na血症では 0.5 mEq/L/h 以下が最重要です（ODS・脳障害予防）。</div>`;
    h += `<div class="p2-warn-line" style="margin-top:4px;">※ 急性/慢性の判定は体重変化日数（${weightDays !== null ? weightDays + '日' : '不明'}）で代用しています。正確にはNa異常の持続時間（48時間基準）で判断します。病歴聴取と再検査で必ず補完してください。</div>`;
    h += '</div></div>';
  }

  // モニタリングスケジュール
  h += `<div class="band"><div class="band-title gray">モニタリングと再評価</div><div class="band-body">`;
  h += `<table class="p2-tbl">`;
  h += row('2 時間ごと', 'バイタルサイン・神経学的所見', '意識レベル・SpO₂・血圧・心拍数');
  h += row('4 時間ごと', '血清 Na・尿量', 'Na 補正速度の確認（≤ 0.5 mEq/L/h）');
  h += row('8 時間ごと', '全身評価・輸液速度調整', '浮腫・ラ音・JVD の有無');
  h += row('24 時間後', '総合評価・血液検査・プロトコル見直し', '電解質・eGFR・BNP 再測定');
  h += '</table>';
  if (alerts.warning.length > 0 || alerts.info.length > 0) {
    h += `<div class="p2-rec" style="margin-top:10px;"><strong>判定根拠（第1段階アラートより）</strong><br>`;
    [...alerts.warning, ...alerts.info].slice(0,5).forEach(a => { h += `• ${a.title}：${a.msg}<br>`; });
    h += '</div>';
  }
  h += '</div></div>';

  // 免責
  h += `<div class="p2-disclaimer">本ツールの計算結果はあくまで参考値であり、「診断」を行うものではありません。輸液処方は必ず医師の指示に基づき、患者の臨床症状・バイタルサイン・尿量・体重などを定期的に再評価しながら実施してください。<br>計算根拠：体重法（組織異化補正済み）、Na法（Adrogue-Madias原理）、Hct法（TBW×[1−基準Hct/実測Hct]）、TP法（TBW×[TP/7.0−1]）。維持輸液：小児Holliday-Segar / 高齢者22.5 / 成人27.5 mL/kg/日 ± 発熱補正（NICE CG174推奨範囲の中間値として本ツールで採用した参考値。ただしNICE CG174は重症腎疾患を適用除外としている）。Posm = 2×Na + Glu/18 + BUN/2.8。<br>BNP閾値（200/500 pg/mL）は心不全の診断閾値ではなく、本ツールで慎重投与判断のために採用した安全上の参考閾値です。Na補正の急性/慢性判定はNa異常の発症時期ではなく、体重変化日数を代用指標とした参考判定です。正確には病歴聴取と再検査で補完してください。<br>参照文献:<br>1. McDonagh, T. A., et al. (2021). 2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure. European Heart Journal, 42, 3599-3726. doi: 10.1093/eurheartj/ehab368<br>2. 日本循環器学会 / 日本心不全学会. (2025). 2025年改訂版 心不全診療ガイドライン. https://www.j-circ.or.jp/cms/wp-content/uploads/2025/03/JCS2025_Kato.pdf<br>3. National Institute for Health and Care Excellence. (2013, updated 2016). Intravenous fluid therapy in adults in hospital (CG174). https://www.nice.org.uk/guidance/cg174<br>4. 日本腎臓学会. (2012). エビデンスに基づくCKD診療ガイドライン2012. 東京医学社.<br>5. Matsuo, S., Imai, E., Horio, M., et al. (2009). Revised equations for estimated GFR from serum creatinine in Japan. American Journal of Kidney Diseases, 53(6), 982-992. doi: 10.1053/j.ajkd.2008.12.034<br>6. Adrogue, H. J., &amp; Madias, N. E. (2000). Hypernatremia. New England Journal of Medicine, 342, 1493-1499. doi: 10.1056/NEJM200005253422106<br>7. Adrogue, H. J., &amp; Madias, N. E. (2000). Hyponatremia. New England Journal of Medicine, 342, 1581-1589. doi: 10.1056/NEJM200005253422107<br>8. Holliday, M. A., &amp; Segar, W. E. (1957). The maintenance need for water in parenteral fluid therapy. Pediatrics, 19(5), 823-832.<br>9. Wiedemann, H. P., et al. (2006). Comparison of two fluid-management strategies in acute lung injury (FACTT Trial). New England Journal of Medicine, 354, 2564-2575. doi: 10.1056/NEJMoa062200<br>10. 日本静脈経腸栄養学会 (JSPEN). (2013). 静脈経腸栄養ガイドライン 第3版. 照林社.</div>`;
  h += `<button class="p2-print-btn" onclick="window.print()">印刷 / PDF 保存</button>`;

  document.getElementById('p2-body').innerHTML = h;
  const card = document.getElementById('card-p2');
  card.style.display = '';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
//  SAMPLE CASES — 50症例ライブラリ
// ============================================================
const SAMPLE_CASES = [
  // ──── 高張性脱水（Na > 145） 10症例 ────
  { label:'①高張性脱水・典型（80歳男性）', cat:'高張性脱水（Na>145）',
    age:80, sex:'male', height:163, usuW:63.0, daysAgo:14, curW:59.5,
    sbp:96, dbp:58, hr:112, rr:22, spo2:95, temp:38.2, urineH:20,
    jcs:'I-2', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false, cpAngle:'sharp',
    na:155, k:4.5, cl:115, bun:38, cre:1.4, glu:128, tp:5.6, alb:2.6, hb:15.2, hct:48.0, bnp:null, stress:'1.2' },

  { label:'②高張性脱水・軽度（73歳女性）', cat:'高張性脱水（Na>145）',
    age:73, sex:'female', height:152, usuW:50.0, daysAgo:7, curW:48.5,
    sbp:108, dbp:68, hr:96, rr:18, spo2:97, temp:37.6, urineH:35,
    jcs:'0', dryMouth:true, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:148, k:4.2, cl:108, bun:24, cre:0.9, glu:115, tp:6.2, alb:3.2, hb:14.0, hct:44.0, bnp:null, stress:'1.0' },

  { label:'③高張性脱水・重症（85歳男性）', cat:'高張性脱水（Na>145）',
    age:85, sex:'male', height:160, usuW:58.0, daysAgo:21, curW:52.0,
    sbp:82, dbp:50, hr:124, rr:26, spo2:93, temp:38.8, urineH:10,
    jcs:'II-10', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:166, k:5.2, cl:122, bun:56, cre:2.1, glu:145, tp:5.0, alb:2.2, hb:16.5, hct:52.0, bnp:null, stress:'1.3' },

  { label:'④高張性脱水＋高血糖（68歳男性）', cat:'高張性脱水（Na>145）',
    age:68, sex:'male', height:170, usuW:72.0, daysAgo:10, curW:69.0,
    sbp:102, dbp:64, hr:108, rr:20, spo2:96, temp:37.9, urineH:28,
    jcs:'I-1', dryMouth:true, turgurDown:false, axilDry:false, edema:false, rales:false, jvd:false,
    na:152, k:4.8, cl:118, bun:32, cre:1.2, glu:420, tp:6.0, alb:3.0, hb:14.8, hct:47.0, bnp:null, stress:'1.1' },

  { label:'⑤高張性脱水＋発熱（77歳女性）', cat:'高張性脱水（Na>145）',
    age:77, sex:'female', height:155, usuW:52.0, daysAgo:5, curW:50.5,
    sbp:104, dbp:62, hr:104, rr:24, spo2:95, temp:39.2, urineH:22,
    jcs:'I-2', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:150, k:4.6, cl:112, bun:30, cre:1.1, glu:135, tp:5.8, alb:2.8, hb:15.0, hct:47.5, bnp:null, stress:'1.3' },

  { label:'⑥認知症・水分摂取不足（82歳女性）', cat:'高張性脱水（Na>145）',
    age:82, sex:'female', height:148, usuW:44.0, daysAgo:30, curW:41.0,
    sbp:110, dbp:70, hr:92, rr:18, spo2:97, temp:37.2, urineH:30,
    jcs:'I-3', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:153, k:4.3, cl:110, bun:42, cre:1.0, glu:110, tp:5.5, alb:2.5, hb:13.8, hct:43.5, bnp:null, stress:'1.0' },

  { label:'⑦高張性脱水・CKD合併（76歳男性）', cat:'高張性脱水（Na>145）',
    age:76, sex:'male', height:165, usuW:65.0, daysAgo:14, curW:62.0,
    sbp:118, dbp:72, hr:88, rr:18, spo2:96, temp:37.4, urineH:25,
    jcs:'I-1', dryMouth:true, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:150, k:5.2, cl:112, bun:48, cre:2.4, glu:120, tp:5.9, alb:2.8, hb:11.5, hct:36.0, bnp:null, stress:'1.0' },

  { label:'⑧高張性脱水・重篤（79歳男性）', cat:'高張性脱水（Na>145）',
    age:79, sex:'male', height:162, usuW:60.0, daysAgo:10, curW:55.5,
    sbp:88, dbp:52, hr:118, rr:28, spo2:92, temp:38.5, urineH:8,
    jcs:'II-20', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:162, k:5.5, cl:125, bun:68, cre:2.8, glu:152, tp:4.8, alb:2.0, hb:17.2, hct:54.0, bnp:null, stress:'1.5' },

  { label:'⑨術後高Na血症（65歳男性）', cat:'高張性脱水（Na>145）',
    age:65, sex:'male', height:172, usuW:70.0, daysAgo:3, curW:68.5,
    sbp:118, dbp:74, hr:85, rr:16, spo2:98, temp:37.5, urineH:38,
    jcs:'0', dryMouth:false, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:147, k:3.8, cl:108, bun:20, cre:0.9, glu:145, tp:6.5, alb:3.5, hb:13.2, hct:42.0, bnp:null, stress:'1.2' },

  { label:'⑩熱中症・高張性脱水（45歳男性）', cat:'高張性脱水（Na>145）',
    age:45, sex:'male', height:175, usuW:78.0, daysAgo:1, curW:75.5,
    sbp:98, dbp:58, hr:120, rr:24, spo2:96, temp:40.2, urineH:15,
    jcs:'I-2', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:149, k:4.2, cl:110, bun:22, cre:1.3, glu:130, tp:6.8, alb:3.8, hb:16.0, hct:50.0, bnp:null, stress:'1.5' },

  // ──── 低張性脱水（Na < 135） 10症例 ────
  { label:'⑪低張性脱水・利尿剤（75歳男性）', cat:'低張性脱水（Na<135）',
    age:75, sex:'male', height:168, usuW:66.0, daysAgo:14, curW:64.0,
    sbp:100, dbp:62, hr:98, rr:20, spo2:96, temp:37.0, urineH:32,
    jcs:'I-2', dryMouth:true, turgurDown:false, axilDry:false, edema:true, rales:false, jvd:false,
    na:128, k:3.2, cl:88, bun:28, cre:1.3, glu:105, tp:6.0, alb:3.0, hb:13.0, hct:40.0, bnp:180, stress:'1.0' },

  { label:'⑫SIADH・低張性（70歳女性）', cat:'低張性脱水（Na<135）',
    age:70, sex:'female', height:158, usuW:55.0, daysAgo:7, curW:55.5,
    sbp:112, dbp:72, hr:84, rr:18, spo2:97, temp:37.1, urineH:50,
    jcs:'I-3', dryMouth:false, turgurDown:false, axilDry:false, edema:false, rales:false, jvd:false,
    na:122, k:3.8, cl:82, bun:10, cre:0.7, glu:95, tp:6.2, alb:3.5, hb:12.5, hct:38.5, bnp:null, stress:'1.0' },

  { label:'⑬嘔吐下痢・低張性（65歳女性）', cat:'低張性脱水（Na<135）',
    age:65, sex:'female', height:155, usuW:52.0, daysAgo:3, curW:50.0,
    sbp:96, dbp:58, hr:110, rr:22, spo2:96, temp:38.0, urineH:20,
    jcs:'I-1', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:130, k:2.8, cl:90, bun:25, cre:1.1, glu:88, tp:5.8, alb:2.8, hb:14.5, hct:45.0, bnp:null, stress:'1.1' },

  { label:'⑭低Na＋心不全（78歳男性）', cat:'低張性脱水（Na<135）',
    age:78, sex:'male', height:167, usuW:65.0, daysAgo:21, curW:66.5,
    sbp:100, dbp:68, hr:96, rr:22, spo2:92, temp:37.0, urineH:40,
    jcs:'I-2', dryMouth:false, turgurDown:false, axilDry:false, edema:true, rales:true, jvd:true,
    na:132, k:4.2, cl:94, bun:30, cre:1.5, glu:112, tp:5.5, alb:2.5, hb:11.0, hct:34.0, bnp:850, stress:'1.0' },

  { label:'⑮肝硬変・低Na（67歳男性）', cat:'低張性脱水（Na<135）',
    age:67, sex:'male', height:170, usuW:68.0, daysAgo:30, curW:65.0,
    sbp:98, dbp:60, hr:102, rr:20, spo2:95, temp:37.3, urineH:35,
    jcs:'I-1', dryMouth:false, turgurDown:false, axilDry:false, edema:true, rales:false, jvd:false,
    na:126, k:3.5, cl:88, bun:18, cre:0.8, glu:95, tp:4.8, alb:2.0, hb:10.5, hct:33.0, bnp:null, stress:'1.0' },

  { label:'⑯重症低Na血症・緊急（72歳女性）', cat:'低張性脱水（Na<135）',
    age:72, sex:'female', height:152, usuW:48.0, daysAgo:7, curW:47.0,
    sbp:86, dbp:52, hr:116, rr:24, spo2:94, temp:37.5, urineH:15,
    jcs:'II-20', dryMouth:false, turgurDown:false, axilDry:false, edema:false, rales:false, jvd:false,
    na:115, k:3.6, cl:78, bun:22, cre:1.0, glu:100, tp:5.8, alb:3.0, hb:13.0, hct:40.5, bnp:null, stress:'1.3' },

  { label:'⑰術後低Na（55歳女性）', cat:'低張性脱水（Na<135）',
    age:55, sex:'female', height:160, usuW:58.0, daysAgo:5, curW:58.5,
    sbp:106, dbp:66, hr:88, rr:18, spo2:97, temp:37.2, urineH:45,
    jcs:'0', dryMouth:false, turgurDown:false, axilDry:false, edema:false, rales:false, jvd:false,
    na:128, k:3.4, cl:90, bun:14, cre:0.7, glu:112, tp:6.4, alb:3.2, hb:12.0, hct:37.0, bnp:null, stress:'1.2' },

  { label:'⑱慢性低Na・高齢（80歳女性）', cat:'低張性脱水（Na<135）',
    age:80, sex:'female', height:145, usuW:40.0, daysAgo:60, curW:39.0,
    sbp:108, dbp:68, hr:80, rr:16, spo2:97, temp:36.8, urineH:40,
    jcs:'I-2', dryMouth:false, turgurDown:false, axilDry:false, edema:false, rales:false, jvd:false,
    na:127, k:3.9, cl:90, bun:18, cre:0.8, glu:95, tp:5.8, alb:2.8, hb:11.5, hct:36.0, bnp:null, stress:'1.0' },

  { label:'⑲多飲症・希釈性低Na（38歳男性）', cat:'低張性脱水（Na<135）',
    age:38, sex:'male', height:172, usuW:68.0, daysAgo:3, curW:69.5,
    sbp:110, dbp:70, hr:76, rr:16, spo2:98, temp:36.8, urineH:80,
    jcs:'I-3', dryMouth:false, turgurDown:false, axilDry:false, edema:false, rales:false, jvd:false,
    na:120, k:3.5, cl:80, bun:8, cre:0.6, glu:85, tp:6.6, alb:3.8, hb:13.5, hct:42.0, bnp:null, stress:'1.0' },

  { label:'⑳CKD＋低Na（74歳男性）', cat:'低張性脱水（Na<135）',
    age:74, sex:'male', height:165, usuW:62.0, daysAgo:14, curW:62.5,
    sbp:112, dbp:72, hr:86, rr:18, spo2:96, temp:37.0, urineH:35,
    jcs:'I-1', dryMouth:false, turgurDown:false, axilDry:false, edema:true, rales:false, jvd:false,
    na:130, k:5.0, cl:92, bun:45, cre:2.8, glu:125, tp:5.6, alb:2.6, hb:10.8, hct:33.5, bnp:320, stress:'1.0' },

  // ──── 等張性脱水（Na 135-145） 10症例 ────
  { label:'㉑等張性脱水・典型（70歳女性）', cat:'等張性脱水（Na135-145）',
    age:70, sex:'female', height:155, usuW:52.0, daysAgo:5, curW:49.5,
    sbp:104, dbp:64, hr:104, rr:20, spo2:96, temp:37.8, urineH:25,
    jcs:'I-1', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:138, k:4.0, cl:100, bun:25, cre:1.0, glu:110, tp:6.0, alb:3.0, hb:14.0, hct:44.0, bnp:null, stress:'1.2' },

  { label:'㉒下痢による等張性脱水（74歳男性）', cat:'等張性脱水（Na135-145）',
    age:74, sex:'male', height:167, usuW:63.0, daysAgo:3, curW:61.0,
    sbp:106, dbp:66, hr:100, rr:18, spo2:97, temp:37.6, urineH:30,
    jcs:'0', dryMouth:true, turgurDown:true, axilDry:false, edema:false, rales:false, jvd:false,
    na:140, k:3.5, cl:100, bun:22, cre:1.1, glu:115, tp:6.4, alb:3.4, hb:14.5, hct:45.5, bnp:null, stress:'1.1' },

  { label:'㉓熱傷・等張性脱水（42歳男性）', cat:'等張性脱水（Na135-145）',
    age:42, sex:'male', height:175, usuW:75.0, daysAgo:1, curW:72.0,
    sbp:96, dbp:58, hr:118, rr:26, spo2:95, temp:38.5, urineH:18,
    jcs:'I-1', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:142, k:4.5, cl:104, bun:20, cre:1.2, glu:140, tp:5.5, alb:2.8, hb:15.5, hct:49.0, bnp:null, stress:'1.7' },

  { label:'㉔腸閉塞・等張性脱水（72歳男性）', cat:'等張性脱水（Na135-145）',
    age:72, sex:'male', height:165, usuW:64.0, daysAgo:2, curW:61.5,
    sbp:98, dbp:60, hr:112, rr:22, spo2:96, temp:37.5, urineH:20,
    jcs:'I-2', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:140, k:3.8, cl:98, bun:28, cre:1.3, glu:118, tp:5.8, alb:2.8, hb:15.0, hct:47.0, bnp:null, stress:'1.3' },

  { label:'㉕嘔吐・等張性脱水（60歳女性）', cat:'等張性脱水（Na135-145）',
    age:60, sex:'female', height:160, usuW:58.0, daysAgo:2, curW:56.5,
    sbp:102, dbp:64, hr:106, rr:20, spo2:97, temp:37.0, urineH:28,
    jcs:'0', dryMouth:true, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:136, k:3.2, cl:96, bun:18, cre:0.8, glu:100, tp:6.6, alb:3.5, hb:13.5, hct:42.0, bnp:null, stress:'1.1' },

  { label:'㉖外傷後・等張性脱水（35歳男性）', cat:'等張性脱水（Na135-145）',
    age:35, sex:'male', height:178, usuW:76.0, daysAgo:1, curW:74.0,
    sbp:100, dbp:62, hr:115, rr:22, spo2:97, temp:37.2, urineH:22,
    jcs:'I-1', dryMouth:false, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:142, k:4.2, cl:104, bun:16, cre:1.0, glu:115, tp:7.0, alb:3.8, hb:14.0, hct:43.5, bnp:null, stress:'1.5' },

  { label:'㉗廃用症候群・軽度脱水（85歳女性）', cat:'等張性脱水（Na135-145）',
    age:85, sex:'female', height:145, usuW:40.0, daysAgo:30, curW:38.5,
    sbp:108, dbp:66, hr:85, rr:16, spo2:97, temp:36.9, urineH:35,
    jcs:'0', dryMouth:true, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:138, k:4.0, cl:100, bun:20, cre:0.8, glu:108, tp:5.8, alb:2.8, hb:11.5, hct:36.0, bnp:null, stress:'1.0' },

  { label:'㉘敗血症・等張性脱水（68歳男性）', cat:'等張性脱水（Na135-145）',
    age:68, sex:'male', height:168, usuW:66.0, daysAgo:3, curW:64.0,
    sbp:94, dbp:56, hr:114, rr:24, spo2:95, temp:39.0, urineH:18,
    jcs:'I-2', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:139, k:4.6, cl:100, bun:30, cre:1.5, glu:128, tp:5.5, alb:2.4, hb:13.0, hct:41.0, bnp:null, stress:'1.5' },

  { label:'㉙経管栄養中・脱水（78歳女性）', cat:'等張性脱水（Na135-145）',
    age:78, sex:'female', height:150, usuW:46.0, daysAgo:14, curW:44.5,
    sbp:110, dbp:68, hr:90, rr:18, spo2:96, temp:37.4, urineH:30,
    jcs:'I-1', dryMouth:true, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:140, k:3.8, cl:102, bun:26, cre:1.0, glu:122, tp:5.6, alb:2.6, hb:12.0, hct:38.0, bnp:null, stress:'1.0' },

  { label:'㉚術後早期・等張性（62歳男性）', cat:'等張性脱水（Na135-145）',
    age:62, sex:'male', height:170, usuW:68.0, daysAgo:2, curW:66.5,
    sbp:112, dbp:70, hr:92, rr:18, spo2:97, temp:37.6, urineH:40,
    jcs:'0', dryMouth:false, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:138, k:3.6, cl:100, bun:18, cre:0.9, glu:130, tp:6.2, alb:3.2, hb:12.8, hct:40.0, bnp:null, stress:'1.2' },

  // ──── 過剰輸液・心不全 5症例 ────
  { label:'㉛心不全急性増悪（74歳男性）', cat:'過剰輸液・心不全',
    age:74, sex:'male', height:168, usuW:65.0, daysAgo:14, curW:68.5,
    sbp:105, dbp:68, hr:102, rr:26, spo2:91, temp:37.0, urineH:30,
    jcs:'0', dryMouth:false, turgurDown:false, axilDry:false, edema:true, rales:true, jvd:true, cpAngle:'dull',
    na:135, k:4.5, cl:98, bun:28, cre:1.4, glu:112, tp:5.8, alb:2.8, hb:11.0, hct:34.5, bnp:1850, stress:'1.0' },

  { label:'㉜慢性心不全代償期（80歳男性）', cat:'過剰輸液・心不全',
    age:80, sex:'male', height:162, usuW:62.0, daysAgo:30, curW:64.5,
    sbp:112, dbp:72, hr:88, rr:20, spo2:93, temp:36.8, urineH:35,
    jcs:'0', dryMouth:false, turgurDown:false, axilDry:false, edema:true, rales:false, jvd:true, cpAngle:'sharp',
    na:136, k:4.2, cl:96, bun:24, cre:1.6, glu:108, tp:6.0, alb:3.0, hb:11.5, hct:36.0, bnp:650, stress:'1.0' },

  { label:'㉝過剰輸液後・全身浮腫（68歳女性）', cat:'過剰輸液・心不全',
    age:68, sex:'female', height:158, usuW:55.0, daysAgo:7, curW:59.0,
    sbp:118, dbp:76, hr:88, rr:22, spo2:92, temp:37.2, urineH:45,
    jcs:'0', dryMouth:false, turgurDown:false, axilDry:false, edema:true, rales:true, jvd:false, cpAngle:'dull',
    na:136, k:4.0, cl:98, bun:20, cre:0.9, glu:108, tp:5.8, alb:2.6, hb:10.5, hct:33.0, bnp:1200, stress:'1.0' },

  { label:'㉞CKD＋溢水（72歳男性）', cat:'過剰輸液・心不全',
    age:72, sex:'male', height:165, usuW:62.0, daysAgo:14, curW:65.0,
    sbp:122, dbp:78, hr:84, rr:20, spo2:93, temp:36.9, urineH:20,
    jcs:'0', dryMouth:false, turgurDown:false, axilDry:false, edema:true, rales:false, jvd:true, cpAngle:'dull',
    na:134, k:5.5, cl:96, bun:55, cre:3.2, glu:118, tp:5.5, alb:2.5, hb:10.0, hct:31.0, bnp:980, stress:'1.0' },

  { label:'㉟肺水腫疑い（76歳女性）', cat:'過剰輸液・心不全',
    age:76, sex:'female', height:152, usuW:50.0, daysAgo:7, curW:53.0,
    sbp:95, dbp:62, hr:108, rr:30, spo2:89, temp:37.0, urineH:25,
    jcs:'I-2', dryMouth:false, turgurDown:false, axilDry:false, edema:true, rales:true, jvd:true, cpAngle:'dull',
    na:134, k:4.8, cl:96, bun:32, cre:1.8, glu:115, tp:5.5, alb:2.4, hb:10.8, hct:33.5, bnp:2200, stress:'1.0' },

  // ──── 合併症あり 10症例 ────
  { label:'㊱CKD stage3・脱水（70歳男性）', cat:'合併症あり',
    age:70, sex:'male', height:167, usuW:65.0, daysAgo:10, curW:63.0,
    sbp:118, dbp:74, hr:88, rr:18, spo2:97, temp:37.0, urineH:32,
    jcs:'0', dryMouth:true, turgurDown:false, axilDry:false, edema:false, rales:false, jvd:false,
    na:140, k:4.8, cl:104, bun:32, cre:1.8, glu:118, tp:6.2, alb:3.2, hb:11.8, hct:37.5, bnp:null, stress:'1.0' },

  { label:'㊲CKD stage4・脱水（76歳男性）', cat:'合併症あり',
    age:76, sex:'male', height:163, usuW:60.0, daysAgo:14, curW:57.0,
    sbp:104, dbp:66, hr:98, rr:20, spo2:95, temp:37.5, urineH:18,
    jcs:'I-1', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:142, k:5.0, cl:108, bun:62, cre:3.5, glu:132, tp:5.8, alb:2.6, hb:10.2, hct:32.0, bnp:null, stress:'1.2' },

  { label:'㊳高K血症・AKI（68歳男性）', cat:'合併症あり',
    age:68, sex:'male', height:168, usuW:68.0, daysAgo:7, curW:66.0,
    sbp:108, dbp:68, hr:92, rr:18, spo2:96, temp:37.2, urineH:22,
    jcs:'0', dryMouth:false, turgurDown:false, axilDry:false, edema:false, rales:false, jvd:false,
    na:138, k:6.2, cl:102, bun:45, cre:2.5, glu:128, tp:6.0, alb:3.0, hb:11.5, hct:36.0, bnp:null, stress:'1.0' },

  { label:'㊴低K血症・嘔吐（55歳女性）', cat:'合併症あり',
    age:55, sex:'female', height:158, usuW:54.0, daysAgo:5, curW:52.0,
    sbp:96, dbp:58, hr:108, rr:22, spo2:97, temp:37.0, urineH:30,
    jcs:'I-1', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:132, k:2.3, cl:88, bun:20, cre:0.9, glu:95, tp:6.5, alb:3.5, hb:13.0, hct:41.0, bnp:null, stress:'1.1' },

  { label:'㊵DKA・高血糖（48歳男性）', cat:'合併症あり',
    age:48, sex:'male', height:172, usuW:74.0, daysAgo:3, curW:71.5,
    sbp:98, dbp:60, hr:115, rr:28, spo2:96, temp:37.8, urineH:12,
    jcs:'I-2', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:130, k:5.5, cl:92, bun:28, cre:1.4, glu:480, tp:6.2, alb:3.2, hb:15.0, hct:47.0, bnp:null, stress:'1.5' },

  { label:'㊶肺炎＋脱水（78歳男性）', cat:'合併症あり',
    age:78, sex:'male', height:164, usuW:62.0, daysAgo:7, curW:59.5,
    sbp:100, dbp:62, hr:108, rr:26, spo2:94, temp:39.5, urineH:22,
    jcs:'I-2', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:145, k:4.2, cl:108, bun:35, cre:1.5, glu:138, tp:5.8, alb:2.6, hb:14.0, hct:44.5, bnp:null, stress:'1.5' },

  { label:'㊷消化器術後・脱水（65歳女性）', cat:'合併症あり',
    age:65, sex:'female', height:158, usuW:56.0, daysAgo:5, curW:54.0,
    sbp:110, dbp:68, hr:96, rr:18, spo2:97, temp:37.8, urineH:35,
    jcs:'0', dryMouth:false, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:138, k:3.5, cl:100, bun:22, cre:0.9, glu:125, tp:5.8, alb:2.8, hb:11.5, hct:36.0, bnp:null, stress:'1.2' },

  { label:'㊸外科的侵襲後・脱水（58歳男性）', cat:'合併症あり',
    age:58, sex:'male', height:170, usuW:70.0, daysAgo:4, curW:67.5,
    sbp:98, dbp:60, hr:112, rr:22, spo2:96, temp:38.2, urineH:20,
    jcs:'I-1', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:140, k:4.6, cl:104, bun:26, cre:1.2, glu:135, tp:5.5, alb:2.8, hb:13.5, hct:42.0, bnp:null, stress:'1.5' },

  { label:'㊹CKD＋高Na複合（77歳男性）', cat:'合併症あり',
    age:77, sex:'male', height:163, usuW:61.0, daysAgo:14, curW:57.5,
    sbp:100, dbp:62, hr:104, rr:20, spo2:95, temp:37.8, urineH:15,
    jcs:'I-2', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:156, k:5.3, cl:120, bun:58, cre:3.0, glu:138, tp:5.2, alb:2.2, hb:11.0, hct:34.5, bnp:null, stress:'1.3' },

  { label:'㊺多臓器不全疑い（82歳女性）', cat:'合併症あり',
    age:82, sex:'female', height:148, usuW:42.0, daysAgo:10, curW:39.5,
    sbp:80, dbp:48, hr:126, rr:30, spo2:90, temp:39.2, urineH:5,
    jcs:'III-100', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:true, jvd:false,
    na:158, k:5.8, cl:118, bun:82, cre:3.8, glu:168, tp:4.5, alb:1.8, hb:12.0, hct:38.0, bnp:null, stress:'1.7' },

  // ──── 特殊ケース 5症例 ────
  { label:'㊻脳卒中後・嚥下障害（76歳男性）', cat:'特殊ケース',
    age:76, sex:'male', height:168, usuW:66.0, daysAgo:21, curW:62.5,
    sbp:115, dbp:74, hr:85, rr:16, spo2:96, temp:37.0, urineH:30,
    jcs:'I-3', dryMouth:true, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:142, k:4.0, cl:104, bun:22, cre:1.0, glu:118, tp:5.8, alb:2.8, hb:12.5, hct:39.5, bnp:null, stress:'1.0' },

  { label:'㊼摂食障害・低栄養（35歳女性）', cat:'特殊ケース',
    age:35, sex:'female', height:162, usuW:40.0, daysAgo:60, curW:37.5,
    sbp:90, dbp:55, hr:96, rr:16, spo2:97, temp:35.8, urineH:35,
    jcs:'0', dryMouth:false, turgurDown:true, axilDry:false, edema:false, rales:false, jvd:false,
    na:132, k:2.6, cl:88, bun:10, cre:0.5, glu:65, tp:4.5, alb:2.2, hb:10.5, hct:33.0, bnp:null, stress:'1.0' },

  { label:'㊽急性胃腸炎・中年（44歳男性）', cat:'特殊ケース',
    age:44, sex:'male', height:172, usuW:72.0, daysAgo:2, curW:70.0,
    sbp:106, dbp:66, hr:102, rr:20, spo2:97, temp:37.8, urineH:32,
    jcs:'0', dryMouth:true, turgurDown:false, axilDry:true, edema:false, rales:false, jvd:false,
    na:138, k:3.5, cl:100, bun:18, cre:0.9, glu:105, tp:7.0, alb:4.0, hb:15.0, hct:46.0, bnp:null, stress:'1.1' },

  { label:'㊾軽度脱水・境界例（72歳女性）', cat:'特殊ケース',
    age:72, sex:'female', height:155, usuW:52.0, daysAgo:7, curW:51.0,
    sbp:116, dbp:72, hr:82, rr:16, spo2:97, temp:36.8, urineH:45,
    jcs:'0', dryMouth:false, turgurDown:false, axilDry:false, edema:false, rales:false, jvd:false,
    na:143, k:4.0, cl:104, bun:16, cre:0.8, glu:105, tp:6.5, alb:3.5, hb:12.5, hct:39.0, bnp:null, stress:'1.0' },

  { label:'㊿終末期・参考症例（88歳男性）', cat:'特殊ケース',
    age:88, sex:'male', height:158, usuW:48.0, daysAgo:60, curW:43.0,
    sbp:90, dbp:55, hr:105, rr:20, spo2:94, temp:37.5, urineH:12,
    jcs:'II-10', dryMouth:true, turgurDown:true, axilDry:true, edema:false, rales:false, jvd:false,
    na:148, k:4.8, cl:110, bun:45, cre:1.8, glu:112, tp:5.0, alb:2.2, hb:11.0, hct:35.0, bnp:null, stress:'1.0' },
];

// ============================================================
//  SAMPLE CASE LOADER
// ============================================================
function loadSampleCase(idx) {
  const c = SAMPLE_CASES[idx];
  if (!c) return;

  // 基本情報
  document.getElementById('age').value = c.age;
  document.getElementById('sex').value = c.sex;
  document.getElementById('height').value = c.height;

  // 体重 + 日付（date形式: YYYY-MM-DD）
  const _p = n => String(n).padStart(2, '0');
  const _fmtD = d => d.getFullYear() + '-' + _p(d.getMonth()+1) + '-' + _p(d.getDate());
  const _now2 = new Date();
  const _usu = new Date(_now2); _usu.setDate(_usu.getDate() - (c.daysAgo || 0));
  document.getElementById('usuWeight').value = c.usuW;
  document.getElementById('usuWeightDate').value = _fmtD(_usu);
  document.getElementById('curWeight').value = c.curW;
  document.getElementById('curWeightDate').value = _fmtD(_now2);

  // バイタルサイン
  if (consciousnessMode !== 'jcs') switchConsciousness('jcs');
  document.getElementById('jcs').value = c.jcs || '0';
  document.getElementById('sbp').value = c.sbp;
  document.getElementById('dbp').value = c.dbp;
  document.getElementById('hr').value = c.hr;
  document.getElementById('rr').value = c.rr;
  document.getElementById('spo2').value = c.spo2;
  document.getElementById('temp').value = c.temp;

  // 尿量
  if (urineMode !== 'h') switchUrine('h');
  document.getElementById('urineH').value = c.urineH;

  // 身体診察チェックボックス
  ['dryMouth','turgurDown','axilDry','edema','rales','jvd'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.checked = !!c[id]; toggleCb(id); }
  });
  const edemaSub = document.getElementById('edemaSub');
  if (edemaSub) edemaSub.classList.toggle('show', !!c.edema);
  // CP angle（select: '', 'sharp', 'dull'）
  const cpEl = document.getElementById('cpAngle');
  if (cpEl) cpEl.value = c.cpAngle || '';

  // 血液検査
  ['na','k','cl','bun','cre','glu','tp','alb','hb','hct','bnp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = (c[id] !== null && c[id] !== undefined) ? c[id] : '';
  });

  // ストレス係数
  const stressRadio = document.querySelector(`input[name="stress"][value="${c.stress}"]`);
  if (stressRadio) stressRadio.checked = true;

  validate();
}

function loadSample() { loadSampleCase(0); } // 後方互換

// ===== SAMPLE PANEL =====
function buildSampleCards() {
  const body = document.getElementById('sampleCardsBody');
  if (!body || typeof SAMPLE_CASES === 'undefined') return;
  body.innerHTML = '';
  let _lastLoaded = -1;
  const cats = [...new Set(SAMPLE_CASES.map(c => c.cat))];
  cats.forEach(cat => {
    const hdr = document.createElement('div');
    hdr.className = 'sc-cat';
    hdr.textContent = cat;
    body.appendChild(hdr);
    const grid = document.createElement('div');
    grid.className = 'sc-grid';
    SAMPLE_CASES.forEach((c, i) => {
      if (c.cat !== cat) return;
      const loss = (c.usuW && c.curW) ? ((c.usuW - c.curW) / c.usuW * 100).toFixed(1) : '?';
      const card = document.createElement('div');
      card.className = 'sc-card';
      card.id = 'sc-' + i;
      card.innerHTML = '<div class="sc-name">' + c.label + '</div>' +
        '<div class="sc-meta">Na ' + (c.na ?? '—') + ' / -' + loss + '% / ' + (c.daysAgo || 0) + '日</div>';
      card.addEventListener('click', () => {
        document.querySelectorAll('.sc-card').forEach(el => el.classList.remove('loaded'));
        card.classList.add('loaded');
        loadSampleCase(i);
        closeSamplePanel();
      });
      grid.appendChild(card);
    });
    body.appendChild(grid);
  });
}

function toggleSamplePanel() {
  const body = document.getElementById('sampleCardsBody');
  const btn = document.getElementById('btnSampleToggle');
  if (!body) return;
  if (body.style.display === 'none' || body.style.display === '') {
    body.style.display = 'block';
    btn.textContent = '一覧を閉じる \u25B2';
  } else {
    body.style.display = 'none';
    btn.textContent = '一覧を開く \u25BC';
  }
}

function closeSamplePanel() {
  const body = document.getElementById('sampleCardsBody');
  const btn = document.getElementById('btnSampleToggle');
  if (body) body.style.display = 'none';
  if (btn) btn.textContent = '一覧を開く \u25BC';
}

// ============================================================
//  INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  // Set s3 as optional
  const s3 = document.getElementById('s3-status');
  if (s3) { s3.className = 'c-status ok'; s3.textContent = '任意入力'; }
  // 現体重測定日 → 今日をデフォルト。通常時体重は未入力（過去日を手動入力）
  const _now = new Date();
  const _pad = n => String(n).padStart(2, '0');
  const _nowStr = _now.getFullYear() + '-' + _pad(_now.getMonth()+1) + '-' + _pad(_now.getDate());
  document.getElementById('curWeightDate').value = _nowStr;
  // usuWeightDate は空欄のまま（利用者が測定日時を入力する）
  // サンプルカードを構築
  buildSampleCards();
  // 初期バリデーション
  validate();
});

