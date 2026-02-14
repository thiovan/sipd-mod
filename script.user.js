// ==UserScript==
// @name         SIPD Mod by Thio
// @namespace    https://sipd.kemendagri.go.id/
// @version      2.1-260214
// @description  Modular custom features for SIPD Dashboard
// @author       Thio Van
// @match        https://sipd.kemendagri.go.id/penatausahaan/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=go.id
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // ╔══════════════════════════════════════════════════════════╗
  // ║                    CORE FRAMEWORK                       ║
  // ╚══════════════════════════════════════════════════════════╝

  const SIPD_MOD_ATTR = "data-sipd-mod";
  const OBSERVER_TIMEOUT = 15000; // 15s max wait

  /** @type {ModuleDefinition[]} */
  const modules = [];

  /** @type {Map<string, Element>} active mounted elements by module id */
  const mountedModules = new Map();

  /**
   * Register a module to the framework.
   *
   * @typedef {Object} ModuleDefinition
   * @property {string}   id              - Unique module identifier
   * @property {string}   name            - Human-readable display name
   * @property {string}   urlPattern      - Substring to match against current URL
   * @property {string}   targetSelector  - CSS selector for the injection anchor
   * @property {string}   [insertPosition='afterend'] - insertAdjacentElement position
   * @property {boolean}  [waitForReady=true]  - If true, wait for target element's
   *                                              transitions/animations to finish before mounting.
   *                                              If false, mount as soon as element exists in DOM.
   * @property {() => string}          render   - Returns HTML string to inject
   * @property {(el: Element) => void} [onMount]   - Called after injection
   * @property {() => void}            [onUnmount] - Called on cleanup
   *
   * @param {ModuleDefinition} moduleDef
   */
  function registerModule(moduleDef) {
    const defaults = {
      insertPosition: "afterend",
      waitForReady: true,
      mountDelay: 0,
    };
    modules.push({ ...defaults, ...moduleDef });
    console.log(`[SIPD Mod] Module registered: ${moduleDef.id}`);
  }

  // ── DOM Observer ──────────────────────────────────────────

  /**
   * Wait for an element to appear in the DOM using MutationObserver.
   * Watches for both new nodes AND attribute changes (style transitions).
   * Falls back to a polling interval + timeout to prevent infinite waiting.
   *
   * @param {string}   selector
   * @param {(el: Element) => void} callback
   * @param {number}   [timeout=OBSERVER_TIMEOUT]
   */
  function waitForElement(selector, callback, timeout = OBSERVER_TIMEOUT) {
    // Check if already present
    const existing = document.querySelector(selector);
    if (existing) {
      callback(existing);
      return;
    }

    let resolved = false;

    const resolve = () => {
      const el = document.querySelector(selector);
      if (el && !resolved) {
        resolved = true;
        observer.disconnect();
        clearInterval(pollId);
        callback(el);
      }
    };

    // MutationObserver — watches childList AND attributes (for style changes)
    const observer = new MutationObserver(resolve);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    // Polling fallback — catches edge cases MutationObserver might miss
    // (e.g. React batch updates, CSS transitions applied via requestAnimationFrame)
    const pollId = setInterval(resolve, 500);

    // Safety timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        clearInterval(pollId);
        console.warn(`[SIPD Mod] Timeout waiting for: ${selector}`);
      }
    }, timeout);
  }

  /**
   * Wait for an element's transitions/animations to complete.
   * Checks computed opacity and no active CSS transitions.
   *
   * @param {Element} el
   * @returns {Promise<Element>}
   */
  function waitForAnimationEnd(el) {
    return new Promise((resolve) => {
      const check = () => {
        const style = getComputedStyle(el);
        const opacity = parseFloat(style.opacity);
        const isTransitioning =
          style.transition && style.transition !== "none" && opacity < 1;

        if (opacity >= 1 && !isTransitioning) {
          resolve(el);
          return true;
        }
        return false;
      };

      // Already stable?
      if (check()) return;

      // Listen to transitionend
      const onEnd = () => {
        el.removeEventListener("transitionend", onEnd);
        clearInterval(fallback);
        resolve(el);
      };
      el.addEventListener("transitionend", onEnd);

      // Polling fallback — some CSS transitions don't fire transitionend reliably
      const fallback = setInterval(() => {
        if (check()) {
          el.removeEventListener("transitionend", onEnd);
          clearInterval(fallback);
        }
      }, 200);

      // Final safety: resolve after 5s regardless
      setTimeout(() => {
        el.removeEventListener("transitionend", onEnd);
        clearInterval(fallback);
        resolve(el);
      }, 5000);
    });
  }

  // ── Module Lifecycle ──────────────────────────────────────

  /**
   * Mount a single module: inject HTML and call onMount.
   * Includes guard against duplicate injection.
   * Respects waitForReady setting.
   *
   * @param {ModuleDefinition} mod
   */
  function mountModule(mod) {
    // Guard: already injected?
    if (document.querySelector(`[${SIPD_MOD_ATTR}="${mod.id}"]`)) {
      console.log(`[SIPD Mod] ${mod.id} already mounted, skipping.`);
      return;
    }

    waitForElement(mod.targetSelector, async (target) => {
      // Double-check guard after async wait
      if (document.querySelector(`[${SIPD_MOD_ATTR}="${mod.id}"]`)) return;

      // If waitForReady, wait for animations to complete
      if (mod.waitForReady) {
        console.log(
          `[SIPD Mod] ${mod.id} waiting for animation to complete...`,
        );
        await waitForAnimationEnd(target);
      }

      // Additional delay to let all page content render first
      if (mod.mountDelay > 0) {
        console.log(
          `[SIPD Mod] ${mod.id} delaying mount by ${mod.mountDelay}ms...`,
        );
        await new Promise((r) => setTimeout(r, mod.mountDelay));
      }

      // Triple-check guard after all waits
      if (document.querySelector(`[${SIPD_MOD_ATTR}="${mod.id}"]`)) return;

      const wrapper = document.createElement("div");
      wrapper.setAttribute(SIPD_MOD_ATTR, mod.id);
      wrapper.innerHTML = mod.render();

      target.insertAdjacentElement(mod.insertPosition, wrapper);
      mountedModules.set(mod.id, wrapper);

      if (typeof mod.onMount === "function") {
        mod.onMount(wrapper);
      }

      console.log(`[SIPD Mod] Mounted: ${mod.id}`);
    });
  }

  /**
   * Unmount a single module: remove from DOM and call onUnmount.
   *
   * @param {ModuleDefinition} mod
   */
  function unmountModule(mod) {
    const el =
      mountedModules.get(mod.id) ||
      document.querySelector(`[${SIPD_MOD_ATTR}="${mod.id}"]`);

    if (el) {
      if (typeof mod.onUnmount === "function") {
        mod.onUnmount();
      }
      el.remove();
      mountedModules.delete(mod.id);
      console.log(`[SIPD Mod] Unmounted: ${mod.id}`);
    }
  }

  /**
   * Evaluate all modules against the current URL.
   * Mount matching modules, unmount non-matching ones.
   */
  function evaluateModules() {
    const currentUrl = window.location.href;

    modules.forEach((mod) => {
      const shouldBeActive = currentUrl.includes(mod.urlPattern);

      if (shouldBeActive) {
        mountModule(mod);
      } else {
        unmountModule(mod);
      }
    });
  }

  // ── SPA Navigation Listener ───────────────────────────────

  // Primary: Navigation API (modern browsers)
  if (window.navigation) {
    window.navigation.addEventListener("navigatesuccess", () => {
      evaluateModules();
    });
  }

  // Fallback: popstate for older browsers
  window.addEventListener("popstate", () => {
    setTimeout(() => evaluateModules(), 300);
  });

  // Initial evaluation on page load
  // React SPA may not have rendered content yet, so we retry a few times
  function initialEvaluate() {
    const ready =
      document.readyState === "loading"
        ? new Promise((r) => document.addEventListener("DOMContentLoaded", r))
        : Promise.resolve();

    ready.then(() => {
      evaluateModules();
      // Retry at increasing intervals to catch late React renders
      [500, 1500, 3000, 5000].forEach((delay) => {
        setTimeout(() => evaluateModules(), delay);
      });
    });
  }
  initialEvaluate();

  // ╔══════════════════════════════════════════════════════════╗
  // ║                     MODULES SECTION                     ║
  // ║  Add new modules below using registerModule({...})      ║
  // ╚══════════════════════════════════════════════════════════╝

  // ===== MODULE: Realisasi — Filter Tambahan =====
  registerModule({
    id: "realisasi-filter",
    name: "Filter Tambahan",
    urlPattern: "/pengeluaran/laporan/realisasi",
    targetSelector: "div.container-fluid",
    insertPosition: "beforeend",
    waitForReady: true,
    mountDelay: 1000,

    render: () => `
<style>
  .my-chakra-select-wrapper {
    position: relative;
    width: 100%;
  }

  .my-chakra-select {
    width: 100%;
    outline: none;
    appearance: none;
    font-size: var(--chakra-fontSizes-md);
    padding-left: var(--chakra-space-4);
    padding-right: var(--chakra-space-8);
    height: var(--chakra-sizes-10);
    border-radius: var(--chakra-radii-md);
    border: 1px solid var(--chakra-colors-gray-200);
    background: var(--chakra-colors-white);
    color: var(--chakra-colors-gray-800);
  }

  .my-chakra-select:focus {
    border-color: var(--chakra-colors-blue-500);
    box-shadow: 0 0 0 1px var(--chakra-colors-blue-500);
  }

  .my-select-icon {
    position: absolute;
    top: 50%;
    right: var(--chakra-space-2);
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--chakra-colors-gray-400);
    font-size: 1.25rem;
    display: flex;
  }

  /* Chakra UI-style spinner */
  @keyframes sipd-spinner {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .sipd-spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-bottom-color: transparent;
    border-radius: 50%;
    animation: sipd-spinner 0.45s linear infinite;
    margin-right: 0.5rem;
    vertical-align: middle;
  }
  .btn[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
</style>
<div class="card rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 custom-class mt-5">
  <div class="card-header">
    <div>
      <h1 class="card-title custom-class">Filter Tambahan</h1>
      <h1 class="card-subtitle custom-class">SIPD Mod by Thio Van</h1>
    </div>
  </div>
  <div class="card-body p-6">
    <div class="grid grid-cols-12 mb-5 gap-5">

      <div class="col-span-6">
        <label class="block form-label">Bulan Awal</label>
        <div class="relative">
          <span id="react-select-4-live-region" class="sr-only"></span>
          <span aria-live="polite" aria-atomic="false" aria-relevant="additions text" role="log" class="sr-only"></span>
          <div class="my-chakra-select-wrapper">
            <select name="bulanAwal" class="my-chakra-select">
              <option value="" disabled selected>Pilih bulan disini ...</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
            <div class="my-select-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-6">
        <label class="block form-label">Bulan Akhir</label>
        <div class="relative">
          <span id="react-select-4-live-region" class="sr-only"></span>
          <span aria-live="polite" aria-atomic="false" aria-relevant="additions text" role="log" class="sr-only"></span>
          <div class="my-chakra-select-wrapper">
            <select name="bulanAkhir" class="my-chakra-select">
              <option value="" disabled selected>Pilih bulan disini ...</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
            <div class="my-select-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-4">
        <button name="view" type="button" class="btn undefined btn inline-flex justify-center items-center bg-success-500 text-white">
          <span class="btn-label">Lihat</span>
        </button>
        <button name="download" type="button" class="btn undefined btn inline-flex justify-center items-center bg-primary-500 text-white">
          <span class="btn-label">Download</span>
        </button>
      </div>
    </div>
  </div>
</div>
    `,

    onMount: (el) => {
      const viewBtn = el.querySelector("button[name='view']");
      const downloadBtn = el.querySelector("button[name='download']");

      // Chakra UI-style loading state helper
      const setLoading = (btn, loading) => {
        const label = btn.querySelector(".btn-label");
        if (loading) {
          btn.disabled = true;
          btn._originalText = label.textContent;
          label.innerHTML =
            '<span class="sipd-spinner"></span> Mohon Tunggu ...';
        } else {
          btn.disabled = false;
          label.textContent = btn._originalText || label.textContent;
        }
      };

      // Shared formatters
      const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
          return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        } catch {
          return dateStr;
        }
      };

      const formatRupiah = (val) => (Number(val) || 0).toLocaleString("id-ID");

      if (viewBtn) {
        viewBtn.addEventListener("click", () => {
          console.log("[SIPD Mod] Realisasi view clicked");

          const bulanAwal = parseInt(
            el.querySelector("select[name='bulanAwal']").value,
          );
          const bulanAkhir = parseInt(
            el.querySelector("select[name='bulanAkhir']").value,
          );
          const token = document.cookie.match(/X-SIPD-PU-TK=([^;]+)/)?.[1];

          setLoading(viewBtn, true);

          // Throttled fetch — max 2 concurrent requests to avoid HTTP 520
          const MAX_CONCURRENT = 2;
          const throttleAll = (fns, limit) => {
            const results = [];
            let idx = 0;
            const run = () => {
              if (idx >= fns.length) return Promise.resolve();
              const i = idx++;
              return fns[i]().then((r) => {
                results[i] = r;
                return run();
              });
            };
            const workers = Array.from(
              { length: Math.min(limit, fns.length) },
              () => run(),
            );
            return Promise.all(workers).then(() => results);
          };

          const fetchTasks = [];
          for (let i = bulanAwal; i <= bulanAkhir; i++) {
            fetchTasks.push(() =>
              fetch(
                `https://service.sipd.kemendagri.go.id/pengeluaran/strict/laporan/realisasi/cetak?tipe=dokumen&skpd=498&bulan=${i}`,
                {
                  credentials: "include",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              ).then((res) => res.json()),
            );
          }

          const td = (text, cls = "") =>
            `<td class="p-2 border border-slate-300 dark:border-slate-700 ${cls}">${text}</td>`;

          throttleAll(fetchTasks, MAX_CONCURRENT)
            .then((results) => {
              console.log("[SIPD Mod] View success:", results);

              const tableContainer = document.createElement("div");
              tableContainer.className =
                "mt-5 overflow-x-auto table-result-container";

              // Flatten all results into a single array
              const allData = [];
              results.forEach((res) => {
                const items = Array.isArray(res) ? res : res.data || [];
                items.forEach((item) => allData.push(item));
              });

              // Store for download reuse
              el._lastFetchedData = allData;

              let tableRows = "";
              let rowNum = 0;
              let totals = { realisasi: 0, setoran: 0, spd: 0, sp2d: 0 };

              allData.forEach((item) => {
                rowNum++;
                totals.realisasi += Number(item.nilai_realisasi) || 0;
                totals.setoran += Number(item.nilai_setoran) || 0;
                totals.spd += Number(item.nilai_spd_detail) || 0;
                totals.sp2d += Number(item.nilai_sp2d) || 0;

                tableRows += `
                  <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                    ${td(rowNum, "text-center")}
                    ${td(item.kode_skpd || "-", "whitespace-nowrap")}
                    ${td(item.nama_skpd || "-")}
                    ${td(item.kode_sub_skpd || "-", "whitespace-nowrap")}
                    ${td(item.nama_sub_skpd || "-")}
                    ${td(item.kode_fungsi || "-", "text-center")}
                    ${td(item.nama_fungsi || "-")}
                    ${td(item.kode_sub_fungsi || "-", "text-center")}
                    ${td(item.nama_sub_fungsi || "-")}
                    ${td(item.kode_urusan || "-", "text-center")}
                    ${td(item.nama_urusan || "-")}
                    ${td(item.kode_bidang_urusan || "-", "text-center")}
                    ${td(item.nama_bidang_urusan || "-")}
                    ${td(item.kode_program || "-", "whitespace-nowrap")}
                    ${td(item.nama_program || "-")}
                    ${td(item.kode_giat || "-", "whitespace-nowrap")}
                    ${td(item.nama_giat || "-")}
                    ${td(item.kode_sub_giat || "-", "whitespace-nowrap")}
                    ${td(item.nama_sub_giat || "-")}
                    ${td(item.kode_rekening || "-", "whitespace-nowrap")}
                    ${td(item.nama_rekening || "-")}
                    ${td(item.nomor_dokumen || "-", "whitespace-nowrap")}
                    ${td(item.jenis_dokumen || "-", "text-center")}
                    ${td(item.jenis_transaksi || "-", "text-center")}
                    ${td(item.nomor_dpt || "-")}
                    ${td(formatDate(item.tanggal_dokumen), "text-center whitespace-nowrap")}
                    ${td(item.keterangan_dokumen || "-")}
                    ${td(formatRupiah(item.nilai_realisasi), "text-right whitespace-nowrap")}
                    ${td(formatRupiah(item.nilai_setoran), "text-right whitespace-nowrap")}
                    ${td(item.nip_pegawai || "-", "whitespace-nowrap")}
                    ${td(item.nama_pegawai || "-")}
                    ${td(formatDate(item.tanggal_simpan), "text-center whitespace-nowrap")}
                    ${td(item.nomor_spd || "-", "whitespace-nowrap")}
                    ${td(item.periode_spd || "-", "text-center")}
                    ${td(formatRupiah(item.nilai_spd_detail), "text-right whitespace-nowrap")}
                    ${td(item.tahap_spd || "-")}
                    ${td(item.nama_sub_tahap_jadwal || "-")}
                    ${td(item.status_tahap_apbd || "-", "text-center")}
                    ${td(item.nomor_spp || "-", "whitespace-nowrap")}
                    ${td(formatDate(item.tanggal_spp), "text-center whitespace-nowrap")}
                    ${td(item.nomor_spm || "-", "whitespace-nowrap")}
                    ${td(formatDate(item.tanggal_spm), "text-center whitespace-nowrap")}
                    ${td(item.nomor_sp2d || "-", "whitespace-nowrap")}
                    ${td(formatDate(item.tanggal_sp2d), "text-center whitespace-nowrap")}
                    ${td(formatDate(item.tanggal_sp2d_transfer), "text-center whitespace-nowrap")}
                    ${td(formatRupiah(item.nilai_sp2d), "text-right whitespace-nowrap")}
                  </tr>`;
              });

              const COLS = 46;
              const th = (text, cls = "") =>
                `<th class="p-2 border border-slate-300 dark:border-slate-700 ${cls}">${text}</th>`;

              tableContainer.innerHTML = `
                <p class="mb-2 text-sm text-slate-500 dark:text-slate-400">Total ${rowNum} dokumen</p>
                <table class="w-full text-sm text-left border-collapse border border-slate-300 dark:border-slate-700">
                  <thead class="bg-slate-100 dark:bg-slate-900 font-bold">
                    <tr>
                      ${th("No", "text-center")}
                      ${th("Kode SKPD")}
                      ${th("Nama SKPD")}
                      ${th("Kode Sub SKPD")}
                      ${th("Nama Sub SKPD")}
                      ${th("Kode Fungsi", "text-center")}
                      ${th("Nama Fungsi")}
                      ${th("Kode Sub Fungsi", "text-center")}
                      ${th("Nama Sub Fungsi")}
                      ${th("Kode Urusan", "text-center")}
                      ${th("Nama Urusan")}
                      ${th("Kode Bid. Urusan", "text-center")}
                      ${th("Nama Bidang Urusan")}
                      ${th("Kode Program")}
                      ${th("Nama Program")}
                      ${th("Kode Kegiatan")}
                      ${th("Nama Kegiatan")}
                      ${th("Kode Sub Kegiatan")}
                      ${th("Nama Sub Kegiatan")}
                      ${th("Kode Rekening")}
                      ${th("Nama Rekening")}
                      ${th("Nomor Dokumen")}
                      ${th("Jenis Dok", "text-center")}
                      ${th("Transaksi", "text-center")}
                      ${th("Nomor DPT")}
                      ${th("Tgl Dokumen", "text-center")}
                      ${th("Keterangan")}
                      ${th("Nilai Realisasi", "text-right")}
                      ${th("Nilai Setoran", "text-right")}
                      ${th("NIP Pegawai")}
                      ${th("Nama Pegawai")}
                      ${th("Tgl Simpan", "text-center")}
                      ${th("Nomor SPD")}
                      ${th("Periode SPD", "text-center")}
                      ${th("Nilai SPD", "text-right")}
                      ${th("Tahapan SPD")}
                      ${th("Sub Tahapan")}
                      ${th("Tahapan APBD", "text-center")}
                      ${th("Nomor SPP")}
                      ${th("Tgl SPP", "text-center")}
                      ${th("Nomor SPM")}
                      ${th("Tgl SPM", "text-center")}
                      ${th("Nomor SP2D")}
                      ${th("Tgl SP2D", "text-center")}
                      ${th("Tgl Transfer", "text-center")}
                      ${th("Nilai SP2D", "text-right")}
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows || `<tr><td colspan="${COLS}" class="p-4 text-center">Tidak ada data</td></tr>`}
                  </tbody>
                  ${
                    rowNum > 0
                      ? `<tfoot class="bg-slate-100 dark:bg-slate-900 font-bold">
                    <tr>
                      <td colspan="27" class="p-2 border border-slate-300 dark:border-slate-700 text-right">Total</td>
                      ${td(formatRupiah(totals.realisasi), "text-right whitespace-nowrap")}
                      ${td(formatRupiah(totals.setoran), "text-right whitespace-nowrap")}
                      <td colspan="4" class="p-2 border border-slate-300 dark:border-slate-700"></td>
                      <td class="p-2 border border-slate-300 dark:border-slate-700"></td>
                      <td class="p-2 border border-slate-300 dark:border-slate-700"></td>
                      ${td(formatRupiah(totals.spd), "text-right whitespace-nowrap")}
                      <td colspan="8" class="p-2 border border-slate-300 dark:border-slate-700"></td>
                      <td class="p-2 border border-slate-300 dark:border-slate-700"></td>
                      ${td(formatRupiah(totals.sp2d), "text-right whitespace-nowrap")}
                    </tr>
                  </tfoot>`
                      : ""
                  }
                </table>`;

              const existing = el.querySelector(".table-result-container");
              if (existing) {
                existing.remove();
              }
              el.querySelector(".card-body").appendChild(tableContainer);
            })
            .catch((err) => console.error("[SIPD Mod] View failed:", err))
            .finally(() => setLoading(viewBtn, false));
        });
      }

      if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
          console.log("[SIPD Mod] Realisasi download clicked");

          const bulanAwal = parseInt(
            el.querySelector("select[name='bulanAwal']").value,
          );
          const bulanAkhir = parseInt(
            el.querySelector("select[name='bulanAkhir']").value,
          );
          const token = document.cookie.match(/X-SIPD-PU-TK=([^;]+)/)?.[1];

          setLoading(downloadBtn, true);

          // Reuse cached data if available, otherwise fetch
          const dataPromise = el._lastFetchedData
            ? Promise.resolve(el._lastFetchedData)
            : (() => {
                const MAX_CONCURRENT = 2;
                const throttleAll = (fns, limit) => {
                  const results = [];
                  let idx = 0;
                  const run = () => {
                    if (idx >= fns.length) return Promise.resolve();
                    const i = idx++;
                    return fns[i]().then((r) => {
                      results[i] = r;
                      return run();
                    });
                  };
                  const workers = Array.from(
                    { length: Math.min(limit, fns.length) },
                    () => run(),
                  );
                  return Promise.all(workers).then(() => results);
                };
                const tasks = [];
                for (let i = bulanAwal; i <= bulanAkhir; i++) {
                  tasks.push(() =>
                    fetch(
                      `https://service.sipd.kemendagri.go.id/pengeluaran/strict/laporan/realisasi/cetak?tipe=dokumen&skpd=498&bulan=${i}`,
                      {
                        credentials: "include",
                        headers: { Authorization: `Bearer ${token}` },
                      },
                    ).then((r) => r.json()),
                  );
                }
                return throttleAll(tasks, MAX_CONCURRENT).then((results) => {
                  const all = [];
                  results.forEach((res) => {
                    (Array.isArray(res) ? res : res.data || []).forEach(
                      (item) => all.push(item),
                    );
                  });
                  return all;
                });
              })();

          dataPromise
            .then((data) => {
              // Build Excel workbook matching SIPD dashboard format
              const wb = XLSX.utils.book_new();

              // Cell styles
              const sHeader = {
                font: { bold: true },
                alignment: {
                  horizontal: "center",
                  vertical: "center",
                  wrapText: true,
                },
                border: {
                  top: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                  right: { style: "thin" },
                },
                fill: { fgColor: { rgb: "D9E1F2" } },
              };
              const sTitle = {
                font: { bold: true, sz: 14 },
                alignment: { horizontal: "center" },
              };
              const sCenter = {
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                  top: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                  right: { style: "thin" },
                },
              };
              const sLeft = {
                alignment: { vertical: "center", wrapText: true },
                border: {
                  top: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                  right: { style: "thin" },
                },
              };
              const sMoney = {
                alignment: { horizontal: "right", vertical: "center" },
                border: {
                  top: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                  right: { style: "thin" },
                },
                numFmt: '"Rp."#,##0',
              };

              const headers = [
                "Nomor",
                "Kode SKPD",
                "Nama SKPD",
                "Kode Sub SKPD",
                "Nama Sub SKPD",
                "Kode Fungsi",
                "Nama Fungsi",
                "Kode Sub Fungsi",
                "Nama Sub Fungsi",
                "Kode Urusan",
                "Nama Urusan",
                "Kode Bidang Urusan",
                "Nama Bidang Urusan",
                "Kode Program",
                "Nama Program",
                "Kode Kegiatan",
                "Nama Kegiatan",
                "Kode Sub Kegiatan",
                "Nama Sub Kegiatan",
                "Kode Rekening",
                "Nama Rekening",
                "Nomor Dokumen",
                "Jenis Dokumen",
                "Jenis Transaksi",
                "Nomor DPT",
                "Tanggal Dokumen",
                "Keterangan Dokumen",
                "Nilai Realisasi",
                "Nilai Setoran",
                "NIP Pegawai",
                "Nama Pegawai",
                "Tanggal Simpan",
                "Nomor SPD",
                "Periode SPD",
                "Nilai SPD",
                "Tahapan SPD",
                "Nama Sub Tahapan Jadwal",
                "Tahapan APBD",
                "Nomor SPP",
                "Tanggal SPP",
                "Nomor SPM",
                "Tanggal SPM",
                "Nomor SP2D",
                "Tanggal SP2D",
                "Tanggal Transfer",
                "Nilai SP2D",
              ];

              const hRow = headers.map((v) => ({ v, t: "s", s: sHeader }));

              // Title rows
              const aoa = [
                [{ v: "LAPORAN REALISASI PER DOKUMEN", t: "s", s: sTitle }],
                [{ v: "", t: "s", s: sTitle }],
                [{ v: "", t: "s", s: sTitle }],
                [],
                hRow,
              ];

              // Data rows
              let r = 1;
              const totals = { realisasi: 0, setoran: 0, spd: 0, sp2d: 0 };
              data.forEach((s) => {
                totals.realisasi += Number(s.nilai_realisasi) || 0;
                totals.setoran += Number(s.nilai_setoran) || 0;
                totals.spd += Number(s.nilai_spd_detail) || 0;
                totals.sp2d += Number(s.nilai_sp2d) || 0;

                aoa.push([
                  { v: String(r), t: "s", s: sCenter },
                  { v: String(s.kode_skpd || ""), t: "s", s: sLeft },
                  { v: String(s.nama_skpd || ""), t: "s", s: sLeft },
                  { v: String(s.kode_sub_skpd || ""), t: "s", s: sLeft },
                  { v: String(s.nama_sub_skpd || ""), t: "s", s: sLeft },
                  { v: String(s.kode_fungsi || ""), t: "s", s: sCenter },
                  { v: String(s.nama_fungsi || ""), t: "s", s: sCenter },
                  { v: String(s.kode_sub_fungsi || ""), t: "s", s: sCenter },
                  { v: String(s.nama_sub_fungsi || ""), t: "s", s: sLeft },
                  { v: String(s.kode_urusan || ""), t: "s", s: sCenter },
                  { v: String(s.nama_urusan || ""), t: "s", s: sLeft },
                  { v: String(s.kode_bidang_urusan || ""), t: "s", s: sCenter },
                  { v: String(s.nama_bidang_urusan || ""), t: "s", s: sLeft },
                  { v: String(s.kode_program || ""), t: "s", s: sCenter },
                  { v: String(s.nama_program || ""), t: "s", s: sLeft },
                  { v: String(s.kode_giat || ""), t: "s", s: sCenter },
                  { v: String(s.nama_giat || ""), t: "s", s: sLeft },
                  { v: String(s.kode_sub_giat || ""), t: "s", s: sCenter },
                  { v: String(s.nama_sub_giat || ""), t: "s", s: sLeft },
                  { v: String(s.kode_rekening || ""), t: "s", s: sCenter },
                  { v: String(s.nama_rekening || ""), t: "s", s: sLeft },
                  { v: String(s.nomor_dokumen || ""), t: "s", s: sLeft },
                  { v: String(s.jenis_dokumen || ""), t: "s", s: sCenter },
                  { v: String(s.jenis_transaksi || ""), t: "s", s: sCenter },
                  { v: String(s.nomor_dpt || ""), t: "s", s: sLeft },
                  {
                    v: String(formatDate(s.tanggal_dokumen)),
                    t: "s",
                    s: sCenter,
                  },
                  { v: String(s.keterangan_dokumen || ""), t: "s", s: sLeft },
                  {
                    v: Number(s.nilai_realisasi) || 0,
                    t: "n",
                    z: '"Rp."#,##0',
                    s: sMoney,
                  },
                  {
                    v: Number(s.nilai_setoran) || 0,
                    t: "n",
                    z: '"Rp."#,##0',
                    s: sMoney,
                  },
                  { v: String(s.nip_pegawai || ""), t: "s", s: sLeft },
                  { v: String(s.nama_pegawai || ""), t: "s", s: sLeft },
                  {
                    v: String(formatDate(s.tanggal_simpan)),
                    t: "s",
                    s: sCenter,
                  },
                  { v: String(s.nomor_spd || ""), t: "s", s: sLeft },
                  { v: String(s.periode_spd || ""), t: "s", s: sCenter },
                  {
                    v: Number(s.nilai_spd_detail) || 0,
                    t: "n",
                    z: '"Rp."#,##0',
                    s: sMoney,
                  },
                  { v: String(s.tahap_spd || ""), t: "s", s: sLeft },
                  {
                    v: String(s.nama_sub_tahap_jadwal || ""),
                    t: "s",
                    s: sLeft,
                  },
                  { v: String(s.status_tahap_apbd || ""), t: "s", s: sCenter },
                  { v: String(s.nomor_spp || ""), t: "s", s: sLeft },
                  { v: String(formatDate(s.tanggal_spp)), t: "s", s: sCenter },
                  { v: String(s.nomor_spm || ""), t: "s", s: sLeft },
                  { v: String(formatDate(s.tanggal_spm)), t: "s", s: sCenter },
                  { v: String(s.nomor_sp2d || ""), t: "s", s: sLeft },
                  { v: String(formatDate(s.tanggal_sp2d)), t: "s", s: sCenter },
                  {
                    v: String(formatDate(s.tanggal_sp2d_transfer)),
                    t: "s",
                    s: sCenter,
                  },
                  {
                    v: Number(s.nilai_sp2d) || 0,
                    t: "n",
                    z: '"Rp."#,##0',
                    s: sMoney,
                  },
                ]);
                r++;
              });

              // Totals row
              const totalRow = headers.map((_, idx) => {
                if (idx === 0) return { v: "Total", t: "s", s: sHeader };
                if (idx === 27)
                  return {
                    v: totals.realisasi,
                    t: "n",
                    z: '"Rp."#,##0',
                    s: { ...sMoney, font: { bold: true } },
                  };
                if (idx === 28)
                  return {
                    v: totals.setoran,
                    t: "n",
                    z: '"Rp."#,##0',
                    s: { ...sMoney, font: { bold: true } },
                  };
                if (idx === 34)
                  return {
                    v: totals.spd,
                    t: "n",
                    z: '"Rp."#,##0',
                    s: { ...sMoney, font: { bold: true } },
                  };
                if (idx === 45)
                  return {
                    v: totals.sp2d,
                    t: "n",
                    z: '"Rp."#,##0',
                    s: { ...sMoney, font: { bold: true } },
                  };
                return { v: "", t: "s", s: sHeader };
              });
              aoa.push(totalRow);

              const ws = XLSX.utils.aoa_to_sheet(aoa);

              // Column widths matching dashboard
              ws["!cols"] = [
                { wch: 6 },
                { wch: 20 },
                { wch: 40 },
                { wch: 20 },
                { wch: 33 },
                { wch: 12 },
                { wch: 24 },
                { wch: 15 },
                { wch: 70 },
                { wch: 14 },
                { wch: 32 },
                { wch: 18 },
                { wch: 42 },
                { wch: 16 },
                { wch: 28 },
                { wch: 16 },
                { wch: 28 },
                { wch: 18 },
                { wch: 30 },
                { wch: 18 },
                { wch: 30 },
                { wch: 22 },
                { wch: 16 },
                { wch: 18 },
                { wch: 18 },
                { wch: 16 },
                { wch: 32 },
                { wch: 18 },
                { wch: 18 },
                { wch: 18 },
                { wch: 26 },
                { wch: 16 },
                { wch: 20 },
                { wch: 14 },
                { wch: 18 },
                { wch: 12 },
                { wch: 22 },
                { wch: 14 },
                { wch: 20 },
                { wch: 14 },
                { wch: 20 },
                { wch: 14 },
                { wch: 20 },
                { wch: 14 },
                { wch: 14 },
                { wch: 18 },
              ];

              // Merged title rows
              const numCols = headers.length;
              ws["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } },
              ];

              XLSX.utils.book_append_sheet(wb, ws, "Data Realisasi Dokumen");
              XLSX.writeFile(wb, "Laporan Realisasi Per Dokumen.xlsx");
              console.log("[SIPD Mod] Excel downloaded successfully");
            })
            .catch((err) => console.error("[SIPD Mod] Download failed:", err))
            .finally(() => setLoading(downloadBtn, false));
        });
      }
    },
  });

  // ===== ADD MORE MODULES BELOW =====
  // registerModule({
  //   id: 'my-new-feature',
  //   name: 'Feature Name',
  //   urlPattern: '/some/path',
  //   targetSelector: '.some-container',
  //   waitForReady: false,  // Mount immediately, don't wait for animations
  //   render: () => `<div>Content</div>`,
  //   onMount: (el) => { /* event handlers */ },
  // });
})();
