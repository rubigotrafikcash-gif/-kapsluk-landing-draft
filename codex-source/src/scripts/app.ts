type ScreenName = 'intro' | 'consent' | 'setup' | 'workspace' | 'item' | 'review' | 'ready';

type CapsuleItem = {
  id: string;
  category: string;
  comment: string;
  url: string;
  imageUrl: string | null;
};

const state: {
  screen: ScreenName;
  history: ScreenName[];
  capsuleName: string;
  items: CapsuleItem[];
  draft: CapsuleItem | null;
  pendingDeleteId: string | null;
} = {
  screen: 'intro',
  history: [],
  capsuleName: '',
  items: [],
  draft: null,
  pendingDeleteId: null,
};

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector);
const $$ = <T extends Element>(selector: string) => Array.from(document.querySelectorAll<T>(selector));

const backButton = $('#back-button') as HTMLButtonElement;
const screens = $$<HTMLElement>('[data-screen]');
const helpDialog = $('#help-dialog') as HTMLDialogElement;
const deleteDialog = $('#delete-dialog') as HTMLDialogElement;
const itemForm = $('#item-form') as HTMLFormElement;
const imageInput = $('#item-image') as HTMLInputElement;
const uploadPreview = $('#upload-preview') as HTMLImageElement;
const uploadLabel = $('#upload-label') as HTMLLabelElement;

function setScreen(next: ScreenName, pushHistory = true) {
  if (state.screen === next) return;
  if (pushHistory) state.history.push(state.screen);
  state.screen = next;
  screens.forEach((screen) => {
    const active = screen.dataset.screen === next;
    screen.hidden = !active;
    screen.classList.toggle('is-active', active);
  });
  backButton.hidden = next === 'intro' || next === 'workspace' || next === 'ready';
  window.scrollTo({ top: 0, behavior: 'instant' });
  const heading = $<HTMLElement>(`[data-screen="${next}"] h1`);
  heading?.focus({ preventScroll: true });
}

function goBack() {
  if (state.screen === 'review') {
    if (state.history.at(-1) === 'item') state.history.pop();
    setScreen('item', false);
    return;
  }
  const previous = state.history.pop();
  if (previous) setScreen(previous, false);
}

function isSafeNeutralName(value: string) {
  const compact = value.trim();
  if (compact.length < 2) return false;
  const looksLikeContact = /@|\+?\d[\d\s()-]{7,}|\b\S+@\S+\.\S+\b/.test(compact);
  return !looksLikeContact;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function resetItemForm() {
  itemForm.reset();
  ($('#comment-count') as HTMLElement).textContent = '0';
  uploadPreview.hidden = true;
  uploadPreview.removeAttribute('src');
  uploadLabel.classList.remove('has-image');
  ($('#item-error') as HTMLElement).hidden = true;
  state.draft = null;
}

function renderWorkspace() {
  const count = state.items.length;
  ($('#workspace-title') as HTMLElement).textContent = state.capsuleName || 'Новая капсула';
  ($('#item-count') as HTMLElement).textContent = String(count);
  ($('#progress-fill') as HTMLElement).style.width = `${(count / 12) * 100}%`;
  ($('#next-item-number') as HTMLElement).textContent = String(Math.min(count + 1, 12));
  ($('#items-summary') as HTMLElement).textContent = `${count} ${plural(count, 'подтверждена', 'подтверждены', 'подтверждено')}`;
  ($('#empty-state') as HTMLElement).hidden = count > 0;
  ($('#items-region') as HTMLElement).hidden = count === 0;
  ($('#prepare-pdf') as HTMLButtonElement).disabled = count === 0;
  ($('#add-item') as HTMLButtonElement).disabled = count >= 12;

  const list = $('#items-list') as HTMLOListElement;
  list.replaceChildren(...state.items.map((item) => {
    const li = document.createElement('li');
    li.className = 'item-card';
    const thumb = document.createElement('div');
    thumb.className = 'item-thumb';
    if (item.imageUrl) {
      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = '';
      thumb.append(img);
    } else {
      thumb.textContent = 'по ссылке';
    }
    const copy = document.createElement('div');
    copy.className = 'item-copy';
    const title = document.createElement('strong');
    title.textContent = item.category;
    const comment = document.createElement('p');
    comment.textContent = item.comment;
    const status = document.createElement('span');
    status.textContent = 'Подтверждено';
    copy.append(title, comment, status);
    const remove = document.createElement('button');
    remove.className = 'delete-item';
    remove.type = 'button';
    remove.dataset.deleteId = item.id;
    remove.setAttribute('aria-label', `Удалить: ${item.category}`);
    remove.textContent = '×';
    li.append(thumb, copy, remove);
    return li;
  }));
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

function openItemForm() {
  if (state.items.length >= 12) return;
  resetItemForm();
  setScreen('item');
}

$$<HTMLButtonElement>('[data-next]').forEach((button) => {
  button.addEventListener('click', () => setScreen(button.dataset.next as ScreenName));
});

backButton.addEventListener('click', goBack);
($('#help-button') as HTMLButtonElement).addEventListener('click', () => helpDialog.showModal());
$('.dialog-close')?.addEventListener('click', () => helpDialog.close());
helpDialog.addEventListener('click', (event) => {
  if (event.target === helpDialog) helpDialog.close();
});

($('#consent-form') as HTMLFormElement).addEventListener('submit', (event) => {
  event.preventDefault();
  const valid = ($('#terms-agree') as HTMLInputElement).checked && ($('#data-agree') as HTMLInputElement).checked;
  ($('#consent-error') as HTMLElement).hidden = valid;
  if (valid) setScreen('setup');
});

($('#setup-form') as HTMLFormElement).addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#capsule-name') as HTMLInputElement;
  const valid = isSafeNeutralName(input.value);
  ($('#setup-error') as HTMLElement).hidden = valid;
  if (!valid) return;
  state.capsuleName = input.value.trim();
  state.history = [];
  renderWorkspace();
  setScreen('workspace', false);
});

($('#add-item') as HTMLButtonElement).addEventListener('click', openItemForm);

imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file) {
    uploadPreview.hidden = true;
    uploadLabel.classList.remove('has-image');
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    uploadPreview.src = String(reader.result);
    uploadPreview.hidden = false;
    uploadLabel.classList.add('has-image');
  });
  reader.readAsDataURL(file);
});

($('#item-comment') as HTMLTextAreaElement).addEventListener('input', (event) => {
  ($('#comment-count') as HTMLElement).textContent = String((event.target as HTMLTextAreaElement).value.length);
});

itemForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const category = ($('#item-category') as HTMLSelectElement).value.trim();
  const comment = ($('#item-comment') as HTMLTextAreaElement).value.trim();
  const url = ($('#item-url') as HTMLInputElement).value.trim();
  const valid = Boolean(category && comment && isValidUrl(url));
  ($('#item-error') as HTMLElement).hidden = valid;
  if (!valid) return;
  state.draft = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    category,
    comment,
    url,
    imageUrl: uploadPreview.hidden ? null : uploadPreview.src,
  };
  ($('#review-category') as HTMLElement).textContent = category;
  ($('#review-comment') as HTMLElement).textContent = comment;
  const reviewUrl = $('#review-url') as HTMLAnchorElement;
  reviewUrl.href = url;
  const reviewImage = $('#review-image') as HTMLElement;
  reviewImage.replaceChildren();
  if (state.draft.imageUrl) {
    const img = document.createElement('img');
    img.src = state.draft.imageUrl;
    img.alt = `Скриншот: ${category}`;
    reviewImage.append(img);
  } else {
    const placeholder = document.createElement('span');
    placeholder.innerHTML = 'Изображение<br>из ссылки';
    reviewImage.append(placeholder);
  }
  setScreen('review');
});

($('#edit-item') as HTMLButtonElement).addEventListener('click', () => {
  if (state.history.at(-1) === 'item') state.history.pop();
  setScreen('item', false);
});
($('#confirm-item') as HTMLButtonElement).addEventListener('click', () => {
  if (!state.draft || state.items.length >= 12) return;
  state.items.push(state.draft);
  state.draft = null;
  state.history = [];
  renderWorkspace();
  setScreen('workspace', false);
});

($('#items-list') as HTMLOListElement).addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-delete-id]');
  if (!button) return;
  state.pendingDeleteId = button.dataset.deleteId ?? null;
  deleteDialog.showModal();
});

($('#cancel-delete') as HTMLButtonElement).addEventListener('click', () => {
  state.pendingDeleteId = null;
  deleteDialog.close();
});

($('#confirm-delete') as HTMLButtonElement).addEventListener('click', () => {
  state.items = state.items.filter((item) => item.id !== state.pendingDeleteId);
  state.pendingDeleteId = null;
  deleteDialog.close();
  renderWorkspace();
});

($('#prepare-pdf') as HTMLButtonElement).addEventListener('click', () => {
  const count = state.items.length;
  if (!count) return;
  ($('#ready-summary') as HTMLElement).textContent = `${count} ${plural(count, 'вещь подтверждена', 'вещи подтверждены', 'вещей подтверждено')}. Можно переходить к генерации лукбука.`;
  setScreen('ready');
});

($('#return-workspace') as HTMLButtonElement).addEventListener('click', () => setScreen('workspace', false));

window.addEventListener('beforeunload', () => {
  // The prototype intentionally keeps no draft in cookies, localStorage, or a backend.
});

renderWorkspace();
