(function () {
    'use strict';

    var root = document.documentElement;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ==================== THEME ==================== */
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) { /* private mode */ }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f8fa' : '#0a0e12');
        try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
    }
    applyTheme(saved || 'dark');

    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });
    }

    /* ==================== NAV ==================== */
    var nav = document.getElementById('nav');
    var navMenu = document.getElementById('nav-menu');
    var navToggle = document.getElementById('nav-toggle');
    var lastY = window.scrollY;

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            var open = navMenu.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        navMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navMenu.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    var links = document.querySelectorAll('.nav__link[data-link]');
    var sections = [];
    links.forEach(function (link) {
        var id = link.getAttribute('href').slice(1);
        var sec = document.getElementById(id);
        if (sec) sections.push({ id: id, link: link, el: sec });
    });

    if ('IntersectionObserver' in window && sections.length) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                sections.forEach(function (s) {
                    s.link.classList.toggle('active', s.el === entry.target);
                });
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        sections.forEach(function (s) { spy.observe(s.el); });
    }

    /* ==================== SCROLL: progress + nav-hide + parallax ==================== */
    var progress = document.getElementById('progress');
    var heroGrid = document.getElementById('hero-grid');
    var orb1 = document.getElementById('orb-1');
    var orb2 = document.getElementById('orb-2');
    var ticking = false;

    function updateScrollUI() {
        var y = window.scrollY;

        if (nav) nav.classList.toggle('scrolled', y > 8);
        if (nav && y > nav.offsetHeight * 2.5 && y > lastY && !navMenu.classList.contains('open')) {
            nav.classList.add('hidden');
        } else {
            nav.classList.remove('hidden');
        }
        lastY = y;

        if (progress) {
            var doc = document.documentElement;
            var max = doc.scrollHeight - window.innerHeight;
            progress.style.setProperty('--scroll', (max > 0 ? (y / max) * 100 : 0) + '%');
        }

        if (!reduceMotion) {
            if (heroGrid) heroGrid.style.backgroundPosition = '0px ' + (-y * 0.12) + 'px';
            if (orb1) orb1.style.transform = 'translate3d(0,' + y * 0.1 + 'px,0)';
            if (orb2) orb2.style.transform = 'translate3d(0,' + y * -0.07 + 'px,0)';
        }
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { requestAnimationFrame(updateScrollUI); ticking = true; }
    }, { passive: true });
    updateScrollUI();

    /* ==================== SCROLL SPY REVEALS ==================== */
    var reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur');
    if ('IntersectionObserver' in window) {
        var revealObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var delay = entry.target.getAttribute('data-delay');
                    entry.target.style.setProperty('--reveal-delay', delay ? delay * 0.08 + 's' : '0s');
                    entry.target.classList.add('visible');
                    revealObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        reveals.forEach(function (el) { revealObs.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('visible'); });
    }

    /* ==================== COUNT-UP STATS ==================== */
    var counters = document.querySelectorAll('[data-count]');
    if ('IntersectionObserver' in window && counters.length) {
        var countObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                countObs.unobserve(el);
                var target = parseInt(el.getAttribute('data-count'), 10) || 0;
                var suffix = el.getAttribute('data-suffix') || '';
                var dur = 1400;
                var start = null;

                function tick(ts) {
                    if (!start) start = ts;
                    var p = Math.min((ts - start) / dur, 1);
                    var eased = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.round(eased * target) + suffix;
                    if (p < 1) requestAnimationFrame(tick);
                }
                if (reduceMotion) { el.textContent = target + suffix; return; }
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { countObs.observe(el); });
    }

    /* ==================== TERMINAL TYPING LOOP ==================== */
    var term = document.getElementById('term-body');
    if (term && !reduceMotion) {
        term.style.minHeight = term.offsetHeight + 'px';
        term.textContent = '';

        var cursor = document.createElement('span');
        cursor.className = 't-cursor';
        cursor.textContent = '▊';
        term.appendChild(cursor);

        var session = [
            { t: '$ kubectl get platforms', c: '' },
            { t: 'NAME   STATUS  TEAMS  ENGINEERS', c: 't-dim' },
            { t: 'idp    running  20+    300+', c: 't-ok' },
            { t: '', c: '' },
            { t: '$ helm upgrade idp --namespace prod', c: '' },
            { t: '✓ release "idp" deployed', c: 't-ok' },
            { t: '', c: '' },
            { t: '$ kubectl get nodes', c: '' },
            { t: '✓ all nodes Ready · schedulable', c: 't-ok' },
            { t: '', c: '' },
            { t: '$ python cleanup.py --sweep', c: '' },
            { t: '✓ no orphaned objects found', c: 't-ok' },
            { t: '', c: '' },
            { t: '$ watch -n 5 platform health', c: '' },
            { t: '✓ platform operational', c: 't-ok' }
        ];

        var li = 0, ci = 0, row = null;

        function ensureRow() {
            if (row) return;
            row = document.createElement('div');
            row.className = 'term__row ' + (session[li].c || '');
            term.insertBefore(row, cursor);
        }

        function step() {
            if (li >= session.length) {
                setTimeout(reset, 4200);
                return;
            }
            ensureRow();
            var line = session[li];
            if (ci < line.t.length) {
                row.textContent += line.t.charAt(ci);
                ci++;
                setTimeout(step, 16 + Math.random() * 28);
            } else {
                li++; ci = 0; row = null;
                setTimeout(step, 260);
            }
        }

        function reset() {
            while (term.firstChild !== cursor) term.removeChild(term.firstChild);
            li = 0; ci = 0; row = null;
            setTimeout(step, 900);
        }
        setTimeout(step, 600);
    }

    /* ==================== CANDLE REPLAY ==================== */
    var candles = document.getElementById('candles');
    var hero = document.getElementById('home');
    if (candles && hero && 'IntersectionObserver' in window && !reduceMotion) {
        var replay = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                candles.classList.remove('playing');
                void candles.getBoundingClientRect();
                candles.classList.add('playing');
            });
        }, { threshold: 0.25 });
        replay.observe(hero);
    }

    /* ==================== CURSOR GLOW ==================== */
    var glow = document.getElementById('cursor-glow');
    if (glow && finePointer && !reduceMotion) {
        var gx = -600, gy = -600, cx = -600, cy = -600;

        document.addEventListener('pointermove', function (e) {
            gx = e.clientX; gy = e.clientY;
            if (!document.body.classList.contains('cursor-on')) document.body.classList.add('cursor-on');
        }, { passive: true });
        document.addEventListener('pointerleave', function () {
            document.body.classList.remove('cursor-on');
        });

        (function loop() {
            cx += (gx - cx) * 0.08;
            cy += (gy - cy) * 0.08;
            glow.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
            requestAnimationFrame(loop);
        })();
    }

    /* ==================== 3D TILT ==================== */
    if (finePointer && !reduceMotion) {
        document.querySelectorAll('.tilt').forEach(function (card) {
            var active = false, tx = 0, ty = 0, rx = 0, ry = 0;

            card.addEventListener('pointerenter', function () {
                active = true;
                card.classList.add('tilting');
            });
            card.addEventListener('pointermove', function (e) {
                var r = card.getBoundingClientRect();
                tx = (e.clientX - r.left) / r.width - 0.5;
                ty = (e.clientY - r.top) / r.height - 0.5;
            });
            card.addEventListener('pointerleave', function () {
                active = false;
                card.classList.remove('tilting');
                rx = 0; ry = 0;
                card.style.transform = '';
            });

            (function loop() {
                if (active) {
                    ry = tx * 5.5;
                    rx = -ty * 5.5;
                    card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-2px)';
                }
                requestAnimationFrame(loop);
            })();
        });
    }

    /* ==================== FOOTER YEAR ==================== */
    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
})();