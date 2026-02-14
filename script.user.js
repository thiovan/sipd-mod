// ==UserScript==
// @name         SIPD Mod by Thio Van
// @namespace    https://sipd.kemendagri.go.id/
// @version      3.1-260214
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

  // Column definitions for 46-col realisasi table (single source of truth)
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

  // Shared Excel cell styles
  const XL_BORDER = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };
  const XL = {
    header: {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: XL_BORDER,
      fill: { fgColor: { rgb: "D9E1F2" } },
    },
    title: {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center" },
    },
    center: {
      alignment: { horizontal: "center", vertical: "center" },
      border: XL_BORDER,
    },
    left: {
      alignment: { vertical: "center", wrapText: true },
      border: XL_BORDER,
    },
    money: {
      alignment: { horizontal: "right", vertical: "center" },
      border: XL_BORDER,
      numFmt: '"Rp."#,##0',
    },
  };

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
    return Promise.all(
      Array.from({ length: Math.min(limit, fns.length) }, () => run()),
    ).then(() => results);
  }

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

  function getCellValue(item, col, rowNum) {
    if (col.key === "_rowNum") return rowNum;
    const raw = item[col.key];
    if (col.format === "date") return formatDate(raw);
    if (col.format === "rupiah") return formatRupiah(raw);
    return raw || "-";
  }

  function computeTotals(data) {
    const t = { realisasi: 0, setoran: 0, spd: 0, sp2d: 0 };
    data.forEach((item) => {
      COLUMNS.forEach((col) => {
        if (col.totalKey) t[col.totalKey] += Number(item[col.key]) || 0;
      });
    });
    return t;
  }

  /** Populate a <select> with unique sorted values from data */
  function populateSelect(select, items, valueKey, textKey, placeholder) {
    const seen = new Map();
    items.forEach((item) => {
      const v = item[valueKey];
      if (v && !seen.has(v)) seen.set(v, item[textKey] || v);
    });
    select.innerHTML =
      `<option value="" disabled selected>${placeholder}</option>` +
      [...seen.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "id"))
        .map(([v, t]) => `<option value="${v}">${t}</option>`)
        .join("");
  }

  /** Chakra-style loading state for buttons */
  function setLoading(btn, loading) {
    const label = btn.querySelector(".btn-label");
    if (loading) {
      btn.disabled = true;
      btn._origText = label.textContent;
      label.innerHTML = '<span class="sipd-spinner"></span> Mohon Tunggu ...';
    } else {
      btn.disabled = false;
      label.textContent = btn._origText || label.textContent;
    }
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║                  HTML GENERATORS                        ║
  // ╚══════════════════════════════════════════════════════════╝

  const CELL_CLS = "p-2 border border-slate-300 dark:border-slate-700";
  const tdCell = (text, cls = "") =>
    `<td class="${CELL_CLS} ${cls}">${text}</td>`;
  const thCell = (text, cls = "") =>
    `<th class="${CELL_CLS} ${cls}">${text}</th>`;
  const alignCls = (a) =>
    a === "center" ? "text-center" : a === "right" ? "text-right" : "";

  const selectWrapper = (name, label, optionsHtml = "") => `
    <div class="col-span-6">
      <label class="block form-label">${label}</label>
      <div class="my-chakra-select-wrapper">
        <select name="${name}" class="my-chakra-select">${optionsHtml}</select>
        <div class="my-select-icon"><svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg></div>
      </div>
    </div>`;

  const monthOptions = BULAN.map(
    (b, i) => `<option value="${i + 1}">${b}</option>`,
  ).join("");
  const monthSelect = (name, label) =>
    selectWrapper(
      name,
      label,
      `<option value="" disabled selected>Pilih bulan disini ...</option>${monthOptions}`,
    );

  const btnHtml = (name, label, color) =>
    `<button name="${name}" type="button" class="btn undefined btn inline-flex justify-center items-center bg-${color}-500 text-white"><span class="btn-label">${label}</span></button>`;

  const actionButtons = (viewName, downloadName, clearName) => `
    <div class="col-span-12 flex items-end justify-between">
      <div class="flex gap-2">${btnHtml(viewName, "Lihat", "success")}${btnHtml(downloadName, "Download", "primary")}</div>
      ${btnHtml(clearName, "Bersihkan", "danger")}
    </div>`;

  const cardWrapper = (sectionTitle, content) => `
<div class="card rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 custom-class mt-5">
  <div class="card-header"><div>
    <h1 class="card-title custom-class">Fitur Tambahan</h1>
    <h1 class="card-subtitle custom-class text-danger">SIPD Mod by Thio Van</h1>
  </div></div>
  <div class="card-body p-6">
    <h5 class="font-bold mb-2">${sectionTitle}</h5>
    <div class="grid grid-cols-12 mb-5 gap-5">${content}</div>
  </div>
</div>`;

  // ── COLUMNS-driven table rendering ────────────────────────

  function renderTableHeaders() {
    return COLUMNS.map((c) =>
      thCell(c.thLabel || c.label, alignCls(c.align)),
    ).join("");
  }

  function renderTableRow(item, rowNum) {
    const cells = COLUMNS.map((col) => {
      let cls = alignCls(col.align);
      if (
        col.format === "date" ||
        col.key.startsWith("kode_") ||
        col.key.startsWith("nomor_") ||
        col.key.startsWith("nip_")
      )
        cls += " whitespace-nowrap";
      return tdCell(getCellValue(item, col, rowNum), cls.trim());
    }).join("");
    return `<tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">${cells}</tr>`;
  }

  function renderTableFooter(totals) {
    const totalColIdx = {};
    COLUMNS.forEach((col, i) => {
      if (col.totalKey) totalColIdx[col.totalKey] = i;
    });
    const first = Math.min(...Object.values(totalColIdx));
    const cells = COLUMNS.map((col, i) => {
      if (i === 0)
        return `<td colspan="${first}" class="${CELL_CLS} text-right font-bold">Total</td>`;
      if (i > 0 && i < first) return "";
      if (col.totalKey)
        return tdCell(
          formatRupiah(totals[col.totalKey]),
          "text-right whitespace-nowrap font-bold",
        );
      return `<td class="${CELL_CLS}"></td>`;
    }).join("");
    return `<tfoot class="bg-slate-100 dark:bg-slate-900 font-bold"><tr>${cells}</tr></tfoot>`;
  }

  /** Generic simple table renderer (for sub kegiatan etc.) */
  function renderSimpleTable({ colDefs, data, containerClass, countLabel }) {
    const thead = colDefs
      .map((c) => thCell(c.label, alignCls(c.align || "left")))
      .join("");
    let total = 0;
    const rows = data
      .map((item, i) => {
        const cells = colDefs
          .map((c) => {
            if (c.key === "_rowNum") return tdCell(i + 1, "text-center");
            const val =
              c.format === "rupiah"
                ? formatRupiah(item[c.key])
                : item[c.key] || "-";
            if (c.totalKey) total += Number(item[c.key]) || 0;
            return tdCell(
              val,
              `${alignCls(c.align || "left")}${c.format === "rupiah" ? " whitespace-nowrap" : ""}`,
            );
          })
          .join("");
        return `<tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">${cells}</tr>`;
      })
      .join("");

    const hasTotals = colDefs.some((c) => c.totalKey);
    const tfoot =
      hasTotals && data.length > 0
        ? `<tfoot class="bg-slate-100 dark:bg-slate-900 font-bold"><tr>
          <td colspan="${colDefs.length - 1}" class="${CELL_CLS} text-right">Total</td>
          ${tdCell(formatRupiah(total), "text-right whitespace-nowrap")}
        </tr></tfoot>`
        : "";

    return `<div class="mt-5 overflow-x-auto ${containerClass}">
      <p class="mb-2 text-sm text-slate-500 dark:text-slate-400">Total ${data.length} ${countLabel}</p>
      <table class="w-full text-sm text-left border-collapse border border-slate-300 dark:border-slate-700">
        <thead class="bg-slate-100 dark:bg-slate-900 font-bold"><tr>${thead}</tr></thead>
        <tbody>${rows || `<tr><td colspan="${colDefs.length}" class="p-4 text-center">Tidak ada data</td></tr>`}</tbody>
        ${tfoot}
      </table>
    </div>`;
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║                  EXCEL GENERATORS                       ║
  // ╚══════════════════════════════════════════════════════════╝

  /** Build 46-col realisasi workbook (COLUMNS-driven) */
  function buildExcelWorkbook(data) {
    const wb = XLSX.utils.book_new();
    const headers = COLUMNS.map((c) => c.label);
    const hRow = headers.map((v) => ({ v, t: "s", s: XL.header }));
    const aoa = [
      [{ v: "LAPORAN REALISASI PER DOKUMEN", t: "s", s: XL.title }],
      [{ v: "", t: "s", s: XL.title }],
      [{ v: "", t: "s", s: XL.title }],
      [],
      hRow,
    ];

    const totals = { realisasi: 0, setoran: 0, spd: 0, sp2d: 0 };
    let r = 1;
    data.forEach((item) => {
      COLUMNS.forEach((col) => {
        if (col.totalKey) totals[col.totalKey] += Number(item[col.key]) || 0;
      });
      aoa.push(
        COLUMNS.map((col) => {
          if (col.key === "_rowNum")
            return { v: String(r), t: "s", s: XL.center };
          if (col.format === "rupiah")
            return {
              v: Number(item[col.key]) || 0,
              t: "n",
              z: '"Rp."#,##0',
              s: XL.money,
            };
          if (col.format === "date")
            return {
              v: String(formatDate(item[col.key])),
              t: "s",
              s: XL.center,
            };
          return {
            v: String(item[col.key] || ""),
            t: "s",
            s: col.align === "center" ? XL.center : XL.left,
          };
        }),
      );
      r++;
    });

    aoa.push(
      COLUMNS.map((col, i) => {
        if (i === 0) return { v: "Total", t: "s", s: XL.header };
        if (col.totalKey)
          return {
            v: totals[col.totalKey],
            t: "n",
            z: '"Rp."#,##0',
            s: { ...XL.money, font: { bold: true } },
          };
        return { v: "", t: "s", s: XL.header };
      }),
    );

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = COL_WIDTHS.map((wch) => ({ wch }));
    ws["!merges"] = [0, 1, 2].map((r) => ({
      s: { r, c: 0 },
      e: { r, c: headers.length - 1 },
    }));
    XLSX.utils.book_append_sheet(wb, ws, "Data Realisasi Dokumen");
    return wb;
  }

  /** Generic simple Excel builder (for sub kegiatan etc.) */
  function buildSimpleExcel({ title, colDefs, data, sheetName, filename }) {
    const wb = XLSX.utils.book_new();
    const headers = colDefs.map((c) => c.label);
    const aoa = [
      [{ v: title, t: "s", s: XL.title }],
      [],
      headers.map((h) => ({ v: h, t: "s", s: XL.header })),
    ];

    let total = 0;
    data.forEach((item, i) => {
      aoa.push(
        colDefs.map((c) => {
          if (c.key === "_rowNum")
            return { v: String(i + 1), t: "s", s: XL.center };
          if (c.format === "rupiah") {
            if (c.totalKey) total += Number(item[c.key]) || 0;
            return {
              v: Number(item[c.key]) || 0,
              t: "n",
              z: '"Rp."#,##0',
              s: XL.money,
            };
          }
          return {
            v: String(item[c.key] || ""),
            t: "s",
            s: c.align === "center" ? XL.center : XL.left,
          };
        }),
      );
    });

    const totalRow = colDefs.map((c, i) => {
      if (c.totalKey)
        return {
          v: total,
          t: "n",
          z: '"Rp."#,##0',
          s: { ...XL.money, font: { bold: true } },
        };
      return { v: i === 0 ? "Total" : "", t: "s", s: XL.header };
    });
    aoa.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = colDefs.map((c) => ({ wch: c.width || 20 }));
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║                    CORE FRAMEWORK                       ║
  // ╚══════════════════════════════════════════════════════════╝

  const modules = [];
  const mountedModules = new Map();

  function registerModule(moduleDef) {
    modules.push({
      insertPosition: "afterend",
      waitForReady: true,
      mountDelay: 0,
      ...moduleDef,
    });
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
        console.warn(`[SIPD Mod] Timeout: ${selector}`);
      }
    }, timeout);
  }

  function waitForAnimationEnd(el) {
    return new Promise((resolve) => {
      const check = () => {
        const s = getComputedStyle(el);
        const o = parseFloat(s.opacity);
        if (o >= 1 && !(s.transition && s.transition !== "none" && o < 1)) {
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

  if (window.navigation)
    window.navigation.addEventListener("navigatesuccess", evaluateModules);
  window.addEventListener("popstate", () => setTimeout(evaluateModules, 300));
  (function init() {
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

  // Sub Kegiatan column definitions
  const SUBKEG_COLS = [
    { key: "_rowNum", label: "No", width: 6, align: "center" },
    { key: "nama_sub_skpd", label: "Nama Sub SKPD", width: 35, align: "left" },
    {
      key: "nama_sub_giat",
      label: "Nama Sub Kegiatan",
      width: 40,
      align: "left",
    },
    {
      key: "kode_rekening",
      label: "Kode Rekening",
      width: 20,
      align: "center",
    },
    { key: "nama_rekening", label: "Nama Rekening", width: 40, align: "left" },
    {
      key: "nilai_realisasi",
      label: "Nilai Realisasi",
      width: 22,
      align: "right",
      format: "rupiah",
      totalKey: "realisasi",
    },
  ];

  registerModule({
    id: "realisasi-filter",
    name: "Fitur Tambahan",
    urlPattern: "/pengeluaran/laporan/realisasi",
    targetSelector: "div.container-fluid",
    insertPosition: "beforeend",
    waitForReady: true,
    mountDelay: 1000,

    render: () => `
<style>
  .my-chakra-select-wrapper { position: relative; width: 100%; }
  .my-chakra-select { width: 100%; outline: none; appearance: none; font-size: var(--chakra-fontSizes-md); padding-left: var(--chakra-space-4); padding-right: var(--chakra-space-8); height: var(--chakra-sizes-10); border-radius: var(--chakra-radii-md); border: 1px solid var(--chakra-colors-gray-200); background: var(--chakra-colors-white); color: var(--chakra-colors-gray-800); }
  .my-chakra-select:focus { border-color: var(--chakra-colors-blue-500); box-shadow: 0 0 0 1px var(--chakra-colors-blue-500); }
  .my-select-icon { position: absolute; top: 50%; right: var(--chakra-space-2); transform: translateY(-50%); pointer-events: none; color: var(--chakra-colors-gray-400); font-size: 1.25rem; display: flex; }
  @keyframes sipd-spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .sipd-spinner { display: inline-block; width: 1em; height: 1em; border: 2px solid currentColor; border-bottom-color: transparent; border-radius: 50%; animation: sipd-spinner 0.45s linear infinite; margin-right: 0.5rem; vertical-align: middle; }
  .btn[disabled] { opacity: 0.6; cursor: not-allowed; pointer-events: none; }
</style>
${cardWrapper(
  "Filter Periode Bulan",
  `
  ${monthSelect("bulanAwal", "Bulan Awal")}
  ${monthSelect("bulanAkhir", "Bulan Akhir")}
  ${actionButtons("view", "download", "clear")}
`,
)}
${cardWrapper(
  "Filter Per Sub Kegiatan",
  `
  <div class="col-span-12" id="subkeg-load-area">
    ${btnHtml("load", "Ambil Data", "primary").replace('class="btn', 'class="w-full btn')}
  </div>
  <div class="col-span-12 hidden" id="subkeg-filter-area">
    <div class="grid grid-cols-12 gap-5">
      ${selectWrapper("subSkpd", "Sub SKPD", '<option value="" disabled selected>Pilih Sub SKPD ...</option>')}
      ${selectWrapper("subKeg", "Sub Kegiatan", '<option value="" disabled selected>Pilih Sub Kegiatan ...</option>')}
      ${actionButtons("subkegView", "subkegDownload", "subkegClear")}
    </div>
  </div>
`,
)}`,

    onMount: (el) => {
      const $ = (sel) => el.querySelector(sel);
      const btn = (name) => $(`button[name='${name}']`);
      const sel = (name) => $(`select[name='${name}']`);

      // ── Filter Periode Bulan ──────────────────────────────

      btn("view")?.addEventListener("click", () => {
        const { start, end } = getMonthRange(el);
        setLoading(btn("view"), true);

        fetchRealisasi(start, end, getAuthToken())
          .then((data) => {
            el._lastFetchedData = data;
            const totals = computeTotals(data);
            let rows = "";
            data.forEach((item, i) => {
              rows += renderTableRow(item, i + 1);
            });

            const container = document.createElement("div");
            container.className = "mt-5 overflow-x-auto table-result-container";
            container.innerHTML = `
              <p class="mb-2 text-sm text-slate-500 dark:text-slate-400">Total ${data.length} dokumen</p>
              <table class="w-full text-sm text-left border-collapse border border-slate-300 dark:border-slate-700">
                <thead class="bg-slate-100 dark:bg-slate-900 font-bold"><tr>${renderTableHeaders()}</tr></thead>
                <tbody>${rows || `<tr><td colspan="${COLUMNS.length}" class="p-4 text-center">Tidak ada data</td></tr>`}</tbody>
                ${data.length > 0 ? renderTableFooter(totals) : ""}
              </table>`;

            $(".table-result-container")?.remove();
            $(".card-body").appendChild(container);
          })
          .catch((err) => console.error("[SIPD Mod] View failed:", err))
          .finally(() => setLoading(btn("view"), false));
      });

      btn("download")?.addEventListener("click", () => {
        setLoading(btn("download"), true);
        const dataP = el._lastFetchedData
          ? Promise.resolve(el._lastFetchedData)
          : fetchRealisasi(...Object.values(getMonthRange(el)), getAuthToken());
        dataP
          .then((data) => {
            XLSX.writeFile(
              buildExcelWorkbook(data),
              "Laporan Realisasi Per Dokumen.xlsx",
            );
          })
          .catch((err) => console.error("[SIPD Mod] Download failed:", err))
          .finally(() => setLoading(btn("download"), false));
      });

      btn("clear")?.addEventListener("click", () => {
        $(".table-result-container")?.remove();
        el._lastFetchedData = null;
      });

      // ── Filter Per Sub Kegiatan ───────────────────────────

      let subkegData = null;
      const loadArea = $("#subkeg-load-area");
      const filterArea = $("#subkeg-filter-area");
      const subSkpd = sel("subSkpd");
      const subKeg = sel("subKeg");

      const updateSubKeg = () => {
        if (!subkegData) return;
        const v = subSkpd.value;
        populateSelect(
          subKeg,
          v ? subkegData.filter((d) => d.kode_sub_skpd === v) : subkegData,
          "kode_sub_giat",
          "nama_sub_giat",
          "Pilih Sub Kegiatan ...",
        );
      };

      const getGroupedData = () => {
        if (!subkegData) return [];
        const s = subSkpd.value,
          k = subKeg.value;
        const filtered = subkegData.filter(
          (d) => (!s || d.kode_sub_skpd === s) && (!k || d.kode_sub_giat === k),
        );
        const groups = new Map();
        filtered.forEach((d) => {
          const key = d.kode_rekening || "-";
          if (!groups.has(key))
            groups.set(key, {
              nama_sub_skpd: d.nama_sub_skpd || "-",
              nama_sub_giat: d.nama_sub_giat || "-",
              kode_rekening: key,
              nama_rekening: d.nama_rekening || "-",
              nilai_realisasi: 0,
            });
          groups.get(key).nilai_realisasi += Number(d.nilai_realisasi) || 0;
        });
        return [...groups.values()].sort((a, b) =>
          a.kode_rekening.localeCompare(b.kode_rekening),
        );
      };

      btn("load")?.addEventListener("click", () => {
        setLoading(btn("load"), true);
        fetchRealisasi(1, new Date().getMonth() + 1, getAuthToken())
          .then((data) => {
            subkegData = data;
            populateSelect(
              subSkpd,
              data,
              "kode_sub_skpd",
              "nama_sub_skpd",
              "Pilih Sub SKPD ...",
            );
            updateSubKeg();
            loadArea.classList.add("hidden");
            filterArea.classList.remove("hidden");
          })
          .catch((err) => console.error("[SIPD Mod] Load failed:", err))
          .finally(() => setLoading(btn("load"), false));
      });

      subSkpd?.addEventListener("change", updateSubKeg);

      btn("subkegView")?.addEventListener("click", () => {
        const html = renderSimpleTable({
          colDefs: SUBKEG_COLS,
          data: getGroupedData(),
          containerClass: "subkeg-table-container",
          countLabel: "rekening",
        });
        $(".subkeg-table-container")?.remove();
        filterArea.closest(".card-body").insertAdjacentHTML("beforeend", html);
      });

      btn("subkegDownload")?.addEventListener("click", () => {
        const grouped = getGroupedData();
        if (!grouped.length) return;
        buildSimpleExcel({
          title: "REALISASI PER SUB KEGIATAN",
          colDefs: SUBKEG_COLS,
          data: grouped,
          sheetName: "Realisasi Per Sub Kegiatan",
          filename: "Realisasi Per Sub Kegiatan.xlsx",
        });
      });

      btn("subkegClear")?.addEventListener("click", () => {
        $(".subkeg-table-container")?.remove();
      });
    },
  });

  // ===== ADD MORE MODULES BELOW =====
})();
