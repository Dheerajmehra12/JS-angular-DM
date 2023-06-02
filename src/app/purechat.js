function loadPureChatJs(purechatConfig, head) {
  if (!document.getElementById('purchat-widget')) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.id = 'purchat-widget';
    script.setAttribute('data-cfasync', 'false');
    var strScriptBody = "\
    (function (window) {\
      window.purechatApi = {\
        l: [],\
        t: [],\
        on: function () {\
          this.l.push(arguments);\
        }\
      };\
      var done = false;\
      var script = document.createElement('script');\
      script.async = true;\
      script.type = 'text/javascript';\
      script.onreadystatechange = script.onload = function(e) {\
\
        if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {\
          var w = new PCWidget({c: '" + purechatConfig + "', f: true });\
\
          var mediaLg='991.98px';\
\
          var mediaBreakpoints={\
              xs: '0',\
              sm: '576px',\
              md: '768px',\
              lg: '992px',\
              xl: '1200px'\
          };\
\
          function hideWidgetForMobile() {\
            var mediaq=window.matchMedia('(max-width: '+mediaBreakpoints['sm']+')');\
            showHideChatBox(mediaq);\
            mediaq.addEventListener('change',showHideChatBox);\
          }\
\
          function showHideChatBox(mediaq) {\
            console.log('showHideChatBox',mediaq.matches);\
            if(mediaq.matches) {\
                hideChatBox();\
            }else{\
                showChatBox();\
            }\
          }\
\
          var chatboxExpanded=false;\
          var chatboxMinimized=false;\
\
          purechatApi.on('chatbox:expand', function (args) {\
            console.log('Chatbox was expanded', args.chatboxId);\
            showChatBox();\
            chatboxExpanded=true;\
          });\
\
          purechatApi.on('chatbox:collapse', function (args) {\
            console.log('Chatbox was collapsed', args.chatboxId);\
            hideWidgetForMobile();\
            chatboxExpanded=false;\
          });\
\
          purechatApi.on('chatbox:minimize', function (args) {\
              chatboxMinimized=true;\
              hideWidgetForMobile();\
              console.log('Chatbox was minimized', args.chatboxId);\
          });\
\
          function contactUsHandler() {\
            console.log('contactUsHandler invoked');\
            if(!chatboxExpanded) {\
                purechatApi.set('chatbox.expanded', true);\
            }\
            else {\
              purechatApi.set('chatbox.expanded', false);\
            }\
          }\
\
          function hideChatBox() {\
            purechatApi.set('chatbox.visible', false);\
          }\
\
          function showChatBox() {\
            purechatApi.set('chatbox.visible', true);\
          }\
\
          function changePosition() {\
            var styleOverride='\\n' +\
                '#PureChatWidget.purechat.purechat-bottom-right,\\n' +\
                '#PureChatWidget.purechat.purechat-bottom-left {\\n' +\
                '  left: 16px !important;\\n' +\
                '  bottom: 40px !important;\\n' +\
                '}';\
\
            var mdStyleOverride='\\n@media (max-width: '+mediaLg+') {\\n' +\
                '#PureChatWidget.purechat.purechat-bottom-right,\\n' +\
                '#PureChatWidget.purechat.purechat-bottom-left {\\n' +\
                '  left: 16px !important;\\n' +\
                '  bottom: 64px !important;\\n' +\
                '}\\n';\
                '}';\
\
            var style2='\\n' +\
                '#PureChatWidget.purechat.purechat-popped-out-widget.purechat-widget-collapsed.purechat-bottom {\\n' +\
                '   bottom: 64px !important;\\n' +\
                '}';\
\
            var style3='\\n' +\
                '#PureChatWidget.purechat.purechat-popped-out-widget.purechat-widget-super-collapsed.purechat-bottom-left .purechat-btn-collapse {' +\
                'left: -5px !important;\\n' +\
                'margin-left: 0 !important;\\n' +\
                'right: auto !important;' +\
                '}';\
            var printHide='\\n@media print {\\n' +\
                '  #PureChatWidget.purechat.purechat-widget {\\n' +\
                '    display: none !important;\\n' +\
                '  }\\n' +\
                '}';\
            document.getElementById('pcwidget-styles').append(styleOverride+mdStyleOverride+style2+style3+printHide);\
          }\
\
          purechatApi.on('chatbox:ready', function () {\
            purechatApi.set('chatbox.position', 'bottomLeft');\
            purechatApi.set('chatbox.showMinimizeButton', false);\
            purechatApi.set('chatbox.expanded', false);\
            changePosition();\
            purechatApi.contactUsHandler = contactUsHandler;\
            purechatApi.hideChatBox=hideChatBox;\
            purechatApi.showChatBox=showChatBox;\
            console.log('Chatbox Ready');\
          });\
\
          done = true;\
          return purechatApi;\
        }\
      };\
      script.src = 'https://app.purechat.com/VisitorWidget/WidgetScript';\
      document.getElementsByTagName('head').item(0).appendChild(script);\
    })(window);";
    var scriptBody = document.createTextNode(strScriptBody);
    script.append(scriptBody);
    head.append(script);
  }
}
if ( typeof module === "object" && typeof module.exports === "object" ) {
  module.exports = {
    loadPureChatJs: loadPureChatJs,
  };
}
