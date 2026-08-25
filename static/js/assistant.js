document.addEventListener('DOMContentLoaded', () => {
  const fab = document.getElementById('assistant-fab');
  const panel = document.getElementById('assistant-panel');
  const closeBtn = document.getElementById('assistant-close');
  const input = document.getElementById('assistant-input');
  const sendBtn = document.getElementById('assistant-send');
  const body = document.getElementById('assistant-body');

  if (!fab || !panel) return;

  fab.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    if (panel.style.display === 'flex' && input) {
      input.focus();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }

  window.sendAssistantMessage = async function(text) {
    if (!text || !text.trim()) return;

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'msg msg-user';
    userMsg.textContent = text;
    body.appendChild(userMsg);
    body.scrollTop = body.scrollHeight;

    if (input) input.value = '';

    // Append loading bot message
    const botMsg = document.createElement('div');
    botMsg.className = 'msg msg-bot';
    botMsg.innerHTML = '<span style="color: #64748B;">Thinking & checking live catalogue...</span>';
    body.appendChild(botMsg);
    body.scrollTop = body.scrollHeight;

    try {
      const response = await fetch('/api/assistant/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      
      let html = `<p>${data.reply || "Here's what I found:"}</p>`;
      if (data.products && data.products.length > 0) {
        html += '<div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">';
        data.products.slice(0, 3).forEach(p => {
          html += `<a href="/p/${p.canonical_id}" style="font-weight: 600; color: #2563EB; font-size: 0.8rem; text-decoration: underline;">📦 ${p.brand}: ${p.title.slice(0, 35)}...</a>`;
        });
        html += '</div>';
      }
      botMsg.innerHTML = html;
    } catch (err) {
      botMsg.innerHTML = '<p style="color: #DC2626;">Could not contact assistant. Please try a manual search above.</p>';
    }
    body.scrollTop = body.scrollHeight;
  };

  if (sendBtn && input) {
    sendBtn.addEventListener('click', () => {
      sendAssistantMessage(input.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendAssistantMessage(input.value);
      }
    });
  }
});
