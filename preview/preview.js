(function () {
  const data = window.PREVIEW_DATA;
  if (!data) {
    console.error("PREVIEW_DATA not found");
    return;
  }

  const titleEl = document.getElementById("window-title");
  const tagsEl = document.getElementById("window-tags");
  const tabsEl = document.getElementById("tabs");
  const contentEl = document.getElementById("content");
  const openBtn = document.getElementById("open-button");
  const paletteEl = document.getElementById("palette");
  const structureEl = document.getElementById("structure");
  const propsEl = document.getElementById("properties");
  const addTypeSelect = document.getElementById("add-type");
  const structureFilter = document.getElementById("structure-filter");

  const addTabBtn = document.getElementById("add-tab");
  const addSectionBtn = document.getElementById("add-section");
  const addItemBtn = document.getElementById("add-item");
  const duplicateItemBtn = document.getElementById("duplicate-item");
  const moveUpBtn = document.getElementById("move-up");
  const moveDownBtn = document.getElementById("move-down");
  const deleteItemBtn = document.getElementById("delete-item");
  const copyLuaBtn = document.getElementById("copy-lua");
  const downloadLuaBtn = document.getElementById("download-lua");
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const zoomResetBtn = document.getElementById("zoom-reset");
  const zoomFitBtn = document.getElementById("zoom-fit");
  const zoomLabel = document.getElementById("zoom-label");
  const canvas = document.getElementById("canvas");
  const canvasItem = document.getElementById("canvas-item");
  const editorLayout = document.querySelector(".editor-layout");
  const sideTabs = document.querySelectorAll(".side-tab");
  const sidePanels = document.querySelectorAll(".side-panel");

  const ELEMENT_TYPES = [
    "Section",
    "Group",
    "Paragraph",
    "Button",
    "Toggle",
    "Slider",
    "Keybind",
    "Input",
    "Textarea",
    "Dropdown",
    "Code",
    "Colorpicker",
    "Divider",
    "Space",
    "Image",
    "Video"
  ];

  // Icons disabled in offline preview.

  const ELEMENT_DEFAULTS = {
    Section: { type: "section", title: "Section" },
    Group: { type: "group", title: "Group", items: [] },
    Paragraph: { type: "paragraph", title: "Paragraph", desc: "Description" },
    Button: { type: "button", title: "Button", desc: "" },
    Toggle: { type: "toggle", title: "Toggle", value: false, typeValue: "Toggle" },
    Slider: { type: "slider", title: "Slider", value: 50, min: 0, max: 100, step: 1 },
    Keybind: { type: "keybind", title: "Keybind", value: "G" },
    Input: { type: "input", title: "Input", placeholder: "Enter text", inputType: "Input" },
    Textarea: { type: "textarea", title: "Textarea", placeholder: "Enter text", inputType: "Textarea" },
    Dropdown: { type: "dropdown", title: "Dropdown", options: ["Option 1", "Option 2"] },
    Code: { type: "code", title: "Code", code: "print(\"Hello\")", language: "lua" },
    Colorpicker: { type: "colorpicker", title: "Colorpicker", value: "#30ff6a" },
    Divider: { type: "divider" },
    Space: { type: "space", size: 8 },
    Image: { type: "image", src: "../docs/ui.png" },
    Video: { type: "video", src: "" }
  };

  const state = {
    selected: { tabIndex: 0, path: null },
    zoom: 1,
    drag: null
  };

  if (!data.window) {
    data.window = { title: "Window", tags: [] };
  }

  function setWindowHeader() {
    titleEl.textContent = data.window?.title || "Window";
    openBtn.textContent = data.window?.openButton?.title || "Open UI";
    tagsEl.innerHTML = "";
    if (Array.isArray(data.window?.tags)) {
      data.window.tags.forEach(tag => {
        const t = document.createElement("div");
        t.className = "tag";
        t.textContent = tag.title || tag.text || "";
        tagsEl.appendChild(t);
      });
    }
  }

  function getTab(tabIndex) {
    return data.tabs[tabIndex];
  }

  function getItemByPath(items, path) {
    let current = null;
    let list = items;
    for (let i = 0; i < path.length; i += 1) {
      current = list[path[i]];
      if (!current) return null;
      if (i < path.length - 1) {
        list = current.items || [];
      }
    }
    return current;
  }

  function getSelectedItem() {
    const tab = getTab(state.selected.tabIndex);
    if (!tab) return null;
    return getItemByPath(tab.items || [], state.selected.path);
  }

  function getSelectedContainer() {
    const tab = getTab(state.selected.tabIndex);
    if (!tab) return { list: [], parent: null };
    if (!state.selected.path.length) return { list: tab.items, parent: null };
    const parentPath = state.selected.path.slice(0, -1);
    const parent = getItemByPath(tab.items, parentPath);
    if (parent && Array.isArray(parent.items)) {
      return { list: parent.items, parent };
    }
    return { list: tab.items, parent: null };
  }

  function getInsertContainer() {
    const tab = getTab(state.selected.tabIndex);
    if (!tab) return { list: [], parent: null, path: [] };
    if (!state.selected.path.length) return { list: tab.items, parent: null, path: [] };
    const item = getSelectedItem();
    if (item && item.type === "group") {
      item.items = item.items || [];
      return { list: item.items, parent: item, path: state.selected.path.slice() };
    }
    const parentPath = state.selected.path.slice(0, -1);
    const parent = getItemByPath(tab.items, parentPath);
    if (parent && Array.isArray(parent.items)) {
      return { list: parent.items, parent, path: parentPath };
    }
    return { list: tab.items, parent: null, path: [] };
  }

  function renderTabs() {
    tabsEl.innerHTML = "";
    data.tabs.forEach((tab, index) => {
      const t = document.createElement("div");
      t.className = "tab" + (index === state.selected.tabIndex ? " active" : "");
      t.textContent = tab.title || "Tab";
      t.addEventListener("click", () => {
        state.selected = { tabIndex: index, path: [] };
        renderAll();
      });
      tabsEl.appendChild(t);
    });
  }

  function renderPreviewItem(item, path) {
    const pathKey = path.join(".");
    function applyLockOverlay(node) {
      if (!item.locked) return;
      node.classList.add("lockable");
      const overlay = document.createElement("div");
      overlay.className = "lock-overlay";
      const text = document.createElement("div");
      text.className = "lock-text";
      text.textContent = item.lockedTitle || "Locked";
      overlay.appendChild(text);
      node.appendChild(overlay);
    }
    if (item.type === "section") {
      const box = document.createElement("div");
      box.className = "section";
      box.dataset.path = pathKey;
      if (isSamePath(path, state.selected.path)) {
        box.classList.add("preview-selected");
      }
      box.addEventListener("click", (e) => {
        e.stopPropagation();
        state.selected = { tabIndex: state.selected.tabIndex, path: path.slice() };
        renderAll();
      });
      if (item.title) {
        const h = document.createElement("div");
        h.className = "section-title";
        h.textContent = item.title;
        box.appendChild(h);
      }
      applyLockOverlay(box);
      return box;
    }

    if (item.type === "group") {
      const box = document.createElement("div");
      box.className = "section";
      box.dataset.path = pathKey;
      if (isSamePath(path, state.selected.path)) {
        box.classList.add("preview-selected");
      }
      box.addEventListener("click", (e) => {
        e.stopPropagation();
        state.selected = { tabIndex: state.selected.tabIndex, path: path.slice() };
        renderAll();
      });
      const h = document.createElement("div");
      h.className = "section-title";
      h.textContent = item.title || "Group";
      box.appendChild(h);
      (item.items || []).forEach((child, idx) => {
        box.appendChild(renderPreviewItem(child, path.concat(idx)));
      });
      applyLockOverlay(box);
      return box;
    }

    if (item.type === "paragraph") {
      const container = document.createElement("div");
      container.className = "paragraph";
      container.dataset.path = pathKey;
      if (isSamePath(path, state.selected.path)) {
        container.classList.add("preview-selected");
      }
      container.addEventListener("click", (e) => {
        e.stopPropagation();
        state.selected = { tabIndex: state.selected.tabIndex, path: path.slice() };
        renderAll();
      });
      const title = document.createElement("div");
      title.className = "paragraph-title";
      title.textContent = item.title || item.text || "Paragraph";
      container.appendChild(title);
      if (item.desc) {
        const desc = document.createElement("div");
        desc.className = "paragraph-desc";
        desc.textContent = item.desc;
        container.appendChild(desc);
      }
      if (Array.isArray(item.buttons) && item.buttons.length) {
        const wrap = document.createElement("div");
        wrap.className = "para-buttons";
        item.buttons.forEach(btn => {
          const b = document.createElement("div");
          b.className = "para-button";
          b.textContent = btn.title || "Button";
          wrap.appendChild(b);
        });
        container.appendChild(wrap);
      }
      applyLockOverlay(container);
      return container;
    }

    if (item.type === "image") {
      const img = document.createElement("img");
      img.className = "image";
      img.src = item.src;
      img.alt = "";
      img.dataset.path = pathKey;
      if (isSamePath(path, state.selected.path)) {
        img.classList.add("preview-selected");
      }
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        state.selected = { tabIndex: state.selected.tabIndex, path: path.slice() };
        renderAll();
      });
      applyLockOverlay(img);
      return img;
    }

    if (item.type === "divider") {
      const hr = document.createElement("div");
      hr.className = "divider";
      hr.dataset.path = pathKey;
      if (isSamePath(path, state.selected.path)) {
        hr.classList.add("preview-selected");
      }
      hr.addEventListener("click", (e) => {
        e.stopPropagation();
        state.selected = { tabIndex: state.selected.tabIndex, path: path.slice() };
        renderAll();
      });
      applyLockOverlay(hr);
      return hr;
    }

    if (item.type === "space") {
      const sp = document.createElement("div");
      sp.className = "space";
      sp.style.height = (item.size || 8) + "px";
      sp.dataset.path = pathKey;
      if (isSamePath(path, state.selected.path)) {
        sp.classList.add("preview-selected");
      }
      sp.addEventListener("click", (e) => {
        e.stopPropagation();
        state.selected = { tabIndex: state.selected.tabIndex, path: path.slice() };
        renderAll();
      });
      applyLockOverlay(sp);
      return sp;
    }

    if (item.type === "code") {
      const code = document.createElement("pre");
      code.className = "code";
      code.textContent = item.code || "";
      code.dataset.path = pathKey;
      if (isSamePath(path, state.selected.path)) {
        code.classList.add("preview-selected");
      }
      code.addEventListener("click", (e) => {
        e.stopPropagation();
        state.selected = { tabIndex: state.selected.tabIndex, path: path.slice() };
        renderAll();
      });
      applyLockOverlay(code);
      return code;
    }

    if (item.type === "video") {
      const v = document.createElement("div");
      v.className = "section";
      v.textContent = "[video preview not supported]";
      v.dataset.path = pathKey;
      if (isSamePath(path, state.selected.path)) {
        v.classList.add("preview-selected");
      }
      v.addEventListener("click", (e) => {
        e.stopPropagation();
        state.selected = { tabIndex: state.selected.tabIndex, path: path.slice() };
        renderAll();
      });
      applyLockOverlay(v);
      return v;
    }

    const row = document.createElement("div");
    row.className = "element";
    if (item.locked) row.classList.add("is-locked");
    row.dataset.path = pathKey;
    if (isSamePath(path, state.selected.path)) {
      row.classList.add("preview-selected");
    }
    row.addEventListener("click", (e) => {
      e.stopPropagation();
      state.selected = { tabIndex: state.selected.tabIndex, path: path.slice() };
      renderAll();
    });

    const left = document.createElement("div");
    const title = document.createElement("div");
    title.className = "row-title";
    title.textContent = item.title || item.type || "";
    left.appendChild(title);
    if (item.desc) {
      const desc = document.createElement("div");
      desc.className = "row-desc";
      desc.textContent = item.desc;
      left.appendChild(desc);
    }

    row.appendChild(left);
    row.appendChild(renderControl(item));
    applyLockOverlay(row);
    return row;
  }

  function renderControl(item) {
    switch (item.type) {
      case "button": {
        const btn = document.createElement("button");
        btn.className = "button" + (item.variant ? " " + item.variant : "");
        if (item.locked) btn.classList.add("control-locked");
        return btn;
      }
      case "toggle": {
        const t = document.createElement("div");
        t.className = "toggle" + (item.value ? " on" : "");
        if (item.locked) t.classList.add("control-locked");
        return t;
      }
      case "input": {
        const input = document.createElement("input");
        input.className = "input";
        input.placeholder = item.placeholder || "";
        if (item.value) input.value = item.value;
        if (item.locked) input.classList.add("control-locked");
        return input;
      }
      case "textarea": {
        const area = document.createElement("textarea");
        area.className = "textarea";
        area.placeholder = item.placeholder || "";
        area.rows = 2;
        if (item.value) area.value = item.value;
        if (item.locked) area.classList.add("control-locked");
        return area;
      }
      case "slider": {
        const wrap = document.createElement("div");
        wrap.className = "slider";
        if (item.locked) wrap.classList.add("control-locked");
        const rangeWrap = document.createElement("div");
        rangeWrap.className = "slider-track";
        const input = document.createElement("input");
        input.type = "range";
        input.min = String(item.min ?? 0);
        input.max = String(item.max ?? 100);
        input.step = String(item.step ?? 1);
        input.value = String(item.value ?? 50);
        const fill = document.createElement("div");
        fill.className = "slider-fill";
        const thumb = document.createElement("div");
        thumb.className = "slider-thumb";
        const out = document.createElement("div");
        out.className = "slider-value";
        out.textContent = input.value;

        function sync() {
          const min = Number(input.min);
          const max = Number(input.max);
          const val = Number(input.value);
          const pct = max === min ? 0 : (val - min) / (max - min);
          fill.style.width = (pct * 100).toFixed(2) + "%";
          thumb.style.left = (pct * 100).toFixed(2) + "%";
          out.textContent = input.value;
        }
        input.addEventListener("input", sync);
        sync();

        rangeWrap.appendChild(fill);
        rangeWrap.appendChild(thumb);
        rangeWrap.appendChild(input);

        wrap.appendChild(rangeWrap);
        wrap.appendChild(out);
        return wrap;
      }
      case "dropdown": {
        const select = document.createElement("select");
        select.className = "dropdown";
        (item.options || []).forEach(opt => {
          const o = document.createElement("option");
          o.textContent = opt;
          select.appendChild(o);
        });
        if (item.locked) select.classList.add("control-locked");
        return select;
      }
      case "colorpicker": {
        const box = document.createElement("div");
        box.className = "color";
        box.style.background = item.value || "#30ff6a";
        if (item.locked) box.classList.add("control-locked");
        return box;
      }
      case "keybind": {
        const btn = document.createElement("button");
        btn.className = "button";
        btn.textContent = item.value || "Key";
        if (item.locked) btn.classList.add("control-locked");
        return btn;
      }
      default: {
        const stub = document.createElement("div");
        stub.textContent = "[unknown control]";
        return stub;
      }
    }
  }

  function renderPreview() {
    contentEl.innerHTML = "";
    const tab = getTab(state.selected.tabIndex);
    if (!tab) return;
    if (tab.showTitle) {
      const header = document.createElement("div");
      header.className = "section";
      const title = document.createElement("div");
      title.className = "section-title";
      title.textContent = tab.title || "Tab";
      header.appendChild(title);
      contentEl.appendChild(header);
    }
    (tab.items || []).forEach((item, idx) => {
      contentEl.appendChild(renderPreviewItem(item, [idx]));
    });
  }

  function renderPalette() {
    paletteEl.innerHTML = "";
    ELEMENT_TYPES.forEach(type => {
      const el = document.createElement("div");
      el.className = "palette-item";
      el.textContent = type;
      el.addEventListener("click", () => {
        addElement(type);
      });
      paletteEl.appendChild(el);
    });
  }

  function renderStructure() {
    structureEl.innerHTML = "";

    const filter = (structureFilter.value || "").trim().toLowerCase();

    data.tabs.forEach((tab, tIndex) => {
      const tabItem = document.createElement("div");
      tabItem.className = "structure-item" + (tIndex === state.selected.tabIndex && state.selected.path.length === 0 ? " active" : "");
      tabItem.textContent = "Tab: " + (tab.title || "Tab");
      tabItem.addEventListener("click", () => {
        state.selected = { tabIndex: tIndex, path: [] };
        renderAll();
      });
      structureEl.appendChild(tabItem);

      (tab.items || []).forEach((item, i) => {
        renderStructureItem(item, tIndex, [i], 1, filter);
      });
    });
  }

  function renderStructureItem(item, tabIndex, path, depth, filter) {
    const div = document.createElement("div");
    div.className = "structure-item" + (tabIndex === state.selected.tabIndex && isSamePath(path, state.selected.path) ? " active" : "");
    div.style.marginLeft = (depth * 10) + "px";
    div.textContent = (item.type || "item") + (item.title ? ": " + item.title : "");
    if (filter && !div.textContent.toLowerCase().includes(filter)) {
      div.classList.add("dim");
    }
    div.addEventListener("click", () => {
      state.selected = { tabIndex, path: path.slice() };
      renderAll();
    });
    div.draggable = true;
    div.addEventListener("dragstart", (e) => {
      state.drag = { tabIndex, path: path.slice() };
      e.dataTransfer.effectAllowed = "move";
    });
    div.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    div.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!state.drag) return;
      moveItemByPath(state.drag, { tabIndex, path: path.slice() });
      state.drag = null;
    });
    structureEl.appendChild(div);

    if (item.type === "group" && Array.isArray(item.items)) {
      item.items.forEach((child, idx) => {
        renderStructureItem(child, tabIndex, path.concat(idx), depth + 1, filter);
      });
    }
  }

  function moveItemByPath(from, to) {
    if (!from || !to) return;
    if (from.tabIndex !== to.tabIndex) return;
    const tab = getTab(from.tabIndex);
    if (!tab) return;
    const fromParent = from.path.slice(0, -1);
    const toParent = to.path.slice(0, -1);
    if (!isSamePath(fromParent, toParent)) return;
    const list = fromParent.length ? (getItemByPath(tab.items, fromParent).items || []) : tab.items;
    const fromIdx = from.path[from.path.length - 1];
    const toIdx = to.path[to.path.length - 1];
    if (!list[fromIdx]) return;
    const [item] = list.splice(fromIdx, 1);
    const insertIdx = fromIdx < toIdx ? toIdx - 1 : toIdx;
    list.splice(insertIdx, 0, item);
    state.selected = { tabIndex: from.tabIndex, path: fromParent.concat(insertIdx) };
    renderAll();
  }

  function isSamePath(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function renderProperties() {
    propsEl.innerHTML = "";
    const tab = getTab(state.selected.tabIndex);
    if (!tab) return;

    if (state.selected.path === null) {
      const windowGroup = makeGroup("Window");
      windowGroup.body.appendChild(makeTextField("Title", data.window?.title || "", value => { data.window.title = value; renderHeaderOnly(); }, "Window title text"));
      windowGroup.body.appendChild(makeTextField("Author", data.window?.author || "", value => { data.window.author = value; renderPreviewAndStructure(); }, "Optional author string"));
      windowGroup.body.appendChild(makeTextField("Folder", data.window?.folder || "", value => { data.window.folder = value; renderPreviewAndStructure(); }, "Folder name for configs"));
      windowGroup.body.appendChild(makeTextField("Theme", data.window?.theme || "", value => { data.window.theme = value; renderPreviewAndStructure(); }, "Theme name (e.g. Dark)"));
      windowGroup.body.appendChild(makeTextField("Size (lua:UDim2...)", data.window?.size || "", value => { data.window.size = value; renderPreviewAndStructure(); }, "lua:UDim2.fromOffset(580,460)"));
      windowGroup.body.appendChild(makeTextField("MinSize (lua:Vector2...)", data.window?.minSize || "", value => { data.window.minSize = value; renderPreviewAndStructure(); }, "lua:Vector2.new(560,350)"));
      windowGroup.body.appendChild(makeTextField("MaxSize (lua:Vector2...)", data.window?.maxSize || "", value => { data.window.maxSize = value; renderPreviewAndStructure(); }, "lua:Vector2.new(850,560)"));
      windowGroup.body.appendChild(makeCheckboxField("Transparent", !!data.window?.transparent, value => { data.window.transparent = value; renderAll(); }));
      windowGroup.body.appendChild(makeCheckboxField("Resizable", data.window?.resizable !== false, value => { data.window.resizable = value; renderAll(); }));
      windowGroup.body.appendChild(makeNumberField("SideBarWidth", data.window?.sideBarWidth ?? "", value => { data.window.sideBarWidth = value; renderPreviewAndStructure(); }, "Number (e.g. 200)", 0));
      windowGroup.body.appendChild(makeTextField("Background", data.window?.background || "", value => { data.window.background = value; renderPreviewAndStructure(); }, "rbxassetid:// or video:URL"));
      windowGroup.body.appendChild(makeNumberField("BackgroundImageTransparency", data.window?.backgroundImageTransparency ?? "", value => { data.window.backgroundImageTransparency = value; renderPreviewAndStructure(); }, "0..1", 0, 1));
      windowGroup.body.appendChild(makeCheckboxField("HideSearchBar", !!data.window?.hideSearchBar, value => { data.window.hideSearchBar = value; renderAll(); }));
      windowGroup.body.appendChild(makeCheckboxField("ScrollBarEnabled", !!data.window?.scrollBarEnabled, value => { data.window.scrollBarEnabled = value; renderAll(); }));
      propsEl.appendChild(windowGroup.container);

      const tagsGroup = makeGroup("Tags");
      const tagsField = document.createElement("div");
      tagsField.className = "props-field";
      const tagsLabel = document.createElement("label");
      tagsLabel.textContent = "Tags (title|color|radius per line)";
      const tagsArea = document.createElement("textarea");
      tagsArea.className = "textarea";
      tagsArea.rows = 3;
      tagsArea.value = (data.window?.tags || [])
        .map(t => [t.title || t.text || "", t.color || "", t.radius ?? ""].join("|").replace(/\|+$/, ""))
        .join("\n");
      tagsArea.addEventListener("input", () => {
        const tags = tagsArea.value.split("\n").map(v => v.trim()).filter(Boolean);
        data.window.tags = tags.map(line => {
          const parts = line.split("|").map(v => v.trim());
          const tag = { title: parts[0] || "Tag" };
          if (parts[1]) tag.color = parts[1];
          if (parts[2]) {
            const n = Number(parts[2]);
            tag.radius = Number.isNaN(n) ? parts[2] : n;
          }
          return tag;
        });
        renderHeaderOnly();
      });
      tagsField.appendChild(tagsLabel);
      tagsField.appendChild(tagsArea);
      tagsField.appendChild(makeHelp("Example: v1.2|#ff8a00|8"));
      tagsGroup.body.appendChild(tagsField);
      propsEl.appendChild(tagsGroup.container);
      return;
    }

    if (!state.selected.path.length) {
      const tabGroup = makeGroup("Tab");
      tabGroup.body.appendChild(makeTextField("Title", tab.title || "", value => { tab.title = value; renderPreviewAndStructure(); }, "Tab title"));
      tabGroup.body.appendChild(makeCheckboxField("Locked", !!tab.locked, value => { tab.locked = value; renderAll(); }));
      tabGroup.body.appendChild(makeTextField("Tab Section (builder)", tab.section || "Main", value => { tab.section = value; renderPreviewAndStructure(); }, "Groups tabs in sidebar section"));
      propsEl.appendChild(tabGroup.container);
      return;
    }

    const item = getSelectedItem();
    if (!item) return;

    const elementGroup = makeGroup("Element: " + item.type);
    const fields = getFieldsForItem(item);
    fields.forEach(field => {
      elementGroup.body.appendChild(buildField(field, item));
    });
    propsEl.appendChild(elementGroup.container);
  }

  function makeGroup(title) {
    const container = document.createElement("div");
    container.className = "props-group";
    const head = document.createElement("div");
    head.className = "props-group-title";
    head.textContent = title;
    const body = document.createElement("div");
    body.className = "props-group-body";
    container.appendChild(head);
    container.appendChild(body);
    return { container, body };
  }

  function getFieldsForItem(item) {
    if (item.type === "section") {
      return [
        { key: "title", label: "Title", type: "text", help: "Section title" },
        { key: "box", label: "Box", type: "checkbox" },
        { key: "fontWeight", label: "FontWeight", type: "select", options: ["Regular", "Semibold", "Bold"], help: "Regular/Semibold/Bold" },
        { key: "textTransparency", label: "TextTransparency", type: "number", help: "0..1", min: 0, max: 1 },
        { key: "textXAlignment", label: "TextXAlignment", type: "select", options: ["Left", "Center", "Right"], help: "Left/Center/Right" },
        { key: "textSize", label: "TextSize", type: "number", help: "Number (e.g. 18)", min: 0 },
        { key: "opened", label: "Opened", type: "checkbox" }
      ];
    }

    if (item.type === "group") {
      return [
        { key: "title", label: "Title", type: "text", help: "Builder-only group title" }
      ];
    }

    if (item.type === "paragraph") {
      return [
        { key: "title", label: "Title", type: "text", help: "Paragraph title" },
        { key: "desc", label: "Desc", type: "textarea", help: "Paragraph description" },
        { key: "color", label: "Color (name or #hex)", type: "text", help: "Name or #RRGGBB", validate: "color" },
        { key: "image", label: "Image", type: "text", help: "rbxassetid:// or URL" },
        { key: "imageSize", label: "ImageSize", type: "number", help: "Number (e.g. 20)", min: 0 },
        { key: "thumbnail", label: "Thumbnail", type: "text", help: "rbxassetid:// or URL" },
        { key: "thumbnailSize", label: "ThumbnailSize", type: "number", help: "Number (e.g. 80)", min: 0 },
        { key: "buttons", label: "Buttons (one per line)", type: "buttons", help: "One per line" },
        { key: "locked", label: "Locked", type: "checkbox" }
      ];
    }

    if (item.type === "image") {
      return [
        { key: "src", label: "Image src", type: "text", help: "rbxassetid:// or URL" },
        { key: "aspectRatio", label: "AspectRatio", type: "ratio", options: ["16:9", "4:3", "1:1", "3:2", "21:9"], help: "16:9 or 1.777" },
        { key: "radius", label: "Radius", type: "number", help: "Corner radius", min: 0 }
      ];
    }

    if (item.type === "divider") return [];
    if (item.type === "space") return [];

    if (item.type === "code") {
      return [
        { key: "title", label: "Title", type: "text", help: "Filename/title" },
        { key: "code", label: "Code", type: "textarea", help: "Code content" },
        { key: "onCopy", label: "OnCopy (stub)", type: "checkbox" }
      ];
    }

    if (item.type === "video") {
      return [
        { key: "src", label: "Video src", type: "text" }
      ];
    }

    if (item.type === "button") {
      return [
        { key: "title", label: "Title", type: "text" },
        { key: "desc", label: "Desc", type: "text" },
        { key: "locked", label: "Locked", type: "checkbox" },
        { key: "callback", label: "Callback (stub)", type: "checkbox" }
      ];
    }

    if (item.type === "toggle") {
      return [
        { key: "title", label: "Title", type: "text" },
        { key: "desc", label: "Desc", type: "text" },
        { key: "typeValue", label: "Type (Toggle/Checkbox)", type: "select", options: ["Toggle", "Checkbox"], help: "Toggle or Checkbox" },
        { key: "value", label: "Value", type: "checkbox", help: "true/false" },
        { key: "locked", label: "Locked", type: "checkbox" },
        { key: "callback", label: "Callback (stub)", type: "checkbox" }
      ];
    }

    if (item.type === "slider") {
      return [
        { key: "title", label: "Title", type: "text" },
        { key: "desc", label: "Desc", type: "text" },
        { key: "min", label: "Min", type: "number", help: "Min value" },
        { key: "max", label: "Max", type: "number", help: "Max value" },
        { key: "value", label: "Default", type: "number", help: "Default value" },
        { key: "step", label: "Step", type: "number", help: "Step (e.g. 1)", min: 0 },
        { key: "locked", label: "Locked", type: "checkbox" },
        { key: "callback", label: "Callback (stub)", type: "checkbox" }
      ];
    }

    if (item.type === "input" || item.type === "textarea") {
      return [
        { key: "title", label: "Title", type: "text" },
        { key: "desc", label: "Desc", type: "text" },
        { key: "value", label: "Value", type: "text", help: "Default value" },
        { key: "inputType", label: "Type", type: "select", options: ["Input", "Textarea"], help: "Input or Textarea" },
        { key: "placeholder", label: "Placeholder", type: "text", help: "Placeholder text" },
        { key: "callback", label: "Callback (stub)", type: "checkbox" }
      ];
    }

    if (item.type === "dropdown") {
      return [
        { key: "title", label: "Title", type: "text" },
        { key: "desc", label: "Desc", type: "text" },
        { key: "options", label: "Values (one per line)", type: "list", help: "Values list" },
        { key: "value", label: "Value", type: "text", help: "Selected value" },
        { key: "multi", label: "Multi", type: "checkbox", help: "Multi-select" },
        { key: "allowNone", label: "AllowNone", type: "checkbox", help: "Allow none" },
        { key: "callback", label: "Callback (stub)", type: "checkbox" }
      ];
    }

    if (item.type === "colorpicker") {
      return [
        { key: "title", label: "Title", type: "text" },
        { key: "desc", label: "Desc", type: "text" },
        { key: "value", label: "Default", type: "text", help: "#RRGGBB or name", validate: "color" },
        { key: "transparency", label: "Transparency", type: "number", help: "0..1", min: 0, max: 1 },
        { key: "locked", label: "Locked", type: "checkbox" },
        { key: "callback", label: "Callback (stub)", type: "checkbox" }
      ];
    }

    if (item.type === "keybind") {
      return [
        { key: "title", label: "Title", type: "text" },
        { key: "desc", label: "Desc", type: "text" },
        { key: "value", label: "Value", type: "text", help: "Key name (e.g. G)" },
        { key: "locked", label: "Locked", type: "checkbox" },
        { key: "callback", label: "Callback (stub)", type: "checkbox" }
      ];
    }

    return [];
  }

  function buildField(field, item) {
    const wrap = document.createElement("div");
    wrap.className = "props-field";

    const label = document.createElement("label");
    label.textContent = field.label;
    wrap.appendChild(label);

    if (field.type === "checkbox") {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!item[field.key];
      input.addEventListener("change", () => {
        item[field.key] = input.checked;
        normalizeItem(item);
        renderAll();
      });
      wrap.appendChild(input);
      if (field.help) wrap.appendChild(makeHelp(field.help));
      return wrap;
    }

    if (field.type === "select") {
      const select = document.createElement("select");
      select.className = "dropdown";
      (field.options || []).forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        select.appendChild(o);
      });
      select.value = item[field.key] || (field.options ? field.options[0] : "");
      select.addEventListener("change", () => {
        item[field.key] = select.value;
        normalizeItem(item);
        renderPreviewAndStructure();
      });
      wrap.appendChild(select);
      if (field.help) wrap.appendChild(makeHelp(field.help));
      return wrap;
    }

    if (field.type === "ratio") {
      const select = document.createElement("select");
      select.className = "dropdown";
      const custom = document.createElement("option");
      custom.value = "__custom__";
      custom.textContent = "Custom";
      select.appendChild(custom);
      (field.options || []).forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        select.appendChild(o);
      });
      const input = document.createElement("input");
      input.className = "input";
      input.type = "text";
      input.placeholder = "e.g. 16:9 or 1.777";
      input.value = item[field.key] ?? "";
      select.value = (field.options || []).includes(input.value) ? input.value : "__custom__";

      const error = document.createElement("div");
      error.className = "field-error";

      const applyRatio = () => {
        const raw = input.value.trim();
        const ok = validateValue("ratio", raw);
        input.classList.toggle("invalid", !ok);
        error.textContent = ok ? "" : "Invalid ratio";
        if (!ok && raw !== "") return;
        item[field.key] = raw;
        normalizeItem(item);
        renderPreviewAndStructure();
      };

      select.addEventListener("change", () => {
        if (select.value === "__custom__") return;
        input.value = select.value;
        applyRatio();
      });
      input.addEventListener("input", applyRatio);

      wrap.appendChild(select);
      wrap.appendChild(input);
      wrap.appendChild(error);
      if (field.help) wrap.appendChild(makeHelp(field.help));
      return wrap;
    }


    if (field.type === "textarea") {
      const area = document.createElement("textarea");
      area.className = "textarea";
      area.rows = 3;
      area.value = item[field.key] || "";
      area.addEventListener("input", () => {
        item[field.key] = area.value;
        normalizeItem(item);
        renderPreviewAndStructure();
      });
      wrap.appendChild(area);
      if (field.help) wrap.appendChild(makeHelp(field.help));
      return wrap;
    }

    if (field.type === "list") {
      const area = document.createElement("textarea");
      area.className = "textarea";
      area.rows = 3;
      area.value = (item[field.key] || []).join("\n");
      area.addEventListener("input", () => {
        item[field.key] = area.value.split("\n").map(v => v.trim()).filter(Boolean);
        normalizeItem(item);
        renderPreviewAndStructure();
      });
      wrap.appendChild(area);
      if (field.help) wrap.appendChild(makeHelp(field.help));
      return wrap;
    }

    if (field.type === "buttons") {
      const area = document.createElement("textarea");
      area.className = "textarea";
      area.rows = 4;
      area.value = (item.buttons || []).map(b => b.title || "Button").join("\n");
      area.addEventListener("input", () => {
        const lines = area.value.split("\n").map(v => v.trim()).filter(Boolean);
        item.buttons = lines.map(line => {
          const title = line.trim();
          return { title: title || "Button" };
        });
        normalizeItem(item);
        renderPreviewAndStructure();
      });
      wrap.appendChild(area);
      if (field.help) wrap.appendChild(makeHelp(field.help));
      return wrap;
    }

    const input = document.createElement("input");
    input.className = "input";
    input.type = field.type === "number" ? "number" : "text";
    if (field.type === "number") {
      if (field.min !== undefined) input.min = String(field.min);
      if (field.max !== undefined) input.max = String(field.max);
      input.step = field.step !== undefined ? String(field.step) : "any";
    }
    input.value = item[field.key] ?? "";
    const error = document.createElement("div");
    error.className = "field-error";
    const applyValue = () => {
      const raw = input.value;
      if (field.type === "number") {
        const num = raw === "" ? "" : Number(raw);
        let ok = true;
        if (raw !== "" && Number.isNaN(num)) ok = false;
        if (ok && field.min !== undefined && num !== "" && num < field.min) ok = false;
        if (ok && field.max !== undefined && num !== "" && num > field.max) ok = false;
        input.classList.toggle("invalid", !ok);
        error.textContent = ok ? "" : "Out of range";
        if (!ok) return;
        item[field.key] = num;
        normalizeItem(item);
        renderPreviewAndStructure();
        return;
      }
      if (field.validate) {
        const ok = validateValue(field.validate, raw);
        input.classList.toggle("invalid", !ok);
        error.textContent = ok ? "" : "Invalid value";
        if (!ok && raw !== "") return;
      }
      item[field.key] = raw;
      normalizeItem(item);
      renderPreviewAndStructure();
    };
    input.addEventListener("input", () => {
      applyValue();
    });
    wrap.appendChild(input);
    wrap.appendChild(error);
    if (field.help) wrap.appendChild(makeHelp(field.help));
    return wrap;
  }

  function makeTextField(labelText, value, onChange, help) {
    const wrap = document.createElement("div");
    wrap.className = "props-field";
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.className = "input";
    input.value = value;
    input.addEventListener("input", () => onChange(input.value));
    wrap.appendChild(label);
    wrap.appendChild(input);
    if (help) wrap.appendChild(makeHelp(help));
    return wrap;
  }

  function makeNumberField(labelText, value, onChange, help, min, max) {
    const wrap = document.createElement("div");
    wrap.className = "props-field";
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.className = "input";
    input.type = "number";
    if (min !== undefined) input.min = String(min);
    if (max !== undefined) input.max = String(max);
    input.step = "any";
    input.value = value ?? "";
    input.addEventListener("input", () => {
      const v = input.value.trim();
      const num = v === "" ? "" : Number(v);
      if (num !== "" && Number.isNaN(num)) return;
      if (min !== undefined && num !== "" && num < min) return;
      if (max !== undefined && num !== "" && num > max) return;
      onChange(num);
    });
    wrap.appendChild(label);
    wrap.appendChild(input);
    if (help) wrap.appendChild(makeHelp(help));
    return wrap;
  }

  function makeCheckboxField(labelText, value, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "props-field";
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!value;
    input.addEventListener("change", () => onChange(input.checked));
    wrap.appendChild(label);
    wrap.appendChild(input);
    if (labelText && labelText.toLowerCase().includes("transparent")) {
      wrap.appendChild(makeHelp("true/false"));
    }
    return wrap;
  }

  function makeHelp(text) {
    const small = document.createElement("div");
    small.className = "props-help";
    small.textContent = text;
    return small;
  }

  function clamp01(n) {
    if (typeof n !== "number" || Number.isNaN(n)) return n;
    return Math.max(0, Math.min(1, n));
  }

  function validateValue(kind, value) {
    const v = String(value || "").trim();
    if (!v) return true;
    if (kind === "ratio") {
      if (v.includes(":")) {
        const parts = v.split(":").map(p => p.trim());
        if (parts.length !== 2) return false;
        const a = Number(parts[0]);
        const b = Number(parts[1]);
        return Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0;
      }
      const n = Number(v);
      return Number.isFinite(n) && n > 0;
    }
    if (kind === "color") {
      if (v.startsWith("#")) {
        return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v);
      }
      return /^[a-zA-Z][a-zA-Z0-9_-]{1,24}$/.test(v);
    }
    return true;
  }

  function normalizeItem(item) {
    if (!item || !item.type) return;

    if (item.type === "toggle") {
      const t = String(item.typeValue || "Toggle");
      const normalized = t.toLowerCase() === "checkbox" ? "Checkbox" : "Toggle";
      item.type = "toggle";
      item.typeValue = normalized;
    }

    if (item.type === "section") {
      if (item.textXAlignment) {
        const v = String(item.textXAlignment).toLowerCase();
        item.textXAlignment = v === "center" ? "Center" : v === "right" ? "Right" : "Left";
      }
      if (typeof item.textTransparency === "number") item.textTransparency = clamp01(item.textTransparency);
    }

    if (item.type === "paragraph") {
      if (!item.title && item.text) item.title = item.text;
    }

    if (item.type === "button") {
      if (item.justify) {
        const v = String(item.justify).toLowerCase();
        item.justify = v === "center" ? "Center" : v === "left" ? "Left" : v === "right" ? "Right" : "Between";
      }
      if (item.size) {
        const v = String(item.size).toLowerCase();
        item.size = v === "small" ? "Small" : v === "large" ? "Large" : "Default";
      }
    }

    if (item.type === "slider") {
      if (typeof item.isTextbox === "string") {
        item.isTextbox = item.isTextbox.toLowerCase() !== "false";
      }
      if (typeof item.isTooltip === "string") {
        item.isTooltip = item.isTooltip.toLowerCase() === "true";
      }
    }

    if (item.type === "colorpicker") {
      if (typeof item.transparency === "number") item.transparency = clamp01(item.transparency);
    }

    if (item.type === "dropdown") {
      if (typeof item.menuWidth === "number" && item.menuWidth < 0) item.menuWidth = 0;
    }

    if (item.type === "input" || item.type === "textarea") {
      const v = String(item.inputType || (item.type === "textarea" ? "Textarea" : "Input")).toLowerCase();
      item.inputType = v === "textarea" ? "Textarea" : "Input";
    }
  }

  function addElement(type) {
    const tab = getTab(state.selected.tabIndex);
    if (!tab) return;

    const element = JSON.parse(JSON.stringify(ELEMENT_DEFAULTS[type] || { type: type.toLowerCase(), title: type }));
    normalizeItem(element);
    const container = getInsertContainer();
    container.list.push(element);

    state.selected.path = container.path.concat(container.list.length - 1);

    renderAll();
  }

  addTabBtn.addEventListener("click", () => {
    data.tabs.push({ title: "New Tab", section: "Main", items: [] });
    state.selected = { tabIndex: data.tabs.length - 1, path: [] };
    renderAll();
  });

  addSectionBtn.addEventListener("click", () => addElement("Section"));
  addItemBtn.addEventListener("click", () => addElement(addTypeSelect.value || "Button"));

  duplicateItemBtn.addEventListener("click", () => {
    if (!state.selected.path.length) return;
    const container = getSelectedContainer();
    const index = state.selected.path[state.selected.path.length - 1];
    const item = container.list[index];
    if (!item) return;
    const copy = JSON.parse(JSON.stringify(item));
    container.list.splice(index + 1, 0, copy);
    state.selected.path[state.selected.path.length - 1] = index + 1;
    renderAll();
  });

  moveUpBtn.addEventListener("click", () => {
    if (!state.selected.path.length) return;
    const container = getSelectedContainer();
    const index = state.selected.path[state.selected.path.length - 1];
    if (index <= 0) return;
    const temp = container.list[index - 1];
    container.list[index - 1] = container.list[index];
    container.list[index] = temp;
    state.selected.path[state.selected.path.length - 1] = index - 1;
    renderAll();
  });

  moveDownBtn.addEventListener("click", () => {
    if (!state.selected.path.length) return;
    const container = getSelectedContainer();
    const index = state.selected.path[state.selected.path.length - 1];
    if (index >= container.list.length - 1) return;
    const temp = container.list[index + 1];
    container.list[index + 1] = container.list[index];
    container.list[index] = temp;
    state.selected.path[state.selected.path.length - 1] = index + 1;
    renderAll();
  });

  deleteItemBtn.addEventListener("click", () => {
    const tab = getTab(state.selected.tabIndex);
    if (!tab) return;
    if (!state.selected.path.length) return;
    const container = getSelectedContainer();
    const index = state.selected.path[state.selected.path.length - 1];
    container.list.splice(index, 1);
    state.selected.path = [];
    renderAll();
  });

  copyLuaBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(buildLua(data));
    } catch (e) {
      console.warn("Clipboard failed", e);
    }
  });

  downloadLuaBtn.addEventListener("click", () => {
    const blob = new Blob([buildLua(data)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "windui-preview.lua";
    a.click();
    URL.revokeObjectURL(url);
  });


  structureFilter.addEventListener("input", () => renderStructure());

  function applyZoom() {
    const z = Math.max(0.25, Math.min(2.5, state.zoom));
    state.zoom = z;
    canvasItem.style.transform = "scale(" + z.toFixed(3) + ")";
    zoomLabel.textContent = Math.round(z * 100) + "%";
  }

  function fitToCanvas() {
    const canvasRect = canvas.getBoundingClientRect();
    const itemRect = document.getElementById("window").getBoundingClientRect();
    const availW = canvasRect.width - 64;
    const availH = canvasRect.height - 64;
    const scale = Math.min(availW / itemRect.width, availH / itemRect.height, 1);
    state.zoom = Math.max(0.25, scale);
    applyZoom();
  }

  sideTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      sideTabs.forEach(b => b.classList.toggle("active", b === btn));
      sidePanels.forEach(p => p.classList.toggle("active", p.getAttribute("data-panel") === target));
    });
  });
  zoomInBtn.addEventListener("click", () => {
    state.zoom += 0.1;
    applyZoom();
  });
  zoomOutBtn.addEventListener("click", () => {
    state.zoom -= 0.1;
    applyZoom();
  });
  zoomResetBtn.addEventListener("click", () => {
    state.zoom = 1;
    applyZoom();
  });
  zoomFitBtn.addEventListener("click", () => {
    fitToCanvas();
  });

  canvas.addEventListener("click", (e) => {
    if (e.target === canvas || e.target.id === "canvas-inner") {
      state.selected = { tabIndex: state.selected.tabIndex, path: null };
      renderAll();
    }
  });

  function renderAll() {
    setWindowHeader();
    renderTabs();
    renderPreview();
    renderPalette();
    renderStructure();
    renderProperties();
  }

  function renderPreviewAndStructure() {
    renderPreview();
    renderStructure();
  }

  function renderHeaderOnly() {
    setWindowHeader();
  }

  ELEMENT_TYPES.forEach(type => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    addTypeSelect.appendChild(opt);
  });
  addTypeSelect.value = "Button";

  renderAll();
  applyZoom();

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
  }

  document.addEventListener("keydown", (e) => {
    if (isTypingTarget(document.activeElement)) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteItemBtn.click();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
      e.preventDefault();
      duplicateItemBtn.click();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
      e.preventDefault();
      zoomInBtn.click();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "-") {
      e.preventDefault();
      zoomOutBtn.click();
      return;
    }
  });


  function luaString(value) {
    if (value === null || value === undefined) return "nil";
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    const s = String(value)
      .replace(/\\/g, "\\\\")
      .replace(/\"/g, "\\\"")
      .replace(/\n/g, "\\n");
    return "\"" + s + "\"";
  }

  function luaValue(value) {
    if (value === null || value === undefined) return "nil";
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    const s = String(value).trim();
    if (s.startsWith("lua:")) return s.slice(4);
    if (s.startsWith("UDim2.") || s.startsWith("Color3.") || s.startsWith("ColorSequence.") || s.startsWith("Vector2.") || s.startsWith("NumberSequence.")) {
      return s;
    }
    return luaString(s);
  }

  function luaList(arr, mapper) {
    if (!Array.isArray(arr) || !arr.length) return "{}";
    const parts = arr.map(v => mapper ? mapper(v) : luaString(v));
    return "{ " + parts.join(", ") + " }";
  }

  function luaColor(value) {
    if (!value) return "nil";
    const v = String(value);
    if (v.startsWith("#")) {
      return "Color3.fromHex(" + luaString(v) + ")";
    }
    if (v.startsWith("lua:")) return v.slice(4);
    if (v.startsWith("Color3.")) return v;
    return luaString(v);
  }

  function safeName(name) {
    return (name || "item")
      .toString()
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/^(\d)/, "_$1");
  }

  function buildLua(model) {
    const lines = [];
    lines.push("local WindUI = loadstring(game:HttpGet(\"https://github.com/Footagesus/WindUI/releases/latest/download/main.lua\"))()");
    lines.push("if not WindUI then return end");
    lines.push("");
    lines.push("local Window = WindUI:CreateWindow({");
    lines.push("    Title = " + luaString(model.window?.title || "WindUI") + ",");
    if (model.window?.author) lines.push("    Author = " + luaString(model.window.author) + ",");
    if (model.window?.folder) lines.push("    Folder = " + luaString(model.window.folder) + ",");
    if (model.window?.theme) lines.push("    Theme = " + luaString(model.window.theme) + ",");
    if (model.window?.size) lines.push("    Size = " + luaValue(model.window.size) + ",");
    if (model.window?.minSize) lines.push("    MinSize = " + luaValue(model.window.minSize) + ",");
    if (model.window?.maxSize) lines.push("    MaxSize = " + luaValue(model.window.maxSize) + ",");
    if (model.window?.resizable !== undefined) lines.push("    Resizable = " + (model.window.resizable ? "true" : "false") + ",");
    if (model.window?.scrollBarEnabled !== undefined) lines.push("    ScrollBarEnabled = " + (model.window.scrollBarEnabled ? "true" : "false") + ",");
    if (model.window?.hideSearchBar !== undefined) lines.push("    HideSearchBar = " + (model.window.hideSearchBar ? "true" : "false") + ",");
    if (model.window?.sideBarWidth) lines.push("    SideBarWidth = " + luaValue(model.window.sideBarWidth) + ",");
    if (model.window?.transparent !== undefined) lines.push("    Transparent = " + (model.window.transparent ? "true" : "false") + ",");
    if (model.window?.background) lines.push("    Background = " + luaString(model.window.background) + ",");
    if (model.window?.backgroundImageTransparency !== undefined) lines.push("    BackgroundImageTransparency = " + luaValue(model.window.backgroundImageTransparency) + ",");
    lines.push("})");
    lines.push("");

    if (Array.isArray(model.window?.tags)) {
      model.window.tags.forEach(tag => {
        lines.push("Window:Tag({");
        lines.push("    Title = " + luaString(tag.title || tag.text || "Tag") + ",");
        if (tag.color) lines.push("    Color = " + luaColor(tag.color) + ",");
        if (tag.radius !== undefined) lines.push("    Radius = " + luaValue(tag.radius) + ",");
        lines.push("})");
      });
      lines.push("");
    }

    const sectionMap = new Map();
    (model.tabs || []).forEach(tab => {
      const sectionName = (tab.section || "Main").trim() || "Main";
      if (!sectionMap.has(sectionName)) sectionMap.set(sectionName, []);
      sectionMap.get(sectionName).push(tab);
    });

    const sectionVars = new Map();
    for (const [sectionName] of sectionMap) {
      const varName = "Section_" + safeName(sectionName);
      sectionVars.set(sectionName, varName);
      lines.push("local " + varName + " = Window:Section({ Title = " + luaString(sectionName) + ", Opened = true })");
    }
    if (sectionMap.size) lines.push("");

    const tabVars = new Map();
    let tabIndex = 0;
    for (const [sectionName, tabs] of sectionMap) {
      const sectionVar = sectionVars.get(sectionName);
      for (const tab of tabs) {
        tabIndex += 1;
        const tabVar = "Tab_" + tabIndex;
        tabVars.set(tab, tabVar);
        lines.push("local " + tabVar + " = " + sectionVar + ":Tab({");
        lines.push("    Title = " + luaString(tab.title || "Tab") + ",");
        if (tab.locked) lines.push("    Locked = true,");
        lines.push("})");
      }
    }
    if (tabIndex) lines.push("");

    for (const tab of (model.tabs || [])) {
      const tabVar = tabVars.get(tab);
      if (!tabVar) continue;
      lines.push("-- " + (tab.title || "Tab"));
      lines.push(emitItems(tabVar, tab.items || [], 0));
      lines.push("");
    }

    return lines.filter(Boolean).join("\n");
  }

  function emitItems(parentVar, items, depth) {
    const out = [];
    items.forEach((item, idx) => {
      const indent = "    ".repeat(depth);
      const varSuffix = depth + "_" + idx;
      switch (item.type) {
        case "section":
          out.push(indent + parentVar + ":Section({");
          out.push(indent + "    Title = " + luaString(item.title || "Section") + ",");
          if (item.box !== undefined) out.push(indent + "    Box = " + (item.box ? "true" : "false") + ",");
          if (item.fontWeight) out.push(indent + "    FontWeight = " + luaString(item.fontWeight) + ",");
          if (item.textTransparency !== undefined) out.push(indent + "    TextTransparency = " + luaValue(item.textTransparency) + ",");
          if (item.textXAlignment) out.push(indent + "    TextXAlignment = " + luaString(item.textXAlignment) + ",");
          if (item.textSize) out.push(indent + "    TextSize = " + luaValue(item.textSize) + ",");
          if (item.opened !== undefined) out.push(indent + "    Opened = " + (item.opened ? "true" : "false") + ",");
          out.push(indent + "})");
          break;
        case "paragraph":
          out.push(indent + parentVar + ":Paragraph({");
          out.push(indent + "    Title = " + luaString(item.title || item.text || "Paragraph") + ",");
          if (item.desc) out.push(indent + "    Desc = " + luaString(item.desc) + ",");
          if (item.color) out.push(indent + "    Color = " + luaColor(item.color) + ",");
          if (item.image) out.push(indent + "    Image = " + luaString(item.image) + ",");
          if (item.imageSize) out.push(indent + "    ImageSize = " + luaValue(item.imageSize) + ",");
          if (item.thumbnail) out.push(indent + "    Thumbnail = " + luaString(item.thumbnail) + ",");
          if (item.thumbnailSize) out.push(indent + "    ThumbnailSize = " + luaValue(item.thumbnailSize) + ",");
          if (Array.isArray(item.buttons) && item.buttons.length) {
            out.push(indent + "    Buttons = {");
            item.buttons.forEach(btn => {
              out.push(indent + "        {");
              out.push(indent + "            Title = " + luaString(btn.title || "Button") + ",");
              out.push(indent + "            Callback = function() end,");
              out.push(indent + "        },");
            });
            out.push(indent + "    },");
          }
          if (item.locked) out.push(indent + "    Locked = true,");
          out.push(indent + "})");
          break;
        case "divider":
          out.push(indent + parentVar + ":Divider()");
          break;
        case "space":
          out.push(indent + parentVar + ":Space()");
          break;
        case "image":
          if (item.src && (item.src.startsWith("http") || item.src.startsWith("rbxassetid://"))) {
            out.push(indent + parentVar + ":Image({");
            out.push(indent + "    Image = " + luaString(item.src) + ",");
            if (item.aspectRatio) out.push(indent + "    AspectRatio = " + luaString(item.aspectRatio) + ",");
            if (item.radius !== undefined) out.push(indent + "    Radius = " + luaValue(item.radius) + ",");
            out.push(indent + "})");
          } else {
            out.push(indent + "-- TODO: replace local image path with rbxassetid:// or https URL");
            out.push(indent + parentVar + ":Image({ Image = \"\" })");
          }
          break;
        case "code":
          out.push(indent + parentVar + ":Code({");
          out.push(indent + "    Title = " + luaString(item.title || "code") + ",");
          out.push(indent + "    Code = " + luaString(item.code || "") + ",");
          if (item.onCopy) out.push(indent + "    OnCopy = function() end,");
          out.push(indent + "})");
          break;
        case "group": {
          const grpVar = parentVar + "_Group" + varSuffix;
          out.push(indent + "local " + grpVar + " = " + parentVar + ":Group({})");
          out.push(emitItems(grpVar, item.items || [], depth + 1));
          break;
        }
        case "button":
          out.push(indent + parentVar + ":Button({");
          out.push(indent + "    Title = " + luaString(item.title || "Button") + ",");
          if (item.desc) out.push(indent + "    Desc = " + luaString(item.desc) + ",");
          if (item.locked) out.push(indent + "    Locked = true,");
          if (item.callback) out.push(indent + "    Callback = function() end,");
          out.push(indent + "})");
          break;
        case "toggle":
          out.push(indent + parentVar + ":Toggle({");
          out.push(indent + "    Title = " + luaString(item.title || "Toggle") + ",");
          if (item.desc) out.push(indent + "    Desc = " + luaString(item.desc) + ",");
          {
            const t = String(item.typeValue || "Toggle");
            const normalized = t.toLowerCase() === "checkbox" ? "Checkbox" : "Toggle";
            out.push(indent + "    Type = " + luaString(normalized) + ",");
          }
          out.push(indent + "    Value = " + (item.value ? "true" : "false") + ",");
          if (item.locked) out.push(indent + "    Locked = true,");
          if (item.callback) out.push(indent + "    Callback = function() end,");
          out.push(indent + "})");
          break;
        case "input":
          out.push(indent + parentVar + ":Input({");
          out.push(indent + "    Title = " + luaString(item.title || "Input") + ",");
          if (item.desc) out.push(indent + "    Desc = " + luaString(item.desc) + ",");
          if (item.value) out.push(indent + "    Value = " + luaString(item.value) + ",");
          if (item.inputType && item.inputType !== "Input") out.push(indent + "    Type = " + luaString(item.inputType) + ",");
          out.push(indent + "    Placeholder = " + luaString(item.placeholder || "") + ",");
          if (item.callback) out.push(indent + "    Callback = function() end,");
          out.push(indent + "})");
          break;
        case "textarea":
          out.push(indent + parentVar + ":Input({");
          out.push(indent + "    Title = " + luaString(item.title || "Textarea") + ",");
          if (item.desc) out.push(indent + "    Desc = " + luaString(item.desc) + ",");
          if (item.value) out.push(indent + "    Value = " + luaString(item.value) + ",");
          out.push(indent + "    Type = \"Textarea\",");
          out.push(indent + "    Placeholder = " + luaString(item.placeholder || "") + ",");
          if (item.callback) out.push(indent + "    Callback = function() end,");
          out.push(indent + "})");
          break;
        case "dropdown":
          out.push(indent + parentVar + ":Dropdown({");
          out.push(indent + "    Title = " + luaString(item.title || "Dropdown") + ",");
          if (item.desc) out.push(indent + "    Desc = " + luaString(item.desc) + ",");
          out.push(indent + "    Values = " + luaList(item.options || []) + ",");
          if (item.value) out.push(indent + "    Value = " + luaString(item.value) + ",");
          if (item.multi) out.push(indent + "    Multi = true,");
          if (item.allowNone) out.push(indent + "    AllowNone = true,");
          if (item.callback) out.push(indent + "    Callback = function() end,");
          out.push(indent + "})");
          break;
        case "slider":
          out.push(indent + parentVar + ":Slider({");
          out.push(indent + "    Title = " + luaString(item.title || "Slider") + ",");
          if (item.desc) out.push(indent + "    Desc = " + luaString(item.desc) + ",");
          out.push(indent + "    Value = { Min = " + luaValue(item.min ?? 0) + ", Max = " + luaValue(item.max ?? 100) + ", Default = " + luaValue(item.value ?? 0) + " },");
          out.push(indent + "    Step = " + luaValue(item.step ?? 1) + ",");
          if (item.locked) out.push(indent + "    Locked = true,");
          if (item.callback) out.push(indent + "    Callback = function() end,");
          out.push(indent + "})");
          break;
        case "colorpicker":
          out.push(indent + parentVar + ":Colorpicker({");
          out.push(indent + "    Title = " + luaString(item.title || "Colorpicker") + ",");
          if (item.desc) out.push(indent + "    Desc = " + luaString(item.desc) + ",");
          out.push(indent + "    Default = " + luaColor(item.value) + ",");
          if (item.transparency !== undefined) out.push(indent + "    Transparency = " + luaValue(item.transparency) + ",");
          if (item.locked) out.push(indent + "    Locked = true,");
          if (item.callback) out.push(indent + "    Callback = function() end,");
          out.push(indent + "})");
          break;
        case "keybind":
          out.push(indent + parentVar + ":Keybind({");
          out.push(indent + "    Title = " + luaString(item.title || "Keybind") + ",");
          out.push(indent + "    Value = " + luaString(item.value || "G") + ",");
          if (item.desc) out.push(indent + "    Desc = " + luaString(item.desc) + ",");
          if (item.locked) out.push(indent + "    Locked = true,");
          if (item.callback) out.push(indent + "    Callback = function() end,");
          out.push(indent + "})");
          break;
        case "video":
          out.push(indent + parentVar + ":Video({ Video = " + luaString(item.src || "") + " })");
          break;
      }
    });
    return out.join("\n");
  }
})();
