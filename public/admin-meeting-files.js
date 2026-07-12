(function () {
  const tabButton = document.querySelector('[data-tab="meeting-files"]');
  const uploadInput = document.querySelector("#meeting-files-upload");
  const listNode = document.querySelector("#meeting-files-list");
  const statusNode = document.querySelector("#meeting-files-status");
  const maxBytes = 5 * 1024 * 1024;
  let files = [];
  let hasLoaded = false;

  if (!tabButton || !uploadInput || !listNode) return;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function setLocalStatus(message, kind = "") {
    statusNode.textContent = message;
    statusNode.className = `status${kind ? ` ${kind}` : ""}`;
  }

  function formatSize(size) {
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} КБ`;
    return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
  }

  function render() {
    if (!files.length) {
      listNode.innerHTML = '<tr><td colspan="3">Файлы ещё не добавлены.</td></tr>';
      return;
    }
    listNode.innerHTML = files.map((file) => `
      <tr>
        <td><span class="meeting-file-icon" aria-hidden="true">▣</span>${escapeHtml(file.name)}</td>
        <td>${formatSize(file.size)}</td>
        <td class="meeting-file-actions">
          <label class="icon-button" title="Заменить файл"><input type="file" data-replace-file="${escapeHtml(file.id)}" hidden /><span aria-hidden="true">↻</span></label>
          <button class="icon-button" type="button" title="Удалить файл" data-delete-file="${escapeHtml(file.id)}" aria-label="Удалить файл ${escapeHtml(file.name)}">×</button>
        </td>
      </tr>`).join("");
  }

  async function loadFiles(force = false) {
    if (hasLoaded && !force) return;
    const payload = await apiRequest("/api/meeting-files");
    files = payload.files || [];
    render();
    hasLoaded = true;
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.readAsDataURL(file);
    });
  }

  async function uploadFile(file, id = "") {
    if (!file) return;
    if (file.size > maxBytes) {
      setLocalStatus("Размер файла должен быть не больше 5 МБ.", "error");
      return;
    }
    setLocalStatus(id ? "Заменяю файл..." : "Добавляю файл...");
    try {
      const contentBase64 = await readFile(file);
      const payload = await apiRequest("/api/meeting-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: file.name, mimeType: file.type, contentBase64 }),
      });
      files = payload.files || [];
      render();
      setLocalStatus(id ? "Файл заменён. Он будет прикреплён к новым встречам." : "Файл добавлен. Он будет прикреплён к новым встречам.", "success");
    } catch (error) {
      setLocalStatus(error.message || "Не удалось сохранить файл.", "error");
    }
  }

  uploadInput.addEventListener("change", () => {
    uploadFile(uploadInput.files?.[0]).finally(() => { uploadInput.value = ""; });
  });

  listNode.addEventListener("change", (event) => {
    const input = event.target.closest("input[data-replace-file]");
    if (!input) return;
    uploadFile(input.files?.[0], input.dataset.replaceFile || "").finally(() => { input.value = ""; });
  });

  listNode.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-delete-file]");
    if (!button) return;
    setLocalStatus("Удаляю файл...");
    try {
      const payload = await apiRequest("/api/meeting-files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: button.dataset.deleteFile }),
      });
      files = payload.files || [];
      render();
      setLocalStatus("Файл удалён. Он больше не будет добавляться к новым встречам.", "success");
    } catch (error) {
      setLocalStatus(error.message || "Не удалось удалить файл.", "error");
    }
  });

  tabButton.addEventListener("click", () => loadFiles().catch((error) => setLocalStatus(error.message, "error")));
})();
