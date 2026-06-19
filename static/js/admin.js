/*
  后台只管理例句内容：场景与例句。
*/

const adminPath = window.location.pathname;
const currentPage = adminPath.replace("/admin/", "");

let sceneCache = [];
let sentenceCache = [];
let editingRecord = null;
let sentenceFilterValue = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function adminApi(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

function showMessage(text, type = "success") {
  const message = document.querySelector("#adminMessage") || document.querySelector("#loginMessage");
  if (!message) return;
  message.textContent = text;
  message.dataset.type = type;
}

function initLoginPage() {
  const form = document.querySelector("#loginForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await adminApi("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: form.password.value }),
      });
      window.location.href = "/admin/scene";
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}

function initAdminChrome() {
  if (!document.querySelector(".admin-topbar")) return;

  document.querySelectorAll("[data-admin-page]").forEach((link) => {
    link.classList.toggle("active", link.dataset.adminPage === currentPage);
  });

  document.querySelector("#logoutBtn")?.addEventListener("click", async () => {
    await adminApi("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  });
}

function setPageText({ eyebrow, title, subtitle, formTitle }) {
  document.querySelector("#adminEyebrow").textContent = eyebrow;
  document.querySelector("#adminTitle").textContent = title;
  document.querySelector("#adminSubtitle").textContent = subtitle;
  document.querySelector("#formTitle").textContent = formTitle;
}

async function loadSceneCache() {
  const result = await adminApi("/api/scenes");
  sceneCache = result.data || [];
  return sceneCache;
}

function resetEdit(renderForm) {
  editingRecord = null;
  renderForm();
  showMessage("");
}

function renderSceneForm() {
  const form = document.querySelector("#adminForm");
  form.innerHTML = `
    <div class="form-grid">
      <label>
        场景名称
        <input name="name" value="${escapeHtml(editingRecord?.name || "")}" placeholder="例如：学校" required>
      </label>
      <label>
        英文名称
        <input name="en" value="${escapeHtml(editingRecord?.en || "")}" placeholder="留空时自动翻译">
      </label>
    </div>
    <div class="form-actions">
      <button type="submit">${editingRecord ? "保存修改" : "新增场景"}</button>
      <button type="button" class="secondary" id="cancelEditBtn">清空</button>
    </div>
  `;
  document.querySelector("#cancelEditBtn").addEventListener("click", () => resetEdit(renderSceneForm));
}

function renderSentenceForm() {
  const form = document.querySelector("#adminForm");
  const activeSceneId = String(editingRecord?.scene_id || sentenceFilterValue || sceneCache[0]?.id || "");
  const sceneOptions = sceneCache.map((scene) => {
    const selected = String(scene.id) === activeSceneId ? "selected" : "";
    return `<option value="${scene.id}" ${selected}>${escapeHtml(scene.name)}</option>`;
  }).join("");
  const situationOptions = buildSituationOptions(activeSceneId, editingRecord?.situation);
  const useCustomSituation = editingRecord?.situation && !situationOptions.includes(editingRecord.situation);

  form.innerHTML = `
    <div class="form-grid">
      <label>
        所属场景
        <select name="scene_id" id="sentenceSceneSelect" required>${sceneOptions}</select>
      </label>
      <label>
        情景
        <select name="situation_select" id="sentenceSituationSelect">
          ${situationOptions.map((situation) => {
            const selected = !useCustomSituation && situation === (editingRecord?.situation || situationOptions[0]) ? "selected" : "";
            return `<option value="${escapeHtml(situation)}" ${selected}>${escapeHtml(situation)}</option>`;
          }).join("")}
          <option value="__new__" ${useCustomSituation || situationOptions.length === 0 ? "selected" : ""}>新增情景…</option>
        </select>
      </label>
      <label id="customSituationLabel" ${useCustomSituation || situationOptions.length === 0 ? "" : "hidden"}>
        新增情景名称
        <input name="situation_custom" value="${escapeHtml(useCustomSituation ? editingRecord.situation : "")}" placeholder="例如：教室问候">
      </label>
      <label>
        韩文例句
        <input name="korean" value="${escapeHtml(editingRecord?.korean || "")}" required>
      </label>
      <label>
        中文翻译
        <input name="chinese" value="${escapeHtml(editingRecord?.chinese || "")}" required>
      </label>
    </div>
    <div class="form-actions">
      <button type="submit">${editingRecord ? "保存修改" : "新增例句"}</button>
      <button type="button" class="secondary" id="cancelEditBtn">清空</button>
    </div>
  `;
  document.querySelector("#cancelEditBtn").addEventListener("click", () => resetEdit(renderSentenceForm));
  bindSentenceSituationControls();
}

function buildSituationOptions(sceneId, currentSituation = "") {
  const seen = new Set();
  sentenceCache.forEach((sentence) => {
    if (String(sentence.scene_id) !== String(sceneId)) return;
    const situation = (sentence.situation || "常用表达").trim();
    if (situation) seen.add(situation);
  });
  if (currentSituation) seen.add(currentSituation);
  return Array.from(seen);
}

function bindSentenceSituationControls() {
  const sceneSelect = document.querySelector("#sentenceSceneSelect");
  const situationSelect = document.querySelector("#sentenceSituationSelect");
  const customLabel = document.querySelector("#customSituationLabel");
  const customInput = document.querySelector("[name='situation_custom']");
  if (!sceneSelect || !situationSelect || !customLabel) return;

  const refreshSituationOptions = () => {
    const options = buildSituationOptions(sceneSelect.value);
    situationSelect.innerHTML = `
      ${options.map((situation, index) => `<option value="${escapeHtml(situation)}" ${index === 0 ? "selected" : ""}>${escapeHtml(situation)}</option>`).join("")}
      <option value="__new__" ${options.length === 0 ? "selected" : ""}>新增情景…</option>
    `;
    customLabel.hidden = options.length > 0;
    if (customInput) customInput.value = "";
  };

  const toggleCustom = () => {
    customLabel.hidden = situationSelect.value !== "__new__";
  };

  sceneSelect.addEventListener("change", refreshSituationOptions);
  situationSelect.addEventListener("change", toggleCustom);
}

function renderEmpty(text) {
  document.querySelector("#adminTable").innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
}

function renderSceneTable(rows) {
  if (!rows.length) {
    renderEmpty("还没有场景数据。");
    return;
  }

  document.querySelector("#adminTable").innerHTML = `
    <div class="table">
      <table>
        <thead>
          <tr><th>ID</th><th>场景名称</th><th>英文名称</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.id}</td>
              <td><strong>${escapeHtml(row.name)}</strong></td>
              <td>${escapeHtml(row.en || "Scene")}</td>
              <td>
                <div class="actions">
                  <button class="secondary" data-action="edit" data-id="${row.id}">编辑</button>
                  <button class="danger" data-action="delete" data-id="${row.id}">删除</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
  bindTableActions(rows, {
    apiBase: "/api/scenes",
    reloadPage: loadScenePage,
    renderForm: renderSceneForm,
    beforeDelete: ensureSceneCanDelete,
  });
}

function renderSentenceTable(rows) {
  if (!rows.length) {
    renderEmpty("还没有例句数据。");
    return;
  }

  document.querySelector("#adminTable").innerHTML = `
    <div class="table">
      <table>
        <thead>
          <tr><th>ID</th><th>场景</th><th>情景</th><th>韩文</th><th>中文</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.id}</td>
              <td>${escapeHtml(row.scene_name || "")}</td>
              <td>${escapeHtml(row.situation || "常用表达")}</td>
              <td class="ko-cell">${escapeHtml(row.korean)}</td>
              <td>${escapeHtml(row.chinese)}</td>
              <td>
                <div class="actions">
                  <button class="secondary" data-action="edit" data-id="${row.id}">编辑</button>
                  <button class="danger" data-action="delete" data-id="${row.id}">删除</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
  bindTableActions(rows, {
    apiBase: "/api/sentences",
    reloadPage: loadSentencePage,
    renderForm: renderSentenceForm,
  });
}

async function ensureSceneCanDelete(sceneId) {
  const result = await adminApi(`/api/sentences?scene_id=${encodeURIComponent(sceneId)}`);
  if ((result.data || []).length > 0) {
    throw new Error("该场景下还有例句，请先删除或迁移例句");
  }
}

function bindTableActions(rows, { apiBase, reloadPage, renderForm, beforeDelete }) {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const id = button.dataset.id;

      if (action === "edit") {
        editingRecord = rows.find((row) => String(row.id) === String(id));
        renderForm();
        window.scrollTo({ top: 0, behavior: "smooth" });
        showMessage("正在编辑当前记录。");
        return;
      }

      if (action !== "delete") return;
      try {
        if (beforeDelete) await beforeDelete(id);
        if (!confirm("确定要删除这条数据吗？")) return;
        await adminApi(`${apiBase}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        editingRecord = null;
        await reloadPage();
        showMessage("删除成功。");
      } catch (error) {
        showMessage(error.message, "error");
      }
    });
  });
}

async function loadScenePage() {
  setPageText({
    eyebrow: "SCENES",
    title: "场景管理",
    subtitle: "维护例句页的场景分类。含例句的场景不能直接删除。",
    formTitle: editingRecord ? "编辑场景" : "新增场景",
  });
  document.querySelector("#sentenceFilterLabel").hidden = true;
  const rows = await loadSceneCache();
  renderSceneForm();
  renderSceneTable(rows);
}

async function loadSentencePage() {
  setPageText({
    eyebrow: "EXAMPLES",
    title: "例句管理",
    subtitle: "维护韩语例句、中文翻译和情景分组。",
    formTitle: editingRecord ? "编辑例句" : "新增例句",
  });

  await loadSceneCache();

  const filterLabel = document.querySelector("#sentenceFilterLabel");
  const filter = document.querySelector("#sentenceSceneFilter");
  filterLabel.hidden = false;
  filter.innerHTML = `<option value="">全部场景</option>${sceneCache.map((scene) => (
    `<option value="${scene.id}">${escapeHtml(scene.name)}</option>`
  )).join("")}`;
  filter.value = sentenceFilterValue;

  const url = sentenceFilterValue ? `/api/sentences?scene_id=${encodeURIComponent(sentenceFilterValue)}` : "/api/sentences";
  const result = await adminApi(url);
  const allResult = sentenceFilterValue ? await adminApi("/api/sentences") : result;
  sentenceCache = allResult.data || [];

  renderSentenceForm();
  renderSentenceTable(result.data || []);

  filter.onchange = async () => {
    sentenceFilterValue = filter.value;
    editingRecord = null;
    await loadSentencePage();
  };
}

function initAdminForm() {
  const form = document.querySelector("#adminForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      if (currentPage === "scene") {
        const payload = { name: form.name.value.trim(), en: form.en.value.trim() };
        const method = editingRecord ? "PUT" : "POST";
        const url = editingRecord ? `/api/scenes?id=${editingRecord.id}` : "/api/scenes";
        await adminApi(url, { method, body: JSON.stringify(payload) });
        editingRecord = null;
        await loadScenePage();
        showMessage("保存成功。");
        return;
      }

      if (currentPage === "sentence") {
        const selectedSituation = form.situation_select.value;
        const customSituation = (form.situation_custom?.value || "").trim();
        const payload = {
          scene_id: form.scene_id.value,
          situation: selectedSituation === "__new__" ? customSituation : selectedSituation,
          korean: form.korean.value.trim(),
          chinese: form.chinese.value.trim(),
        };
        const method = editingRecord ? "PUT" : "POST";
        const url = editingRecord ? `/api/sentences?id=${editingRecord.id}` : "/api/sentences";
        await adminApi(url, { method, body: JSON.stringify(payload) });
        editingRecord = null;
        await loadSentencePage();
        showMessage("保存成功。");
      }
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}

async function loadCurrentAdminPage() {
  if (adminPath === "/admin/login") return;
  if (currentPage === "scene") {
    await loadScenePage();
    return;
  }
  if (currentPage === "sentence") {
    await loadSentencePage();
    return;
  }
  window.location.href = "/admin/scene";
}

document.addEventListener("DOMContentLoaded", async () => {
  initLoginPage();
  initAdminChrome();
  initAdminForm();
  try {
    await loadCurrentAdminPage();
  } catch (error) {
    showMessage(error.message, "error");
  }
});
