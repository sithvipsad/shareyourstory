// ============================================
// និយាយរឿងក្នុងចិត្ត - Things In My Heart
// Main Application (កែប្រែ)
// ============================================

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ===== Global Variables =====
let confessions = JSON.parse(localStorage.getItem('confessions') || '[]');
let nextId = Date.now();
let page = 1;
const PER_PAGE = 5;
let selectedImageFile = null;
let selectedImageBase64 = null;

// ===== Theme =====
function initTheme() {
  const btn = $('#themeBtn');
  const saved = localStorage.getItem('theme') || 'light';
  
  function apply(mode) {
    document.body.classList.toggle('dark', mode === 'dark');
    if (btn) btn.textContent = mode === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', mode);
  }
  
  apply(saved);
  if (btn) btn.onclick = () => apply(document.body.classList.contains('dark') ? 'light' : 'dark');
}

// ===== Tags =====
function initTags() {
  const tags = $$('#tagList .tag');
  const input = $('#tagInput');
  
  tags.forEach(tag => {
    tag.onclick = () => {
      tags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      if (input) input.value = tag.dataset.tag;
    };
  });
}

// ===== Image Upload (កែប្រែ) =====
function initUpload() {
  const box = $('#uploadBox');
  const input = $('#imageInput');
  const preview = $('#imagePreview');
  const img = $('#previewImg');
  const remove = $('#removeImg');
  
  if (!box || !input) return;
  
  // Click to upload
  box.onclick = () => input.click();
  
  // Drag and drop
  box.ondragover = (e) => {
    e.preventDefault();
    box.style.borderColor = 'var(--p)';
    box.style.background = 'rgba(108,92,231,0.05)';
  };
  
  box.ondragleave = () => {
    box.style.borderColor = '';
    box.style.background = '';
  };
  
  box.ondrop = (e) => {
    e.preventDefault();
    box.style.borderColor = '';
    box.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  
  // File selected
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };
  
  function handleFile(file) {
    // ពិនិត្យទំហំ
    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ រូបភាពធំពេក (លើស 5MB)', 'error');
      return;
    }
    
    // ពិនិត្យប្រភេទ
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('❌ សូមប្រើ JPG, PNG, GIF, ឬ WebP', 'error');
      return;
    }
    
    // រក្សាទុក file
    selectedImageFile = file;
    
    // បង្ហាញ preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      selectedImageBase64 = ev.target.result;
      if (img) img.src = ev.target.result;
      if (preview) preview.style.display = 'block';
      if (box) {
        box.innerHTML = '📎 <b>' + file.name + '</b> (' + formatFileSize(file.size) + ')';
      }
    };
    reader.readAsDataURL(file);
  }
  
  // Remove image
  if (remove) {
    remove.onclick = () => {
      selectedImageFile = null;
      selectedImageBase64 = null;
      if (input) input.value = '';
      if (preview) preview.style.display = 'none';
      if (box) {
        box.innerHTML = '📁 ចុចដើម្បីដាក់រូបភាព (មិនចាំបាច់, តូចជាង 5MB)';
      }
    };
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ===== Character Counter =====
function initCharCount() {
  const textarea = $('#textInput');
  const counter = $('#charCount');
  
  if (!textarea || !counter) return;
  
  textarea.oninput = () => {
    const len = textarea.value.length;
    counter.textContent = len;
    counter.style.color = len > 4500 ? 'red' : len > 4000 ? 'orange' : '';
    validateForm();
  };
}

// ===== Form Validation =====
function validateForm() {
  const text = $('#textInput')?.value.trim() || '';
  const captcha = $('#captchaInput')?.value.trim() || '';
  const agree = $('#agree')?.checked || false;
  const btn = $('#submitBtn');
  if (btn) btn.disabled = !(text.length >= 25 && captcha && agree);
}

// ===== CAPTCHA =====
function initCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  window._captchaAnswer = a + b;
  const label = $('#captchaQ');
  if (label) label.textContent = 'តើ ' + a + ' + ' + b + ' = ?';
}

// ===== Toast =====
function showToast(msg, type) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 5000);
}

// ===== Form Submit =====
function initForm() {
  const form = $('#confessForm');
  const modal = $('#modal');
  
  if (!form) return;
  
  form.onsubmit = (e) => {
    e.preventDefault();
    const ans = parseInt($('#captchaInput')?.value || '0');
    if (ans !== window._captchaAnswer) {
      showToast('❌ ចម្លើយមិនត្រឹមត្រូវ', 'error');
      initCaptcha();
      if ($('#captchaInput')) $('#captchaInput').value = '';
      return;
    }
    if (modal) modal.hidden = false;
  };
  
  $('#modalNo')?.addEventListener('click', () => {
    if (modal) modal.hidden = true;
  });
  
  $('#modalYes')?.addEventListener('click', async () => {
    if (modal) modal.hidden = true;
    await submitConfession();
  });
}

async function submitConfession() {
  const btn = $('#submitBtn');
  const msgBox = $('#msgBox');
  
  if (!btn) return;
  
  btn.disabled = true;
  btn.textContent = '⏳ កំពុងផ្ញើទៅ Channel...';
  
  const textValue = $('#textInput')?.value.trim() || '';
  const nameValue = $('#nameInput')?.value.trim() || 'អនាមិក';
  const locationValue = $('#locationInput')?.value || 'មិនស្គាល់';
  const tagValue = $('#tagInput')?.value || 'ផ្សេងៗ';
  
  const confession = {
    id: Date.now(),
    text: textValue,
    name: nameValue,
    location: locationValue,
    tag: tagValue,
    date: new Date().toISOString(),
    votes: 0,
    imageBase64: selectedImageBase64,
    imageFile: selectedImageFile
  };
  
  console.log('📤 កំពុងផ្ញើរ...');
  console.log('🖼️ មានរូបភាព៖', !!selectedImageBase64);
  
  try {
    // ផ្ញើទៅ Telegram Channel
    const result = await TelegramClient.sendToChannel(confession);
    
    if (result.success) {
      // រក្សាទុកក្នុង localStorage
      const cleanConfession = { ...confession };
      delete cleanConfession.imageBase64;
      delete cleanConfession.imageFile;
      confessions.unshift(cleanConfession);
      localStorage.setItem('confessions', JSON.stringify(confessions));
      
      if (msgBox) {
        msgBox.style.background = '#e8f5e9';
        msgBox.style.color = '#2e7d32';
        msgBox.textContent = '✅ ផ្ញើរបានជោគជ័យ! រឿងរបស់អ្នកបានផ្សព្វផ្សាយក្នុង Channel 📢';
      }
      
      showToast('✅ ផ្សព្វផ្សាយក្នុង Channel បានជោគជ័យ!', 'success');
      
      resetForm();
      renderRecent();
      updateStats();
    } else {
      if (msgBox) {
        msgBox.style.background = '#ffebee';
        msgBox.style.color = '#c62828';
        msgBox.textContent = '❌ មានបញ្ហា: ' + (result.error || 'មិនអាចផ្ញើបាន');
      }
      showToast('❌ មានបញ្ហាក្នុងការផ្ញើ', 'error');
    }
  } catch (error) {
    console.error('Submit Error:', error);
    if (msgBox) {
      msgBox.style.background = '#ffebee';
      msgBox.style.color = '#c62828';
      msgBox.textContent = '❌ មានបញ្ហាក្នុងការតភ្ជាប់';
    }
    showToast('❌ មានបញ្ហាក្នុងការតភ្ជាប់', 'error');
  }
  
  btn.disabled = true;
  btn.textContent = '📤 ផ្ញើរឿងក្នុងចិត្ត';
  
  setTimeout(() => { if (msgBox) msgBox.textContent = ''; }, 5000);
}

function resetForm() {
  // សម្អាតទម្រង់
  const textInput = $('#textInput');
  const nameInput = $('#nameInput');
  const locationInput = $('#locationInput');
  const captchaInput = $('#captchaInput');
  const agree = $('#agree');
  const tagInput = $('#tagInput');
  
  if (textInput) textInput.value = '';
  if (nameInput) nameInput.value = '';
  if (locationInput) locationInput.value = '';
  if (captchaInput) captchaInput.value = '';
  if (agree) agree.checked = false;
  if (tagInput) tagInput.value = '';
  
  // សម្អាត tags
  $$('#tagList .tag').forEach(t => t.classList.remove('active'));
  const firstTag = $('#tagList .tag');
  if (firstTag) firstTag.classList.add('active');
  
  // សម្អាតរូបភាព
  selectedImageFile = null;
  selectedImageBase64 = null;
  const imageInput = $('#imageInput');
  const preview = $('#imagePreview');
  const box = $('#uploadBox');
  if (imageInput) imageInput.value = '';
  if (preview) preview.style.display = 'none';
  if (box) box.innerHTML = '📁 ចុចដើម្បីដាក់រូបភាព (មិនចាំបាច់, តូចជាង 5MB)';
  
  // សម្អាត counter
  const counter = $('#charCount');
  if (counter) counter.textContent = '0';
  
  initCaptcha();
  validateForm();
}

// ===== Render Recent =====
function renderRecent(search = '') {
  const list = $('#recentList');
  if (!list) return;
  
  let items = [...confessions];
  
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i => 
      (i.text || '').toLowerCase().includes(q) ||
      (i.name || '').toLowerCase().includes(q) ||
      (i.location || '').toLowerCase().includes(q)
    );
  }
  
  const end = page * PER_PAGE;
  const pageItems = items.slice(0, end);
  
  if (pageItems.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:var(--t2);padding:20px;">មិនមានរឿងទេ</p>';
    const loadMore = $('#loadMore');
    if (loadMore) loadMore.style.display = 'none';
    return;
  }
  
  list.innerHTML = pageItems.map(item => `
    <div class="item">
      ${item.tag ? '<span class="tag-badge">' + escapeHtml(item.tag) + '</span>' : ''}
      <p>${escapeHtml(item.text || '').replace(/\n/g, '<br>')}</p>
      <div class="meta">
        <span>👤 ${escapeHtml(item.name || 'អនាមិក')}</span>
        <span>📍 ${escapeHtml(item.location || 'មិនស្គាល់')}</span>
        <span>🕒 ${(item.date || '').split('T')[0]}</span>
        <span>⭐ ${item.votes || 0}</span>
      </div>
    </div>
  `).join('');
  
  const loadMore = $('#loadMore');
  if (loadMore) loadMore.style.display = items.length > end ? 'block' : 'none';
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[m]);
}

// ===== Search =====
function initSearch() {
  const input = $('#searchInput');
  if (input) {
    input.oninput = () => {
      page = 1;
      renderRecent(input.value);
    };
  }
}

// ===== Load More =====
function initLoadMore() {
  const btn = $('#loadMore');
  if (btn) {
    btn.onclick = () => {
      page++;
      renderRecent($('#searchInput')?.value || '');
    };
  }
}

// ===== Stats =====
function updateStats() {
  const today = new Date().toISOString().split('T')[0];
  const statToday = $('#statToday');
  const statTotal = $('#statTotal');
  const statOnline = $('#statOnline');
  
  if (statToday) statToday.textContent = confessions.filter(c => (c.date || '').startsWith(today)).length;
  if (statTotal) statTotal.textContent = confessions.length;
  if (statOnline) statOnline.textContent = Math.floor(Math.random() * 20) + 1;
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTags();
  initUpload();
  initCharCount();
  initCaptcha();
  initForm();
  initSearch();
  initLoadMore();
  updateStats();
  renderRecent();
  
  console.log('💭 និយាយរឿងក្នុងចិត្ត - Things In My Heart');
  console.log('📢 Channel: https://t.me/Thingsinmyheartt');
  console.log('🖼️ ការផ្ញើររូបភាពបានត្រៀមរួចរាល់');
});