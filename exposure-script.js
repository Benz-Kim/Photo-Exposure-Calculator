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
  { max: 1,  text: 'Very dark scenes / long exposures',        status: 'Very dark' },
  { max: 4,  text: 'Night streets / candlelight',            status: 'Dark' },
  { max: 7,  text: 'City nights / dim interiors',                status: 'Low light'      },
  { max: 10, text: 'Bright interiors / overcast outdoors',       status: 'Indoor light'   },
  { max: 13, text: 'Open shade / cloudy daylight',      status: 'Daylight'   },
  { max: 16, text: 'Direct sunlight',            status: 'Bright daylight'   },
  { max: 20, text: 'Sunlit snow / bright beaches',             status: 'Very bright'   },
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
let activePreset = null;

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
  const targetSlider = document.getElementById('sl-target-ev');
  const targetLabel = document.getElementById('target-ev-value');
  if (targetSlider) targetSlider.value = targetEV.toFixed(1);
  if (targetLabel) targetLabel.textContent = targetEV.toFixed(1);
  document.getElementById('sl-shutter').value  = idx.shutter;
  document.getElementById('sl-aperture').value = idx.aperture;
  document.getElementById('sl-iso').value      = idx.iso;

  document.getElementById('val-shutter').textContent  = SHUTTERS[idx.shutter].label;
  document.getElementById('val-aperture').textContent = APERTURES[idx.aperture].label;
  document.getElementById('val-iso').textContent      = 'ISO ' + ISOS[idx.iso].toLocaleString('en-US');

  ['shutter', 'aperture', 'iso'].forEach(k => {
    const panel  = document.getElementById('panel-' + k);
    const btn    = document.getElementById('lock-' + k);
    const slider = document.getElementById('sl-' + k);
    btn.setAttribute('aria-pressed', String(!locks[k]));
    btn.setAttribute('aria-label', locks[k] ? 'Calculate ' + k + ' automatically' : k + ' is automatic. Switch to manual');
    slider.setAttribute('aria-valuetext', k === 'shutter' ? SHUTTERS[idx[k]].label + ' seconds' : k === 'aperture' ? APERTURES[idx[k]].label : 'ISO ' + ISOS[idx[k]]);
    if (locks[k]) {
      panel.classList.remove('locked');
      btn.classList.add('active');
      btn.textContent = 'Manual';
      slider.disabled = false;
    } else {
      panel.classList.add('locked');
      btn.classList.remove('active');
      btn.textContent = 'Auto';
      slider.disabled = true;
    }
  });

  const ev  = calcEV(SHUTTERS[idx.shutter].val, APERTURES[idx.aperture].val, ISOS[idx.iso]);
  const pct = Math.min(100, Math.max(0, (ev / 20) * 100));

  document.getElementById('ev-display').textContent = ev.toFixed(1);
  document.getElementById('ev-fill').style.width    = pct + '%';
  document.getElementById('ev-marker').style.left   = pct + '%';

  const sit = EV_SITUATIONS.find(s => ev <= s.max) || EV_SITUATIONS[EV_SITUATIONS.length - 1];
  document.getElementById('ev-situation').textContent = 'Typical context: ' + sit.text + ' (not a light-meter reading)';
  document.getElementById('ev-status').textContent = Math.abs(solveMeta.residualEV) >= 0.05
    ? 'EV100 · reference differs by ' + Math.abs(solveMeta.residualEV).toFixed(2)
      + ' stops' + (solveMeta.rangeLimited ? ' (camera limit)' : '')
    : 'EV100 · reference maintained';

  for (const name of Object.keys(PRESETS)) {
    const button = document.getElementById('preset-' + name);
    if (button) button.setAttribute('aria-pressed', String(name === activePreset));
  }
  const viewfinderValues = { shutter: SHUTTERS[idx.shutter].label + ' s', aperture: APERTURES[idx.aperture].label, iso: 'ISO ' + ISOS[idx.iso].toLocaleString('en-US') };
  for (const key of Object.keys(viewfinderValues)) {
    const label = document.getElementById('vf-' + key);
    if (label) label.textContent = viewfinderValues[key];
  }
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
      const minShutter = SHUTTERS[SHUTTERS.length - 1].val;
      const maxShutter = SHUTTERS[0].val;
      if (t < minShutter || t > maxShutter) return;
      const si = ExposureCore.nearestIndex(SHUTTERS, t);
      const deltaEV = calcEV(SHUTTERS[si].val, ap, iso) - ev;
      // Do not call a combination "equivalent" when rounding exceeds 0.5 stop.
      if (Math.abs(deltaEV) > 0.5) return;
      let tag = '';
      if      (t >= 1/30)   tag = '<span class="tag tag-motion">Motion blur</span>';
      else if (t <= 1/1000) tag = '<span class="tag tag-freeze">Freeze action</span>';
      else if (ap <= 2.8)   tag = '<span class="tag tag-portrait">Soft background</span>';
      else if (ap >= 11)    tag = '<span class="tag tag-landscape">Deep focus</span>';
      combos.push({ shutter: SHUTTERS[si].label, aperture: 'f/' + ap, iso: iso.toLocaleString('en-US'), tag, deltaEV });
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
  const cI = ISOS[idx.iso].toLocaleString('en-US');

  tbody.innerHTML = filtered.map(c => {
    const active = c.shutter === cS && c.aperture === cA && c.iso === cI;
    return `<tr class="${active ? 'active-row' : ''}">
      <td>${c.shutter} <small class="ev-delta">ΔEV ${c.deltaEV >= 0 ? '+' : ''}${c.deltaEV.toFixed(2)}</small></td><td>${c.aperture}</td><td>ISO ${c.iso}</td><td>${c.tag || '—'}</td>
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
  const title = 'Settings tell part of the story.';
  const desc = 'EV100 describes your shutter, aperture and ISO combination. Actual exposure depends on scene brightness and your camera’s meter.';
  const envText = ev < 5
    ? 'Lower EV settings are often used in dim scenes. Check your light meter before shooting.'
    : ev < 12
      ? 'A mid-range EV setting. Use your light meter to match it to the scene.'
      : 'Higher EV settings are often used in bright scenes. Check your light meter before shooting.';

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
    warnings.push('△ ISO ' + iVal.toLocaleString('en-US') + ' — higher ISO may increase visible noise, depending on your camera and conditions.');
  } else if (iVal >= 3200) {
    warnings.push('△ ISO ' + iVal.toLocaleString('en-US') + ' — consider a wider aperture or slower shutter if you want to lower ISO.');
  }

  // ── Shutter speed guidance ──
  // 핵심: sVal은 초 단위 — 느린 셔터(긴 시간)일수록 값이 크다
  // 30초=30, 1/30초=0.033, 1/1000초=0.001
  // 버그 수정: >= 로 비교해야 "느린 셔터"를 잡을 수 있음
  if (sVal >= 1) {
    warnings.push('Shutter ' + SHUTTERS[idx.shutter].label + ' — a long exposure. Watch for camera shake and subject motion; use a tripod when needed.');
  } else if (sVal >= 1/30) {
    warnings.push('Shutter ' + SHUTTERS[idx.shutter].label + ' — a slow shutter can blur moving subjects. Stabilize your camera or use a tripod.');
  } else if (sVal >= 1/60) {
    warnings.push('Shutter ' + SHUTTERS[idx.shutter].label + ' — handheld shake is possible. Steady the camera or use image stabilization.');
  }
  // 1/125 이상 빠른 셔터: 경고 없음 (일반 핸드헬드 촬영에 안전)

  // ── Aperture diffraction guidance ──
  if (aVal >= 16) {
    warnings.push('Aperture ' + APERTURES[idx.aperture].label + ' — diffraction may reduce sharpness, depending on your lens and sensor.');
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
    if (tab) {
      tab.classList.toggle('active', k === key);
      tab.setAttribute('aria-pressed', String(k === key));
    }
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
  if (mIso)      mIso.textContent      = ISOS[idx.iso].toLocaleString('en-US');

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
  if (textEl) textEl.textContent = 'Settings EV100. Actual exposure depends on the scene.';
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

// Changing the reference EV intentionally changes desired brightness;
// changing a locked camera parameter instead holds the reference EV steady.
function onTargetEVChange() {
  activePreset = null;
  const slider = document.getElementById('sl-target-ev');
  const value = Number(slider.value);
  if (!Number.isFinite(value)) return;
  targetEV = Math.max(-5, Math.min(20, value));
  updateUI();
}

function onSliderChange(key) {
  activePreset = null;
  if (!locks[key]) return;
  idx[key] = parseInt(document.getElementById('sl-' + key).value, 10);
  updateUI();
}

function toggleLock(key) {
  locks = ExposureCore.transitionLocks(locks, key);
  updateUI();
}

function resetCalculator() {
  activePreset = null;
  locks = { shutter: true, aperture: true, iso: false };
  idx = { shutter: 12, aperture: 5, iso: 3 };
  targetEV = calcEV(SHUTTERS[idx.shutter].val, APERTURES[idx.aperture].val, ISOS[idx.iso]);
  updateUI();
}

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  activePreset = name;
  locks        = { shutter: true, aperture: true, iso: false };
  idx.shutter  = p.shutter;
  idx.aperture = p.aperture;
  idx.iso      = p.iso;
  targetEV = calcEV(SHUTTERS[idx.shutter].val, APERTURES[idx.aperture].val, ISOS[idx.iso]);
  updateUI();
}


// ── 9. EXIF 사진 정보 불러오기 ──

let exifPending = null;

let exifLoading = false;
let exifWaiting = [];

// One script request for concurrent imports; failed CDN loads are recoverable.
function loadExifLib(callback) {
  if (window.exifr) { callback(null); return; }
  exifWaiting.push(callback);
  if (exifLoading) return;
  exifLoading = true;
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/exifr/dist/lite.umd.js';
  const finish = (err) => {
    exifLoading = false;
    const callbacks = exifWaiting.splice(0);
    callbacks.forEach(fn => fn(err));
  };
  script.onload = () => finish(window.exifr ? null : new Error('The metadata reader is unavailable.'));
  script.onerror = () => finish(new Error('Could not load the metadata reader. Check your connection and choose the photo again.'));
  document.head.appendChild(script);
}

function formatShutter(val) {
  if (!val) return '—';
  if (val >= 1) return val + 's';
  return '1/' + Math.round(1 / val) + 's';
}

async function loadExif(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const filenameEl = document.getElementById('exif-filename');
  const resultEl   = document.getElementById('exif-result');
  const chipsEl    = document.getElementById('exif-chips');
  const msgEl      = document.getElementById('exif-msg');
  const applyBtn   = document.getElementById('exif-apply-btn');

  filenameEl.textContent = file.name;
  resultEl.style.display = 'block';
  chipsEl.innerHTML = '<span class="exif-loading">Reading photo metadata…</span>';
  msgEl.textContent = '';
  applyBtn.style.display = 'none';
  exifPending = null;

  loadExifLib(async function(loadError) {
    try {
      if (loadError) throw loadError;
      // 옵션 없이 전체 파싱 → 가장 호환성 높음
      const exif = await window.exifr.parse(file);

      const fnum = Number.isFinite(exif?.FNumber) && exif.FNumber > 0 ? exif.FNumber : null;
      const etime = Number.isFinite(exif?.ExposureTime) && exif.ExposureTime > 0 ? exif.ExposureTime : null;
      const iso = Number.isFinite(exif?.ISO) && exif.ISO > 0 ? exif.ISO : null;

      const hasExif = fnum != null || etime != null || iso != null;

      if (!hasExif) {
        chipsEl.innerHTML = '<span class="exif-error">No shutter, aperture or ISO metadata found.<br><small style="font-size:0.8rem;color:var(--text-dim);">Editing apps may remove metadata. Try an original camera JPEG.</small></span>';
        return;
      }

      // 슬라이더 인덱스 매핑
      let sIdx = null, aIdx = null, iIdx = null;
      if (etime != null) sIdx = ExposureCore.nearestIndex(SHUTTERS, etime);
      if (fnum != null) aIdx = ExposureCore.nearestIndex(APERTURES, fnum);
      if (iso != null) iIdx = ExposureCore.nearestIndex(ISOS, iso);

      // Never combine partial EXIF with stale values from an earlier setting.
      const complete = sIdx != null && aIdx != null && iIdx != null;
      exifPending = complete ? { sIdx, aIdx, iIdx } : null;

      chipsEl.innerHTML = `
        <div class="exif-chip"><span>Shutter</span>${sIdx != null ? SHUTTERS[sIdx].label : '—'}</div>
        <div class="exif-chip"><span>Aperture</span>${aIdx != null ? APERTURES[aIdx].label : '—'}</div>
        <div class="exif-chip"><span>ISO</span>${iIdx != null ? 'ISO ' + ISOS[iIdx].toLocaleString('en-US') : '—'}</div>
      `;

      const rawParts = [];
      if (etime != null) rawParts.push('Shutter ' + formatShutter(etime));
      if (fnum  != null) rawParts.push('f/' + fnum);
      if (iso   != null) rawParts.push('ISO ' + iso);
      msgEl.textContent = rawParts.length ? 'Original metadata: ' + rawParts.join('  ·  ') : '';

      applyBtn.style.display = complete ? 'inline-block' : 'none';
      if (!complete) msgEl.textContent += ' · Some settings are missing. All three are needed to apply a photo.';

    } catch (err) {
      console.error(err);
      // Error messages must not be interpolated into innerHTML.
      chipsEl.textContent = 'Could not read photo metadata. ' + (err.message || 'Try another photo.');
    }
  });
}

function applyExif() {
  if (!exifPending) return;
  activePreset = null;
  const { sIdx, aIdx, iIdx } = exifPending;
  locks = { shutter: true, aperture: true, iso: false };
  if (sIdx != null) idx.shutter  = sIdx;
  if (aIdx != null) idx.aperture = aIdx;
  if (iIdx != null) idx.iso      = iIdx;
  // Import establishes a new reference setting instead of using a stale target.
  targetEV = calcEV(SHUTTERS[idx.shutter].val, APERTURES[idx.aperture].val, ISOS[idx.iso]);
  updateUI();

  const btn = document.getElementById('exif-apply-btn');
  btn.textContent = 'Settings applied';
  btn.style.background = 'var(--accent)';
  btn.style.color = '#fff';
  setTimeout(() => {
    btn.textContent = 'Apply photo settings';
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
