window.__ModuleLoader__.load({
  id: "dsh-web-restart",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var react = require("react");

    // ── styles ────────────────────────────────────────────────────────────────
    var css = ".wr_layer{flex:none;width:100%;min-width:0;position:relative}.wr_btn{box-sizing:border-box;cursor:pointer;width:36px;height:36px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:10px;flex:none;justify-content:center;align-items:center;gap:0;padding:0;display:flex;position:relative;font-family:inherit}.wr_btn:hover{background:var(--dsw-alias-interactive-bg-hover)}.wr_wide .wr_btn{width:100%;min-height:34px;border-radius:12px;justify-content:flex-start;gap:8px;padding:6px 10px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}.wr_icon{flex:none;width:16px;height:16px;color:var(--dsw-alias-label-secondary);display:block}.wr_label{display:none}.wr_wide .wr_label{display:block;text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary);overflow:hidden}.wr_spin svg{animation:wr_spin 1s linear infinite}@keyframes wr_spin{to{transform:rotate(360deg)}}.wr_fdot{box-sizing:border-box;position:absolute;top:1px;right:1px;width:8px;height:8px;border-radius:50%;border:1.5px solid var(--dsw-alias-bg-layer);background:var(--dsw-alias-state-success-primary)}.wr_fdot.wr_amber{background:var(--dsw-alias-state-warn-primary)}.wr_fdot.wr_red{background:var(--dsw-alias-state-error-primary)}.wr_overlay{z-index:1000;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.wr_mask{background:var(--dsw-alias-bg-mask-1);backdrop-filter:var(--dsw-mask-blur);position:absolute;inset:0}.wr_dialog{z-index:1;box-sizing:border-box;width:440px;max-width:calc(100vw - 32px);background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:16px;box-shadow:var(--dsw-shadow-lv3);flex-direction:column;gap:10px;padding:16px;display:flex;position:relative}.wr_dtitle{font-size:14px;line-height:22px;font-weight:600;color:var(--dsw-alias-label-primary);display:flex;align-items:center;gap:8px}.wr_ddesc{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);margin:0}.wr_dnote{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-fill-bg);border:1px solid var(--dsw-alias-border-weak);border-radius:8px;padding:6px 8px}.wr_dnote.wr_ok{color:var(--dsw-alias-state-success-primary)}.wr_dtoggle{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1px solid var(--dsw-alias-border-weak);border-radius:10px;background:var(--dsw-alias-fill-bg)}.wr_dtext{display:flex;flex-direction:column;gap:2px;min-width:0}.wr_dlabel{font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary)}.wr_dhint{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}.wr_dfoot{display:flex;align-items:center;justify-content:flex-end;gap:8px}.wr_dbtn{box-sizing:border-box;cursor:pointer;font-family:inherit;font-size:12px;line-height:18px;padding:5px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-default);background:var(--dsw-alias-fill-bg);color:var(--dsw-alias-label-primary)}.wr_dbtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.wr_dbtn:disabled{opacity:.5;cursor:default}.wr_ddanger{background:var(--dsw-alias-state-error-primary);border-color:transparent;color:var(--dsw-alias-label-on-accent)}.wr_ddanger:hover:not(:disabled){background:var(--dsw-alias-state-error-primary-hover,var(--dsw-alias-state-error-primary))}.wr_card{list-style:none;box-sizing:border-box;border:1px solid var(--dsw-alias-border-default);border-radius:12px;background:var(--dsw-alias-bg-layer);overflow:hidden}.wr_chead{box-sizing:border-box;cursor:pointer;width:100%;display:flex;align-items:center;gap:8px;padding:10px 12px;border:none;background:0 0;font-family:inherit;text-align:left;color:var(--dsw-alias-label-primary)}.wr_chead:hover{background:var(--dsw-alias-interactive-bg-hover)}.wr_cheadText{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}.wr_cname{font-size:13px;line-height:20px;font-weight:600}.wr_cdesc{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}.wr_cbadge{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-state-warn-primary)}.wr_chev{flex:none;width:14px;height:14px;color:var(--dsw-alias-label-tertiary);transition:transform .15s}.wr_chevOpen{transform:rotate(180deg)}.wr_cbody{box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:0 12px 12px;border-top:1px solid var(--dsw-alias-border-weak)}.wr_creadonly{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);margin:10px 0 0}.wr_ctoggle{display:flex;align-items:flex-start;gap:10px;margin-top:10px}.wr_switch{box-sizing:border-box;flex:none;width:34px;height:20px;border-radius:10px;border:1px solid var(--dsw-alias-border-strong);background:var(--dsw-alias-fill-bg);position:relative;cursor:pointer;transition:background .15s,border-color .15s;margin-top:1px}.wr_switch.wr_on{background:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}.wr_switch::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-primary);transition:transform .15s}.wr_switch.wr_on::after{transform:translateX(14px)}.wr_ctext{display:flex;flex-direction:column;gap:2px;min-width:0}.wr_clabel{font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary)}.wr_cfield{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}.wr_cfield.wr_over{color:var(--dsw-alias-state-warn-primary)}.wr_cfooter{display:flex;align-items:center;gap:8px;margin-top:2px}.wr_cfailed{flex:1;font-size:11px;line-height:16px;color:var(--dsw-alias-state-error-primary)}.wr_cbtn{box-sizing:border-box;cursor:pointer;font-family:inherit;font-size:12px;line-height:18px;padding:3px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-default);background:var(--dsw-alias-fill-bg);color:var(--dsw-alias-label-primary)}.wr_cbtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.wr_cbtn:disabled{opacity:.5;cursor:default}.wr_csave{background:var(--dsw-alias-accent-solid);border-color:transparent;color:var(--dsw-alias-label-on-accent)}.wr_csave:hover:not(:disabled){background:var(--dsw-alias-accent-solid-hover)}.wr_csweep{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);border-top:1px solid var(--dsw-alias-border-weak);padding-top:8px;margin-top:2px;word-break:break-all}";
    var tagId = "dsh-web-restart/RestartButton.module.css";
    if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
      var tag = document.createElement("style");
      tag.dataset.plugin = "dsh-web-restart";
      tag.dataset.pluginCss = tagId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    var styles = {
      layer: "wr_layer",
      btn: "wr_btn",
      wide: "wr_wide",
      icon: "wr_icon",
      label: "wr_label",
      spin: "wr_spin",
      fdot: "wr_fdot",
      amber: "wr_amber",
      red: "wr_red",
      overlay: "wr_overlay",
      mask: "wr_mask",
      dialog: "wr_dialog",
      dtitle: "wr_dtitle",
      ddesc: "wr_ddesc",
      dnote: "wr_dnote",
      ok: "wr_ok",
      dtoggle: "wr_dtoggle",
      dtext: "wr_dtext",
      dlabel: "wr_dlabel",
      dhint: "wr_dhint",
      dfoot: "wr_dfoot",
      dbtn: "wr_dbtn",
      ddanger: "wr_ddanger",
      card: "wr_card",
      chead: "wr_chead",
      cheadText: "wr_cheadText",
      cname: "wr_cname",
      cdesc: "wr_cdesc",
      cbadge: "wr_cbadge",
      chev: "wr_chev",
      chevOpen: "wr_chevOpen",
      cbody: "wr_cbody",
      creadonly: "wr_creadonly",
      ctoggle: "wr_ctoggle",
      switch: "wr_switch",
      on: "wr_on",
      ctext: "wr_ctext",
      clabel: "wr_clabel",
      cfield: "wr_cfield",
      over: "wr_over",
      cfooter: "wr_cfooter",
      cfailed: "wr_cfailed",
      cbtn: "wr_cbtn",
      csave: "wr_csave",
      csweep: "wr_csweep"
    };

    var NS = "dsh-web-restart";
    var zh = {
      "label.restart": "重启服务",
      "label.requested": "已请求重启，页面将重连…",
      "label.supervisorDown": "监督进程未运行，重启不可用",
      "state.ok": "运行中",
      "state.down": "监督进程未运行",
      "state.pending": "重启进行中",
      "state.error": "获取状态失败",
      "tip.title": "重启 dsh web 服务",
      "tip.desc": "将停止并重新启动 dsh web 服务（约 10 秒后执行）。当前正在运行的会话会被中断；服务重启完成后页面自动刷新。",
      "tip.autoLabel": "重启后自动继续中断的会话",
      "tip.autoHint": "开启后，重启完成时自动恢复上次被中断的会话（含目标续跑）；关闭则需手动继续。",
      "tip.autoOn": "自动继续：已开启 — 重启后中断的会话会自动恢复",
      "tip.autoOff": "自动继续：未开启 — 中断的会话需手动继续",
      "tip.confirm": "确认重启",
      "tip.cancel": "取消",
      "tip.requested": "已请求重启，页面将重连…",
      "tip.supervisorDown": "监督进程未运行，无法执行重启",
      "card.title": "重启服务设置",
      "card.description": "服务重启后如何处理被中断的会话。",
      "card.expand": "展开设置",
      "card.collapse": "收起设置",
      "card.autoContinue": "重启后自动继续中断的会话",
      "card.autoContinueHint": "开启后，重启完成时自动恢复上次重启中断的会话（含目标续跑）；关闭则需手动继续。",
      "card.on": "开",
      "card.off": "关",
      "card.overridden": "已覆盖",
      "card.reset": "恢复默认",
      "card.save": "保存",
      "card.saving": "保存中…",
      "card.discard": "放弃修改",
      "card.unsaved": "未保存",
      "card.saveFailed": "本部署没有接受这些值，已保留供你修改。",
      "card.readOnly": "本部署的设置为只读。",
      "card.sweepDone": "上次重启后自动继续了 {n} 个会话",
      "card.sweepFail": "上次自动继续 {resumed} 个，失败 {failed} 个",
      "card.sweepNone": "尚未有自动继续记录"
    };
    var en = {
      "label.restart": "Restart service",
      "label.requested": "Restart requested, page will reconnect…",
      "label.supervisorDown": "Supervisor is not running; restart unavailable",
      "state.ok": "running",
      "state.down": "supervisor down",
      "state.pending": "restarting",
      "state.error": "status failed",
      "tip.title": "Restart the dsh web service",
      "tip.desc": "Stops and restarts the dsh web service (executes in ~10 s). Running sessions are interrupted; the page reloads once the service is back.",
      "tip.autoLabel": "Auto-continue interrupted sessions after restart",
      "tip.autoHint": "When on, sessions cut short by the restart resume automatically at boot (goals keep running rounds); when off, continue them manually.",
      "tip.autoOn": "Auto-continue: on — interrupted sessions resume after the restart",
      "tip.autoOff": "Auto-continue: off — interrupted sessions need manual continuation",
      "tip.confirm": "Restart now",
      "tip.cancel": "Cancel",
      "tip.requested": "Restart requested, page will reconnect…",
      "tip.supervisorDown": "Supervisor is not running; restart cannot be executed",
      "card.title": "Restart service settings",
      "card.description": "How sessions cut short by a service restart are handled.",
      "card.expand": "Show settings",
      "card.collapse": "Hide settings",
      "card.autoContinue": "Auto-continue interrupted sessions after restart",
      "card.autoContinueHint": "When on, sessions cut short by the last restart are resumed automatically at boot (goals keep running rounds); when off, continue them manually.",
      "card.on": "On",
      "card.off": "Off",
      "card.overridden": "Overridden",
      "card.reset": "Reset to default",
      "card.save": "Save",
      "card.saving": "Saving…",
      "card.discard": "Discard",
      "card.unsaved": "Unsaved",
      "card.saveFailed": "The deployment did not accept these values; they were left for you to correct.",
      "card.readOnly": "This deployment stores settings read-only.",
      "card.sweepDone": "Auto-continued {n} sessions after the last restart",
      "card.sweepFail": "Last sweep: {resumed} resumed, {failed} failed",
      "card.sweepNone": "No auto-continue record yet"
    };

    var inject = ["slots", "locale", "settingsScope"];

    // ── tiny snapshot store (mirrors dsh-client-runtime's, no dependency) ────
    function createSnapshotStore(initial) {
      var value = initial;
      var listeners = [];
      return {
        getSnapshot: function () { return value; },
        subscribe: function (listener) {
          listeners.push(listener);
          return function () {
            listeners = listeners.filter(function (l) { return l !== listener; });
          };
        },
        set: function (next) {
          value = next;
          for (var i = 0; i < listeners.length; i++) listeners[i]();
        }
      };
    }

    // ── settings card controller: staged boolean over the web-restart namespace ──
    function WebRestartCardController(scope) {
      this.scope = scope;
      this.staged = null; // null | { value: boolean, clear: boolean }
      this.saving = false;
      this.failed = false;
      this.store = createSnapshotStore(this.project());
      var self = this;
      scope.subscribe(function () { self.publish(); });
    }

    WebRestartCardController.prototype.snapshot = function () {
      return this.scope.getSnapshot();
    };

    WebRestartCardController.prototype.project = function () {
      var snap = this.snapshot();
      var user = snap.user;
      var effective = typeof snap.value === "object" && snap.value !== null && typeof snap.value.autoContinueAfterRestart === "boolean"
        ? snap.value.autoContinueAfterRestart
        : false;
      var overridden = user !== void 0 && Object.hasOwn(user, "autoContinueAfterRestart");
      return {
        available: snap.status === "ready",
        writable: snap.writable === true,
        dirty: this.staged !== null,
        saving: this.saving,
        failed: this.failed,
        on: this.staged !== null && !this.staged.clear ? this.staged.value : effective,
        overridden: this.staged !== null && !this.staged.clear ? true : overridden,
        defaultOn: typeof snap.base === "object" && snap.base !== null && snap.base.autoContinueAfterRestart === true
      };
    };

    WebRestartCardController.prototype.publish = function () {
      this.store.set(this.project());
    };

    WebRestartCardController.prototype.toggle = function (value) {
      this.staged = { value: value, clear: false };
      this.failed = false;
      this.publish();
    };

    WebRestartCardController.prototype.resetField = function () {
      var snap = this.snapshot();
      var overridden = snap.user !== void 0 && Object.hasOwn(snap.user, "autoContinueAfterRestart");
      if (!overridden) return;
      this.staged = { value: false, clear: true };
      this.failed = false;
      this.publish();
    };

    WebRestartCardController.prototype.save = function () {
      var self = this;
      if (this.staged === null || this.saving) return Promise.resolve(false);
      this.saving = true;
      this.failed = false;
      this.publish();
      var write = this.staged.clear
        ? this.scope.unset("autoContinueAfterRestart")
        : this.scope.set("autoContinueAfterRestart", this.staged.value);
      return write.then(function () {
        self.saving = false;
        self.staged = null;
        self.publish();
        return true;
      }, function () {
        self.saving = false;
        self.failed = true;
        self.publish();
        return false;
      });
    };

    WebRestartCardController.prototype.discard = function () {
      if (this.staged === null && !this.failed) return;
      this.staged = null;
      this.failed = false;
      this.publish();
    };

    WebRestartCardController.prototype.inject = function () {
      return {
        hooks: { webRestartCard: this.store },
        toggle: this.toggle.bind(this),
        save: this.save.bind(this),
        discard: this.discard.bind(this),
        resetField: this.resetField.bind(this)
      };
    };

    // ── settings card (设置 → 插件 → 插件配置) ──
    function WebRestartCard(props) {
      var t = props.t;
      var state = props.useWebRestartCard(function (snapshot) { return snapshot; });
      var openRef = react.useState(false);
      var open = openRef[0];
      var setOpen = openRef[1];
      if (state.available !== true) return null;
      var blocked = !state.dirty || state.saving;

      return react.createElement("li", { className: styles.card },
        react.createElement("button", {
          type: "button",
          className: styles.chead,
          "aria-expanded": open,
          "aria-label": t(open ? "card.collapse" : "card.expand") + ": " + t("card.title"),
          onClick: function () { setOpen(!open); }
        },
          react.createElement("span", { className: styles.cheadText },
            react.createElement("span", { className: styles.cname }, t("card.title")),
            react.createElement("span", { className: styles.cdesc }, t("card.description"))
          ),
          state.dirty ? react.createElement("span", { className: styles.cbadge }, t("card.unsaved")) : null,
          react.createElement("svg", {
            className: styles.chev + (open ? " " + styles.chevOpen : ""),
            viewBox: "0 0 16 16",
            width: 14,
            height: 14,
            "aria-hidden": "true"
          },
            react.createElement("path", { fill: "currentColor", d: "M4 6l4 4 4-4z" })
          )
        ),
        open ? react.createElement("div", { className: styles.cbody },
          state.writable !== true ? react.createElement("p", { className: styles.creadonly, role: "status" }, t("card.readOnly")) : null,
          react.createElement("div", { className: styles.ctoggle },
            react.createElement("button", {
              type: "button",
              className: styles.switch + (state.on ? " " + styles.on : ""),
              role: "switch",
              "aria-checked": state.on,
              "aria-label": t("card.autoContinue"),
              disabled: state.writable !== true || state.saving,
              onClick: function () { props.toggle(!state.on); }
            }),
            react.createElement("span", { className: styles.ctext },
              react.createElement("span", { className: styles.clabel }, t("card.autoContinue")),
              react.createElement("span", { className: styles.cfield }, t("card.autoContinueHint")),
              react.createElement("span", {
                className: styles.cfield + (state.overridden ? " " + styles.over : "")
              },
                (state.overridden ? t("card.overridden") + " · " : "") +
                (state.defaultOn ? t("card.on") : t("card.off")) + " (" + t("card.reset") + ")"
              )
            )
          ),
          react.createElement("div", { className: styles.cfooter },
            state.failed ? react.createElement("p", { className: styles.cfailed, role: "status" }, t("card.saveFailed")) : null,
            react.createElement("button", {
              type: "button",
              className: styles.cbtn,
              disabled: !state.dirty || state.saving,
              onClick: function () { props.discard(); }
            }, t("card.discard")),
            react.createElement("button", {
              type: "button",
              className: styles.cbtn,
              disabled: !state.overridden || state.saving,
              onClick: function () { props.resetField(); }
            }, t("card.reset")),
            react.createElement("button", {
              type: "button",
              className: styles.cbtn + " " + styles.csave,
              disabled: blocked,
              onClick: function () { props.save(); }
            }, t(state.saving ? "card.saving" : "card.save"))
          )
        ) : null
      );
    }

    // ── rail-bottom restart button: click opens a confirm modal, the restart
    // request is only sent after the user confirms in the modal ──
    function RestartButton(props) {
      var wide = props.wide;
      var t = props.t;
      var statusRef = react.useState("loading");
      var status = statusRef[0];
      var setStatus = statusRef[1];
      var phaseRef = react.useState("idle");
      var phase = phaseRef[0];
      var setPhase = phaseRef[1];
      var openRef = react.useState(false);
      var open = openRef[0];
      var setOpen = openRef[1];
      var autoRef = react.useState(false);
      var auto = autoRef[0];
      var setAuto = autoRef[1];

      function refresh() {
        fetch("/plugin/dsh-web-restart", { cache: "no-store" })
          .then(function (res) {
            if (res.ok === false) throw new Error("HTTP " + res.status);
            return res.json();
          })
          .then(function (json) {
            if (json.ok === false) throw new Error(json.error || "unknown error");
            if (json.request && json.request.target && !json.request.due) setStatus("pending");
            else if (json.supervisor && json.supervisor.running) setStatus("ok");
            else setStatus("down");
            if (json.config) setAuto(json.config.autoContinueAfterRestart === true);
          })
          .catch(function () {
            setStatus("error");
          });
      }

      react.useEffect(function () {
        refresh();
        var timer = setInterval(refresh, 30000);
        return function () { clearInterval(timer); };
      }, []);

      react.useEffect(function () {
        if (!open) return;
        function onKey(event) {
          if (event.key === "Escape") setOpen(false);
        }
        document.addEventListener("keydown", onKey);
        return function () { document.removeEventListener("keydown", onKey); };
      }, [open]);

      // persist the auto-continue switch immediately through the host config
      // endpoint (writes the web-restart section of settings.yaml)
      function toggleAuto() {
        if (phase === "requested") return;
        var next = !auto;
        setAuto(next);
        fetch("/plugin/dsh-web-restart/config", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ autoContinueAfterRestart: next }),
          cache: "no-store"
        })
          .then(function (res) {
            if (res.ok === false) return res.json().then(function (j) { throw new Error(j.error || "HTTP " + res.status); });
            return res.json();
          })
          .then(function (json) {
            setAuto(json.config && json.config.autoContinueAfterRestart === true);
          })
          .catch(function (error) {
            setAuto(!next);
            var message = (error && error.message) ? error.message : String(error);
            // eslint-disable-next-line no-alert
            window.alert(message);
          });
      }

      function confirmRestart() {
        if (phase === "requested") return;
        setPhase("requested");
        fetch("/plugin/dsh-web-restart", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ delay: 10 }),
          cache: "no-store"
        })
          .then(function (res) {
            if (res.ok === false) return res.json().then(function (j) { throw new Error(j.error || "HTTP " + res.status); });
            return res.json();
          })
          .then(function (json) {
            // give the response time to flush, then let the page reload after the
            // supervisor restarts the service (delay 10s + boot margin).
            setTimeout(function () { window.location.reload(); }, (json.delayS + 12) * 1000);
          })
          .catch(function (error) {
            setPhase("idle");
            setStatus("error");
            var message = (error && error.message) ? error.message : String(error);
            // eslint-disable-next-line no-alert
            window.alert(message);
          });
      }

      var dotClass = styles.fdot;
      if (status === "pending") dotClass += " " + styles.amber;
      if (status === "down" || status === "error") dotClass += " " + styles.red;

      var supervisorUp = status === "ok" || status === "pending";
      var title = phase === "requested" ? t("label.requested") : t("label.restart");

      return react.createElement("div", {
        className: styles.layer + (wide ? " " + styles.wide : "")
      },
        react.createElement("button", {
          type: "button",
          className: styles.btn + (phase === "requested" ? " " + styles.spin : ""),
          onClick: function () {
            if (phase === "requested") return;
            setOpen(true);
          },
          title: title,
          "aria-label": title,
          "aria-haspopup": "dialog",
          "aria-expanded": open
        },
          react.createElement("span", { className: dotClass }),
          react.createElement("svg", { className: styles.icon, viewBox: "0 0 16 16", "aria-hidden": "true" },
            react.createElement("path", {
              fill: "currentColor",
              d: "M13.65 2.35a7 7 0 1 0 2.34 5.65h-1.5a5.5 5.5 0 1 1-1.84-4.44L10 6h6V0l-2.35 2.35z"
            })
          ),
          react.createElement("span", { className: styles.label }, title)
        ),
        open ? react.createElement("div", {
          className: styles.overlay,
          onClick: function () { if (phase !== "requested") setOpen(false); }
        },
          react.createElement("div", { className: styles.mask }),
          react.createElement("div", {
            className: styles.dialog,
            role: "dialog",
            "aria-label": t("tip.title"),
            "aria-modal": "true",
            onClick: function (event) { event.stopPropagation(); }
          },
            react.createElement("div", { className: styles.dtitle },
              react.createElement("svg", { viewBox: "0 0 16 16", width: 14, height: 14, "aria-hidden": "true" },
                react.createElement("path", { fill: "currentColor", d: "M13.65 2.35a7 7 0 1 0 2.34 5.65h-1.5a5.5 5.5 0 1 1-1.84-4.44L10 6h6V0l-2.35 2.35z" })
              ),
              t("tip.title")
            ),
            react.createElement("p", { className: styles.ddesc }, t("tip.desc")),
            phase === "requested"
              ? react.createElement("div", { className: styles.dnote + " " + styles.ok, role: "status" }, t("tip.requested"))
              : react.createElement("div", { className: styles.dtoggle },
                react.createElement("button", {
                  type: "button",
                  className: styles.switch + (auto ? " " + styles.on : ""),
                  role: "switch",
                  "aria-checked": auto,
                  "aria-label": t("tip.autoLabel"),
                  onClick: toggleAuto
                }),
                react.createElement("span", { className: styles.dtext },
                  react.createElement("span", { className: styles.dlabel }, t("tip.autoLabel")),
                  react.createElement("span", { className: styles.dhint }, t("tip.autoHint"))
                )
              ),
            phase === "requested" ? null : react.createElement("div", { className: styles.dfoot },
              react.createElement("button", {
                type: "button",
                className: styles.dbtn,
                onClick: function () { setOpen(false); }
              }, t("tip.cancel")),
              react.createElement("button", {
                type: "button",
                className: styles.dbtn + " " + styles.ddanger,
                disabled: !supervisorUp,
                onClick: confirmRestart,
                title: supervisorUp ? "" : t("tip.supervisorDown")
              }, t("tip.confirm"))
            )
          )
        ) : null
      );
    }

    function apply(ctx) {
      ctx.effect(function () {
        ctx.locale.register(NS, { zh: zh, en: en });
      }, "dsh-web-restart: dictionaries");

      // 设置 → 插件 → 插件配置 card
      var controller = new WebRestartCardController(ctx.settingsScope.bind({ namespace: "web-restart" }));
      ctx.slots.inject("settings.plugin.item", function* () {
        yield ctx.slots.register({
          name: "settings.plugin.item",
          id: "web-restart",
          order: 30,
          locale: NS,
          inject: function () { return controller.inject(); }
        }, WebRestartCard);
      });

      // 侧边栏（左 rail）最底部的重启按钮：与余额等底部项并列，任何布局
      // （首页 / 会话 / 日历模式）都固定可见。点击弹出确认弹窗，确认后才
      // 发出重启请求。
      ctx.slots.inject("sidebar.rail.footer", function () {
        return ctx.slots.register({
          name: "sidebar.rail.footer",
          id: "web-restart",
          order: 200,
          locale: NS
        }, RestartButton);
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
