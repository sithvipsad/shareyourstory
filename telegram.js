// ============================================
// Telegram API ផ្ទាល់ (MTProto)
// Channel: @Thingsinmyheartt
// ============================================

const TelegramClient = {
  // API Credentials
  API_ID: 22859090,
  API_HASH: 'a1de61bc1a1c2e7134b7c1f76111f388',
  CHANNEL_USERNAME: '@Thingsinmyheartt',
  BOT_TOKEN: '7568763554:AAGLNbPtD1ev3O8GBPMEtcpPH73cuOS-vtg',
  
  isReady: false,
  
  /**
   * ចាប់ផ្ដើម Telegram Client
   */
  async init() {
    try {
      // ពិនិត្យ Telegram WebApp
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        this.isReady = true;
        console.log('✅ Telegram WebApp ready');
        return true;
      }
      
      // ប្រើ Bot API ជាវិធីចម្បង
      this.isReady = true;
      console.log('✅ Using Bot API');
      return true;
    } catch (error) {
      console.error('Init Error:', error);
      return false;
    }
  },
  
  /**
   * ផ្ញើរឿងទៅ Channel (មានរូបភាព)
   */
  async sendToChannel(data) {
    if (!this.isReady) {
      await this.init();
    }
    
    try {
      // បើមានរូបភាព ផ្ញើរូបភាពជាមួយ caption
      if (data.imageBase64 || data.imageFile) {
        return await this.sendPhotoWithCaption(data);
      }
      
      // បើគ្មានរូបភាព ផ្ញើរតែអត្ថបទ
      return await this.sendMessageOnly(data);
      
    } catch (error) {
      console.error('Send Error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * ផ្ញើររូបភាពជាមួយ caption
   */
  async sendPhotoWithCaption(data) {
    const message = this.formatMessage(data);
    const url = `https://api.telegram.org/bot${this.BOT_TOKEN}/sendPhoto`;
    
    try {
      const formData = new FormData();
      formData.append('chat_id', this.CHANNEL_USERNAME);
      formData.append('caption', message);
      formData.append('parse_mode', 'HTML');
      
      // បើមាន base64 image
      if (data.imageBase64) {
        // បម្លែង base64 ទៅ Blob
        const blob = this.base64ToBlob(data.imageBase64);
        formData.append('photo', blob, 'confession_photo.jpg');
      }
      // បើមាន file object
      else if (data.imageFile) {
        formData.append('photo', data.imageFile, data.imageFile.name || 'photo.jpg');
      }
      
      console.log('📤 កំពុងផ្ញើរូបភាពទៅ Channel...');
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log('📋 លទ្ធផល:', result);
      
      if (result.ok) {
        console.log('✅ រូបភាពត្រូវបានផ្ញើរដោយជោគជ័យ!');
        return { success: true, method: 'photo_with_caption' };
      } else {
        console.error('❌ បរាជ័យ:', result.description);
        
        // បើផ្ញើររូបភាពមិនបាន សាកផ្ញើរតែអត្ថបទ
        console.log('🔄 កំពុងព្យាយាមផ្ញើរតែអត្ថបទ...');
        return await this.sendMessageOnly(data);
      }
      
    } catch (error) {
      console.error('❌ Photo Send Error:', error);
      
      // បើមានបញ្ហា ផ្ញើរតែអត្ថបទ
      console.log('🔄 កំពុងព្យាយាមផ្ញើរតែអត្ថបទ...');
      return await this.sendMessageOnly(data);
    }
  },
  
  /**
   * ផ្ញើរតែអត្ថបទ
   */
  async sendMessageOnly(data) {
    const message = this.formatMessage(data);
    const url = `https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.CHANNEL_USERNAME,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: false
        })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        console.log('✅ អត្ថបទត្រូវបានផ្ញើរដោយជោគជ័យ');
        return { success: true, method: 'text_only' };
      } else {
        throw new Error(result.description || 'Unknown error');
      }
      
    } catch (error) {
      console.error('❌ Message Send Error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * បម្លែង Base64 ទៅ Blob
   */
  base64ToBlob(base64) {
    // ញែកប្រភេទឯកសារ
    const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }
    
    const contentType = matches[1];
    const base64Data = matches[2];
    
    // Decode base64
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: contentType });
  },
  
  /**
   * បង្កើតសារ
   */
  formatMessage(data) {
    const { id, text, name, location, tag, date } = data;
    
    // Badge តាមប្រភេទ
    const badges = {
      'ស្នេហា': '💕',
      'សោកសៅ': '😢',
      'សប្បាយ': '😊',
      'ខឹង': '😠',
      'ផ្សេងៗ': '📌'
    };
    const badge = badges[tag] || '📌';
    
    // កាត់អត្ថបទ
    let preview = text;
    if (text.length > 350) {
      preview = text.substring(0, 350) + '...';
    }
    
    // ការពារ HTML
    preview = preview
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // កាលបរិច្ឆេទ
    let khDate = date;
    try {
      khDate = new Date(date).toLocaleDateString('km-KH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Phnom_Penh'
      });
    } catch (e) {}
    
    const safeName = (name || 'អនាមិក')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const safeLocation = (location || 'មិនស្គាល់')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    return '📝 <b>រឿងក្នុងចិត្ត #' + id + '</b>\n' +
      badge + ' <b>' + (tag || 'ផ្សេងៗ') + '</b>\n\n' +
      preview + '\n\n' +
      '━━━━━━━━━━━━━━━\n' +
      '👤 <b>ឈ្មោះ៖</b> ' + safeName + '\n' +
      '📍 <b>ទីតាំង៖</b> ' + safeLocation + '\n' +
      '🕒 <b>កាលបរិច្ឆេទ៖</b> ' + khDate + '\n\n' +
      '#រឿងក្នុងចិត្ត #ThingsInMyHeart\n' +
      '🔗 <a href="https://t.me/Thingsinmyheartt">មើលក្នុង Channel</a>';
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await TelegramClient.init();
  console.log('📢 Channel: https://t.me/Thingsinmyheartt');
  console.log('🖼️ រូបភាពនឹងត្រូវបានផ្ញើរភ្ជាប់ជាមួយអត្ថបទ');
});