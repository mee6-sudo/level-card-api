// index.js
export default {
  async fetch(request, env) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const data = await request.json();
      
      // Validate required fields
      const requiredFields = ['rank_text', 'rank', 'avatar', 'user_name', 'max_xp', 'xp'];
      for (const field of requiredFields) {
        if (!data[field]) {
          return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Validate numeric fields
      if (isNaN(data.rank) || isNaN(data.max_xp) || isNaN(data.xp)) {
        return new Response(JSON.stringify({ error: 'Rank, max_xp, and xp must be numbers' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validate XP values
      if (parseInt(data.xp) > parseInt(data.max_xp)) {
        return new Response(JSON.stringify({ error: 'xp cannot be greater than max_xp' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Set defaults
      const avatar_border = data.avatar_border || '#FFFFFF';
      const bar_placeholder = data.bar_placeholder ? `${data.bar_placeholder}80` : '#80808080';
      const bar = data.bar || '#FFFFFF';

      // Calculate percentage
      const percentage = ((data.xp / data.max_xp) * 100).toFixed(2);

      // Generate HTML for the card
      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
    body { margin: 0; padding: 0; width: 900px; height: 300px; }
    .card {
      width: 100%; height: 100%;
      background: linear-gradient(to bottom, #1a1a2e, #16213e);
      display: flex; align-items: center;
      font-family: 'Roboto', sans-serif; color: white;
    }
    .avatar-container { margin-left: 50px; }
    .avatar {
      width: 180px; height: 180px; border-radius: 50%;
      border: 5px solid ${avatar_border}; object-fit: cover;
    }
    .user-info { margin-left: 40px; width: 600px; }
    .username { font-size: 42px; font-weight: bold; margin-bottom: 10px; }
    .rank { font-size: 28px; margin-bottom: 30px; opacity: 0.8; }
    .xp-container { margin-bottom: 20px; }
    .xp-text {
      font-size: 24px; margin-bottom: 8px;
      display: flex; justify-content: space-between;
    }
    .progress-bar {
      height: 20px; width: 100%;
      background-color: ${bar_placeholder};
      border-radius: 10px; overflow: hidden;
    }
    .progress {
      height: 100%; width: ${percentage}%;
      background-color: ${bar}; border-radius: 10px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="avatar-container">
      <img class="avatar" src="${data.avatar}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'" />
    </div>
    <div class="user-info">
      <div class="username">${data.user_name}</div>
      <div class="rank">${data.rank_text} #${data.rank}</div>
      <div class="xp-container">
        <div class="xp-text">
          <span>${data.xp}/${data.max_xp} XP</span>
          <span>${percentage}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress"></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      // Call Popcat.xyz screenshot API
      const popcatResponse = await fetch('https://api.popcat.xyz/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `data:text/html;charset=UTF-8,${encodeURIComponent(html)}`,
          delay: 2,
          width: 900,
          height: 300
        })
      });

      if (!popcatResponse.ok) {
        throw new Error('Failed to generate image');
      }

      // Return the image with caching headers
      return new Response(popcatResponse.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400' // 24 hours cache
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
