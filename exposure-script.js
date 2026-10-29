/* ==========================================
   노출 계산기 — script.js  (전면 재작성)
   ========================================== */

// ── 1. 데이터 ──

const SHUTTERS = [
  { label: '30"',    val: 30      },
  { label: '15"',    val: 15      },
  { label: '8"',     val: 8       },
  { label: '4"',     val: 4       },
  { label: '2"',     val: 2       },
  { label: '1"',     val: 1       },
  { label: '1/2',    val: 0.5     },
  { label: '1/4',    val: 0.25    },
  { label: '1/8',    val: 0.125   },
  { label: '1/15',   val: 1/15    },
  { label: '1/30',   val: 1/30    },
  { label: '1/60',   val: 1/60    },
  { label: '1/125',  val: 1/125   },
  { label: '1/250',  val: 1/250   },
  { label: '1/500',  val: 1/500   },
  { label: '1/1000', val: 1/1000  },
  { label: '1/2000', val: 1/2000  },
  { label: '1/4000', val: 1/4000  },
  { label: '1/8000', val: 1/8000  },
];

const APERTURES = [
  { label: 'f/1',   val: 1    },
  { label: 'f/1.4', val: 1.4  },
  { label: 'f/2',   val: 2    },
  { label: 'f/2.8', val: 2.8  },
  { label: 'f/4',   val: 4    },
  { label: 'f/5.6', val: 5.6  },
  { label: 'f/8',   val: 8    },
  { label: 'f/11',  val: 11   },
  { label: 'f/16',  val: 16   },
  { label: 'f/22',  val: 22   },
  { label: 'f/32',  val: 32   },
];

const ISOS = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200];

const EV_SITUATIONS = [
  { max: 1,  text: '🌑 완전한 어둠 — 장노출 필수',        status: '매우 어두움' },
  { max: 4,  text: '🌃 야간 거리 / 촛불 환경',            status: '어두운 환경' },
  { max: 7,  text: '🌆 야경, 실내 저조도',                status: '저조도'      },
  { max: 10, text: '💡 실내 밝은 조명 / 흐린 야외',       status: '실내 환경'   },
  { max: 13, text: '⛅ 맑은 날 그늘 / 흐린 날 야외',      status: '일반 야외'   },
  { max: 16, text: '☀️ 맑은 날 직사광선 야외',            status: '밝은 야외'   },
  { max: 20, text: '🏔 설원 / 해변 직사광선',             status: '매우 밝음'   },
];

const PRESETS = {
  sunny:    { shutter: 13, aperture: 5, iso: 1 },
  indoor:   { shutter: 10, aperture: 4, iso: 3 },
  night:    { shutter: 4,  aperture: 2, iso: 5 },
  portrait: { shutter: 12, aperture: 1, iso: 2 },
  sport:    { shutter: 15, aperture: 4, iso: 3 },
};

// ── 2. 상태 ──
let locks = { shutter: true, aperture: true, iso: false };
let idx   = { shutter: 12, aperture: 5, iso: 3 };
const SETTING_OPTIONS = { shutter: SHUTTERS, aperture: APERTURES, iso: ISOS };

// Preserve the EV100 of the initial settings; the unlocked control is solved
// against this target whenever either locked control changes.
let targetEV = ExposureCore.calculateEV(
  SHUTTERS[idx.shutter].val, APERTURES[idx.aperture].val, ISOS[idx.iso]
);
let solveMeta = null;

// ── 3. Pure EV model integration ──
function calcEV(s, a, i) {
  return ExposureCore.calculateEV(s, a, i);
}

function solveAutoParameter() {
  const unlocked = Object.keys(locks).find(k => !locks[k]);
  solveMeta = ExposureCore.resolveSetting(unlocked, targetEV, idx, SETTING_OPTIONS);
  idx[unlocked] = solveMeta.index;
}

// ── 4. UI 업데이트 ──
function updateUI() {
  solveAutoParameter();
  document.getElementById('sl-shutter').value  = idx.shutter;
  document.getElementById('sl-aperture').value = idx.aperture;
  document.getElementById('sl-iso').value      = idx.iso;

  document.getElementById('val-shutter').textContent  = SHUTTERS[idx.shutter].label;
  document.getElementById('val-aperture').textContent = APERTURES[idx.aperture].label;
  document.getElementById('val-iso').textContent      = 'ISO ' + ISOS[idx.iso].toLocaleString();

  ['shutter', 'aperture', 'iso'].forEach(k => {
    const panel  = document.getElementById('panel-' + k);
    const btn    = document.getElementById('lock-' + k);
    const slider = document.getElementById('sl-' + k);
    if (locks[k]) {
      panel.classList.remove('locked');
      btn.classList.add('active');
      btn.textContent = '🔒';
      slider.disabled = false;
    } else {
      panel.classList.add('locked');
      btn.classList.remove('active');
      btn.textContent = '🔓';
      slider.disabled = true;
    }
  });

  const ev  = calcEV(SHUTTERS[idx.shutter].val, APERTURES[idx.aperture].val, ISOS[idx.iso]);
  const pct = Math.min(100, Math.max(0, (ev / 20) * 100));

  document.getElementById('ev-display').textContent = ev.toFixed(1);
  document.getElementById('ev-fill').style.width    = pct + '%';
  document.getElementById('ev-marker').style.left   = pct + '%';

  const sit = EV_SITUATIONS.find(s => ev <= s.max) || EV_SITUATIONS[EV_SITUATIONS.length - 1];
  document.getElementById('ev-situation').textContent = '참고 장면: ' + sit.text + ' (실제 밝기 측정값 아님)';
  document.getElementById('ev-status').textContent = Math.abs(solveMeta.residualEV) >= 0.05
    ? '설정 EV100 · 목표와 ' + Math.abs(solveMeta.residualEV).toFixed(2)
      + '스톱 차이' + (solveMeta.rangeLimited ? ' (설정 범위 제한)' : '')
    : '설정 EV100 · 목표 유지';

  updateCombos(ev);
  updateJudge(ev);
  updateMobileUI(ev);
}

// ── 5. 조합 테이블 ──
function updateCombos(ev) {
  const tbody   = document.getElementById('combo-tbody');
  const selISOs = [100, 400, 1600, 6400];
  const selAps  = [1.4, 2.8, 5.6, 8, 16];
  const combos  = [];

  selISOs.forEach(iso => {
    selAps.forEach(ap => {
      const t = (ap * ap) / Math.pow(2, ev + Math.log2(iso / 100));
      if (t < 0.00005 || t > 60) return;
      const si = ExposureCore.nearestIndex(SHUTTERS, t);
      let tag = '';
      if      (t >= 1/30)   tag = '<span class="tag tag-motion">모션블러</span>';
      else if (t <= 1/1000) tag = '<span class="tag tag-freeze">순간포착</span>';
      else if (ap <= 2.8)   tag = '<span class="tag tag-portrait">아웃포커싱</span>';
      else if (ap >= 11)    tag = '<span class="tag tag-landscape">풍경</span>';
      combos.push({ shutter: SHUTTERS[si].label, aperture: 'f/' + ap, iso: iso.toLocaleString(), tag });
    });
  });

  const seen = new Set();
  const filtered = combos.filter(c => {
    const key = c.shutter + c.aperture + c.iso;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 8);

  const cS = SHUTTERS[idx.shutter].label;
  const cA = APERTURES[idx.aperture].label;
  const cI = ISOS[idx.iso].toLocaleString();

  tbody.innerHTML = filtered.map(c => {
    const active = c.shutter === cS && c.aperture === cA && c.iso === cI;
    return `<tr class="${active ? 'active-row' : ''}">
      <td>${c.shutter}</td><td>${c.aperture}</td><td>ISO ${c.iso}</td><td>${c.tag || '—'}</td>
    </tr>`;
  }).join('');
}

// ── 6. 노출 판정 ──
function updateJudge(ev) {
  const sVal = SHUTTERS[idx.shutter].val;
  const iVal = ISOS[idx.iso];
  const aVal = APERTURES[idx.aperture].val;

  // EV100 describes the selected exposure settings, not the measured scene brightness.
  // Without scene luminance, over/underexposure cannot be determined.
  const icon = '◎';
  const panelClass = 'judge-level-ok';
  const title = '카메라 설정 EV100';
  const desc = '현재 셔터 속도, 조리개, ISO 조합의 설정 EV입니다. 실제 사진의 노출이 적절한지는 장면 밝기와 측광 결과를 함께 확인해야 합니다.';
  const envText = ev < 5
    ? '낮은 EV 설정은 어두운 장면에서 자주 사용되지만, 적절한 노출을 보장하지는 않습니다.'
    : ev < 12
      ? '중간 EV 설정입니다. 촬영 환경과 카메라의 노출계를 함께 확인하세요.'
      : '높은 EV 설정은 밝은 장면에서 자주 사용되지만, 적절한 노출을 보장하지는 않습니다.';

  const needlePct = Math.min(100, Math.max(0, (ev / 20) * 100));
  document.getElementById('judge-needle').style.left = needlePct + '%';

  const panel = document.getElementById('judge-panel');
  panel.className = 'judge-panel ' + panelClass;
  document.getElementById('judge-icon').textContent  = icon;
  document.getElementById('judge-title').textContent = title;
  document.getElementById('judge-desc').textContent  = desc;
  document.getElementById('judge-env').textContent   = '📍 ' + envText;

  const warnings = [];

  // ── ISO 노이즈 경고 ──
  // 블로그 기준: 주간 ISO 100~400 충분, 일몰·야간 400~800, 심야 고ISO
  if (iVal >= 12800) {
    warnings.push('△ ISO ' + iVal.toLocaleString() + ' — 높은 ISO에서는 카메라와 촬영 조건에 따라 노이즈가 증가할 수 있습니다.');
  } else if (iVal >= 3200) {
    warnings.push('△ ISO ' + iVal.toLocaleString() + ' — 노이즈가 생길 수 있어요. 조리개를 더 열거나 셔터를 느리게 하면 ISO를 낮출 수 있어요.');
  }

  // ── 셔터 속도 경고 ──
  // 핵심: sVal은 초 단위 — 느린 셔터(긴 시간)일수록 값이 크다
  // 30초=30, 1/30초=0.033, 1/1000초=0.001
  // 버그 수정: >= 로 비교해야 "느린 셔터"를 잡을 수 있음
  if (sVal >= 1) {
    warnings.push('△ 셔터 ' + SHUTTERS[idx.shutter].label + ' — 장노출입니다. 손떨림과 피사체 움직임에 주의하고, 필요하면 삼각대를 사용하세요.');
  } else if (sVal >= 1/30) {
    warnings.push('⚠ 셔터 ' + SHUTTERS[idx.shutter].label + ' — 느린 셔터로 손떨림이 생길 수 있어요. 삼각대를 사용하거나 단단히 고정하세요. 움직이는 피사체는 흐릿하게 찍혀요.');
  } else if (sVal >= 1/60) {
    warnings.push('△ 셔터 ' + SHUTTERS[idx.shutter].label + ' — 손으로 들고 찍을 때 살짝 흔들릴 수 있어요. 숨을 참고 카메라를 몸에 밀착하거나, 손떨림 방지(OIS) 기능을 켜세요.');
  }
  // 1/125 이상 빠른 셔터: 경고 없음 (일반 핸드헬드 촬영에 안전)

  // ── 조리개 회절 경고 ──
  if (aVal >= 16) {
    warnings.push('△ 조리개 ' + APERTURES[idx.aperture].label + ' — 회절에 따른 선명도 저하는 센서와 렌즈에 따라 달라질 수 있습니다.');
  }

  document.getElementById('judge-warnings').innerHTML = warnings.map(w =>
    '<div class="judge-warn-item">' + w + '</div>'
  ).join('');
}

// ── 8. 모바일 UI ──

let mobileActiveTab = 'shutter'; // 현재 활성 탭

/** 모바일 탭 전환 */
function switchMobileTab(key) {
  mobileActiveTab = key;

  // 탭 버튼 활성화
  ['shutter', 'aperture', 'iso'].forEach(k => {
    const tab = document.getElementById('mpn-' + k);
    if (tab) tab.classList.toggle('active', k === key);
  });

  // 패널 표시/숨김
  ['shutter', 'aperture', 'iso'].forEach(k => {
    const panel = document.getElementById('panel-' + k);
    if (panel) panel.classList.toggle('mobile-active', k === key);
  });
}

/** 모바일 탭 값 + 하단 바 업데이트 */
function updateMobileUI(ev) {
  // 탭 값 업데이트
  const mShutter  = document.getElementById('mpn-val-shutter');
  const mAperture = document.getElementById('mpn-val-aperture');
  const mIso      = document.getElementById('mpn-val-iso');
  if (mShutter)  mShutter.textContent  = SHUTTERS[idx.shutter].label;
  if (mAperture) mAperture.textContent = APERTURES[idx.aperture].label;
  if (mIso)      mIso.textContent      = ISOS[idx.iso].toLocaleString();

  // 잠금 해제된 탭에 calculating 클래스
  ['shutter', 'aperture', 'iso'].forEach(k => {
    const tab = document.getElementById('mpn-' + k);
    if (tab) tab.classList.toggle('calculating', !locks[k]);
  });

  // 하단 바 업데이트
  const bar = document.getElementById('mobile-bottom-bar');
  if (!bar) return;

  const pct = Math.min(100, Math.max(0, (ev / 20) * 100));
  const numEl    = document.getElementById('mbb-ev-num');
  const fillEl   = document.getElementById('mbb-fill');
  const needleEl = document.getElementById('mbb-needle');
  const iconEl   = document.getElementById('mbb-icon');
  const textEl   = document.getElementById('mbb-text');

  if (numEl)    numEl.textContent         = ev.toFixed(1);
  if (fillEl)   fillEl.style.width        = pct + '%';
  if (needleEl) needleEl.style.left       = pct + '%';

  // Scene brightness is unknown: avoid a false exposure verdict.
  bar.className = 'mobile-bottom-bar mbb-ok';
  if (iconEl) iconEl.textContent = 'EV';
  if (textEl) textEl.textContent = '설정 EV100 · 실제 노출은 장면에 따라 다름';
}

/** 모바일 초기화 */
function initMobile() {
  if (window.innerWidth <= 640) {
    switchMobileTab('shutter');
  } else {
    // 데스크톱: 모든 패널 표시
    ['shutter', 'aperture', 'iso'].forEach(k => {
      const panel = document.getElementById('panel-' + k);
      if (panel) panel.classList.remove('mobile-active');
    });
  }
}

window.addEventListener('resize', function() {
  if (window.innerWidth > 640) {
    ['shutter', 'aperture', 'iso'].forEach(k => {
      const panel = document.getElementById('panel-' + k);
      if (panel) panel.classList.remove('mobile-active');
    });
  } else {
    switchMobileTab(mobileActiveTab);
  }
});


// ── 7. 이벤트 핸들러 ──

function onSliderChange(key) {
  if (!locks[key]) return;
  idx[key] = parseInt(document.getElementById('sl-' + key).value, 10);
  updateUI();
}

function toggleLock(key) {
  locks = ExposureCore.transitionLocks(locks, key);
  updateUI();
}

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  locks        = { shutter: true, aperture: true, iso: false };
  idx.shutter  = p.shutter;
  idx.aperture = p.aperture;
  idx.iso      = p.iso;
  targetEV = calcEV(SHUTTERS[idx.shutter].val, APERTURES[idx.aperture].val, ISOS[idx.iso]);
  updateUI();
}


// ── 9. EXIF 사진 정보 불러오기 ──

let exifPending = null;

function loadExifLib(callback) {
  if (window.exifr) { callback(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/exifr/dist/lite.umd.js';
  s.onload = callback;
  document.head.appendChild(s);
}

function formatShutter(val) {
  if (!val) return '—';
  if (val >= 1) return val + 's';
  return '1/' + Math.round(1 / val) + 's';
}

async function loadExif(input) {
  const file = input.files[0];
  if (!file) return;

  const filenameEl = document.getElementById('exif-filename');
  const resultEl   = document.getElementById('exif-result');
  const chipsEl    = document.getElementById('exif-chips');
  const msgEl      = document.getElementById('exif-msg');
  const applyBtn   = document.getElementById('exif-apply-btn');

  filenameEl.textContent = file.name;
  resultEl.style.display = 'block';
  chipsEl.innerHTML = '<span class="exif-loading">▌ EXIF 정보를 읽는 중...</span>';
  msgEl.textContent = '';
  applyBtn.style.display = 'none';
  exifPending = null;

  loadExifLib(async function() {
    try {
      // 옵션 없이 전체 파싱 → 가장 호환성 높음
      const exif = await window.exifr.parse(file);

      const fnum  = exif && exif.FNumber     != null ? exif.FNumber     : null;
      const etime = exif && exif.ExposureTime != null ? exif.ExposureTime : null;
      const iso   = exif && exif.ISO         != null ? exif.ISO         : null;

      const hasExif = fnum != null || etime != null || iso != null;

      if (!hasExif) {
        chipsEl.innerHTML = '<span class="exif-error">⚠ 셔터속도·조리개·ISO 정보를 찾을 수 없어요.<br><small style="font-size:0.62rem;color:var(--text-dim);">라이트룸 등 편집 프로그램에서 EXIF가 제거됐을 수 있습니다. 카메라 원본 JPG를 사용해주세요.</small></span>';
        return;
      }

      // 슬라이더 인덱스 매핑
      let sIdx = null, aIdx = null, iIdx = null;
      if (etime != null) sIdx = SHUTTERS.reduce((b,s,i)  => Math.abs(s.val - etime) < Math.abs(SHUTTERS[b].val - etime)    ? i : b, 0);
      if (fnum  != null) aIdx = APERTURES.reduce((b,a,i) => Math.abs(a.val - fnum)  < Math.abs(APERTURES[b].val - fnum)    ? i : b, 0);
      if (iso   != null) iIdx = ISOS.reduce((b,v,i)      => Math.abs(v - iso)        < Math.abs(ISOS[b] - iso)             ? i : b, 0);

      exifPending = { sIdx, aIdx, iIdx };

      chipsEl.innerHTML = `
        <div class="exif-chip"><span>셔터속도</span>${sIdx != null ? SHUTTERS[sIdx].label : '—'}</div>
        <div class="exif-chip"><span>조리개</span>${aIdx != null ? APERTURES[aIdx].label : '—'}</div>
        <div class="exif-chip"><span>ISO</span>${iIdx != null ? 'ISO ' + ISOS[iIdx].toLocaleString() : '—'}</div>
      `;

      const rawParts = [];
      if (etime != null) rawParts.push('셔터 ' + formatShutter(etime));
      if (fnum  != null) rawParts.push('f/' + fnum);
      if (iso   != null) rawParts.push('ISO ' + iso);
      msgEl.textContent = rawParts.length ? '📸 원본 EXIF: ' + rawParts.join('  ·  ') : '';

      applyBtn.style.display = 'inline-block';

    } catch (err) {
      console.error(err);
      chipsEl.innerHTML = '<span class="exif-error">⚠ EXIF를 읽는 중 오류가 발생했어요.<br><small style="font-size:0.62rem;color:var(--text-dim);">' + (err.message || String(err)) + '</small></span>';
    }
  });
}

function applyExif() {
  if (!exifPending) return;
  const { sIdx, aIdx, iIdx } = exifPending;
  locks = { shutter: true, aperture: true, iso: false };
  if (sIdx != null) idx.shutter  = sIdx;
  if (aIdx != null) idx.aperture = aIdx;
  if (iIdx != null) idx.iso      = iIdx;
  // Import establishes a new reference setting instead of using a stale target.
  targetEV = calcEV(SHUTTERS[idx.shutter].val, APERTURES[idx.aperture].val, ISOS[idx.iso]);
  updateUI();

  const btn = document.getElementById('exif-apply-btn');
  btn.textContent = '✓ 적용됨';
  btn.style.background = 'var(--accent)';
  btn.style.color = '#000';
  setTimeout(() => {
    btn.textContent = '이 세팅 계산기에 적용하기 ↗';
    btn.style.background = '';
    btn.style.color = '';
  }, 1500);
}


// ── 8. 초기화 ──
document.getElementById('sl-shutter').max  = SHUTTERS.length - 1;
document.getElementById('sl-aperture').max = APERTURES.length - 1;
document.getElementById('sl-iso').max      = ISOS.length - 1;
updateUI();
initMobile();
