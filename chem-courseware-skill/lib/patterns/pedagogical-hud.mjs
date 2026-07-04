function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderObservationList(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }
  return `<ul>
${items.map((item) => `      <li>${escapeHtml(item)}</li>`).join('\n')}
    </ul>`;
}

function renderQuestions(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }
  return `    <div class="questions">
${items.map((item, index) => {
    const prompt = escapeHtml(item?.prompt || `Câu hỏi ${index + 1}`);
    const answer = escapeHtml(item?.answer || '');
    return `      <div>${index + 1}. ${prompt}</div>
      <div class="answer">→ ${answer}</div>`;
  }).join('\n')}
    </div>`;
}

export function createDefaultPedagogicalHudModel(overrides = {}) {
  const controls = overrides.controls || {};
  const status = overrides.status || {};
  return {
    title: overrides.title || 'Mô phỏng thí nghiệm hóa học',
    formulaHtml: overrides.formulaHtml || '',
    intro: overrides.intro || 'Thao tác trực tiếp trong mô hình 3D để quan sát hiện tượng hóa học trước, trong và sau phản ứng.',
    hint: overrides.hint || 'Ưu tiên quan sát dấu hiệu học sinh cần kết luận, không chỉ thao tác kéo thả.',
    observationTitle: overrides.observationTitle || 'Điểm nhấn trực quan',
    observations: Array.isArray(overrides.observations) && overrides.observations.length > 0
      ? overrides.observations
      : [
          'Quan sát trạng thái ban đầu của mẫu trước khi thao tác.',
          'Theo dõi dấu hiệu thay đổi rõ nhất trong vùng phản ứng.',
          'So sánh trạng thái sau phản ứng với trạng thái ban đầu để rút ra kết luận.',
        ],
    questions: Array.isArray(overrides.questions) && overrides.questions.length > 0
      ? overrides.questions
      : [
          {
            prompt: 'Dấu hiệu nào cho thấy phản ứng đã xảy ra?',
            answer: 'Hãy dựa vào hiện tượng quan sát được ngay trên mẫu thay vì mô tả thao tác.',
          },
        ],
    status: {
      label: status.label || 'Trạng thái thí nghiệm',
      text: status.text || 'Sẵn sàng. Hãy bắt đầu thao tác với mẫu thử.',
      sub: status.sub || 'Quan sát kỹ trạng thái ban đầu trước khi chuyển sang bước tiếp theo.',
    },
    controls: {
      resetLabel: controls.resetLabel || 'Đặt lại',
      primaryLabel: controls.primaryLabel || 'Chạy tự động',
    },
    widgetsHtml: overrides.widgetsHtml || '',
    hudClassName: overrides.hudClassName || 'hud--pedagogical-info',
  };
}

export function buildPedagogicalExperimentHud(modelInput = {}) {
  const model = createDefaultPedagogicalHudModel(modelInput);
  const formulaMarkup = model.formulaHtml
    ? `    <p class="formula">${model.formulaHtml}</p>\n`
    : '';
  const widgetsMarkup = model.widgetsHtml ? `\n${model.widgetsHtml}` : '';

  return `<div class="hud ${escapeHtml(model.hudClassName)}" data-courseware-ui="learner-lab pedagogy-info">
  <div class="panel" data-courseware-role="intro">
    <h1 class="lesson-title">${escapeHtml(model.title)}</h1>
${formulaMarkup}    <p class="lesson-desc lesson-prompt">${escapeHtml(model.intro)}</p>
    <p class="lesson-desc lesson-hint">${escapeHtml(model.hint)}</p>
  </div>

  <div class="legend" data-courseware-role="legend">
    <h2>${escapeHtml(model.observationTitle)}</h2>
${renderObservationList(model.observations)}
${renderQuestions(model.questions)}
  </div>${widgetsMarkup}

  <div class="status" data-courseware-role="status">
    <div class="status-label">${escapeHtml(model.status.label)}</div>
    <div id="statusText">${escapeHtml(model.status.text)}</div>
    <div id="statusSub">${escapeHtml(model.status.sub)}</div>
  </div>

  <div class="controls" data-courseware-role="controls">
    <button class="secondary" id="resetBtn" data-action="reset" type="button">${escapeHtml(model.controls.resetLabel)}</button>
    <button id="primaryAction" data-action="autoplay" type="button">${escapeHtml(model.controls.primaryLabel)}</button>
  </div>
</div>`;
}
