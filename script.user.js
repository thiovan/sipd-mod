// ==UserScript==
// @name         SIPD Mod by Thio Van
// @namespace    https://sipd.kemendagri.go.id/
// @version      3.0-260214
// @description  Modular custom features for SIPD Dashboard
// @author       Thio Van
// @match        https://sipd.kemendagri.go.id/penatausahaan/*
// @icon         https://sipd.kemendagri.go.id/penatausahaan/assets/progresive-web-app/favicon-32x32.png
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// @updateURL    https://raw.githubusercontent.com/thiovan/sipd-mod/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/thiovan/sipd-mod/main/script.user.js
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // ╔══════════════════════════════════════════════════════════╗
  // ║                 CONSTANTS & CONFIG                      ║
  // ╚══════════════════════════════════════════════════════════╝

  const SIPD_MOD_ATTR = "data-sipd-mod";
  const OBSERVER_TIMEOUT = 15000;
  const MAX_CONCURRENT = 2;
  const API_BASE =
    "https://service.sipd.kemendagri.go.id/pengeluaran/strict/laporan/realisasi/cetak";

  const BULAN = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  /**
   * Column definitions — single source of truth for table + Excel.
   * @type {Array<{key: string, label: string, thLabel?: string, align: string, format?: string, totalKey?: string}>}
   */
  const COLUMNS = [
    { key: "_rowNum", label: "Nomor", thLabel: "No", align: "center" },
    { key: "kode_skpd", label: "Kode SKPD", align: "left" },
    { key: "nama_skpd", label: "Nama SKPD", align: "left" },
    { key: "kode_sub_skpd", label: "Kode Sub SKPD", align: "left" },
    { key: "nama_sub_skpd", label: "Nama Sub SKPD", align: "left" },
    { key: "kode_fungsi", label: "Kode Fungsi", align: "center" },
    { key: "nama_fungsi", label: "Nama Fungsi", align: "center" },
    { key: "kode_sub_fungsi", label: "Kode Sub Fungsi", align: "center" },
    { key: "nama_sub_fungsi", label: "Nama Sub Fungsi", align: "left" },
    { key: "kode_urusan", label: "Kode Urusan", align: "center" },
    { key: "nama_urusan", label: "Nama Urusan", align: "left" },
    {
      key: "kode_bidang_urusan",
      label: "Kode Bidang Urusan",
      thLabel: "Kode Bid. Urusan",
      align: "center",
    },
    { key: "nama_bidang_urusan", label: "Nama Bidang Urusan", align: "left" },
    { key: "kode_program", label: "Kode Program", align: "center" },
    { key: "nama_program", label: "Nama Program", align: "left" },
    { key: "kode_giat", label: "Kode Kegiatan", align: "center" },
    { key: "nama_giat", label: "Nama Kegiatan", align: "left" },
    { key: "kode_sub_giat", label: "Kode Sub Kegiatan", align: "center" },
    { key: "nama_sub_giat", label: "Nama Sub Kegiatan", align: "left" },
    { key: "kode_rekening", label: "Kode Rekening", align: "center" },
    { key: "nama_rekening", label: "Nama Rekening", align: "left" },
    { key: "nomor_dokumen", label: "Nomor Dokumen", align: "left" },
    {
      key: "jenis_dokumen",
      label: "Jenis Dokumen",
      thLabel: "Jenis Dok",
      align: "center",
    },
    {
      key: "jenis_transaksi",
      label: "Jenis Transaksi",
      thLabel: "Transaksi",
      align: "center",
    },
    { key: "nomor_dpt", label: "Nomor DPT", align: "left" },
    {
      key: "tanggal_dokumen",
      label: "Tanggal Dokumen",
      thLabel: "Tgl Dokumen",
      align: "center",
      format: "date",
    },
    {
      key: "keterangan_dokumen",
      label: "Keterangan Dokumen",
      thLabel: "Keterangan",
      align: "left",
    },
    {
      key: "nilai_realisasi",
      label: "Nilai Realisasi",
      align: "right",
      format: "rupiah",
      totalKey: "realisasi",
    },
    {
      key: "nilai_setoran",
      label: "Nilai Setoran",
      align: "right",
      format: "rupiah",
      totalKey: "setoran",
    },
    { key: "nip_pegawai", label: "NIP Pegawai", align: "left" },
    { key: "nama_pegawai", label: "Nama Pegawai", align: "left" },
    {
      key: "tanggal_simpan",
      label: "Tanggal Simpan",
      thLabel: "Tgl Simpan",
      align: "center",
      format: "date",
    },
    { key: "nomor_spd", label: "Nomor SPD", align: "left" },
    { key: "periode_spd", label: "Periode SPD", align: "center" },
    {
      key: "nilai_spd_detail",
      label: "Nilai SPD",
      align: "right",
      format: "rupiah",
      totalKey: "spd",
    },
    { key: "tahap_spd", label: "Tahapan SPD", align: "left" },
    {
      key: "nama_sub_tahap_jadwal",
      label: "Nama Sub Tahapan Jadwal",
      thLabel: "Sub Tahapan",
      align: "left",
    },
    { key: "status_tahap_apbd", label: "Tahapan APBD", align: "center" },
    { key: "nomor_spp", label: "Nomor SPP", align: "left" },
    {
      key: "tanggal_spp",
      label: "Tanggal SPP",
      thLabel: "Tgl SPP",
      align: "center",
      format: "date",
    },
    { key: "nomor_spm", label: "Nomor SPM", align: "left" },
    {
      key: "tanggal_spm",
      label: "Tanggal SPM",
      thLabel: "Tgl SPM",
      align: "center",
      format: "date",
    },
    { key: "nomor_sp2d", label: "Nomor SP2D", align: "left" },
    {
      key: "tanggal_sp2d",
      label: "Tanggal SP2D",
      thLabel: "Tgl SP2D",
      align: "center",
      format: "date",
    },
    {
      key: "tanggal_sp2d_transfer",
      label: "Tanggal Transfer",
      thLabel: "Tgl Transfer",
      align: "center",
      format: "date",
    },
    {
      key: "nilai_sp2d",
      label: "Nilai SP2D",
      align: "right",
      format: "rupiah",
      totalKey: "sp2d",
    },
  ];

  const COL_WIDTHS = [
    6, 20, 40, 20, 33, 12, 24, 15, 70, 14, 32, 18, 42, 16, 28, 16, 28, 18, 30,
    18, 30, 22, 16, 18, 18, 16, 32, 18, 18, 18, 26, 16, 20, 14, 18, 12, 22, 14,
    20, 14, 20, 14, 20, 14, 14, 18,
  ];

  // ╔══════════════════════════════════════════════════════════╗
  // ║                  UTILITY FUNCTIONS                      ║
  // ╚══════════════════════════════════════════════════════════╝

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

  const getAuthToken = () => document.cookie.match(/X-SIPD-PU-TK=([^;]+)/)?.[1];

  const getMonthRange = (el) => ({
    start: parseInt(el.querySelector("select[name='bulanAwal']").value),
    end: parseInt(el.querySelector("select[name='bulanAkhir']").value),
  });

  /**
   * Run async functions with a concurrency limit.
   * @param {Array<() => Promise>} fns - Lazy promise factories
   * @param {number} limit - Max concurrent
   * @returns {Promise<Array>}
   */
  function throttleAll(fns, limit) {
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
    const workers = Array.from({ length: Math.min(limit, fns.length) }, () =>
      run(),
    );
    return Promise.all(workers).then(() => results);
  }

  /**
   * Fetch realisasi data for a month range, throttled.
   * Returns a flat array of all items.
   */
  function fetchRealisasi(startMonth, endMonth, token) {
    const tasks = [];
    for (let i = startMonth; i <= endMonth; i++) {
      tasks.push(() =>
        fetch(`${API_BASE}?tipe=dokumen&skpd=498&bulan=${i}`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      );
    }
    return throttleAll(tasks, MAX_CONCURRENT).then((results) => {
      const all = [];
      results.forEach((res) => {
        (Array.isArray(res) ? res : res.data || []).forEach((item) =>
          all.push(item),
        );
      });
      return all;
    });
  }

  /** Get cell value for a column definition */
  function getCellValue(item, col, rowNum) {
    if (col.key === "_rowNum") return rowNum;
    const raw = item[col.key];
    if (col.format === "date") return formatDate(raw);
    if (col.format === "rupiah") return formatRupiah(raw);
    return raw || "-";
  }

  /** Compute totals from data array */
  function computeTotals(data) {
    const t = { realisasi: 0, setoran: 0, spd: 0, sp2d: 0 };
    data.forEach((item) => {
      COLUMNS.forEach((col) => {
        if (col.totalKey) t[col.totalKey] += Number(item[col.key]) || 0;
      });
    });
    return t;
  }

  // ── HTML Table Generators ──────────────────────────────────

  const tdCell = (text, cls = "") =>
    `<td class="p-2 border border-slate-300 dark:border-slate-700 ${cls}">${text}</td>`;
  const thCell = (text, cls = "") =>
    `<th class="p-2 border border-slate-300 dark:border-slate-700 ${cls}">${text}</th>`;

  function renderTableHeaders() {
    return COLUMNS.map((col) =>
      thCell(
        col.thLabel || col.label,
        col.align === "center"
          ? "text-center"
          : col.align === "right"
            ? "text-right"
            : "",
      ),
    ).join("\n");
  }

  function renderTableRow(item, rowNum) {
    const cells = COLUMNS.map((col) => {
      const val = getCellValue(item, col, rowNum);
      let cls = "";
      if (col.align === "center") cls = "text-center";
      else if (col.align === "right") cls = "text-right";
      if (
        col.format === "date" ||
        col.key.startsWith("kode_") ||
        col.key.startsWith("nomor_") ||
        col.key.startsWith("nip_")
      )
        cls += " whitespace-nowrap";
      return tdCell(val, cls.trim());
    }).join("\n");

    return `<tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">${cells}</tr>`;
  }

  function renderTableFooter(totals) {
    const totalColIdx = {};
    COLUMNS.forEach((col, i) => {
      if (col.totalKey) totalColIdx[col.totalKey] = i;
    });

    // First total column determines the colspan for "Total" label
    const firstTotalIdx = Math.min(...Object.values(totalColIdx));
    const cells = COLUMNS.map((col, i) => {
      if (i === 0)
        return `<td colspan="${firstTotalIdx}" class="p-2 border border-slate-300 dark:border-slate-700 text-right font-bold">Total</td>`;
      if (i > 0 && i < firstTotalIdx) return ""; // covered by colspan
      if (col.totalKey)
        return tdCell(
          formatRupiah(totals[col.totalKey]),
          "text-right whitespace-nowrap font-bold",
        );
      return `<td class="p-2 border border-slate-300 dark:border-slate-700"></td>`;
    }).join("\n");

    return `<tfoot class="bg-slate-100 dark:bg-slate-900 font-bold"><tr>${cells}</tr></tfoot>`;
  }

  // ── Excel Generators ───────────────────────────────────────

  function buildExcelWorkbook(data) {
    const wb = XLSX.utils.book_new();

    // Compact styles
    const border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    const S = {
      header: {
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border,
        fill: { fgColor: { rgb: "D9E1F2" } },
      },
      title: {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center" },
      },
      center: {
        alignment: { horizontal: "center", vertical: "center" },
        border,
      },
      left: { alignment: { vertical: "center", wrapText: true }, border },
      money: {
        alignment: { horizontal: "right", vertical: "center" },
        border,
        numFmt: '"Rp."#,##0',
      },
    };

    const headers = COLUMNS.map((c) => c.label);
    const hRow = headers.map((v) => ({ v, t: "s", s: S.header }));

    const aoa = [
      [{ v: "LAPORAN REALISASI PER DOKUMEN", t: "s", s: S.title }],
      [{ v: "", t: "s", s: S.title }],
      [{ v: "", t: "s", s: S.title }],
      [],
      hRow,
    ];

    const totals = { realisasi: 0, setoran: 0, spd: 0, sp2d: 0 };
    let r = 1;

    data.forEach((item) => {
      COLUMNS.forEach((col) => {
        if (col.totalKey) totals[col.totalKey] += Number(item[col.key]) || 0;
      });

      const row = COLUMNS.map((col) => {
        if (col.key === "_rowNum") return { v: String(r), t: "s", s: S.center };
        if (col.format === "rupiah")
          return {
            v: Number(item[col.key]) || 0,
            t: "n",
            z: '"Rp."#,##0',
            s: S.money,
          };
        if (col.format === "date")
          return { v: String(formatDate(item[col.key])), t: "s", s: S.center };
        const style = col.align === "center" ? S.center : S.left;
        return { v: String(item[col.key] || ""), t: "s", s: style };
      });

      aoa.push(row);
      r++;
    });

    // Totals row
    const totalRow = COLUMNS.map((col, idx) => {
      if (idx === 0) return { v: "Total", t: "s", s: S.header };
      if (col.totalKey)
        return {
          v: totals[col.totalKey],
          t: "n",
          z: '"Rp."#,##0',
          s: { ...S.money, font: { bold: true } },
        };
      return { v: "", t: "s", s: S.header };
    });
    aoa.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = COL_WIDTHS.map((wch) => ({ wch }));
    ws["!merges"] = [0, 1, 2].map((r) => ({
      s: { r, c: 0 },
      e: { r, c: headers.length - 1 },
    }));

    XLSX.utils.book_append_sheet(wb, ws, "Data Realisasi Dokumen");
    return wb;
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║                    CORE FRAMEWORK                       ║
  // ╚══════════════════════════════════════════════════════════╝

  /** @type {ModuleDefinition[]} */
  const modules = [];
  const mountedModules = new Map();

  function registerModule(moduleDef) {
    const defaults = {
      insertPosition: "afterend",
      waitForReady: true,
      mountDelay: 0,
    };
    modules.push({ ...defaults, ...moduleDef });
    console.log(`[SIPD Mod] Module registered: ${moduleDef.id}`);
  }

  function waitForElement(selector, callback, timeout = OBSERVER_TIMEOUT) {
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

    const observer = new MutationObserver(resolve);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    const pollId = setInterval(resolve, 500);
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        clearInterval(pollId);
        console.warn(`[SIPD Mod] Timeout waiting for: ${selector}`);
      }
    }, timeout);
  }

  function waitForAnimationEnd(el) {
    return new Promise((resolve) => {
      const check = () => {
        const s = getComputedStyle(el);
        const opacity = parseFloat(s.opacity);
        if (
          opacity >= 1 &&
          !(s.transition && s.transition !== "none" && opacity < 1)
        ) {
          resolve(el);
          return true;
        }
        return false;
      };
      if (check()) return;

      const onEnd = () => {
        el.removeEventListener("transitionend", onEnd);
        clearInterval(fb);
        resolve(el);
      };
      el.addEventListener("transitionend", onEnd);
      const fb = setInterval(() => {
        if (check()) {
          el.removeEventListener("transitionend", onEnd);
          clearInterval(fb);
        }
      }, 200);
      setTimeout(() => {
        el.removeEventListener("transitionend", onEnd);
        clearInterval(fb);
        resolve(el);
      }, 5000);
    });
  }

  function mountModule(mod) {
    if (document.querySelector(`[${SIPD_MOD_ATTR}="${mod.id}"]`)) return;

    waitForElement(mod.targetSelector, async (target) => {
      if (document.querySelector(`[${SIPD_MOD_ATTR}="${mod.id}"]`)) return;
      if (mod.waitForReady) await waitForAnimationEnd(target);
      if (mod.mountDelay > 0)
        await new Promise((r) => setTimeout(r, mod.mountDelay));
      if (document.querySelector(`[${SIPD_MOD_ATTR}="${mod.id}"]`)) return;

      const wrapper = document.createElement("div");
      wrapper.setAttribute(SIPD_MOD_ATTR, mod.id);
      wrapper.innerHTML = mod.render();
      target.insertAdjacentElement(mod.insertPosition, wrapper);
      mountedModules.set(mod.id, wrapper);
      if (typeof mod.onMount === "function") mod.onMount(wrapper);
      console.log(`[SIPD Mod] Mounted: ${mod.id}`);
    });
  }

  function unmountModule(mod) {
    const el =
      mountedModules.get(mod.id) ||
      document.querySelector(`[${SIPD_MOD_ATTR}="${mod.id}"]`);
    if (el) {
      if (typeof mod.onUnmount === "function") mod.onUnmount();
      el.remove();
      mountedModules.delete(mod.id);
      console.log(`[SIPD Mod] Unmounted: ${mod.id}`);
    }
  }

  function evaluateModules() {
    const url = window.location.href;
    modules.forEach((mod) =>
      url.includes(mod.urlPattern) ? mountModule(mod) : unmountModule(mod),
    );
  }

  // ── SPA Navigation ────────────────────────────────────────

  if (window.navigation)
    window.navigation.addEventListener("navigatesuccess", evaluateModules);
  window.addEventListener("popstate", () => setTimeout(evaluateModules, 300));

  (function initialEvaluate() {
    const ready =
      document.readyState === "loading"
        ? new Promise((r) => document.addEventListener("DOMContentLoaded", r))
        : Promise.resolve();
    ready.then(() => {
      evaluateModules();
      [500, 1500, 3000, 5000].forEach((d) => setTimeout(evaluateModules, d));
    });
  })();

  // ╔══════════════════════════════════════════════════════════╗
  // ║                     MODULES                             ║
  // ╚══════════════════════════════════════════════════════════╝

  // ── Shared HTML fragments ─────────────────────────────────

  const monthOptions = BULAN.map(
    (b, i) => `<option value="${i + 1}">${b}</option>`,
  ).join("");

  const monthSelect = (name, label) => `
    <div class="col-span-6">
      <label class="block form-label">${label}</label>
      <div class="relative">
        <div class="my-chakra-select-wrapper">
          <select name="${name}" class="my-chakra-select">
            <option value="" disabled selected>Pilih bulan disini ...</option>
            ${monthOptions}
          </select>
          <div class="my-select-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
              <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>`;

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
  .my-chakra-select-wrapper { position: relative; width: 100%; }
  .my-chakra-select {
    width: 100%; outline: none; appearance: none;
    font-size: var(--chakra-fontSizes-md);
    padding-left: var(--chakra-space-4); padding-right: var(--chakra-space-8);
    height: var(--chakra-sizes-10); border-radius: var(--chakra-radii-md);
    border: 1px solid var(--chakra-colors-gray-200);
    background: var(--chakra-colors-white); color: var(--chakra-colors-gray-800);
  }
  .my-chakra-select:focus { border-color: var(--chakra-colors-blue-500); box-shadow: 0 0 0 1px var(--chakra-colors-blue-500); }
  .my-select-icon { position: absolute; top: 50%; right: var(--chakra-space-2); transform: translateY(-50%); pointer-events: none; color: var(--chakra-colors-gray-400); font-size: 1.25rem; display: flex; }
  @keyframes sipd-spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .sipd-spinner { display: inline-block; width: 1em; height: 1em; border: 2px solid currentColor; border-bottom-color: transparent; border-radius: 50%; animation: sipd-spinner 0.45s linear infinite; margin-right: 0.5rem; vertical-align: middle; }
  .btn[disabled] { opacity: 0.6; cursor: not-allowed; pointer-events: none; }
</style>
<div class="card rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 custom-class mt-5">
  <div class="card-header">
    <div>
      <h1 class="card-title custom-class">Fitur Tambahan</h1>
      <h1 class="card-subtitle custom-class text-danger">SIPD Mod by Thio Van</h1>
    </div>
  </div>
  <div class="card-body p-6">
    <h5 class="font-bold mb-2">Filter Periode Bulan</h5>
    <div class="grid grid-cols-12 mb-5 gap-5">
      ${monthSelect("bulanAwal", "Bulan Awal")}
      ${monthSelect("bulanAkhir", "Bulan Akhir")}
      <div class="col-span-12 flex items-end justify-between">
        <div class="flex gap-2">
          <button name="view" type="button" class="btn undefined btn inline-flex justify-center items-center bg-success-500 text-white">
            <span class="btn-label">Lihat</span>
          </button>
          <button name="download" type="button" class="btn undefined btn inline-flex justify-center items-center bg-primary-500 text-white">
            <span class="btn-label">Download</span>
          </button>
        </div>
        <button name="clear" type="button" class="btn undefined btn inline-flex justify-center items-center bg-danger-500 text-white">
          <span class="btn-label">Bersihkan</span>
        </button>
      </div>
    </div>
  </div>
</div>

<div class="card rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 custom-class mt-5">
  <div class="card-header">
    <div>
      <h1 class="card-title custom-class">Fitur Tambahan</h1>
      <h1 class="card-subtitle custom-class text-danger">SIPD Mod by Thio Van</h1>
    </div>
  </div>
  <div class="card-body p-6">
    <h5 class="font-bold mb-2">Filter Per Sub Kegiatan</h5>
    <div class="grid grid-cols-12 mb-5 gap-5">
      <div class="col-span-12" id="subkeg-load-area">
        <button name="load" type="button" class="w-full btn undefined btn inline-flex justify-center items-center bg-primary-500 text-white">
          <span class="btn-label">Ambil Data</span>
        </button>
      </div>
      <div class="col-span-12 hidden" id="subkeg-filter-area">
        <div class="grid grid-cols-12 gap-5">
          <div class="col-span-6">
            <label class="block form-label">Sub SKPD</label>
            <div class="my-chakra-select-wrapper">
              <select name="subSkpd" class="my-chakra-select">
                <option value="" disabled selected>Pilih Sub SKPD ...</option>
              </select>
              <div class="my-select-icon"><svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg></div>
            </div>
          </div>
          <div class="col-span-6">
            <label class="block form-label">Sub Kegiatan</label>
            <div class="my-chakra-select-wrapper">
              <select name="subKeg" class="my-chakra-select">
                <option value="" disabled selected>Pilih Sub Kegiatan ...</option>
              </select>
              <div class="my-select-icon"><svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg></div>
            </div>
          </div>
          <div class="col-span-12 flex items-end justify-between">
            <div class="flex gap-2">
              <button name="subkegView" type="button" class="btn undefined btn inline-flex justify-center items-center bg-success-500 text-white">
                <span class="btn-label">Lihat</span>
              </button>
              <button name="subkegDownload" type="button" class="btn undefined btn inline-flex justify-center items-center bg-primary-500 text-white">
                <span class="btn-label">Download</span>
              </button>
            </div>
            <button name="subkegClear" type="button" class="btn undefined btn inline-flex justify-center items-center bg-danger-500 text-white">
              <span class="btn-label">Bersihkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,

    onMount: (el) => {
      const viewBtn = el.querySelector("button[name='view']");
      const downloadBtn = el.querySelector("button[name='download']");

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

      // ── View Handler ──
      if (viewBtn) {
        viewBtn.addEventListener("click", () => {
          const { start, end } = getMonthRange(el);
          const token = getAuthToken();
          setLoading(viewBtn, true);

          fetchRealisasi(start, end, token)
            .then((data) => {
              el._lastFetchedData = data;

              const totals = computeTotals(data);
              let rows = "";
              data.forEach((item, i) => {
                rows += renderTableRow(item, i + 1);
              });

              const container = document.createElement("div");
              container.className =
                "mt-5 overflow-x-auto table-result-container";
              container.innerHTML = `
                <p class="mb-2 text-sm text-slate-500 dark:text-slate-400">Total ${data.length} dokumen</p>
                <table class="w-full text-sm text-left border-collapse border border-slate-300 dark:border-slate-700">
                  <thead class="bg-slate-100 dark:bg-slate-900 font-bold"><tr>${renderTableHeaders()}</tr></thead>
                  <tbody>${rows || `<tr><td colspan="${COLUMNS.length}" class="p-4 text-center">Tidak ada data</td></tr>`}</tbody>
                  ${data.length > 0 ? renderTableFooter(totals) : ""}
                </table>`;

              const existing = el.querySelector(".table-result-container");
              if (existing) existing.remove();
              el.querySelector(".card-body").appendChild(container);
            })
            .catch((err) => console.error("[SIPD Mod] View failed:", err))
            .finally(() => setLoading(viewBtn, false));
        });
      }

      // ── Download Handler ──
      if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
          const { start, end } = getMonthRange(el);
          const token = getAuthToken();
          setLoading(downloadBtn, true);

          const dataPromise = el._lastFetchedData
            ? Promise.resolve(el._lastFetchedData)
            : fetchRealisasi(start, end, token);

          dataPromise
            .then((data) => {
              const wb = buildExcelWorkbook(data);
              XLSX.writeFile(wb, "Laporan Realisasi Per Dokumen.xlsx");
              console.log("[SIPD Mod] Excel downloaded successfully");
            })
            .catch((err) => console.error("[SIPD Mod] Download failed:", err))
            .finally(() => setLoading(downloadBtn, false));
        });
      }

      // ── Clear Handler ──
      const clearBtn = el.querySelector("button[name='clear']");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          const table = el.querySelector(".table-result-container");
          if (table) table.remove();
          el._lastFetchedData = null;
          console.log("[SIPD Mod] Table cleared");
        });
      }

      // ╔══════════════════════════════════════════════════════╗
      // ║       SUB KEGIATAN FILTER HANDLERS                  ║
      // ╚══════════════════════════════════════════════════════╝

      const loadBtn = el.querySelector("button[name='load']");
      const loadArea = el.querySelector("#subkeg-load-area");
      const filterArea = el.querySelector("#subkeg-filter-area");
      const subSkpdSelect = el.querySelector("select[name='subSkpd']");
      const subKegSelect = el.querySelector("select[name='subKeg']");
      const subkegViewBtn = el.querySelector("button[name='subkegView']");
      const subkegDownloadBtn = el.querySelector(
        "button[name='subkegDownload']",
      );
      const subkegClearBtn = el.querySelector("button[name='subkegClear']");

      // Stored fetched data for sub kegiatan section
      let subkegData = null;

      /** Populate a select with unique values */
      const populateSelect = (
        select,
        items,
        valueKey,
        textKey,
        placeholder,
      ) => {
        const seen = new Map();
        items.forEach((item) => {
          const v = item[valueKey];
          if (v && !seen.has(v)) seen.set(v, item[textKey] || v);
        });
        select.innerHTML =
          `<option value="" disabled selected>${placeholder}</option>` +
          [...seen.entries()]
            .sort((a, b) => a[1].localeCompare(b[1], "id"))
            .map(([val, txt]) => `<option value="${val}">${txt}</option>`)
            .join("");
      };

      /** Update sub kegiatan dropdown based on selected sub SKPD */
      const updateSubKegOptions = () => {
        if (!subkegData) return;
        const selectedSkpd = subSkpdSelect.value;
        const filtered = selectedSkpd
          ? subkegData.filter((d) => d.kode_sub_skpd === selectedSkpd)
          : subkegData;
        populateSelect(
          subKegSelect,
          filtered,
          "kode_sub_giat",
          "nama_sub_giat",
          "Pilih Sub Kegiatan ...",
        );
      };

      /** Group+sum data by Nama Rekening for the selected sub kegiatan */
      const getGroupedData = () => {
        if (!subkegData) return [];
        const skpd = subSkpdSelect.value;
        const keg = subKegSelect.value;
        const filtered = subkegData.filter(
          (d) =>
            (!skpd || d.kode_sub_skpd === skpd) &&
            (!keg || d.kode_sub_giat === keg),
        );

        // Group by kode_rekening, sum nilai_realisasi
        const groups = new Map();
        filtered.forEach((d) => {
          const key = d.kode_rekening || "-";
          if (!groups.has(key)) {
            groups.set(key, {
              nama_sub_skpd: d.nama_sub_skpd || "-",
              nama_sub_giat: d.nama_sub_giat || "-",
              kode_rekening: key,
              nama_rekening: d.nama_rekening || "-",
              nilai_realisasi: 0,
            });
          }
          groups.get(key).nilai_realisasi += Number(d.nilai_realisasi) || 0;
        });
        return [...groups.values()].sort((a, b) =>
          a.kode_rekening.localeCompare(b.kode_rekening),
        );
      };

      // ── Load Handler ──
      if (loadBtn) {
        loadBtn.addEventListener("click", () => {
          const token = getAuthToken();
          const currentMonth = new Date().getMonth() + 1;
          setLoading(loadBtn, true);

          fetchRealisasi(1, currentMonth, token)
            .then((data) => {
              subkegData = data;
              console.log(
                `[SIPD Mod] Sub Kegiatan: loaded ${data.length} records`,
              );

              // Populate Sub SKPD dropdown
              populateSelect(
                subSkpdSelect,
                data,
                "kode_sub_skpd",
                "nama_sub_skpd",
                "Pilih Sub SKPD ...",
              );
              updateSubKegOptions();

              // Show filters, hide load button
              loadArea.classList.add("hidden");
              filterArea.classList.remove("hidden");
            })
            .catch((err) => console.error("[SIPD Mod] Load failed:", err))
            .finally(() => setLoading(loadBtn, false));
        });
      }

      // Sub SKPD change → update sub kegiatan options
      if (subSkpdSelect)
        subSkpdSelect.addEventListener("change", updateSubKegOptions);

      // ── Sub Kegiatan View Handler ──
      if (subkegViewBtn) {
        subkegViewBtn.addEventListener("click", () => {
          const grouped = getGroupedData();
          const SUBCOLS = [
            { label: "No", align: "text-center" },
            { label: "Nama Sub SKPD", align: "" },
            { label: "Nama Sub Kegiatan", align: "" },
            { label: "Kode Rekening", align: "" },
            { label: "Nama Rekening", align: "" },
            { label: "Nilai Realisasi", align: "text-right" },
          ];

          const thead = SUBCOLS.map((c) => thCell(c.label, c.align)).join("");
          let totalRealisasi = 0;
          const rows = grouped
            .map((g, i) => {
              totalRealisasi += g.nilai_realisasi;
              return `<tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
              ${tdCell(i + 1, "text-center")}
              ${tdCell(g.nama_sub_skpd)}
              ${tdCell(g.nama_sub_giat)}
              ${tdCell(g.kode_rekening, "whitespace-nowrap")}
              ${tdCell(g.nama_rekening)}
              ${tdCell(formatRupiah(g.nilai_realisasi), "text-right whitespace-nowrap")}
            </tr>`;
            })
            .join("");

          const container = document.createElement("div");
          container.className = "mt-5 overflow-x-auto subkeg-table-container";
          container.innerHTML = `
            <p class="mb-2 text-sm text-slate-500 dark:text-slate-400">Total ${grouped.length} rekening</p>
            <table class="w-full text-sm text-left border-collapse border border-slate-300 dark:border-slate-700">
              <thead class="bg-slate-100 dark:bg-slate-900 font-bold"><tr>${thead}</tr></thead>
              <tbody>${rows || `<tr><td colspan="6" class="p-4 text-center">Tidak ada data</td></tr>`}</tbody>
              ${
                grouped.length > 0
                  ? `<tfoot class="bg-slate-100 dark:bg-slate-900 font-bold"><tr>
                <td colspan="5" class="p-2 border border-slate-300 dark:border-slate-700 text-right">Total</td>
                ${tdCell(formatRupiah(totalRealisasi), "text-right whitespace-nowrap")}
              </tr></tfoot>`
                  : ""
              }
            </table>`;

          const existing = el.querySelector(".subkeg-table-container");
          if (existing) existing.remove();
          filterArea.closest(".card-body").appendChild(container);
        });
      }

      // ── Sub Kegiatan Download Handler ──
      if (subkegDownloadBtn) {
        subkegDownloadBtn.addEventListener("click", () => {
          const grouped = getGroupedData();
          if (!grouped.length) return;

          const wb = XLSX.utils.book_new();
          const border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
          const sH = {
            font: { bold: true },
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true,
            },
            border,
            fill: { fgColor: { rgb: "D9E1F2" } },
          };
          const sT = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: "center" },
          };
          const sL = {
            alignment: { vertical: "center", wrapText: true },
            border,
          };
          const sC = {
            alignment: { horizontal: "center", vertical: "center" },
            border,
          };
          const sM = {
            alignment: { horizontal: "right", vertical: "center" },
            border,
            numFmt: '"Rp."#,##0',
          };

          const headers = [
            "No",
            "Nama Sub SKPD",
            "Nama Sub Kegiatan",
            "Kode Rekening",
            "Nama Rekening",
            "Nilai Realisasi",
          ];
          const aoa = [
            [{ v: "REALISASI PER SUB KEGIATAN", t: "s", s: sT }],
            [],
            headers.map((h) => ({ v: h, t: "s", s: sH })),
          ];

          let total = 0;
          grouped.forEach((g, i) => {
            total += g.nilai_realisasi;
            aoa.push([
              { v: String(i + 1), t: "s", s: sC },
              { v: g.nama_sub_skpd, t: "s", s: sL },
              { v: g.nama_sub_giat, t: "s", s: sL },
              { v: g.kode_rekening, t: "s", s: sC },
              { v: g.nama_rekening, t: "s", s: sL },
              { v: g.nilai_realisasi, t: "n", z: '"Rp."#,##0', s: sM },
            ]);
          });

          aoa.push([
            { v: "Total", t: "s", s: sH },
            { v: "", t: "s", s: sH },
            { v: "", t: "s", s: sH },
            { v: "", t: "s", s: sH },
            { v: "", t: "s", s: sH },
            {
              v: total,
              t: "n",
              z: '"Rp."#,##0',
              s: { ...sM, font: { bold: true } },
            },
          ]);

          const ws = XLSX.utils.aoa_to_sheet(aoa);
          ws["!cols"] = [
            { wch: 6 },
            { wch: 35 },
            { wch: 40 },
            { wch: 20 },
            { wch: 40 },
            { wch: 22 },
          ];
          ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

          XLSX.utils.book_append_sheet(wb, ws, "Realisasi Per Sub Kegiatan");
          XLSX.writeFile(wb, "Realisasi Per Sub Kegiatan.xlsx");
          console.log("[SIPD Mod] Sub Kegiatan Excel downloaded");
        });
      }

      // ── Sub Kegiatan Clear Handler ──
      if (subkegClearBtn) {
        subkegClearBtn.addEventListener("click", () => {
          const table = el.querySelector(".subkeg-table-container");
          if (table) table.remove();
          // Keep subkegData cached — don't fetch again
          console.log("[SIPD Mod] Sub Kegiatan table cleared");
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
  //   waitForReady: false,
  //   render: () => `<div>Content</div>`,
  //   onMount: (el) => { /* event handlers */ },
  // });
})();
