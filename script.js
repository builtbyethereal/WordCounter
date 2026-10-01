(function () {
  'use strict';

  const WORDS_PER_MINUTE = 200;
  const COPY_RESET_DELAY = 1500;

  const textInput = document.getElementById('textInput');
  const copyButton = document.getElementById('copyButton');
  const clearButton = document.getElementById('clearButton');
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const workspace = document.querySelector('.workspace');

  const statElements = {
    words: document.getElementById('wordCount'),
    characters: document.getElementById('characterCount'),
    charactersNoSpaces: document.getElementById('characterNoSpacesCount'),
    sentences: document.getElementById('sentenceCount'),
    paragraphs: document.getElementById('paragraphCount'),
    readingTime: document.getElementById('readingTime')
  };

  let copyResetTimer;
  let previousStats = {};

  function getPreferredTheme() {
    const savedTheme = window.localStorage.getItem('wordCounterTheme');

    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';

    document.body.classList.toggle('theme-dark', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeLabel.textContent = isDark ? 'Dark' : 'Light';
    window.localStorage.setItem('wordCounterTheme', theme);
  }

  function toggleTheme() {
    const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  function countWords(text) {
    const trimmed = text.trim();

    if (!trimmed) {
      return 0;
    }

    return trimmed.split(/\s+/).length;
  }

  function countSentences(text) {
    const trimmed = text.trim();

    if (!trimmed) {
      return 0;
    }

    const matches = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)/g);
    return matches ? matches.length : 0;
  }

  function countParagraphs(text) {
    const trimmed = text.trim();

    if (!trimmed) {
      return 0;
    }

    return trimmed.split(/\n\s*\n+/).filter(function (paragraph) {
      return paragraph.trim().length > 0;
    }).length;
  }

  function formatReadingTime(wordCount) {
    if (wordCount === 0) {
      return '0 min';
    }

    if (wordCount < WORDS_PER_MINUTE) {
      return '< 1 min';
    }

    return Math.ceil(wordCount / WORDS_PER_MINUTE) + ' min';
  }

  function analyzeText(text) {
    const words = countWords(text);

    return {
      words: words,
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, '').length,
      sentences: countSentences(text),
      paragraphs: countParagraphs(text),
      readingTime: formatReadingTime(words)
    };
  }

  function updateStats() {
    const stats = analyzeText(textInput.value);

    Object.keys(statElements).forEach(function (key) {
      const element = statElements[key];
      const nextValue = stats[key];

      if (previousStats[key] !== undefined && previousStats[key] !== nextValue) {
        element.closest('.stat-card').classList.add('is-updated');
        window.setTimeout(function () {
          element.closest('.stat-card').classList.remove('is-updated');
        }, 220);
      }

      element.textContent = nextValue;
    });

    workspace.classList.toggle('has-text', textInput.value.trim().length > 0);
    previousStats = stats;
  }

  function fallbackCopy(text) {
    textInput.focus();
    textInput.select();

    try {
      document.execCommand('copy');
    } catch (error) {
      console.warn('Copy fallback failed.', error);
    }
  }

  function showCopiedState() {
    window.clearTimeout(copyResetTimer);
    copyButton.querySelector('span').textContent = 'Copied!';

    copyResetTimer = window.setTimeout(function () {
      copyButton.querySelector('span').textContent = 'Copy';
    }, COPY_RESET_DELAY);
  }

  async function copyText() {
    const text = textInput.value;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        fallbackCopy(text);
      }
    } else {
      fallbackCopy(text);
    }

    showCopiedState();
  }

  function clearText() {
    textInput.value = '';
    updateStats();
    textInput.focus();
  }

  function handleKeyboardShortcuts(event) {
    const isClearShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'k';

    if (isClearShortcut) {
      event.preventDefault();
      clearText();
    }
  }

  textInput.addEventListener('input', updateStats);
  copyButton.addEventListener('click', copyText);
  clearButton.addEventListener('click', clearText);
  themeToggle.addEventListener('click', toggleTheme);
  document.addEventListener('keydown', handleKeyboardShortcuts);

  applyTheme(getPreferredTheme());
  updateStats();
})();
