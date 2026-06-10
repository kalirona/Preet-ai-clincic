/**
 * Preet AI Chat Widget
 * Embeddable floating chat widget for customer websites
 * 
 * Usage:
 *   <script src="https://yourdomain.com/widget.js"></script>
 *   <script>
 *     window.PreetAI.init({ agentId: "xxxxx" });
 *   </script>
 */

(function() {
  'use strict';

  const API_BASE = (window as any).PreetAI?.apiBase || window.location.origin;
  let config: { agentId: string | null } = { agentId: null };
  let agentData: any = null;
  let conversationId: string | null = null;
  let isOpen = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let lastMessageTime: string | null = null;

  // ============================================
  // STYLES
  // ============================================
  function injectStyles(brandColor) {
    const style = document.createElement('style');
    style.textContent = `
      #preet-ai-widget * { box-sizing: border-box; margin: 0; padding: 0; }
      #preet-ai-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      
      #preet-ai-bubble {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${brandColor};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        z-index: 99999;
      }
      #preet-ai-bubble:hover { transform: scale(1.05); box-shadow: 0 6px 24px rgba(0,0,0,0.2); }
      #preet-ai-bubble svg { width: 28px; height: 28px; }
      
      #preet-ai-panel {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 380px;
        max-width: calc(100vw - 48px);
        height: 520px;
        max-height: calc(100vh - 140px);
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 99998;
        border: 1px solid #e5e7eb;
      }
      #preet-ai-panel.open { display: flex; }
      
      .pai-header {
        padding: 16px;
        background: ${brandColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .pai-header-info { display: flex; align-items: center; gap: 10px; }
      .pai-header-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex; align-items: center; justify-content: center;
        font-weight: bold; font-size: 14px;
      }
      .pai-header-name { font-weight: 700; font-size: 14px; }
      .pai-header-status { font-size: 11px; opacity: 0.8; }
      .pai-close {
        background: rgba(255,255,255,0.2); border: none; color: white;
        width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
      }
      
      .pai-messages {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 12px;
        background: #f9fafb;
      }
      .pai-message {
        max-width: 80%; padding: 10px 14px;
        border-radius: 12px; font-size: 13px; line-height: 1.5;
        word-wrap: break-word;
      }
      .pai-message.visitor {
        align-self: flex-end;
        background: ${brandColor}; color: white;
        border-bottom-right-radius: 4px;
      }
      .pai-message.agent {
        align-self: flex-start;
        background: white; color: #374151;
        border: 1px solid #e5e7eb;
        border-bottom-left-radius: 4px;
      }
      .pai-message.system {
        align-self: center;
        background: transparent; color: #9ca3af;
        font-size: 11px; font-style: italic;
      }
      .pai-message-time {
        font-size: 10px; margin-top: 4px; opacity: 0.6;
      }
      
      .pai-input-area {
        padding: 12px; border-top: 1px solid #e5e7eb;
        display: flex; gap: 8px; background: white;
      }
      .pai-input {
        flex: 1; padding: 10px 14px; border: 1px solid #e5e7eb;
        border-radius: 10px; font-size: 13px; outline: none;
        transition: border-color 0.2s;
      }
      .pai-input:focus { border-color: ${brandColor}; }
      .pai-send {
        width: 40px; height: 40px; border-radius: 10px;
        background: ${brandColor}; color: white; border: none;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: opacity 0.2s;
      }
      .pai-send:hover { opacity: 0.9; }
      .pai-send:disabled { opacity: 0.5; cursor: not-allowed; }
      .pai-send svg { width: 18px; height: 18px; }
      
      .pai-welcome {
        padding: 20px; text-align: center; color: #6b7280;
      }
      .pai-welcome h3 { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
      .pai-welcome p { font-size: 12px; }
      
      .pai-typing {
        display: flex; gap: 4px; align-items: center; padding: 8px 14px;
        background: white; border: 1px solid #e5e7eb; border-radius: 12px;
        align-self: flex-start; width: fit-content;
      }
      .pai-typing-dot {
        width: 6px; height: 6px; border-radius: 50%; background: #9ca3af;
        animation: pai-bounce 1.4s infinite ease-in-out;
      }
      .pai-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .pai-typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes pai-bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }

      @media (max-width: 480px) {
        #preet-ai-panel {
          bottom: 0; right: 0; left: 0;
          width: 100%; height: 100%;
          max-width: 100%; max-height: 100%;
          border-radius: 0;
        }
        #preet-ai-bubble { bottom: 16px; right: 16px; }
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // HTML HELPERS
  // ============================================
  function svgChatBubble() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  }

  function svgClose() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  }

  function svgSend() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  // ============================================
  // BUILD DOM
  // ============================================
  function buildWidget() {
    const container = document.createElement('div');
    container.id = 'preet-ai-widget';

    // Bubble button
    const bubble = document.createElement('button');
    bubble.id = 'preet-ai-bubble';
    bubble.innerHTML = svgChatBubble();
    bubble.onclick = togglePanel;
    container.appendChild(bubble);

    // Chat panel
    const panel = document.createElement('div');
    panel.id = 'preet-ai-panel';
    panel.innerHTML = `
      <div class="pai-header">
        <div class="pai-header-info">
          <div class="pai-header-avatar">${(agentData?.name || 'A').charAt(0)}</div>
          <div>
            <div class="pai-header-name">${agentData?.name || 'AI Assistant'}</div>
            <div class="pai-header-status">Online</div>
          </div>
        </div>
        <button class="pai-close" onclick="window.PreetAI.close()">${svgClose()}</button>
      </div>
      <div class="pai-messages" id="pai-messages">
        <div class="pai-welcome">
          <h3>${agentData?.name || 'AI Assistant'}</h3>
          <p>${agentData?.welcomeMessage || 'Hi! How can I help you today?'}</p>
        </div>
      </div>
      <div class="pai-input-area">
        <input type="text" class="pai-input" id="pai-input" placeholder="Type your message..." />
        <button class="pai-send" id="pai-send" disabled>${svgSend()}</button>
      </div>
    `;
    container.appendChild(panel);

    document.body.appendChild(container);

    // Event listeners
    const input = document.getElementById('pai-input') as HTMLInputElement;
    const sendBtn = document.getElementById('pai-send') as HTMLButtonElement;
    
    input.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim();
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    sendBtn.addEventListener('click', sendMessage);
  }

  // ============================================
  // PANEL TOGGLE
  // ============================================
  function togglePanel() {
    const panel = document.getElementById('preet-ai-panel');
    const bubble = document.getElementById('preet-ai-bubble');
    
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    bubble.innerHTML = isOpen ? svgClose() : svgChatBubble();
    
    if (isOpen && !conversationId) {
      startConversation();
    }
    
    if (isOpen) {
      setTimeout(() => document.getElementById('pai-input')?.focus(), 100);
    }
  }

  // ============================================
  // CONVERSATION
  // ============================================
  async function startConversation() {
    try {
      const res = await fetch(`${API_BASE}/api/widget/${config.agentId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: localStorage.getItem('pai_visitor_name') || undefined,
          visitorEmail: localStorage.getItem('pai_visitor_email') || undefined,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to start conversation');
      
      const data = await res.json();
      conversationId = data.conversation.id;
      
      // Show welcome message
      if (data.welcomeMessage) {
        addMessage({
          senderType: 'agent',
          content: data.welcomeMessage,
          createdAt: new Date().toISOString(),
        });
      }
      
      // Start polling
      startPolling();
    } catch (err) {
      console.error('[PreetAI] Failed to start conversation:', err);
    }
  }

  // ============================================
  // MESSAGES
  // ============================================
  function addMessage(msg) {
    const container = document.getElementById('pai-messages');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = `pai-message ${msg.senderType}`;
    
    const content = document.createElement('p');
    content.textContent = msg.content;
    div.appendChild(content);
    
    if (msg.createdAt) {
      const time = document.createElement('div');
      time.className = 'pai-message-time';
      time.textContent = formatTime(msg.createdAt);
      div.appendChild(time);
    }
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    
    if (msg.createdAt) {
      lastMessageTime = msg.createdAt;
    }
  }

  async function sendMessage() {
    const input = document.getElementById('pai-input') as HTMLInputElement;
    const sendBtn = document.getElementById('pai-send') as HTMLButtonElement;
    const content = input.value.trim();
    
    if (!content || !conversationId) return;
    
    input.value = '';
    sendBtn.disabled = true;
    
    // Add message locally
    addMessage({
      senderType: 'visitor',
      content,
      createdAt: new Date().toISOString(),
    });
    
    try {
      const res = await fetch(`${API_BASE}/api/widget/conversation/${conversationId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) throw new Error('Failed to send message');
    } catch (err) {
      console.error('[PreetAI] Failed to send message:', err);
    }
  }

  // ============================================
  // POLLING
  // ============================================
  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    
    pollInterval = setInterval(async () => {
      if (!conversationId || !isOpen) return;
      
      try {
        const url = lastMessageTime 
          ? `${API_BASE}/api/widget/conversation/${conversationId}/messages?after=${encodeURIComponent(lastMessageTime)}`
          : `${API_BASE}/api/widget/conversation/${conversationId}/messages`;
          
        const res = await fetch(url);
        if (!res.ok) return;
        
        const messages = await res.json();
        for (const msg of messages) {
          if (msg.senderType !== 'visitor') {
            addMessage(msg);
          }
        }
      } catch (err) {
        // Silent fail for polling
      }
    }, 3000);
  }

  // ============================================
  // INIT
  // ============================================
  async function init(options) {
    if (!options || !options.agentId) {
      console.error('[PreetAI] agentId is required');
      return;
    }
    
    config.agentId = options.agentId;
    
    // Fetch agent config
    try {
      const res = await fetch(`${API_BASE}/api/widget/widget/${config.agentId}`);
      if (res.ok) {
        agentData = await res.json();
      }
    } catch (err) {
      console.warn('[PreetAI] Could not fetch agent config, using defaults');
      agentData = { name: 'AI Assistant', welcomeMessage: 'Hi! How can I help you today?', brandColor: '#7c3aed' };
    }
    
    injectStyles(agentData?.brandColor || '#7c3aed');
    buildWidget();
  }

  function destroy() {
    if (pollInterval) clearInterval(pollInterval);
    const container = document.getElementById('preet-ai-widget');
    if (container) container.remove();
    const styles = document.querySelectorAll('style');
    styles.forEach(s => { if (s.textContent.includes('preet-ai')) s.remove(); });
  }

  // Public API
  (window as any).PreetAI = { init, close: togglePanel, destroy };
})();
