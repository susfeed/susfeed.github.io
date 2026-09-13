document.addEventListener('DOMContentLoaded', function () {
    const headerContent = `
        <header class="site-header">
            <div class="container header-top">
                <a href="index.html" class="logo-link">
                    <img src="img/logo.webp" alt="SusFeed Logo" class="logo" />
                </a>
            </div>

            <nav class="main-nav">
                <ul class="nav-links">

                    <li><a href="index.html"><img src="img/amogus.webp" alt="SusFeed Icon" class="logo" /></a></li>

                    <li class="dropdown">
                        <a href="#">SusFeed News ▾</a>
                        <ul class="dropdown-menu">
                            <li><a href="articles.html">Susarticles</a></li>
                            <li><a href="quiz.html">Quizzes</a></li>
                            <li><a href="games.html">Games</a></li>
                        </ul>
                    </li>

                    <li class="dropdown">
                        <a href="TV/index.html">SusFeed Video</a>
                    </li>

                    <li class="dropdown">
                        <a href="#">SusFeed Edu ▾</a>
                        <ul class="dropdown-menu">
                            <li><a href="susipedia/index.html">SusiPedia</a></li>
                        </ul>
                    </li>

                    <li class="dropdown">
                        <a href="#">About ▾</a>
                        <ul class="dropdown-menu">
                            <li><a href="about.html">About</a></li>
                            <li><a href="corporate/index.html">Corporate</a></li>
                        </ul>
                    </li>

                </ul>
            </nav>
        </header>
    `;

    const headerDiv = document.querySelector('.site-header');
    if (headerDiv) headerDiv.innerHTML = headerContent;

    document.querySelectorAll('.dropdown').forEach(drop => {
        drop.addEventListener('click', function (e) {
            e.stopPropagation();
            this.classList.toggle('open');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
    });

    const footerContent = `
        <footer class="site-footer">
            <div class="container">
                <a href="games/anniversary/index.html">
                    <p>&copy; 2026 SusFeed. All rights reserved.</p>
                </a>
            </div>
        </footer>
    `;

    const footerDiv = document.querySelector('.site-footer');
    if (footerDiv) footerDiv.innerHTML = footerContent;
});

(function () {
  const STORAGE_KEY = 'chineseRoomActive';
  const ORIGINAL_STORAGE_KEY = 'chineseRoomOriginalText';
  const CHINESE_CHARS = '的一是不了在人有我他这个们中来上大为和国地到以说时要就出会可也你对生能而子那得于着下自之年过发后作里用道行所然家种事成方多经么去法学如都同现当没动面起看定天分还进好小部其些主样理心她本前开但因只从想实日军者意无力它与长把机十民第公此已工使情明性知全三又关点正业外将两高间由问很最重并物手应战向头文体政美相见被利什二等产或新己制身果加西斯月话合回特代内信表化老给世位次度门任常先海通教儿原东声提立及比员解水名真论处走义各入几口认条平系气题活尔更别打女变四神总何电数安少报才结反受目太量再感建务做接必场件计管期市直德资命山金指克许统区保至队形社便空决治展马科司五基眼书非则听白却界达光放强即像难且权思王象完设式色路记南品住告类求据程北边死张该交规万取拉格望觉术领共确传师观清今切院让识候带导争运笑飞风步改收根干造言联持组每济车亲极林服快办议往元英士证近失转夫令准布始怎呢存未远叫台单影具罗字爱击流备兵连调深商算质团集百需价花党华城石级整府离况亚请技际约示复病息究线似官火断精满支视消越器容照须九增研写称企八功吗包片史委乎查轻易早曾除农找装广显吧阿李标谈吃图念六引历首医局突专费号尽另周较注语仅考落青随选列武红响虽推势参希古众构房半节土投某案黑维革划敌致陈律足态护七兴派孩验责营星够章音跟志底站严巴例防族供效续施留讲型料终答紧黄绝奇察母京段依批群项故按河米围江织害斗双境客纪采举杀攻父苏密低朝友诉止细愿千值仍男钱破网热助倒育属坐帝限船脸职速刻乐否刚威毛状率甚独球般普怕弹校苦创假久错承印晚兰试股拿脑预谁益阳若哪微尼继送急血惊伤素药适波夜省初喜卫源食险待述陆习置居劳财环排福纳欢雷警获模充负云停木游龙树疑层冷洲冲射略范竟句室异激汉村哈策演简卡罪判担州静退既衣您宗积余痛检差富灵协角占配征修皮挥胜降阶审沉坚善妈刘读啊超免压银买皇养伊怀执副乱抗犯追帮宣佛岁航优怪香著田铁控税左右份穿艺背阵草脚概恶块顿敢守酒岛托央户烈洋哥索胡款靠评版宝座释景顾弟登货互付伯慢欧换闻危忙核暗姐介坏讨丽良序升监临亮露永呼味野架域沙掉括舰鱼杂误湾吉减编楚肯测败屋跑梦散温困剑渐封救贵枪缺楼县尚毫移娘朋画班智亦耳恩短掌恐遗固席输哪谁熟怕脚痛消妈演卡片乡阴敬纪灭兰坚牙';

  let isConverting = false;

  function getRandomChinese(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += CHINESE_CHARS.charAt(Math.floor(Math.random() * CHINESE_CHARS.length));
    }
    return result;
  }

  function collectTextNodes() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          const parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName ? parent.tagName.toLowerCase() : '';
          if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'textarea') {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.nodeValue.trim() === '') return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }
    return nodes;
  }

  function collectAttributeData() {
    const attrs = [];
    document.querySelectorAll('[title], [placeholder], [alt]').forEach(el => {
      ['title', 'placeholder', 'alt'].forEach(attr => {
        if (el.hasAttribute(attr)) {
          const val = el.getAttribute(attr);
          if (val && val.trim()) {
            attrs.push({ el, attr, original: val });
          }
        }
      });
    });
    return attrs;
  }

  function convertTextNode(node) {
    const original = node.nodeValue;
    let newText = '';
    for (let i = 0; i < original.length; i++) {
      const ch = original[i];
      if (/[a-zA-Z0-9\u4e00-\u9fff]/.test(ch)) {
        newText += getRandomChinese(1);
      } else {
        newText += ch;
      }
    }
    node.nodeValue = newText;
  }

  function convertAttributeValue(val) {
    let newVal = '';
    for (let i = 0; i < val.length; i++) {
      const ch = val[i];
      if (/[a-zA-Z0-9\u4e00-\u9fff]/.test(ch)) {
        newVal += getRandomChinese(1);
      } else {
        newVal += ch;
      }
    }
    return newVal;
  }

  function saveOriginalState() {
    const textNodes = collectTextNodes();
    const attrData = collectAttributeData();
    const allEls = Array.from(document.querySelectorAll('[title], [placeholder], [alt]'));
    const snapshot = {
      texts: textNodes.map(n => n.nodeValue),
      attrs: attrData.map(a => ({ attr: a.attr, original: a.original, index: allEls.indexOf(a.el) }))
    };
    localStorage.setItem(ORIGINAL_STORAGE_KEY, JSON.stringify(snapshot));
  }

  function restoreOriginalState() {
    const raw = localStorage.getItem(ORIGINAL_STORAGE_KEY);
    if (!raw) return false;
    try {
      const snapshot = JSON.parse(raw);
      const textNodes = collectTextNodes();
      if (textNodes.length === snapshot.texts.length) {
        textNodes.forEach((node, i) => {
          node.nodeValue = snapshot.texts[i];
        });
      } else {
        location.reload();
        return false;
      }
      const allEls = Array.from(document.querySelectorAll('[title], [placeholder], [alt]'));
      snapshot.attrs.forEach(item => {
        const el = allEls[item.index];
        if (el && el.hasAttribute(item.attr)) {
          el.setAttribute(item.attr, item.original);
        }
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function applyChinese() {
    if (isConverting) return;
    isConverting = true;
    if (!localStorage.getItem(ORIGINAL_STORAGE_KEY)) {
      saveOriginalState();
    }
    const textNodes = collectTextNodes();
    textNodes.forEach(convertTextNode);
    const attrData = collectAttributeData();
    attrData.forEach(({ el, attr }) => {
      const val = el.getAttribute(attr);
      if (val) {
        el.setAttribute(attr, convertAttributeValue(val));
      }
    });
    isConverting = false;
  }

  function removeChinese() {
    if (isConverting) return;
    isConverting = true;
    restoreOriginalState();
    localStorage.removeItem(ORIGINAL_STORAGE_KEY);
    isConverting = false;
  }

  window.chineseRoomToggle = function () {
    const active = localStorage.getItem(STORAGE_KEY) === 'true';
    if (active) {
      localStorage.setItem(STORAGE_KEY, 'false');
      removeChinese();
    } else {
      localStorage.setItem(STORAGE_KEY, 'true');
      applyChinese();
    }
  };

  function applyOnLoad() {
    const active = localStorage.getItem(STORAGE_KEY) === 'true';
    if (active) {
      if (!localStorage.getItem(ORIGINAL_STORAGE_KEY)) {
        saveOriginalState();
      }
      applyChinese();
    } else {
      if (localStorage.getItem(ORIGINAL_STORAGE_KEY)) {
        restoreOriginalState();
        localStorage.removeItem(ORIGINAL_STORAGE_KEY);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyOnLoad);
  } else {
    applyOnLoad();
  }

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      applyOnLoad();
    }
  });
})();