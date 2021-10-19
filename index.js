import axios from 'axios';

export default function start(op = {}) {
  let timer = null;
  let jsonStr = null;
  let isProcessing = false;
  let manifestUrl = op.manifestUrl || `${op.publicPath || ''}/manifest.json`;
  let { messageBox } = op;

  const during = op.during || 1 * 60 * 1000; // 默认一分钟请求一次
  const updateHandler = op.updateHandler || null;
  const elementUI = op.elementUI || window.ELEMENT;
  const elementUIVersion = elementUI && elementUI.version ? elementUI.version : 0;
  const title = op.title || '版本更新提示';

  if (!messageBox && elementUI && elementUI.MessageBox && elementUI.MessageBox.confirm) {
    messageBox = elementUI.MessageBox.confirm;
  }

  const message =
    op.message ||
    `程序小哥刚发布了新版本，赶紧点击“确定”刷新页面吧！${
      messageBox && elementUIVersion >= '2' ? '<br/>' : '\n'
    }温馨提醒:  请确保你现在填写的表单内容已经提交，以免造成内容丢失！`;

  manifestUrl = manifestUrl.replace(/\/+/, '/');

  function getManifest() {
    axios
      .get(`${manifestUrl}?r=${new Date().getTime()}${Math.random()}`)
      .then(res => {
        if (!isProcessing && jsonStr && JSON.stringify(res.data) !== JSON.stringify(jsonStr)) {
          isProcessing = true;
          if (updateHandler && typeof updateHandler === 'function') {
            //对外提供自定义处理方法
            updateHandler();
            isProcessing = false;
          } else if (messageBox) {
            const customClass = 'check-app-version-message-box';
            messageBox(message, title, {
              dangerouslyUseHTMLString: true,
              customClass,
              callback(val) {
                if (val === 'confirm') {
                  location.reload(true);
                } else {
                  isProcessing = false;
                }
              },
            });
            setTimeout(() => {
              const el = document.querySelector(`.${customClass}`);
              if (el && el.parentNode) {
                el.parentNode.style.zIndex = '9999';
              }
            }, 0);
          } else {
            if (window.confirm(message)) {
              //强制刷新浏览器缓存
              location.reload(true);
            } else {
              isProcessing = false;
            }
          }
        }
        jsonStr = res.data;
      })
      .catch(() => {
        if (timer) {
          clearInterval(timer);
        }
      });
  }

  timer = setInterval(() => {
    getManifest();
  }, during);

  getManifest();
}
