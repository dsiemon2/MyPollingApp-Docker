/**
 * PollChat Widget - Embed polls dynamically on any website
 *
 * Usage:
 * <div id="pollchat-poll-123"></div>
 * <script src="https://yourdomain.com/widget.js"></script>
 * <script>
 *   PollChat.render({
 *     container: '#pollchat-poll-123',
 *     pollId: '123',
 *     theme: 'light', // or 'dark'
 *     showResults: true,
 *     allowVote: true,
 *     onVote: function(optionId, optionText) { console.log('Voted:', optionText); }
 *   });
 * </script>
 */
(function(window) {
  'use strict';

  const PollChat = {
    baseUrl: (function() {
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src.includes('widget.js')) {
          return scripts[i].src.replace('/widget.js', '');
        }
      }
      return '';
    })(),

    render: function(options) {
      const {
        container,
        pollId,
        theme = 'light',
        showResults = true,
        allowVote = true,
        onVote = null
      } = options;

      if (!container || !pollId) {
        console.error('PollChat: container and pollId are required');
        return;
      }

      const containerEl = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!containerEl) {
        console.error('PollChat: container not found');
        return;
      }

      // Generate unique visitor ID
      let visitorId = localStorage.getItem('pollchat_widget_visitor');
      if (!visitorId) {
        visitorId = 'widget_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('pollchat_widget_visitor', visitorId);
      }

      // Styles
      const isDark = theme === 'dark';
      const styles = {
        container: `
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: ${isDark ? '#1f2937' : '#ffffff'};
          border-radius: 12px;
          padding: 20px;
          max-width: 500px;
          border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        `,
        title: `
          font-size: 18px;
          font-weight: 600;
          color: ${isDark ? '#f9fafb' : '#1f2937'};
          margin: 0 0 8px 0;
        `,
        description: `
          font-size: 14px;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
          margin: 0 0 16px 0;
        `,
        option: `
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          margin-bottom: 8px;
          border: 2px solid ${isDark ? '#374151' : '#e5e7eb'};
          border-radius: 8px;
          background: ${isDark ? '#374151' : '#ffffff'};
          cursor: pointer;
          transition: all 0.2s;
          box-sizing: border-box;
        `,
        optionSelected: `
          border-color: #7c3aed;
          background: ${isDark ? '#4c1d95' : '#f3e8ff'};
        `,
        optionDisabled: `
          cursor: default;
          background: ${isDark ? '#1f2937' : '#f9fafb'};
        `,
        optionText: `
          font-size: 14px;
          font-weight: 500;
          color: ${isDark ? '#f9fafb' : '#1f2937'};
          display: flex;
          justify-content: space-between;
          align-items: center;
        `,
        percentage: `
          font-weight: 600;
          color: #7c3aed;
        `,
        progressBar: `
          height: 6px;
          background: ${isDark ? '#4b5563' : '#e5e7eb'};
          border-radius: 3px;
          margin-top: 8px;
          overflow: hidden;
        `,
        progressFill: `
          height: 100%;
          background: #7c3aed;
          border-radius: 3px;
          transition: width 0.5s;
        `,
        button: `
          width: 100%;
          padding: 12px;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
        `,
        buttonDisabled: `
          opacity: 0.5;
          cursor: not-allowed;
        `,
        voteCount: `
          text-align: center;
          font-size: 12px;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
          margin-top: 12px;
        `,
        votedBadge: `
          background: ${isDark ? '#065f46' : '#d1fae5'};
          color: ${isDark ? '#6ee7b7' : '#047857'};
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 12px;
          text-align: center;
        `,
        link: `
          display: block;
          text-align: center;
          font-size: 11px;
          color: #7c3aed;
          text-decoration: none;
          margin-top: 12px;
        `
      };

      // State
      let poll = null;
      let selectedOption = null;
      let hasVoted = false;

      // Fetch poll data
      const fetchPoll = async () => {
        try {
          const res = await fetch(`${PollChat.baseUrl}/api/polls/${pollId}`);
          if (res.ok) {
            poll = await res.json();
            render();
          } else {
            containerEl.innerHTML = '<p style="color: #ef4444;">Poll not found</p>';
          }
        } catch (error) {
          containerEl.innerHTML = '<p style="color: #ef4444;">Failed to load poll</p>';
        }
      };

      // Check if already voted
      const checkVoted = async () => {
        try {
          const res = await fetch(`${PollChat.baseUrl}/api/polls/${pollId}/vote?visitorId=${visitorId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.hasVoted) {
              hasVoted = true;
              selectedOption = data.votedOptionId;
            }
          }
        } catch (error) {
          console.error('Failed to check vote status');
        }
      };

      // Submit vote
      const submitVote = async () => {
        if (!selectedOption || !allowVote) return;

        try {
          const res = await fetch(`${PollChat.baseUrl}/api/polls/${pollId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ optionId: selectedOption, visitorId })
          });

          if (res.ok) {
            hasVoted = true;
            await fetchPoll();
            if (onVote) {
              const option = poll.options.find(o => o.id === selectedOption);
              onVote(selectedOption, option?.text || '');
            }
          } else {
            const data = await res.json();
            if (data.error === 'Already voted') {
              hasVoted = true;
              render();
            }
          }
        } catch (error) {
          console.error('Vote failed:', error);
        }
      };

      // Render poll
      const render = () => {
        if (!poll) return;

        let html = `<div style="${styles.container}">`;
        html += `<h3 style="${styles.title}">${escapeHtml(poll.title)}</h3>`;

        if (poll.description) {
          html += `<p style="${styles.description}">${escapeHtml(poll.description)}</p>`;
        }

        if (hasVoted) {
          const votedOption = poll.options.find(o => o.id === selectedOption);
          html += `<div style="${styles.votedBadge}">✓ You voted for: <strong>${escapeHtml(votedOption?.text || 'Unknown')}</strong></div>`;
        }

        // Options
        poll.options.forEach(option => {
          const isSelected = selectedOption === option.id;
          const percentage = poll.totalVotes > 0
            ? Math.round((option.votes / poll.totalVotes) * 100)
            : 0;

          let optionStyle = styles.option;
          if (isSelected) optionStyle += styles.optionSelected;
          if (hasVoted || !allowVote) optionStyle += styles.optionDisabled;

          html += `<button
            style="${optionStyle}"
            data-option-id="${option.id}"
            ${(hasVoted || !allowVote) ? 'disabled' : ''}
          >`;
          html += `<div style="${styles.optionText}">`;
          html += `<span>${escapeHtml(option.text)}${hasVoted && isSelected ? ' <span style="color: #10b981;">(Your vote)</span>' : ''}</span>`;

          if (hasVoted && showResults) {
            html += `<span style="${styles.percentage}">${percentage}%</span>`;
          }
          html += `</div>`;

          if (hasVoted && showResults) {
            html += `<div style="${styles.progressBar}"><div style="${styles.progressFill} width: ${percentage}%;"></div></div>`;
          }

          html += `</button>`;
        });

        // Submit button
        if (!hasVoted && allowVote) {
          html += `<button
            style="${styles.button}${!selectedOption ? styles.buttonDisabled : ''}"
            id="pollchat-submit-${pollId}"
            ${!selectedOption ? 'disabled' : ''}
          >Submit Vote</button>`;
        }

        // Vote count
        html += `<p style="${styles.voteCount}">${poll.totalVotes} vote${poll.totalVotes !== 1 ? 's' : ''} total</p>`;

        // Link to PollChat
        html += `<a href="${PollChat.baseUrl}/polls/${pollId}" target="_blank" style="${styles.link}">View on PollChat ↗</a>`;

        html += `</div>`;

        containerEl.innerHTML = html;

        // Attach event listeners
        poll.options.forEach(option => {
          const btn = containerEl.querySelector(`[data-option-id="${option.id}"]`);
          if (btn && !hasVoted && allowVote) {
            btn.addEventListener('click', () => {
              selectedOption = option.id;
              render();
            });
          }
        });

        const submitBtn = containerEl.querySelector(`#pollchat-submit-${pollId}`);
        if (submitBtn) {
          submitBtn.addEventListener('click', submitVote);
        }
      };

      // Escape HTML
      const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      };

      // Initialize
      (async () => {
        await checkVoted();
        await fetchPoll();
      })();
    }
  };

  // Expose to global
  window.PollChat = PollChat;

})(window);
