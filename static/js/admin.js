/*
  admin.js

  这个文件只服务后台页面：
  - /admin/login 负责登录
  - /admin/scene 负责场景管理
  - /admin/sentence 负责句子管理
  - /admin/material 负责教材管理
*/

// 从当前 URL 中取出路径，例如 /admin/scene。
const adminPath = window.location.pathname;

// 根据路径判断当前后台模块；replace 会把 /admin/ 去掉。
const currentPage = adminPath.replace("/admin/", "");

// 保存场景列表，句子表单和句子筛选都会复用它。
let sceneCache = [];

// 保存当前正在编辑的记录；为 null 表示现在是新增模式。
let editingRecord = null;

// 保存句子管理页当前筛选的场景 id。
let sentenceFilterValue = "";


// 统一封装后台 fetch，避免每个函数重复写 headers 和错误处理。
async function adminApi(url, options = {}) {
  // 发起 HTTP 请求；credentials: "same-origin" 会带上同站 Cookie。
  const response = await fetch(url, {
    // 后台接口都使用 JSON 请求体，所以默认加 Content-Type。
    headers: { "Content-Type": "application/json" },
    // 让浏览器发送后台登录 Cookie。
    credentials: "same-origin",
    // 合并调用方传入的 method、body 等选项。
    ...options,
  });

  // 后端所有接口都返回 JSON，所以这里统一解析。
  const data = await response.json();

  // 如果状态码不是 2xx，把后端错误信息抛给页面显示。
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }

  // 成功时把 JSON 对象返回给调用方。
  return data;
}


// 初始化登录页。
function initLoginPage() {
  // 获取登录表单；如果当前不是登录页，这个元素不存在。
  const form = document.querySelector("#loginForm");

  // 没有登录表单就直接返回，避免后台列表页报错。
  if (!form) {
    return;
  }

  // 获取提示信息元素，用于显示密码错误。
  const message = document.querySelector("#loginMessage");

  // 监听表单提交事件。
  form.addEventListener("submit", async (event) => {
    // 阻止浏览器默认刷新页面提交。
    event.preventDefault();

    // 读取用户输入的密码。
    const password = form.password.value;

    try {
      // 调用登录接口，后端验证成功后会写入 Cookie。
      await adminApi("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      // 登录成功后进入后台默认页面：场景管理。
      window.location.href = "/admin/scene";
    } catch (error) {
      // 登录失败时把错误显示在页面上。
      message.textContent = error.message;
    }
  });
}


// 初始化后台通用导航、退出按钮和当前页面高亮。
function initAdminChrome() {
  // 如果没有后台顶部栏，说明当前是登录页，不需要初始化后台布局。
  if (!document.querySelector(".admin-topbar")) {
    return;
  }

  // 遍历所有后台导航链接。
  document.querySelectorAll("[data-admin-page]").forEach((link) => {
    // data-admin-page 等于 currentPage 时，给链接加 active 类。
    if (link.dataset.adminPage === currentPage) {
      link.classList.add("active");
    }
  });

  // 获取退出按钮。
  const logoutBtn = document.querySelector("#logoutBtn");

  // 点击退出按钮时调用退出接口。
  logoutBtn.addEventListener("click", async () => {
    // 后端会清空 Cookie。
    await adminApi("/api/admin/logout", { method: "POST" });

    // 退出后回到登录页。
    window.location.href = "/admin/login";
  });
}


// 设置后台页面标题、副标题和表单标题。
function setPageText(title, subtitle, formTitle) {
  // 写入主标题。
  document.querySelector("#adminTitle").textContent = title;

  // 写入说明文字。
  document.querySelector("#adminSubtitle").textContent = subtitle;

  // 写入表单标题。
  document.querySelector("#formTitle").textContent = formTitle;
}


// 显示后台操作提示。
function showMessage(text) {
  // 获取提示元素。
  const message = document.querySelector("#adminMessage");

  // 把提示内容写入页面。
  message.textContent = text;
}


// 读取所有场景，用于场景列表、句子筛选、句子表单下拉框。
async function loadSceneCache() {
  // 调用公开场景接口；后台和用户端复用同一套数据接口。
  const result = await adminApi("/api/scenes");

  // 保存到全局变量，后续渲染表单时不用重复请求。
  sceneCache = result.data;

  // 返回场景数组，方便调用方继续使用。
  return sceneCache;
}


// 把教材 textarea 文本转换成后端需要的 content 数组。
function parseMaterialTextarea(textareaValue) {
  // 先按换行拆分，每一行代表教材中的一句。
  return textareaValue
    .split("\n")
    // 去掉每行首尾空格。
    .map((line) => line.trim())
    // 过滤空行。
    .filter(Boolean)
    // 每行格式：句子|开始秒|结束秒。
    .map((line) => {
      // 用竖线拆出文本和时间。
      const [text, start, end] = line.split("|");

      // 返回后端保存的结构。
      return {
        text: text || "",
        start: Number(start || 0),
        end: Number(end || 0),
      };
    });
}


// 把后端 content 数组转换回 textarea 文本。
function materialContentToText(content) {
  // 如果 content 不是数组，就返回空字符串。
  if (!Array.isArray(content)) {
    return "";
  }

  // 每个对象转成“句子|开始秒|结束秒”。
  return content
    .map((line) => `${line.text || ""}|${line.start || 0}|${line.end || 0}`)
    .join("\n");
}


// 渲染场景管理表单。
function renderSceneForm() {
  // 获取表单元素。
  const form = document.querySelector("#adminForm");

  // 表单只有一个场景名称字段。
  form.innerHTML = `
    <div class="form-grid">
      <label>
        场景名称
        <input name="name" value="${editingRecord ? editingRecord.name : ""}" required>
      </label>
    </div>
    <div class="form-actions">
      <button type="submit">${editingRecord ? "保存修改" : "新增场景"}</button>
      <button type="button" class="secondary" id="cancelEditBtn">取消编辑</button>
    </div>
  `;

  // 取消按钮只在编辑时有意义；新增时点它也会清空表单。
  document.querySelector("#cancelEditBtn").addEventListener("click", () => {
    editingRecord = null;
    renderSceneForm();
  });
}


// 渲染句子管理表单。
function renderSentenceForm() {
  // 获取表单元素。
  const form = document.querySelector("#adminForm");

  // 把场景缓存转换成 select 的 option。
  const sceneOptions = sceneCache.map((scene) => {
    // 编辑时需要让原场景被选中。
    const selected = editingRecord && String(editingRecord.scene_id) === String(scene.id) ? "selected" : "";

    // 返回一个 option 字符串。
    return `<option value="${scene.id}" ${selected}>${scene.name}</option>`;
  }).join("");

  // 句子字段较多，所以用网格排版。
  form.innerHTML = `
    <div class="form-grid">
      <label>
        所属场景
        <select name="scene_id" required>${sceneOptions}</select>
      </label>
      <label>
        韩文句子
        <input name="korean" value="${editingRecord ? editingRecord.korean : ""}" required>
      </label>
      <label>
        中文翻译
        <input name="chinese" value="${editingRecord ? editingRecord.chinese : ""}" required>
      </label>
      <label>
        音频地址
        <input name="audio_url" value="${editingRecord ? editingRecord.audio_url || "" : ""}">
      </label>
      <label>
        开始秒
        <input name="audio_start" type="number" step="0.1" value="${editingRecord ? editingRecord.audio_start || 0 : 0}">
      </label>
      <label>
        结束秒
        <input name="audio_end" type="number" step="0.1" value="${editingRecord ? editingRecord.audio_end || 0 : 0}">
      </label>
    </div>
    <div class="form-actions">
      <button type="submit">${editingRecord ? "保存修改" : "新增句子"}</button>
      <button type="button" class="secondary" id="cancelEditBtn">取消编辑</button>
    </div>
  `;

  // 点击取消编辑时恢复新增模式。
  document.querySelector("#cancelEditBtn").addEventListener("click", () => {
    editingRecord = null;
    renderSentenceForm();
  });
}


// 渲染教材管理表单。
function renderMaterialForm() {
  // 获取表单元素。
  const form = document.querySelector("#adminForm");

  // 教材内容是多行时间轴文本。
  const contentText = editingRecord ? materialContentToText(editingRecord.content) : "";

  // 教材表单包含标题、章节、音频和时间轴。
  form.innerHTML = `
    <div class="form-grid">
      <label>
        教材标题
        <input name="title" value="${editingRecord ? editingRecord.title : ""}" required>
      </label>
      <label>
        章节
        <input name="chapter" value="${editingRecord ? editingRecord.chapter || "" : ""}">
      </label>
      <label>
        整段音频地址
        <input name="audio_url" value="${editingRecord ? editingRecord.audio_url || "" : ""}">
      </label>
      <label>
        教材时间轴，每行：句子|开始秒|结束秒
        <textarea name="content" rows="8">${contentText}</textarea>
      </label>
    </div>
    <div class="form-actions">
      <button type="submit">${editingRecord ? "保存修改" : "新增教材"}</button>
      <button type="button" class="secondary" id="cancelEditBtn">取消编辑</button>
    </div>
  `;

  // 点击取消编辑时恢复新增模式。
  document.querySelector("#cancelEditBtn").addEventListener("click", () => {
    editingRecord = null;
    renderMaterialForm();
  });
}


// 渲染场景列表表格。
function renderSceneTable(rows) {
  // 获取列表容器。
  const table = document.querySelector("#adminTable");

  // 没有数据时给出明确提示。
  if (rows.length === 0) {
    table.innerHTML = "<p>还没有场景数据。</p>";
    return;
  }

  // 用 table 展示已有数据和操作按钮。
  table.innerHTML = `
    <div class="table">
      <table>
        <thead>
          <tr><th>ID</th><th>场景名称</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.id}</td>
              <td>${row.name}</td>
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

  // 给编辑和删除按钮绑定事件。
  bindTableActions(rows, "/api/scenes", loadScenePage, renderSceneForm);
}


// 渲染句子列表表格。
function renderSentenceTable(rows) {
  // 获取列表容器。
  const table = document.querySelector("#adminTable");

  // 没有数据时提示。
  if (rows.length === 0) {
    table.innerHTML = "<p>还没有句子数据。</p>";
    return;
  }

  // 输出句子表格。
  table.innerHTML = `
    <div class="table">
      <table>
        <thead>
          <tr><th>ID</th><th>场景</th><th>韩文</th><th>中文</th><th>音频</th><th>时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.id}</td>
              <td>${row.scene_name || ""}</td>
              <td>${row.korean}</td>
              <td>${row.chinese}</td>
              <td>${row.audio_url || ""}</td>
              <td>${row.audio_start || 0} - ${row.audio_end || 0}</td>
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

  // 绑定表格按钮。
  bindTableActions(rows, "/api/sentences", loadSentencePage, renderSentenceForm);
}


// 渲染教材列表表格。
function renderMaterialTable(rows) {
  // 获取列表容器。
  const table = document.querySelector("#adminTable");

  // 没有数据时提示。
  if (rows.length === 0) {
    table.innerHTML = "<p>还没有教材数据。</p>";
    return;
  }

  // 输出教材表格。
  table.innerHTML = `
    <div class="table">
      <table>
        <thead>
          <tr><th>ID</th><th>标题</th><th>章节</th><th>音频</th><th>句子数</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.id}</td>
              <td>${row.title}</td>
              <td>${row.chapter || ""}</td>
              <td>${row.audio_url || ""}</td>
              <td>${Array.isArray(row.content) ? row.content.length : 0}</td>
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

  // 绑定表格按钮。
  bindTableActions(rows, "/api/materials", loadMaterialPage, renderMaterialForm);
}


// 给表格中的编辑、删除按钮绑定事件。
function bindTableActions(rows, apiBase, reloadPage, renderForm) {
  // 找到表格内所有带 data-action 的按钮。
  document.querySelectorAll("[data-action]").forEach((button) => {
    // 给每个按钮添加点击事件。
    button.addEventListener("click", async () => {
      // 读取按钮上的动作类型：edit 或 delete。
      const action = button.dataset.action;

      // 读取按钮对应的数据 id。
      const id = button.dataset.id;

      // 编辑：把当前行放进 editingRecord，然后重绘表单。
      if (action === "edit") {
        editingRecord = rows.find((row) => String(row.id) === String(id));
        renderForm();
        return;
      }

      // 删除：先弹确认框，避免误删。
      if (action === "delete" && confirm("确定要删除这条数据吗？")) {
        // 调用 DELETE 接口。
        await adminApi(`${apiBase}?id=${encodeURIComponent(id)}`, { method: "DELETE" });

        // 删除后清空编辑状态。
        editingRecord = null;

        // 重新加载当前页面数据。
        await reloadPage();

        // 给用户反馈。
        showMessage("删除成功。");
      }
    });
  });
}


// 初始化场景管理页。
async function loadScenePage() {
  // 设置页面文字。
  setPageText("场景管理", "管理问路、购物、餐厅、打招呼等句子分类。", "新增 / 编辑场景");

  // 场景页不需要句子筛选器。
  document.querySelector("#sentenceFilterLabel").style.display = "none";

  // 读取所有场景。
  const rows = await loadSceneCache();

  // 渲染表单。
  renderSceneForm();

  // 渲染已有数据表格。
  renderSceneTable(rows);
}


// 初始化句子管理页。
async function loadSentencePage() {
  // 设置页面文字。
  setPageText("句子管理", "查看所有句子，可按场景筛选，并维护音频时间。", "新增 / 编辑句子");

  // 句子页需要先加载场景缓存。
  await loadSceneCache();

  // 获取筛选器 label。
  const filterLabel = document.querySelector("#sentenceFilterLabel");

  // 显示筛选器。
  filterLabel.style.display = "grid";

  // 获取筛选 select。
  const filter = document.querySelector("#sentenceSceneFilter");

  // 写入“全部场景”和各个场景选项。
  filter.innerHTML = `<option value="">全部场景</option>${sceneCache.map((scene) => (
    `<option value="${scene.id}">${scene.name}</option>`
  )).join("")}`;

  // 重新渲染筛选器后恢复用户上一次选择。
  filter.value = sentenceFilterValue;

  // 根据筛选值拼接接口地址。
  const url = sentenceFilterValue ? `/api/sentences?scene_id=${encodeURIComponent(sentenceFilterValue)}` : "/api/sentences";

  // 读取句子列表。
  const result = await adminApi(url);

  // 渲染表单。
  renderSentenceForm();

  // 渲染表格。
  renderSentenceTable(result.data);

  // 筛选器变化时重新加载句子列表。
  filter.onchange = async () => {
    sentenceFilterValue = filter.value;
    editingRecord = null;
    await loadSentencePage();
  };
}


// 初始化教材管理页。
async function loadMaterialPage() {
  // 设置页面文字。
  setPageText("教材管理", "维护教材文本、整段音频地址以及每句时间轴。", "新增 / 编辑教材");

  // 教材页不需要句子筛选器。
  document.querySelector("#sentenceFilterLabel").style.display = "none";

  // 读取教材列表。
  const result = await adminApi("/api/materials");

  // 渲染表单。
  renderMaterialForm();

  // 渲染表格。
  renderMaterialTable(result.data);
}


// 初始化后台表单提交。
function initAdminForm() {
  // 获取后台表单。
  const form = document.querySelector("#adminForm");

  // 登录页没有这个表单，所以直接返回。
  if (!form) {
    return;
  }

  // 监听后台表单提交。
  form.addEventListener("submit", async (event) => {
    // 阻止默认刷新。
    event.preventDefault();

    try {
      // 场景页提交。
      if (currentPage === "scene") {
        const payload = { name: form.name.value };
        const method = editingRecord ? "PUT" : "POST";
        const url = editingRecord ? `/api/scenes?id=${editingRecord.id}` : "/api/scenes";
        await adminApi(url, { method, body: JSON.stringify(payload) });
        editingRecord = null;
        await loadScenePage();
        showMessage("保存成功。");
      }

      // 句子页提交。
      if (currentPage === "sentence") {
        const payload = {
          scene_id: form.scene_id.value,
          korean: form.korean.value,
          chinese: form.chinese.value,
          audio_url: form.audio_url.value,
          audio_start: Number(form.audio_start.value || 0),
          audio_end: Number(form.audio_end.value || 0),
        };
        const method = editingRecord ? "PUT" : "POST";
        const url = editingRecord ? `/api/sentences?id=${editingRecord.id}` : "/api/sentences";
        await adminApi(url, { method, body: JSON.stringify(payload) });
        editingRecord = null;
        await loadSentencePage();
        showMessage("保存成功。");
      }

      // 教材页提交。
      if (currentPage === "material") {
        const payload = {
          title: form.title.value,
          chapter: form.chapter.value,
          audio_url: form.audio_url.value,
          content: parseMaterialTextarea(form.content.value),
        };
        const method = editingRecord ? "PUT" : "POST";
        const url = editingRecord ? `/api/materials?id=${editingRecord.id}` : "/api/materials";
        await adminApi(url, { method, body: JSON.stringify(payload) });
        editingRecord = null;
        await loadMaterialPage();
        showMessage("保存成功。");
      }
    } catch (error) {
      // 保存失败时显示后端返回的错误。
      showMessage(error.message);
    }
  });
}


// 根据当前路径加载对应后台页面。
async function loadCurrentAdminPage() {
  // 登录页不需要加载后台列表。
  if (adminPath === "/admin/login") {
    return;
  }

  // 场景页。
  if (currentPage === "scene") {
    await loadScenePage();
    return;
  }

  // 句子页。
  if (currentPage === "sentence") {
    await loadSentencePage();
    return;
  }

  // 教材页。
  if (currentPage === "material") {
    await loadMaterialPage();
  }
}


// DOMContentLoaded 表示 HTML 已经解析完成，可以开始查找元素和绑定事件。
document.addEventListener("DOMContentLoaded", async () => {
  // 初始化登录页逻辑。
  initLoginPage();

  // 初始化后台顶部栏和侧边栏。
  initAdminChrome();

  // 初始化后台表单提交逻辑。
  initAdminForm();

  try {
    // 根据当前路径加载场景、句子或教材页面。
    await loadCurrentAdminPage();
  } catch (error) {
    // 这里捕获初始化错误，避免页面空白。
    showMessage(error.message);
  }
});
